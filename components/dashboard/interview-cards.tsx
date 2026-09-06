import { Send, Building2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Job } from "@/app/actions/jobs"
import { format } from "date-fns"
import { CopyLinkButton } from "./copy-link-button"
import Link from "next/link"

export function InterviewCards({ jobs }: { jobs?: (Job & { interviewsCount: number })[] }) {
  if (!jobs || jobs.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Previously Created Interviews
        </h2>
        <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground shadow-sm">
          <Building2 className="mb-4 size-10 opacity-20" />
          <p>No interviews created yet.</p>
        </Card>
      </section>
    )
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Previously Created Interviews
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
                <Building2 className="size-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">
                {format(new Date(job.created_at), "dd MMM yyyy")}
              </span>
            </div>

            <div className="mt-4">
              <Link href={`/job/${job.id}`} className="hover:underline">
                <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
              </Link>
              <p className="mt-0.5 text-sm text-muted-foreground truncate">
                {job.interviewsCount} candidate(s)
              </p>
            </div>

            <div className="mt-4 flex gap-3">
              <CopyLinkButton link={job.shareable_link} />
              <Link href={`/job/${job.id}`} className="flex-1">
                <Button size="sm" variant="outline" className="w-full gap-1.5">
                  <Send className="size-4" />
                  Details
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
