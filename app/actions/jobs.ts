"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { extractText } from "unpdf"
import { analyzeResumeAction } from "@/app/actions/ai"

export type Job = {
  id: string;
  title: string;
  description: string;
  shareable_link: string;
  created_at: string;
}

export async function createJobAction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated. Please log in." }

  const title = formData.get("title")?.toString() || "New Job"
  const description = formData.get("description")?.toString() || ""
  const duration = formData.get("duration")?.toString() || "15"
  const types = JSON.parse(formData.get("types")?.toString() || '["technical"]')
  const candidatePreviews = JSON.parse(formData.get("candidatePreviews")?.toString() || "[]")
  const candidatesCount = parseInt(formData.get("candidatesCount")?.toString() || "0", 10)

  const uniqueToken = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)

  // 1. Insert job row
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert([{
      title,
      description,
      duration: parseInt(duration, 10),
      types,
      shareable_link: uniqueToken,
      user_id: user.id,
    }])
    .select()
    .single()

  if (jobError || !job) {
    console.error("Error creating job:", jobError)
    return { error: jobError?.message || "Failed to create job in database." }
  }

  const insertedCandidates: any[] = []

  // 2. Insert candidate rows with resume uploads + AI analysis
  for (let i = 0; i < candidatesCount; i++) {
    const candidateName = formData.get(`candidateName_${i}`)?.toString() || ""
    const candidateEmail = formData.get(`candidateEmail_${i}`)?.toString() || ""
    const resumeFile = formData.get(`resume_${i}`) as File | null

    if (!candidateName || !candidateEmail) continue

    // Pull the pre-computed AI preview for this candidate (from the review step)
    const preview = candidatePreviews[i] || {}

    let resumeUrl: string | null = null
    let resumeText: string | null = preview.resumeText || null
    let resumeScore: number | null = preview.resumeScore ?? null
    let resumeSummary: string | null = preview.resumeSummary || null
    let customQuestions: any[] | null = preview.customQuestions || null

    // Upload the actual PDF file to Supabase Storage
    if (resumeFile && resumeFile.size > 0) {
      try {
        const arrayBuffer = await resumeFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const fileName = `${job.id}/${Date.now()}_${resumeFile.name.replace(/\s/g, "_")}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(fileName, buffer, { contentType: "application/pdf", upsert: false })

        if (uploadError) {
          console.error(`Resume upload error for ${candidateName}:`, uploadError)
        } else if (uploadData) {
          const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(uploadData.path)
          resumeUrl = urlData?.publicUrl || null
          console.log(`Resume uploaded for ${candidateName}: ${resumeUrl}`)
        }

        // If no pre-computed analysis, do it now from the file
        if (!resumeText || !resumeScore) {
          const { text: extracted } = await extractText(new Uint8Array(buffer), { mergePages: true })
          resumeText = extracted as string
          if (resumeText && resumeText.trim().length > 50) {
            const analysis = await analyzeResumeAction(resumeText, { title, description })
            if (analysis.success && "resumeScore" in analysis) {
              resumeScore = analysis.resumeScore ?? null
              resumeSummary = analysis.resumeSummary ?? null
              customQuestions = analysis.customQuestions ?? null
            }
          }
        }
      } catch (err) {
        console.error(`Error processing resume for ${candidateName}:`, err)
      }
    }

    const { data: candidateRow, error: candidateError } = await supabase
      .from("interviews")
      .insert([{
        job_id: job.id,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        status: "PENDING",
        resume_url: resumeUrl,
        resume_text: resumeText,
        resume_score: resumeScore,
        resume_summary: resumeSummary,
        custom_questions: customQuestions,
      }])
      .select()
      .single()

    if (candidateError) {
      console.error(`Error inserting candidate ${candidateName}:`, candidateError)
    } else if (candidateRow) {
      insertedCandidates.push(candidateRow)
    }
  }

  revalidatePath("/dashboard")

  return {
    success: true,
    link: uniqueToken,
    job,
    candidates: insertedCandidates,
  }
}

export async function getJobsAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { jobs: [] }

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching jobs:", error)
    return { jobs: [] }
  }

  // Attach interview counts per job
  const jobsWithStats = await Promise.all((jobs || []).map(async (job) => {
    const { data: interviews } = await supabase
      .from("interviews")
      .select("id, status, resume_score")
      .eq("job_id", job.id)

    const total = interviews?.length || 0
    const completed = interviews?.filter((i) => i.status === "COMPLETED").length || 0
    const scores = interviews?.filter((i) => i.resume_score != null).map((i) => i.resume_score as number) || []
    const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null

    return {
      ...job,
      interviewsCount: total,
      completedCount: completed,
      avgTechnicalScore: avgScore ? parseFloat(avgScore) : null,
    }
  }))

  return { jobs: jobsWithStats }
}

export async function getJobByIdAction(id: string) {
  const supabase = await createClient()

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !job) {
    console.error("Error fetching job:", error)
    return { error: "Job not found" }
  }

  return { job }
}

export async function getDashboardDataAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { stats: null, recentActivity: [] }

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("user_id", user.id)

  const jobIds = (jobs || []).map((j) => j.id)

  if (jobIds.length === 0) {
    return {
      stats: {
        totalJobs: 0,
        totalInterviews: 0,
        completedInterviews: 0,
        pendingInterviews: 0,
        completionRate: 0,
        avgResumeScore: 0,
        verdictStats: [],
        activityTimeline: [],
      },
      recentActivity: [],
    }
  }

  const { data: interviews } = await supabase
    .from("interviews")
    .select("*")
    .in("job_id", jobIds)
    .order("created_at", { ascending: false })

  const all = interviews || []
  const completed = all.filter((i) => i.status === "COMPLETED")
  const pending = all.filter((i) => i.status === "PENDING")
  const scores = all.filter((i) => i.resume_score != null).map((i) => i.resume_score as number)
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

  // Build activity timeline (last 7 days)
  const timeline: { date: string; interviews: number }[] = []
  for (let d = 6; d >= 0; d--) {
    const day = new Date()
    day.setDate(day.getDate() - d)
    const label = day.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const count = all.filter((i) => new Date(i.created_at).toDateString() === day.toDateString()).length
    timeline.push({ date: label, interviews: count })
  }

  const recentActivity = all.slice(0, 10).map((i) => ({
    id: i.id,
    candidateName: i.candidate_name,
    jobTitle: "", // could join with jobs table
    status: i.status,
    createdAt: i.created_at,
  }))

  return {
    stats: {
      totalJobs: jobIds.length,
      totalInterviews: all.length,
      completedInterviews: completed.length,
      pendingInterviews: pending.length,
      completionRate: all.length ? Math.round((completed.length / all.length) * 100) : 0,
      avgResumeScore: Math.round(avgScore * 10) / 10,
      verdictStats: [],
      activityTimeline: timeline,
    },
    recentActivity,
  }
}

export async function deleteJobAction(jobId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", jobId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error deleting job:", error)
    return { error: "Failed to delete job" }
  }

  revalidatePath("/dashboard")
  return { success: true }
}
