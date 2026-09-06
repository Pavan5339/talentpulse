"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, CheckCircle2, Clock, Code, Copy, ExternalLink, Mail, MessageSquare, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function JobShareView({ job }: { job: any }) {
  const [generatedLink, setGeneratedLink] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setGeneratedLink(`${window.location.origin}/interview/${job.shareable_link}`)
    }
  }, [job.shareable_link])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink)
    toast.success("Link copied to clipboard!")
  }

  const questionCount = job.types ? job.types.length * 2 : 5 // mock metric based on categories

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12 pt-6">
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col items-center text-center space-y-4 pt-4 pb-2">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="size-8 text-green-600 dark:text-green-500" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">Your AI Interview is Ready!</h2>
            <p className="text-muted-foreground">Share this link with your candidates to start the interview process</p>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Interview Link for: {job.title}</Label>
            <div className="rounded-full bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
              Valid for 30 days
            </div>
          </div>
          
          <div className="flex w-full items-center gap-3">
            <div className="flex-1 rounded-md border bg-muted/50 px-4 py-3 text-sm text-foreground overflow-x-auto whitespace-nowrap">
              {generatedLink}
            </div>
            <Button onClick={handleCopyLink} className="shrink-0 gap-2 bg-blue-600 hover:bg-blue-700">
              <Copy className="size-4" />
              Copy Link
            </Button>
            <Link href={generatedLink} target="_blank">
              <Button variant="outline" className="shrink-0 gap-2">
                <ExternalLink className="size-4" />
                Preview
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-2">
              <Clock className="size-4" />
              <span>{job.duration || "15"} Minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Code className="size-4" /> 
              <span>{questionCount} Questions</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <Label className="text-base font-semibold">Share via</Label>
          <div className="grid grid-cols-3 gap-4">
            <Button variant="outline" className="w-full gap-2 h-12">
              <Mail className="size-4" />
              Email
            </Button>
            <Button variant="outline" className="w-full gap-2 h-12">
              <MessageSquare className="size-4" />
              Slack
            </Button>
            <Button variant="outline" className="w-full gap-2 h-12">
              <MessageSquare className="size-4" />
              WhatsApp
            </Button>
          </div>
        </Card>

        <div className="flex items-center justify-between pt-4">
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="w-[200px] gap-2">
              <ArrowLeft className="size-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/create-interview">
            <Button size="lg" className="w-[200px] gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="size-4" />
              Create New Interview
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
