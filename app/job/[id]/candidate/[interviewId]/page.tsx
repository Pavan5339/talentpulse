import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { getJobByIdAction } from "@/app/actions/jobs"
import { getInterviewByIdAction } from "@/app/actions/interviews"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BrainCircuit, CheckCircle, MessageSquare, UserCircle2, XCircle, ArrowLeft, FileText, Star } from "lucide-react"

export default async function CandidateEvaluationPage(props: { params: Promise<{ id: string, interviewId: string }> }) {
  const { id: jobId, interviewId } = await props.params
  
  const { job, error: jobError } = await getJobByIdAction(jobId)
  const { interview, error: interviewError } = await getInterviewByIdAction(interviewId)

  if (jobError || interviewError || !job || !interview) {
    notFound()
  }

  const evalData = interview.evaluation_summary

  if (!evalData) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:block">
          <Sidebar className="fixed inset-y-0 left-0" activeItem="All Interview" />
        </div>
        <div className="flex flex-1 flex-col lg:ml-64">
          <Header userName="Sarah" />
          <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold">Candidate Evaluation Not Ready</h2>
            <p className="text-muted-foreground">This interview has not been evaluated yet.</p>
            <Link href={`/job/${jobId}`}>
              <Button className="mt-4"><ArrowLeft className="mr-2" /> Back to Job</Button>
            </Link>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar className="fixed inset-y-0 left-0" activeItem="Dashboard" />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-64 bg-slate-50/30">
        <Header userName="Sarah" />

        <main className="flex-1 p-6 space-y-8 max-w-5xl mx-auto w-full pb-16">
          
          {/* Back Header */}
          <div className="flex items-center gap-4 border-b pb-6 mt-4">
            <Link href={`/job/${jobId}`}>
              <Button variant="ghost" size="icon" className="shrink-0 bg-white shadow-sm border border-slate-200">
                <ArrowLeft className="size-5 text-slate-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                <UserCircle2 className="size-8 text-primary" />
                AI Evaluation: {interview.candidate_name}
              </h1>
              <p className="text-slate-500 font-medium ml-11">Applying for: <span className="text-slate-700">{job.title}</span></p>
            </div>
          </div>

          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Top Stats */}
            <div className="flex justify-around bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="text-center w-full">
                    <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-2">Technical</p>
                    <p className="text-4xl font-black text-slate-800">{evalData.technicalScore}<span className="text-xl text-slate-300">/10</span></p>
                </div>
                <div className="text-center w-full border-l border-slate-100">
                    <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-2">Communication</p>
                    <p className="text-4xl font-black text-slate-800">{evalData.communicationScore}<span className="text-xl text-slate-300">/10</span></p>
                </div>
                <div className="text-center w-full border-l border-slate-100">
                    <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-2">Verdict</p>
                    <p className={`text-2xl font-black uppercase mt-2 ${
                        evalData.finalVerdict === "Strong Hire" ? "text-green-500" :
                        evalData.finalVerdict === "Hire" ? "text-blue-500" : "text-red-500"
                    }`}>{evalData.finalVerdict}</p>
                </div>
            </div>
            
            {/* Split View for Resume vs Interview Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Resume Analysis */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h4 className="font-bold text-lg text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
                      <FileText className="size-5 text-blue-500" /> Resume Analysis
                  </h4>
                  {interview.resume_score !== null && (
                    <div className="flex items-center gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100 w-max">
                      <Star className={`size-5 ${interview.resume_score >= 8 ? 'text-green-500 fill-green-500' : interview.resume_score >= 5 ? 'text-yellow-500 fill-yellow-500' : 'text-red-500 fill-red-500'}`} />
                      <span className="font-bold text-slate-700">Fit Score: {interview.resume_score}/10</span>
                    </div>
                  )}
                  <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
                    {interview.resume_summary || "No resume was provided or analyzed for this candidate."}
                  </p>
              </div>

              {/* Interview Summary */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h4 className="font-bold text-lg text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
                      <BrainCircuit className="size-5 text-purple-500" /> Voice Interview Analysis
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
                    {evalData.summary || "No verbal summary generated."}
                  </p>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50/50 p-6 rounded-2xl border border-green-200 shadow-sm">
                    <h4 className="font-bold text-green-700 flex items-center gap-2 mb-4 text-lg">
                        <CheckCircle className="size-5" /> Key Strengths
                    </h4>
                    <ul className="space-y-3">
                        {evalData.strengths?.map((s: string, i: number) => (
                            <li key={i} className="flex gap-3 items-start text-green-900 font-medium text-sm leading-relaxed">
                                <div className="mt-1 size-1.5 rounded-full bg-green-500 shrink-0"></div> 
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-red-50/50 p-6 rounded-2xl border border-red-200 shadow-sm">
                    <h4 className="font-bold text-red-600 flex items-center gap-2 mb-4 text-lg">
                        <XCircle className="size-5" /> Areas for Improvement
                    </h4>
                    <ul className="space-y-3">
                        {evalData.weaknesses?.map((w: string, i: number) => (
                            <li key={i} className="flex gap-3 items-start text-red-900 font-medium text-sm leading-relaxed">
                                <div className="mt-1 size-1.5 rounded-full bg-red-400 shrink-0"></div> 
                                {w}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
