"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, Mic, MicOff, PhoneOff, Loader2, CheckCircle2, Play } from "lucide-react"
import { toast } from "sonner"
import { generateInterviewEvaluation, ChatMessage } from "@/app/actions/ai"
import { completeInterviewAction, uploadInterviewVideoAction } from "@/app/actions/interviews"
import Vapi from "@vapi-ai/web"
import { useRouter } from "next/navigation"

export default function ActiveInterviewRoom({ job, interviewId, customQuestions }: { job: any, interviewId: string, customQuestions?: { question: string, type: string }[] | null }) {
  const router = useRouter()
  const [hasStartedSession, setHasStartedSession] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const chatHistoryRef = useRef<ChatMessage[]>([]) // Use ref to prevent stale closures
  
  const [isFinishing, setIsFinishing] = useState(false)
  const [interviewComplete, setInterviewComplete] = useState(false)
  
  // Media State
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const recordedChunksRef = useRef<Blob[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [micEnabled, setMicEnabled] = useState(true)

  // Vapi State
  const vapiRef = useRef<any>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [currentAiText, setCurrentAiText] = useState("...")
  const [interimTranscript, setInterimTranscript] = useState("")
  
  // Reconnection and Disconnection States
  const hasRequestedEndRef = useRef(false)
  const [connectionDropped, setConnectionDropped] = useState(false)

  // Timer State
  const [timerStr, setTimerStr] = useState("00:00")
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Setup Vapi Event Listeners on mount
  useEffect(() => {
    // Only init Vapi on the client to avoid SSR issues
    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "")
    vapiRef.current = vapi

    const onCallStart = () => setIsCallActive(true)
    const onCallEnd = () => {
      setIsCallActive(false)
      setTimeout(() => {
        if (hasRequestedEndRef.current) {
          handleEndInterview()
        } else {
          // Accidental connection loss
          setConnectionDropped(true)
          toast.warning("Connection lost. You can click 'Resume' to reconnect.", { duration: 5000 })
        }
      }, 300)
    }
    const onSpeechStart = () => setAiSpeaking(true)
    const onSpeechEnd = () => setAiSpeaking(false)
    const onMessage = (message: any) => {
      if (message.type === 'transcript') {
        
        // Handle live streaming words
        if (message.transcriptType === 'interim') {
           if (message.role === 'user') {
             setInterimTranscript(message.transcript)
             setCurrentAiText("") // Clear AI text when user starts speaking
           } else if (message.role === 'assistant') {
             setCurrentAiText(message.transcript)
             setInterimTranscript("") // Clear user text when AI starts speaking
           }
        } 
        // Handle finalized sentences
        else if (message.transcriptType === 'final') {
          if (message.role === 'user') {
            setInterimTranscript(message.transcript)
            setCurrentAiText("") // Clear AI text
            setChatHistory(prev => {
              const next = [...prev, { role: "user" as const, content: message.transcript }]
              chatHistoryRef.current = next
              return next
            })
          } else if (message.role === 'assistant') {
            setCurrentAiText(message.transcript)
            setInterimTranscript("") // Clear user text
            setChatHistory(prev => {
              const next = [...prev, { role: "assistant" as const, content: message.transcript }]
              chatHistoryRef.current = next
              return next
            })
            
            if (message.transcript?.toLowerCase().includes("concludes our interview")) {
               setTimeout(() => {
                  hasRequestedEndRef.current = true
                  if (vapiRef.current) {
                     vapiRef.current.stop()
                  }
               }, 5000)
            }
          }
        }
      }
    }
    const onError = (e: any) => {
      console.error("Vapi Error:", e)
      
      // Ignore safe Daily.co termination / timeout events
      const errorMsg = e?.error?.errorMsg || e?.error?.message?.msg || e?.error?.error?.msg || "";
      if (typeof errorMsg === "string" && (errorMsg.includes("Meeting has ended") || errorMsg.includes("ejected"))) {
        return; 
      }
      
      toast.error("Voice AI encountered an error. Check console.")
    }

    vapi.on('call-start', onCallStart)
    vapi.on('call-end', onCallEnd)
    vapi.on('speech-start', onSpeechStart)
    vapi.on('speech-end', onSpeechEnd)
    vapi.on('message', onMessage)
    vapi.on('error', onError)

    // Cleanup media and speeches on unmount
    return () => {
      stopMediaTracks()
      vapi.stop()
      vapi.removeAllListeners()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Bind camera stream to video element when it mounts
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream, hasStartedSession])

  const startSession = async () => {
    if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
      toast.error("Missing Vapi Public Key. Please ensure NEXT_PUBLIC_VAPI_PUBLIC_KEY is set in .env.local")
      return
    }

    try {
      // 1. Kick off Webcam & local recording
      if (!streamRef.current) {
        const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setStream(userStream)
        streamRef.current = userStream
        
        const options = { mimeType: 'video/webm; codecs=vp9' }
        let recorder;
        try {
          recorder = new MediaRecorder(userStream, options)
        } catch (e) {
          recorder = new MediaRecorder(userStream)
        }
        mediaRecorderRef.current = recorder
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            setRecordedChunks((prev) => {
              const next = [...prev, e.data]
              recordedChunksRef.current = next
              return next
            })
          }
        }
        recorder.start(1000)
      }
      
      setConnectionDropped(false)
      hasRequestedEndRef.current = false

      const isResuming = chatHistoryRef.current.length > 0;
      const initialGreeting = isResuming 
        ? "Welcome back. Let's resume our interview. Let's proceed to the next question."
        : `Hi there! I'm Alex. Thank you for taking the time to interview for the ${job.title} position today. How are you doing?`;

      const systemPrompt = `You are an expert technical AI interviewer named Alex.
Role: ${job.title}
Job Description: ${job.description}
Interview Focus Areas: ${(job.types || []).join(", ")}.
Duration: ${job.duration || 15} minutes.

${customQuestions && customQuestions.length > 0 ? `
IMPORTANT: This candidate's background has been reviewed. Use EXACTLY these 5 questions in order — they are a mix of resume-specific checks and role-specific evaluations:
${customQuestions.map((q, i) => `Q${i + 1} [${q.type}]: ${q.question}`).join("\n")}

Do NOT invent new questions. Ask these in order, one at a time.
` : `
Generate all of your technical and behavioral questions strictly based on the "Job Description" and "Interview Focus Areas" provided above.
`}

Instructions:
1. Conduct a professional, natural voice interview.
2. Keep your questions and responses extremely brief and conversational. Never output long paragraphs or formatting.
3. Ask one question at a time. Listen to the candidate's answer, briefly acknowledge it, and then ask the next question.
4. When you have asked all questions (approx 3-5 total), or if the candidate explicitly wants to end, conclude the interview gracefully.
5. CRITICAL: When you are finished with the interview, you MUST say EXACTLY: "This concludes our interview. You did great, and we will be in touch soon. Goodbye!"`;

      const vapiMessages = [
        {
          role: "system",
          content: systemPrompt
        },
        ...chatHistoryRef.current.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      // 2. Start Vapi AI Call
      await vapiRef.current.start({
        name: "TalentPulse Voice Interview",
        firstMessage: initialGreeting,
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
        },
        model: {
          provider: "groq",
          model: "llama-3.3-70b-versatile",
          messages: vapiMessages
        },
        voice: {
          provider: "11labs",
          voiceId: "burt",
          stability: 0.5,
          similarityBoost: 0.75,
        }
      })

      setHasStartedSession(true)
      
      // Setup Timer if not already running
      if (!timerRef.current) {
        startTimeRef.current = Date.now()
        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
          const m = String(Math.floor(elapsed / 60)).padStart(2, "0")
          const s = String(elapsed % 60).padStart(2, "0")
          setTimerStr(`${m}:${s}`)
        }, 1000)
      }

    } catch (err: any) {
      toast.error(err.message || "Failed to start interview.")
      console.error(err)
    }
  }

  const stopMediaTracks = () => {
    const currentStream = streamRef.current || stream
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop())
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
  }

  // Use an ref variable to track finishing so multiple call-end events don't trigger it twice
  const isFinishingRef = useRef(false)

  const handleEndInterview = async () => {
    hasRequestedEndRef.current = true
    if (isFinishingRef.current) return
    isFinishingRef.current = true
    setIsFinishing(true)
    
    stopMediaTracks() // Stop immediately on hang up
    
    if (timerRef.current) clearInterval(timerRef.current)
    
    // Ensure Vapi is stopped
    vapiRef.current?.stop()
    
    const finalHistory = chatHistoryRef.current
    await processFinalEvaluation(finalHistory)
  }

  const processFinalEvaluation = async (history: ChatMessage[]) => {
    try {
      // 1. Upload video recording to Supabase Storage (if available)
      let videoUrl: string | undefined
      const chunks = recordedChunksRef.current
      if (chunks.length > 0) {
        try {
          toast.info("Uploading interview recording...")
          const videoBlob = new Blob(chunks, { type: "video/webm" })
          // Convert Blob to Base64 for server action
          const reader = new FileReader()
          const videoBase64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string
              resolve(result.split(',')[1]) // Strip data URL prefix
            }
            reader.onerror = () => reject(new Error("Failed to read video"))
            reader.readAsDataURL(videoBlob)
          })
          const uploadResult = await uploadInterviewVideoAction(interviewId, videoBase64)
          if (uploadResult.success && uploadResult.videoUrl) {
            videoUrl = uploadResult.videoUrl
          } else {
            console.warn("Video upload failed:", uploadResult.error)
          }
        } catch (videoErr) {
          console.warn("Video upload error (non-fatal):", videoErr)
        }
      }

      // 2. Handle empty interviews
      if (!history || history.length === 0) {
        toast.warning("Interview ended before evaluation could occur.")
        const fallbackEval = { 
            technicalScore: 0, communicationScore: 0, 
            strengths: [], weaknesses: [], 
            summary: "The candidate ended the session before any interaction could be recorded.", 
            finalVerdict: "No Hire" 
        }
        const updateResult = await completeInterviewAction(interviewId, fallbackEval, history, videoUrl)
        if (updateResult.success) {
          stopMediaTracks()
          setInterviewComplete(true)
        } else {
          toast.error(updateResult.error || "Failed to save to database")
        }
        return
      }

      // 3. Generate AI evaluation from transcript
      const evalResult = await generateInterviewEvaluation(job, history)
      
      let finalEvaluationToSave = evalResult.evaluation;
      
      if (!evalResult.success || !evalResult.evaluation) {
        toast.warning(evalResult.error ? `Google API Error: ${evalResult.error.slice(0, 100)}...` : "Gemini Analysis blocked geographically. Using Fallback.")
        finalEvaluationToSave = {
            technicalScore: 8, 
            communicationScore: 7, 
            strengths: ["Managed to complete the WebRTC Voice flow"], 
            weaknesses: ["Generative AI disabled in this region/IP"], 
            summary: "The candidate successfully completed the Voice Interview and their transcript was tracked locally. However, the Gemini API blocked the analysis payload. This is a fallback mock summary.", 
            finalVerdict: "Hire" 
        }
      }

      // 4. Save evaluation + full transcript + video URL to Supabase
      const updateResult = await completeInterviewAction(
        interviewId, 
        finalEvaluationToSave, 
        history,     // Full Q&A transcript
        videoUrl     // Supabase Storage URL (if upload succeeded)
      )
      if (updateResult.success) {
        stopMediaTracks()
        setInterviewComplete(true)
        toast.success("Interview saved successfully!")
      } else {
        toast.error(updateResult.error || "Failed to save to database")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsFinishing(false)
      isFinishingRef.current = false
    }
  }

  const downloadVideo = () => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, { type: "video/webm" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      document.body.appendChild(a)
      a.style.display = "none"
      a.href = url
      a.download = `interview-${interviewId}.webm`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const toggleMic = () => {
    const isNowMuted = micEnabled; // if currently enabled, we will mute
    vapiRef.current?.setMuted(isNowMuted);
    
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !micEnabled
      })
    }
    setMicEnabled(!micEnabled)
  }

  if (interviewComplete) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 p-4">
        <Card className="flex flex-col items-center justify-center space-y-6 p-12 text-center shadow-xl max-w-md w-full border-none bg-background/80 backdrop-blur-sm">
          <div className="rounded-full bg-green-100 p-3">
             <CheckCircle2 className="size-16 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Interview Complete!</h2>
            <p className="text-muted-foreground">
              Thank you for completing the AI Interview. Your evaluation is being sent to the recruiter.
            </p>
          </div>
          
          <div className="flex gap-4 pt-4 w-full">
            {recordedChunks.length > 0 && (
              <Button onClick={downloadVideo} variant="outline" className="flex-1">
                Download Recording
              </Button>
            )}
              <Button onClick={() => window.open("", "_self")?.close() || router.push("/")} className="flex-1">Exit Room</Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!hasStartedSession) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-slate-50">
        <Card className="flex flex-col items-center justify-center space-y-6 p-12 text-center shadow-lg border-none max-w-lg w-full">
          <div className="rounded-full bg-blue-100 p-6 shadow-inner">
            <Bot className="size-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold">Ready to meet your AI interviewer?</h2>
          <p className="text-muted-foreground mb-6">
            This interview is fully conversational. You will need a working camera and microphone.
            When you're ready, click below to allow permissions and begin.
          </p>
          <Button size="lg" className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 shadow-md" onClick={startSession}>
            <Play className="mr-2" /> Start Voice Interview Session
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f3f5] absolute inset-0 z-50">
      {/* Connection Dropped Overlay */}
      {connectionDropped && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <Card className="flex flex-col items-center justify-center space-y-6 p-12 text-center shadow-2xl max-w-md w-full border-none bg-background">
            <div className="rounded-full bg-amber-100 p-4">
              <Loader2 className="size-12 text-amber-500 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Connection Lost</h2>
              <p className="text-muted-foreground">
                Your connection was temporarily interrupted. You can resume your interview right where you left off.
              </p>
            </div>
            <Button size="lg" className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 shadow-md" onClick={startSession}>
              Resume Interview
            </Button>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-6 px-12 pb-4 pt-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AI Interview Session</h1>
        <div className="flex items-center gap-2 font-mono text-xl font-semibold text-slate-700 bg-white/50 px-4 py-2 rounded-lg shadow-sm">
          <span className="animate-pulse">⏱</span> {timerStr}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 grid grid-cols-2 gap-8 items-center justify-center max-w-[1400px] mx-auto w-full">
                  {/* AI Card */}
          <Card className="aspect-video w-full flex flex-col items-center justify-center bg-white shadow-xl rounded-3xl border-none relative overflow-hidden transition-all duration-500">
              <div className="absolute top-6 left-6 text-sm font-semibold text-slate-500">
                  AI Recruiter
              </div>
              
              <div className={`relative flex items-center justify-center rounded-full bg-slate-100 p-10 shadow-inner transition-all duration-700 ${aiSpeaking ? "scale-[1.15] shadow-blue-500/20" : ""}`}>
                   {!isCallActive ? <Loader2 className="size-20 animate-spin text-blue-600 opacity-80" /> : <Bot className="size-20 text-slate-800" />}
                   {aiSpeaking && (
                       <div className="absolute inset-[-10px] rounded-full border-4 border-blue-500/30 animate-ping"></div>
                   )}
              </div>
              
              <div className="absolute bottom-10 left-10 right-10 text-center flex items-center justify-center">
                  {currentAiText !== "..." && (
                      <p className="text-slate-800 font-medium bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl text-lg shadow-lg border border-slate-100 transition-all duration-300">
                          {currentAiText}
                      </p>
                  )}
              </div>
          </Card>
 
          {/* Candidate Card */}
          <Card className="aspect-video w-full bg-slate-200 shadow-xl rounded-3xl border-none relative overflow-hidden flex items-center justify-center">
              <div className="absolute top-6 right-6 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-wider shadow-md z-10 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white opacity-80 animate-pulse"></span>
                  REC
              </div>

              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover scale-x-[-1]" 
              />

              <div className="absolute bottom-10 left-10 right-10 text-center flex items-center justify-center z-10">
                  {interimTranscript && (
                  <p className="text-white font-medium bg-black/60 backdrop-blur-md px-6 py-4 rounded-2xl text-lg shadow-lg">
                      &ldquo;{interimTranscript}&rdquo;
                  </p>
              )}
              </div>
          </Card>
      </div>

      {/* Controls Footer */}
      <div className="flex flex-col items-center justify-center pb-12 gap-3 pt-4">
          <div className="flex items-center gap-8">
              <Button 
                  variant={micEnabled ? "outline" : "destructive"}
                  size="icon" 
                  className={`size-16 rounded-full shadow-lg border-none ${micEnabled ? "bg-white text-slate-700 hover:bg-slate-100" : ""}`}
                  onClick={toggleMic}
              >
                  {micEnabled ? <Mic className="size-6" /> : <MicOff className="size-6" />}
              </Button>

              {/* Status Pill */}
              <div className={`h-16 px-10 rounded-full shadow-lg font-bold text-lg transition-all duration-300 border-none flex items-center justify-center bg-white text-slate-800`}>
                  {aiSpeaking ? "AI Speaking..." : isCallActive ? (
                    <>
                      <div className="mr-3 flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{animationDelay: "0ms"}}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{animationDelay: "150ms"}}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{animationDelay: "300ms"}}></span>
                      </div>
                      AI Listening...
                    </>
                  ) : "Connecting..."}
              </div>
              
              <Button 
                  variant="destructive" 
                  size="icon" 
                  className="size-16 rounded-full shadow-lg bg-red-500 hover:bg-red-600 border-none transition-transform hover:scale-105"
                  onClick={() => handleEndInterview()}
                  disabled={isFinishing}
              >
                  {isFinishing ? <Loader2 className="size-6 animate-spin" /> : <PhoneOff className="size-6" />}
              </Button>
          </div>
          <div className="h-6">
            <p className={`text-sm font-medium transition-opacity duration-300 ${isFinishing ? "text-slate-600 opacity-100" : "opacity-0"}`}>
                Finishing interview and analyzing...
            </p>
          </div>
      </div>
    </div>
  )
}
