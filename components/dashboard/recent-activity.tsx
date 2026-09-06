import { Card } from "@/components/ui/card"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { User, ChevronRight } from "lucide-react"
import Link from "next/link"

interface RecentActivityProps {
  activities: {
    id: string
    candidateName: string
    jobTitle: string
    status: string
    createdAt: string
  }[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (!activities || activities.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground border-none shadow-sm bg-background/50 backdrop-blur-sm">
        <p>No recent activity found.</p>
      </Card>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Recent Candidates</h2>
        <Link href="/dashboard/interviews" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      <Card className="overflow-hidden border-none shadow-sm bg-background/50 backdrop-blur-sm">
        <div className="divide-y divide-border">
          {activities.map((activity) => (
            <Link 
              key={activity.id} 
              href={`/interview/${activity.id}/results`}
              className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <User className="size-5" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{activity.candidateName}</div>
                  <div className="text-xs text-muted-foreground">{activity.jobTitle}</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden sm:block text-right">
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(activity.createdAt), "dd MMM, hh:mm a")}
                  </div>
                </div>
                <Badge 
                  variant={activity.status === "COMPLETED" ? "default" : "secondary"}
                  className={`capitalize select-none ${activity.status === "COMPLETED" ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-none px-3 font-semibold" : ""}`}
                >
                  {activity.status.toLowerCase()}
                </Badge>
                <ChevronRight className="size-4 text-muted-foreground opacity-50 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </section>
  )
}
