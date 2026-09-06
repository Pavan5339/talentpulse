import { notFound } from "next/navigation"
import { getJobByLinkAction } from "@/app/actions/interviews"
import { CandidateEntryForm } from "./entry-form"

// Remove generateStaticParams or similar if it's dynamic
export default async function InterviewPage({ params }: { params: Promise<{ link: string }> }) {
  const { link } = await params
  
  const { job, error } = await getJobByLinkAction(link)

  if (error || !job) {
    return notFound()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to the AI Interview</h1>
          <p className="mt-2 text-muted-foreground">You have been invited to interview for the role of <strong>{job.title}</strong>.</p>
        </div>
        
        <CandidateEntryForm link={link} jobId={job.id} jobTitle={job.title} jobDescription={job.description} />
      </div>
    </div>
  )
}
