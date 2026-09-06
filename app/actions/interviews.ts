"use server"

import { createClient } from "@/lib/supabase/server"
import { analyzeResumeAction } from "@/app/actions/ai"
import { extractText } from "unpdf"

export async function getJobByLinkAction(link: string) {
  if (!link) {
    return { error: "Link parameter is missing" };
  }
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("shareable_link", link)
    .maybeSingle(); // returns null instead of throwing when not found

  if (error || !data) {
    console.error("Error fetching job by link:", error);
    return { error: "Job not found or link is invalid" };
  }

  return { job: data };
}


export async function createInterviewAction(formData: FormData) {
  const candidateName = formData.get("candidateName") as string
  const candidateEmail = formData.get("candidateEmail") as string
  const jobId = formData.get("jobId") as string
  const jobTitle = formData.get("jobTitle") as string
  const jobDescription = formData.get("jobDescription") as string
  const resumeFile = formData.get("resume") as File | null

  if (!candidateName || !candidateEmail || !jobId) {
    return { error: "Missing required fields" }
  }

  const supabase = await createClient()

  // 1. Check if an interview already exists for this candidate (pre-added by recruiter)
  const { data: existingCandidate } = await supabase
    .from("interviews")
    .select("*")
    .eq("job_id", jobId)
    .eq("candidate_email", candidateEmail)
    .single()

  if (existingCandidate) {
    return { success: true, interview: existingCandidate }
  }

  // 2. If they don't exist, create a new row (Public link fallback)
  const resumeData = await handleResumeAnalysis(supabase, jobId, jobTitle, jobDescription, resumeFile)

  const { data, error } = await supabase
    .from("interviews")
    .insert([
      {
        job_id: jobId,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        status: "PENDING",
        ...resumeData
      }
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating interview:", error)
    return { error: "Failed to start interview" }
  }

  return { success: true, interview: data }
}

export async function handleResumeAnalysis(
  supabase: any,
  jobId: string,
  jobTitle: string,
  jobDescription: string,
  resumeFile: File | null,
  existingAnalysis?: { resumeScore: number; resumeSummary: string; customQuestions: any[]; resumeText: string }
) {
  let resumeText = ""
  let resumeScore: number | null = null
  let resumeSummary: string | null = null
  let customQuestions: any[] | null = null
  let resumeUrl: string | null = null

  if (resumeFile && resumeFile.size > 0) {
    try {
      const arrayBuffer = await resumeFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Use unpdf - a server-friendly PDF text extractor (no worker needed)
      const { text: extractedText } = await extractText(new Uint8Array(buffer), { mergePages: true })
      resumeText = extractedText as string

      const fileName = `${jobId}/${Date.now()}_${resumeFile.name.replace(/\s/g, '_')}`
      const { data: uploadData } = await supabase.storage
        .from("resumes")
        .upload(fileName, buffer, { contentType: "application/pdf", upsert: false })
      
      if (uploadData) {
        const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(uploadData.path)
        resumeUrl = urlData?.publicUrl || null
      }

        if (existingAnalysis) {
          resumeText = existingAnalysis.resumeText
          resumeScore = existingAnalysis.resumeScore
          resumeSummary = existingAnalysis.resumeSummary
          customQuestions = existingAnalysis.customQuestions
        } else if (resumeText.trim().length > 50) {
          const analysis = await analyzeResumeAction(resumeText, {
            title: jobTitle,
            description: jobDescription,
          })
          if (analysis.success && 'resumeScore' in analysis) {
            resumeScore = analysis.resumeScore ?? null
            resumeSummary = analysis.resumeSummary ?? null
            customQuestions = analysis.customQuestions ?? null
          }
        }
    } catch (err) {
      console.error("Resume analysis error:", err)
    }
  }

  return {
    resume_text: resumeText || null,
    resume_score: resumeScore,
    resume_summary: resumeSummary,
    resume_url: resumeUrl,
    custom_questions: customQuestions,
  }
}

export async function addCandidateWithResumeAction(formData: FormData) {
  const candidateName = formData.get("candidateName") as string
  const candidateEmail = formData.get("candidateEmail") as string
  const jobId = formData.get("jobId") as string
  const jobTitle = formData.get("jobTitle") as string
  const jobDescription = formData.get("jobDescription") as string
  const resumeFile = formData.get("resume") as File | null

  if (!candidateName || !candidateEmail || !jobId) {
    return { error: "Missing required fields" }
  }

  const supabase = await createClient()

  // Use the shared helper
  const resumeData = await handleResumeAnalysis(supabase, jobId, jobTitle, jobDescription, resumeFile)

  const { data, error } = await supabase
    .from("interviews")
    .insert([{
      job_id: jobId,
      candidate_name: candidateName,
      candidate_email: candidateEmail,
      status: "PENDING",
      ...resumeData
    }])
    .select()
    .single()

  if (error) {
    console.error("Error creating candidate:", error)
    return { error: "Failed to add candidate" }
  }

  return {
    success: true,
    interview: data,
    resumeScore: resumeData.resume_score,
    resumeSummary: resumeData.resume_summary,
  }
}

export async function completeInterviewAction(
  interviewId: string, 
  evaluation: any,
  transcript?: { role: string; content: string }[],
  videoUrl?: string
) {
  const supabase = await createClient()
  
  const updatePayload: Record<string, any> = {
    status: "COMPLETED",
    evaluation_summary: evaluation
  }

  // Save the full chat transcript (all questions + answers) if provided
  if (transcript && transcript.length > 0) {
    updatePayload.transcript = transcript
  }

  // Save the video recording URL if provided
  if (videoUrl) {
    updatePayload.video_url = videoUrl
  }

  const { error } = await supabase
    .from("interviews")
    .update(updatePayload)
    .eq("id", interviewId)

  if (error) {
    console.error("Error saving evaluation:", error)
    return { error: "Failed to persist interview results" }
  }

  return { success: true }
}

export async function uploadInterviewVideoAction(
  interviewId: string,
  videoBase64: string
) {
  const supabase = await createClient()

  try {
    const buffer = Buffer.from(videoBase64, 'base64')
    const fileName = `interviews/${interviewId}/${Date.now()}_recording.webm`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("resumes")  // Reuse existing bucket (or create a "recordings" bucket)
      .upload(fileName, buffer, { contentType: "video/webm", upsert: false })

    if (uploadError) {
      console.error("Video upload error:", uploadError)
      return { error: "Failed to upload video recording" }
    }

    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(uploadData.path)
    return { success: true, videoUrl: urlData?.publicUrl || null }
  } catch (err: any) {
    console.error("Video upload error:", err)
    return { error: err.message || "Unknown video upload error" }
  }
}

export async function getInterviewsByJobIdAction(jobId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching interviews:", error)
    return { error: "Failed to fetch interviews" }
  }

  return { interviews: data }
}

export async function getInterviewByIdAction(interviewId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("id", interviewId)
    .single()

  if (error || !data) {
    console.error("Error fetching interview:", error)
    return { error: "Failed to fetch interview details" }
  }

  return { interview: data }
}

export async function deleteCandidateAction(interviewId: string, jobId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { error } = await supabase
    .from("interviews")
    .delete()
    .eq("id", interviewId)

  if (error) {
    console.error("Error deleting candidate:", error)
    return { error: "Failed to delete candidate" }
  }

  const { revalidatePath } = await import("next/cache")
  revalidatePath(`/job/${jobId}`)

  return { success: true }
}
