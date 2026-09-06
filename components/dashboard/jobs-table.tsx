"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Users, Star, ChevronRight, Plus } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

type Job = {
  id: string
  title: string
  description: string
  shareable_link: string
  created_at: string
  interviewsCount: number
  completedCount: number
  avgTechnicalScore: number | null
}

export function JobsTable({ jobs }: { jobs?: Job[] }) {
  if (!jobs || jobs.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed border-2 border-border bg-transparent shadow-none gap-4">
        <div className="rounded-full bg-accent p-4">
          <Building2 className="size-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">No interviews yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Create your first AI interview to get started.</p>
        </div>
        <Link href="/create-interview">
          <Button className="gap-2 mt-2">
            <Plus className="size-4" />
            Create Interview
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <Link key={job.id} href={`/job/${job.id}`} className="block group">
          <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4 border-none shadow-sm hover:shadow-md transition-all duration-200 bg-background/60 backdrop-blur-sm group-hover:border-primary/20 border">
            {/* Left: Icon + Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent group-hover:bg-primary/10 transition-colors">
                <Building2 className="size-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Created {format(new Date(job.created_at), "dd MMM yyyy")}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm flex-wrap">
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="size-4" />
                  <span className="font-semibold text-foreground text-base">{job.interviewsCount}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">Candidates</span>
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <span className="font-semibold text-foreground text-base">{job.completedCount}</span>
                <span className="text-[11px] text-muted-foreground">Completed</span>
              </div>

              <div className="flex flex-col items-center gap-0.5">
                {job.avgTechnicalScore !== null ? (
                  <div className="flex items-center gap-1">
                    <Star className="size-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-semibold text-foreground text-base">{job.avgTechnicalScore}/10</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-base font-semibold">—</span>
                )}
                <span className="text-[11px] text-muted-foreground">Avg Score</span>
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <Badge
                  variant={job.completedCount > 0 ? "default" : "secondary"}
                  className={`text-xs px-2 ${job.completedCount > 0 ? "bg-green-500/10 text-green-600 hover:bg-green-500/10 border-none" : ""}`}
                >
                  {job.completedCount > 0 ? "Active" : "Pending"}
                </Badge>
              </div>
            </div>

            {/* CTA */}
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              View Candidates
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Card>
        </Link>
      ))}
    </div>
  )
}
