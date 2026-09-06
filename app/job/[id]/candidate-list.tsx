"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Users, UserCircle2, BrainCircuit, MessageSquare,
  Loader2, SlidersHorizontal, X, Star, Trash2, Mail
} from "lucide-react"
import { toast } from "sonner"
import { deleteCandidateAction } from "@/app/actions/interviews"
import { sendInterviewInvitesAction } from "@/app/actions/emails"

const timeAgo = (dateStr: string) => {
  const time = new Date(dateStr).getTime()
  const now = Date.now()
  const diff = Math.floor((now - time) / 1000 / 60)
  if (diff < 1) return "Just now"
  if (diff < 60) return `${diff} mins ago`
  if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`
  return `${Math.floor(diff / 1440)} days ago`
}

const VERDICTS = ["All", "Strong Hire", "Hire", "No Hire"] as const
const STATUSES = ["All", "Completed", "Pending"] as const

export default function CandidateList({ interviews, jobTitle, shareableLink }: { interviews: any[], jobTitle?: string, shareableLink?: string }) {
  const [minScore, setMinScore] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [verdictFilter, setVerdictFilter] = useState<string>("All")
  const [showFilters, setShowFilters] = useState(false)

  const completedInterviews = interviews.filter(i => i.status === "COMPLETED" && i.evaluation_summary)
  const avgTechnical = completedInterviews.length
    ? Math.round((completedInterviews.reduce((sum, i) => sum + (i.evaluation_summary?.technicalScore ?? 0), 0) / completedInterviews.length) * 10) / 10
    : null
  const avgComm = completedInterviews.length
    ? Math.round((completedInterviews.reduce((sum, i) => sum + (i.evaluation_summary?.communicationScore ?? 0), 0) / completedInterviews.length) * 10) / 10
    : null

  const interviewsWithResume = interviews.filter(i => typeof i.resume_score === 'number')
  const avgResume = interviewsWithResume.length
    ? Math.round((interviewsWithResume.reduce((sum, i) => sum + (i.resume_score ?? 0), 0) / interviewsWithResume.length) * 10) / 10
    : null

  const filtered = useMemo(() => {
    return interviews.filter(i => {
      const isCompleted = i.status === "COMPLETED"
      const evalData = i.evaluation_summary
      if (statusFilter === "Completed" && !isCompleted) return false
      if (statusFilter === "Pending" && isCompleted) return false
      if (verdictFilter !== "All" && evalData?.finalVerdict !== verdictFilter) return false
      if (minScore > 0 && (!evalData || evalData.technicalScore < minScore)) return false
      return true
    })
  }, [interviews, statusFilter, verdictFilter, minScore])

  const hasActiveFilter = statusFilter !== "All" || verdictFilter !== "All" || minScore > 0

  const clearFilters = () => {
    setStatusFilter("All")
    setVerdictFilter("All")
    setMinScore(0)
  }

  if (!interviews || !interviews.length) {
    return (
      <Card className="mt-8 border-dashed bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <Users className="size-16 mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-foreground">No Candidates Yet</h3>
          <p className="mt-2 max-w-sm">Share the interview link above with candidates to start gathering automated AI evaluations.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: interviews.length },
          { label: "Completed", value: completedInterviews.length },
          { label: "Avg Technical", value: avgTechnical !== null ? `${avgTechnical}/10` : "—" },
          { label: "Avg Resume", value: avgResume !== null ? `${avgResume}/10` : "—" },
        ].map(stat => (
          <div key={stat.label} className="flex flex-col items-center justify-center bg-accent/50 rounded-xl p-3 text-center">
            <span className="text-xl font-bold text-foreground">{stat.value}</span>
            <span className="text-xs text-muted-foreground mt-0.5">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Header + filter toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Candidate Results</h2>
          <Badge variant="secondary" className="px-3 py-1 font-semibold text-sm">
            {filtered.length} / {interviews.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
              <X className="size-3.5" /> Clear
            </Button>
          )}
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(f => !f)}
            className="gap-2"
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {hasActiveFilter && <span className="size-2 rounded-full bg-primary inline-block" />}
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-5 border border-border/60 bg-accent/30 shadow-none space-y-5">
          <div className="grid sm:grid-cols-3 gap-6">
            {/* Min Technical Score */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex justify-between">
                Min Technical Score
                <span className="text-primary font-bold">{minScore > 0 ? `≥ ${minScore}` : "Any"}</span>
              </label>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                className="w-full accent-primary h-2 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Any</span>
                <span>10</span>
              </div>
            </div>

            {/* Status filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Status</label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      statusFilter === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Verdict filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">AI Verdict</label>
              <div className="flex flex-wrap gap-2">
                {VERDICTS.map(v => (
                  <button
                    key={v}
                    onClick={() => setVerdictFilter(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      verdictFilter === v
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Candidate grid */}
      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-dashed">
          <Users className="size-10 mb-3 opacity-30" />
          <p className="font-medium">No candidates match your filters.</p>
          <button onClick={clearFilters} className="mt-2 text-sm text-primary hover:underline">Clear filters</button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((interview) => (
            <CandidateCard 
              key={interview.id} 
              interview={interview} 
              jobTitle={jobTitle || "AI Interview"} 
              shareableLink={shareableLink || ""} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CandidateCard({ interview, jobTitle, shareableLink }: { interview: any, jobTitle: string, shareableLink: string }) {
  const router = useRouter()
  const [isPendingDelete, startDeleteTransition] = useTransition()
  const [isPendingEmail, startEmailTransition] = useTransition()

  const isCompleted = interview.status === "COMPLETED"
  const evalData = interview.evaluation_summary
  const resumeScore: number | null = interview.resume_score ?? null
  const resumeSummary: string | null = interview.resume_summary ?? null

  const getResumeFit = (score: number) => {
    if (score >= 8) return { label: "Strong Fit", color: "bg-green-500/10 text-green-600 border-green-200" }
    if (score >= 5) return { label: "Good Fit", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" }
    return { label: "Weak Fit", color: "bg-red-500/10 text-red-600 border-red-200" }
  }

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-lg border-slate-200 ${!isCompleted ? "opacity-75 grayscale-[0.2]" : "border-t-4 border-t-primary"}`}>
      <CardHeader className="bg-slate-50/70 pb-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100">
              <UserCircle2 className="size-8 text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">{interview.candidate_name}</CardTitle>
              <div className="text-xs font-medium text-slate-500 mt-1" suppressHydrationWarning>
                {interview.candidate_email && <span className="mr-1">{interview.candidate_email} •</span>} {timeAgo(interview.created_at)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-green-500 hover:bg-green-600 shadow-sm" : ""}>
              {isCompleted ? "Evaluated" : "In Progress"}
            </Badge>
            {resumeScore !== null && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getResumeFit(resumeScore).color}`}>
                <Star className="size-2.5 fill-current" />
                Resume {resumeScore}/10 · {getResumeFit(resumeScore).label}
              </div>
            )}
            {!isCompleted && (
              <div className="flex items-center gap-1 mt-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    const fullLink = `${window.location.origin}/interview/${shareableLink}`
                    startEmailTransition(async () => {
                      const res = await sendInterviewInvitesAction([interview], jobTitle, fullLink)
                      if (res.error) toast.error(res.error)
                      else toast.success(`Email sent to ${interview.candidate_name}!`)
                    })
                  }}
                  disabled={isPendingEmail || isPendingDelete || !shareableLink}
                  title="Send Invite Email"
                >
                  {isPendingEmail ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${interview.candidate_name}?`)) {
                      startDeleteTransition(async () => {
                        const res = await deleteCandidateAction(interview.id, interview.job_id)
                        if (res.error) toast.error(res.error)
                        else {
                          toast.success("Candidate deleted")
                        }
                      })
                    }
                  }}
                  disabled={isPendingDelete || isPendingEmail}
                  title="Delete Candidate"
                >
                  {isPendingDelete ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                </Button>
              </div>
            )}
          </div>
        </div>
        {resumeSummary && (
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed border-t pt-3">{resumeSummary}</p>
        )}
      </CardHeader>

      <CardContent className="pt-6">
        {isCompleted && evalData ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col bg-slate-50 border border-slate-100 p-3 rounded-xl items-center shadow-sm">
                <span className="text-slate-500 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1">
                  <BrainCircuit className="size-3.5" /> Technical
                </span>
                <span className="font-extrabold text-2xl text-slate-800">{evalData.technicalScore}<span className="text-sm font-medium text-slate-400">/10</span></span>
              </div>
              <div className="flex flex-col bg-slate-50 border border-slate-100 p-3 rounded-xl items-center shadow-sm">
                <span className="text-slate-500 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1">
                  <MessageSquare className="size-3.5" /> Comm.
                </span>
                <span className="font-extrabold text-2xl text-slate-800">{evalData.communicationScore}<span className="text-sm font-medium text-slate-400">/10</span></span>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-bold bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
              AI Verdict:
              <span className={
                evalData.finalVerdict === "Strong Hire" ? "text-green-600 bg-green-50 px-2 py-0.5 rounded-md" :
                evalData.finalVerdict === "Hire" ? "text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md" :
                "text-red-600 bg-red-50 px-2 py-0.5 rounded-md"
              }>
                {evalData.finalVerdict}
              </span>
            </div>

            <Link href={`/job/${interview.job_id}/candidate/${interview.id}`}>
              <Button className="w-full mt-2 font-semibold shadow-sm hover:bg-slate-100 transition-colors" variant="outline" size="default">
                View Full AI Report
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-xl border border-slate-100">
            <Loader2 className="size-6 text-slate-300 animate-spin mb-2" />
            <p className="text-sm font-medium text-slate-500">Candidate has not finished the interview yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
