import { notFound } from "next/navigation"
import { getJobByLinkAction, getInterviewByIdAction } from "@/app/actions/interviews"
import ActiveInterviewRoom from "./active-room"

export default async function InterviewStartPage(props: { params: Promise<{ link: string }>; searchParams: Promise<{ interviewId?: string }> }) {
  const { link } = await props.params
  const { interviewId } = await props.searchParams
  
  if (!interviewId) {
    return notFound()
  }

  const [{ job, error }, { interview }] = await Promise.all([
    getJobByLinkAction(link),
    getInterviewByIdAction(interviewId)
  ])

  if (error || !job) {
    return notFound()
  }

  const customQuestions = (interview as any)?.custom_questions ?? null

  return (
    <ActiveInterviewRoom job={job} interviewId={interviewId} customQuestions={customQuestions} />
  )
}
