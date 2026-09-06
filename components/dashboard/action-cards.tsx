import { Phone, Video } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export function ActionCards() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Dashboard</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <Link href="/create-interview" className="outline-none h-full">
          <Card className="cursor-pointer p-6 transition-shadow hover:shadow-md h-full">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent">
                <Video className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Create New Interview</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create AI interviews and schedule them with candidates
                </p>
              </div>
            </div>
          </Card>
        </Link>
        <Card className="cursor-pointer p-6 transition-shadow hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent">
              <Phone className="size-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Create Phone Screening Call</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Schedule phone screening calls with potential candidates
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
