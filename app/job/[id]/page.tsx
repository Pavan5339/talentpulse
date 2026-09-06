import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import JobShareView from "./client-page"
import { getJobByIdAction } from "@/app/actions/jobs"
import { getInterviewsByJobIdAction } from "@/app/actions/interviews"
import { notFound } from "next/navigation"
import CandidateList from "./candidate-list"
import { AddCandidateButton } from "./add-candidate-button"
import { DeleteJobButton } from "./delete-job-button"

export default async function JobDetailsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const { job, error: jobError } = await getJobByIdAction(id)
  const { interviews } = await getInterviewsByJobIdAction(id)

  if (jobError || !job) {
    notFound()
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar className="fixed inset-y-0 left-0" activeItem="Dashboard" />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-64">
        <Header userName="Sarah" />

        <main className="flex-1 p-6 space-y-6 max-w-7xl">
          {/* Header row with job title + Add Candidate */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{job.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage candidates and review AI evaluations</p>
            </div>
            <div className="flex items-center gap-3">
              <DeleteJobButton jobId={job.id} jobTitle={job.title} />
              <AddCandidateButton
                jobId={job.id}
                jobTitle={job.title}
                jobDescription={job.description}
              />
            </div>
          </div>


          <JobShareView job={job} />

          <CandidateList 
            interviews={interviews || []} 
            jobTitle={job.title}
            shareableLink={job.shareable_link}
          />
        </main>
      </div>
    </div>
  )
}
