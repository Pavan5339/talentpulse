"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createInterviewAction } from "@/app/actions/interviews"
import { CheckCircle2 } from "lucide-react"

import { useRouter } from "next/navigation"

export function CandidateEntryForm({
  link,
  jobId,
  jobTitle,
  jobDescription,
}: {
  link: string
  jobId: string
  jobTitle: string
  jobDescription: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function onSubmit(formData: FormData) {
    formData.append("jobId", jobId)
    formData.append("jobTitle", jobTitle)
    formData.append("jobDescription", jobDescription)
    
    startTransition(async () => {
      try {
        const result = await createInterviewAction(formData)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success("Interview session created!")
          router.push(`/interview/${link}/start?interviewId=${result.interview.id}`)
        }
      } catch (err) {
        toast.error("An unexpected error occurred")
      }
    })
  }

  return (
    <Card className="p-8 shadow-lg">
      <div className="mb-6 rounded-lg bg-accent/50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-foreground">Job Description</h2>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {jobDescription}
        </p>
      </div>

      <form action={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="candidateName">Full Name</Label>
          <Input id="candidateName" name="candidateName" placeholder="Enter your first and last name" required disabled={isPending} />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="candidateEmail">Email Address</Label>
          <Input id="candidateEmail" name="candidateEmail" type="email" placeholder="Enter your email" required disabled={isPending} />
        </div>

        <Button type="submit" className="w-full h-12" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting Interview...
            </>
          ) : (
            "Start Video Interview"
          )}
        </Button>
      </form>
    </Card>
  )
}
