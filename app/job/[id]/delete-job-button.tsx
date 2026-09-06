"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { deleteJobAction } from "@/app/actions/jobs"
import { toast } from "sonner"

export function DeleteJobButton({ jobId, jobTitle }: { jobId: string, jobTitle: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (window.confirm(`Are you absolutely sure you want to delete the job "${jobTitle}" and all associated candidate data? This action cannot be undone.`)) {
      startTransition(async () => {
        const res = await deleteJobAction(jobId)
        if (res.error) {
          toast.error(res.error)
        } else {
          toast.success("Job completely deleted.")
          router.push("/dashboard")
          router.refresh()
        }
      })
    }
  }

  return (
    <Button 
      variant="ghost" 
      onClick={handleDelete} 
      disabled={isPending}
      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      Delete Entire Job
    </Button>
  )
}
