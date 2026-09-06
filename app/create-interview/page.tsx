import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { CreateInterviewForm } from "./form"

export default function CreateInterviewPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar className="fixed inset-y-0 left-0" />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-64">
        <Header userName="Sarah" />

        <main className="flex-1 p-6">
          <CreateInterviewForm />
        </main>
      </div>
    </div>
  )
}
