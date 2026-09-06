"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { AddCandidateDialog } from "@/components/dashboard/add-candidate-dialog"

export function AddCandidateButton({
  jobId, jobTitle, jobDescription
}: {
  jobId: string
  jobTitle: string
  jobDescription: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <UserPlus className="size-4" />
        Add Candidate
      </Button>
      <AddCandidateDialog
        open={open}
        onOpenChange={setOpen}
        jobId={jobId}
        jobTitle={jobTitle}
        jobDescription={jobDescription}
      />
    </>
  )
}
