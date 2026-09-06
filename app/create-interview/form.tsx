"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock, Code, Copy, FileText, Loader2, Mail, MessageSquare, Plus, Scan, Trash2, Upload, User, UserPlus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { generatePreviewQuestionsAction } from "@/app/actions/ai"
import { generateComprehensivePreviewAction } from "@/app/actions/previews"
import { createJobAction } from "@/app/actions/jobs"
import { sendInterviewInvitesAction } from "@/app/actions/emails"
import { toast } from "sonner"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const interviewTypes = [
  { id: "technical", label: "Technical" },
  { id: "behavioral", label: "Behavioral" },
  { id: "experience", label: "Experience" },
  { id: "problem-solving", label: "Problem Solving" },
  { id: "leadership", label: "Leadership" },
]

export function CreateInterviewForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["technical"])
  
  // Step management
  const [step, setStep] = useState<"form" | "generating" | "review" | "success">("form")
  const [jobData, setJobData] = useState<FormData | null>(null)
  const [generatedLink, setGeneratedLink] = useState("")
  const [previewQuestions, setPreviewQuestions] = useState<{question: string, type: string}[]>([])
  const [candidatePreviews, setCandidatePreviews] = useState<any[]>([])
  const [generatedCandidates, setGeneratedCandidates] = useState<any[]>([])
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  type CandidateEntry = { id: string, name: string, email: string, resumeFile: File | null }
  const [candidates, setCandidates] = useState<CandidateEntry[]>([])
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tempCandidate, setTempCandidate] = useState<CandidateEntry>({ id: "", name: "", email: "", resumeFile: null })

  const openAddModal = () => {
    setTempCandidate({ id: Date.now().toString() + Math.random(), name: "", email: "", resumeFile: null })
    setIsModalOpen(true)
  }

  const saveCandidate = () => {
    if (!tempCandidate.name.trim() || !tempCandidate.email.trim()) {
      toast.error("Name and Email are required.")
      return
    }
    setCandidates([...candidates, tempCandidate])
    setIsModalOpen(false)
  }

  const removeCandidate = (id: string) => setCandidates(candidates.filter(c => c.id !== id));

  const toggleType = (id: string) => {
    setSelectedTypes(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  // Handle Initial Form Submit
  function handleGenerate(formData: FormData) {
    formData.append("types", JSON.stringify(selectedTypes))
    
    // Append multiple candidates
    formData.append("candidatesCount", candidates.length.toString())
    candidates.forEach((c, index) => {
        formData.append(`candidateName_${index}`, c.name)
        formData.append(`candidateEmail_${index}`, c.email)
        if (c.resumeFile) {
            formData.append(`resume_${index}`, c.resumeFile)
        }
    })

    setJobData(formData)
    setStep("generating")
    
    startTransition(async () => {
      const title = formData.get("title")?.toString() || ""
      const description = formData.get("description")?.toString() || ""
      
      console.log(`[DEBUG] Starting preview generation for ${candidates.length} candidates.`);

      // Convert resumes to base64 for the server action
      const candidatesWithResumes = await Promise.all(candidates.map(async (c) => {
        let resumeBase64 = undefined
        if (c.resumeFile) {
          console.log(`[DEBUG] Encoding resume for ${c.name}: ${c.resumeFile.name} (${c.resumeFile.size} bytes)`);
          const reader = new FileReader()
          resumeBase64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string
              const b64 = result.split(',')[1]
              console.log(`[DEBUG] Successfully encoded ${c.name}'s resume. B64 Length: ${b64.length}`);
              resolve(b64)
            }
            reader.onerror = () => reject(new Error("FileReader failed"))
            reader.readAsDataURL(c.resumeFile!)
          })
        } else {
          console.log(`[DEBUG] No resume file found for candidate: ${c.name}`);
        }
        return {
          name: c.name,
          email: c.email,
          resumeBase64,
          resumeName: c.resumeFile?.name
        }
      }))

      const res = await generateComprehensivePreviewAction(
        { title, description, types: selectedTypes },
        candidatesWithResumes
      )

      if (res.success) {
        console.log(`[DEBUG] Received preview response. Candidates analyzed: ${res.candidatePreviews?.filter((p:any) => p.hasAnalysis).length}`);
        setPreviewQuestions(res.coreQuestions || [])
        setCandidatePreviews(res.candidatePreviews || [])
      } else {
        console.error(`[DEBUG] Preview generation failed:`, res.error);
        toast.error(res.error || "Failed to generate comprehensive preview.")
        setPreviewQuestions([
          { question: `Tell me about your experience as a ${title}.`, type: "Background" },
          { question: "How do you handle complex technical problems?", type: "General" }
        ])
      }
      setStep("review")
    })
  }

  // Handle Final Submission
  async function handleFinish() {
    if (!jobData) return
    
    // Add candidate previews to the form data to avoid re-analysis
    const finalFormData = new FormData()
    // Copy existing jobData
    for (const [key, value] of (jobData as any).entries()) {
      finalFormData.append(key, value)
    }
    // Append the pre-generated AI results
    finalFormData.append("candidatePreviews", JSON.stringify(candidatePreviews))

    startTransition(async () => {
      const result = await createJobAction(finalFormData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Interview created successfully!")
        setGeneratedLink(`${window.location.origin}/interview/${result.link}`)
        if (result.candidates) {
          setGeneratedCandidates(result.candidates)
        }
        setStep("success")
      }
    })
  }

  const handleSendEmails = async () => {
    setIsSendingEmails(true)
    try {
      const title = jobData?.get("title")?.toString() || "AI Interview"
      const res = await sendInterviewInvitesAction(generatedCandidates, title, generatedLink, candidatePreviews)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Successfully sent invites to ${res.count} candidates!`)
      }
    } catch (e) {
      toast.error("Failed to send automated emails.")
    } finally {
      setIsSendingEmails(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink)
    toast.success("Link copied to clipboard!")
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <div className="flex items-center gap-4 border-b pb-6">
        {step === "form" ? (
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
        ) : step === "success" ? (
          <div className="w-9" /> // spacer to keep title centered implicitly
        ) : (
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setStep("form")}>
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <h1 className="text-2xl font-semibold text-foreground">Create New Interview</h1>
      </div>

      {step !== "success" && (
        <div className="h-2 w-full bg-primary/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-in-out" 
            style={{ width: step === "form" ? "33%" : step === "generating" ? "66%" : "100%" }}
          />
        </div>
      )}

      {step === "form" && (
        <form action={handleGenerate} className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium">Job Position</Label>
            <Input 
              id="title" 
              name="title" 
              defaultValue={jobData?.get("title")?.toString() || ""}
              placeholder="e.g. Senior Frontend Developer" 
              className="h-12"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">Job Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              defaultValue={jobData?.get("description")?.toString() || ""}
              placeholder="Enter detailed job description..." 
              className="min-h-[150px] resize-y"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-base font-medium">Interview Duration</Label>
            <Select name="duration" defaultValue={jobData?.get("duration")?.toString() || "15"}>
              <SelectTrigger className="h-12 w-full max-w-md">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Interview Types</Label>
            <div className="flex flex-wrap gap-3">
              {interviewTypes.map((type) => {
                const isActive = selectedTypes.includes(type.id)
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleType(type.id)}
                    className={`cursor-pointer flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
                      isActive 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-input bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {type.id === "technical" && <Code className={`size-4 ${isActive ? 'text-primary' : ''}`} />}
                    {type.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Candidates Section */}
          <div className="space-y-6 pt-8 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <UserPlus className="size-5 text-blue-500" />
                <span>Initial Candidates (Optional)</span>
              </div>
            </div>

            {candidates.length === 0 ? (
              <div 
                onClick={openAddModal}
                className="group cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-10 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300"
              >
                <div className="size-14 rounded-full bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <UserPlus className="size-7 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Add First Candidate</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm text-center">
                  Add details now to get an AI Fit Score and personalized questions immediately after creation.
                </p>
                <Button type="button" variant="outline" className="mt-6 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
                  <Plus className="size-4" />
                  Add Candidate Details
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-center justify-between p-4 bg-slate-50 border rounded-xl hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <User className="size-5 text-blue-600" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-slate-800 truncate">{candidate.name}</p>
                          <p className="text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="truncate">{candidate.email}</span>
                            {candidate.resumeFile && (
                              <span className="flex items-center gap-1 truncate text-green-600">
                                <span className="hidden sm:inline">•</span> 
                                <FileText className="size-3" /> {candidate.resumeFile.name}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeCandidate(candidate.id)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0 ml-2"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-dashed border-2 py-8 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-600 hover:text-slate-800"
                  onClick={openAddModal}
                >
                  <Plus className="size-4 mr-2" />
                  Add Another Candidate
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-8">
            <Link href="/dashboard">
              <Button variant="outline" size="lg" type="button">
                Cancel
              </Button>
            </Link>
            <Button size="lg" type="submit" className="px-8 bg-blue-500 hover:bg-blue-600">
              Generate Questions →
            </Button>
          </div>
        </form>
      )}

      {/* Candidate Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Candidate</DialogTitle>
            <DialogDescription>
              Enter the candidate's details and optionally upload their resume for AI analysis.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="temp-name">Full Name</Label>
              <Input 
                id="temp-name"
                value={tempCandidate.name}
                onChange={(e) => setTempCandidate({...tempCandidate, name: e.target.value})}
                placeholder="e.g. John Doe" 
                className="bg-background" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp-email">Email Address</Label>
              <Input 
                id="temp-email"
                type="email"
                value={tempCandidate.email}
                onChange={(e) => setTempCandidate({...tempCandidate, email: e.target.value})}
                placeholder="e.g. john@example.com" 
                className="bg-background" 
              />
            </div>
            
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Scan className="size-4 text-slate-400" />
                <span>AI Resume Analysis (Optional)</span>
              </Label>
              <div 
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all ${
                  tempCandidate.resumeFile ? "border-green-500 bg-green-50/50" : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 bg-background"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  id="temp-resume"
                  onChange={(e) => setTempCandidate({...tempCandidate, resumeFile: e.target.files?.[0] || null})}
                />
                <label 
                  htmlFor="temp-resume" 
                  className="flex flex-col items-center cursor-pointer text-center w-full"
                >
                  {tempCandidate.resumeFile ? (
                    <>
                      <div className="size-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                        <FileText className="size-6 text-green-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{tempCandidate.resumeFile.name}</span>
                      <span className="text-xs text-green-600 mt-1 font-medium italic">Ready for Groq analysis</span>
                      <Button type="button" variant="ghost" size="sm" className="mt-4 h-8 text-xs underline underline-offset-4" onClick={(e) => { e.preventDefault(); setTempCandidate({...tempCandidate, resumeFile: null}); }}>Remove file</Button>
                    </>
                  ) : (
                    <>
                      <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <Upload className="size-6 text-slate-500" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Click to upload candidate resume</span>
                      <span className="text-xs text-slate-500 mt-1">Groq will auto-generate interview questions from this PDF</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="button" onClick={saveCandidate} className="bg-blue-600 hover:bg-blue-700">Save Candidate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {step === "generating" && (
        <Card className="flex flex-col items-center justify-center p-12 text-center shadow-sm animate-in fade-in duration-500">
          <Loader2 className="size-10 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Generating Interview Questions</h2>
          <p className="mt-2 text-muted-foreground">
            Our AI is crafting personalized questions based on your job position...
          </p>
        </Card>
      )}

      {step === "review" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <h2 className="text-lg font-semibold text-foreground">Generated Interview Questions:</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
              <MessageSquare className="size-4" />
              <span>Core Job Questions (Shared)</span>
            </div>
            {previewQuestions.map((q, idx) => (
              <Card key={idx} className="p-4 bg-white border-slate-200">
                <div className="flex gap-4">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                    {idx + 1}
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-800">{q.question}</p>
                    <p className="text-xs text-slate-400">Category: {q.type}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {candidatePreviews.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                <UserPlus className="size-4" />
                <span>Candidate-Specific AI Analysis</span>
              </div>
              <Accordion type="single" collapsible className="w-full space-y-3">
                {candidatePreviews.map((preview, idx) => (
                  <AccordionItem 
                    value={`cand-${idx}`} 
                    key={idx} 
                    className="border rounded-xl bg-white overflow-hidden px-4 shadow-sm"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-4 text-left w-full">
                        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <User className="size-5 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{preview.name}</div>
                          <div className="text-xs text-slate-500 truncate">{preview.email}</div>
                        </div>
                        {preview.hasAnalysis ? (
                          <div className="mr-4 flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded uppercase">
                              Score: {preview.resumeScore}/10
                            </span>
                          </div>
                        ) : (
                          <span className="mr-8 text-[10px] text-slate-400 font-medium italic truncate max-w-[120px]">
                            {preview.error === "No resume provided" ? "No Resume Uploaded" : `Error: ${preview.error}`}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 border-t pt-4">
                      {preview.hasAnalysis ? (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-tighter">AI Resume Summary</Label>
                            <p className="text-sm text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                              &ldquo;{preview.resumeSummary}&rdquo;
                            </p>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Personalized Interview Questions (5)</Label>
                            <div className="grid gap-2">
                              {preview.customQuestions?.map((q: any, qIdx: number) => (
                                <div key={qIdx} className="flex gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                  <span className="text-xs font-bold text-blue-500">{qIdx + 1}.</span>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-700">{q.question}</p>
                                    <p className="text-[10px] text-slate-400">Focus: {q.type}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <FileText className="size-8 text-slate-200 mb-2" />
                          <p className="text-sm text-slate-400 px-6">
                            {preview.error === "No resume provided" 
                              ? "Standard job questions will be used for this candidate." 
                              : `Analysis failed: ${preview.error}`}
                          </p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          <div className="flex justify-end pt-6">
            <Button 
              size="lg" 
              onClick={handleFinish} 
              disabled={isPending}
              className="px-8 bg-blue-500 hover:bg-blue-600"
            >
              {isPending ? "Creating Link..." : "Create Interview Link & Finish"}
            </Button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col items-center text-center space-y-4 pt-4 pb-2">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="size-8 text-green-600 dark:text-green-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground">Your AI Interview is Ready!</h2>
              <p className="text-muted-foreground">Share this link with your candidates to start the interview process</p>
            </div>
          </div>

          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Interview Link</Label>
              <div className="rounded-full bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                Valid for 30 days
              </div>
            </div>
            
            <div className="flex w-full items-center gap-3">
              <div className="flex-1 rounded-md border bg-muted/50 px-4 py-3 text-sm text-foreground overflow-x-auto whitespace-nowrap">
                {generatedLink}
              </div>
              <Button onClick={handleCopyLink} className="shrink-0 gap-2 bg-blue-600 hover:bg-blue-700">
                <Copy className="size-4" />
                Copy Link
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-2">
                <Clock className="size-4" />
                <span>{jobData?.get("duration")?.toString() || "15"} Minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Code className="size-4" /> 
                <span>5 Job Requirements Questions</span>
              </div>
            </div>
          </Card>

          {generatedCandidates.length > 0 && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Candidates & Interview Questions</Label>
                <div className="text-xs text-muted-foreground">{generatedCandidates.length} Candidates</div>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {generatedCandidates.map((candidate, idx) => (
                  <AccordionItem value={`item-${idx}`} key={idx} className="border bg-slate-50/50 rounded-lg mb-2 px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-4 text-left w-full">
                        <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <User className="size-4 text-blue-600" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="font-semibold text-sm text-slate-800 truncate">{candidate.candidate_name}</div>
                          <div className="text-xs text-slate-500 truncate">{candidate.candidate_email}</div>
                        </div>
                        {candidate.resume_score && (
                          <div className="mr-4 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded shrink-0">
                            Fit Score: {candidate.resume_score}/10
                          </div>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 border-t">
                      {candidate.custom_questions && Array.isArray(candidate.custom_questions) ? (
                        <div className="space-y-4 mt-2">
                          <div className="text-sm font-medium text-slate-700 mb-2">Groq Generated Custom Questions:</div>
                          {candidate.custom_questions.map((q: any, i: number) => (
                            <div key={i} className="flex gap-3 text-sm bg-white p-3 rounded-md border shadow-sm">
                              <span className="font-semibold text-blue-500">{i + 1}.</span>
                              <div className="space-y-1">
                                <p className="text-slate-700 leading-relaxed text-left">{q.question}</p>
                                <p className="text-xs text-slate-400 font-medium text-left">Type: {q.type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 py-2">No custom AI questions were generated. Standard questions will be used.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          )}

          <Card className="p-6 space-y-4">
            <Label className="text-base font-semibold">Share via</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className={`w-full gap-2 h-12 text-blue-600 border-blue-200 hover:bg-blue-50 ${isSendingEmails ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={handleSendEmails}
                disabled={isSendingEmails || generatedCandidates.length === 0}
              >
                {isSendingEmails ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                {isSendingEmails ? "Sending..." : "Send Email Invites to Candidates"}
              </Button>
              <Button variant="outline" className="w-full gap-2 h-12" onClick={handleCopyLink}>
                <Copy className="size-4" />
                Copy generic link
              </Button>
            </div>
          </Card>

          <div className="flex items-center justify-between pt-4">
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="w-[200px] gap-2">
                <ArrowLeft className="size-4" />
                Back to Dashboard
              </Button>
            </Link>
            <Button size="lg" onClick={() => {
              setStep("form");
              setJobData(null);
            }} className="w-[200px] gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="size-4" />
              Create New Interview
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
