import { Card } from "@/components/ui/card"
import { Briefcase, Users, CheckCircle, Clock } from "lucide-react"

interface StatsOverviewProps {
  stats: {
    totalJobs: number
    totalInterviews: number
    completedInterviews: number
    pendingInterviews: number
    completionRate: number
    avgResumeScore: number | null
  }
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const cards = [
    {
      title: "Active Jobs",
      value: stats.totalJobs,
      icon: Briefcase,
      color: "text-blue-600",
      bg: "bg-blue-100/50",
    },
    {
      title: "Total Interviews",
      value: stats.totalInterviews,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-100/50",
    },
    {
      title: "Completed",
      value: stats.completedInterviews,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100/50",
    },
    {
      title: "Completion Rate",
      value: `${stats.completionRate}%`,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-100/50",
    },
    {
      title: "Avg Resume Fit",
      value: stats.avgResumeScore !== null ? `${stats.avgResumeScore}/10` : "—",
      icon: Briefcase, // Or another suitable icon
      color: "text-blue-500",
      bg: "bg-blue-100/30",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="p-6 border-none shadow-sm hover:shadow-md transition-shadow bg-background/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <h3 className="mt-1 text-2xl font-bold text-foreground tracking-tight">{card.value}</h3>
            </div>
            <div className={`rounded-xl p-3 ${card.bg}`}>
              <card.icon className={`size-5 ${card.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
