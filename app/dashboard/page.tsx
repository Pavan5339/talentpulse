import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { StatsOverview } from "@/components/dashboard/stats-overview"
import { JobsTable } from "@/components/dashboard/jobs-table"
import { getJobsAction, getDashboardDataAction } from "@/app/actions/jobs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { DashboardCharts } from "./dashboard-charts"

export default async function Dashboard() {
  const [jobsResult, dashboardResult] = await Promise.all([
    getJobsAction(),
    getDashboardDataAction()
  ])

  const { jobs } = jobsResult
  const { stats } = dashboardResult

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar className="fixed inset-y-0 left-0" activeItem="Dashboard" />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-64">
        <Header userName="Sarah" />

        <main className="flex-1 p-8">
          <div className="mx-auto max-w-6xl space-y-10">

            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your AI interviews and review candidates.</p>
              </div>
              <Link href="/create-interview">
                <Button className="gap-2">
                  <Plus className="size-4" />
                  New Interview
                </Button>
              </Link>
            </div>

            {/* Stats */}
            {stats && <StatsOverview stats={stats} />}

            {/* Charts */}
            {stats && (
              <DashboardCharts 
                verdictStats={stats.verdictStats || []} 
                activityTimeline={stats.activityTimeline || []} 
              />
            )}

            {/* Jobs table */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground tracking-tight">Your Interviews</h2>
                <span className="text-sm text-muted-foreground">
                  {jobs?.length ?? 0} total
                </span>
              </div>
              <JobsTable jobs={jobs as any} />
            </section>

          </div>
        </main>
      </div>
    </div>
  )
}
