"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { addCandidateWithResumeAction } from "@/app/actions/interviews"
import { toast } from "sonner"
import { Upload, FileText, Loader2, CheckCircle2, Star, X } from "lucide-react"

interface AddCandidateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  jobTitle: string
  jobDescription: string
}

export function AddCandidateDialog({
  open, onOpenChange, jobId, jobTitle, jobDescription
}: AddCandidateDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [result, setResult] = useState<{ resumeScore: number | null, resumeSummary: string | null } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file")
      return
    }
    setResumeFile(file)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set("jobId", jobId)
    formData.set("jobTitle", jobTitle)
    formData.set("jobDescription", jobDescription)
    if (resumeFile) formData.set("resume", resumeFile)

    startTransition(async () => {
      const res = await addCandidateWithResumeAction(formData)
      if (res.error) {
        toast.error(res.error)
      } else {
        setResult({
          resumeScore: res.resumeScore ?? null,
          resumeSummary: res.resumeSummary ?? null,
        })
        toast.success("Candidate added successfully!")
        router.refresh()
      }
    })
  }

  const handleClose = () => {
    setResumeFile(null)
    setResult(null)
    onOpenChange(false)
  }

  const getFitLabel = (score: number) => {
    if (score >= 8) return { label: "Strong Fit", color: "bg-green-500/10 text-green-600 border-green-200" }
    if (score >= 5) return { label: "Good Fit", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" }
    return { label: "Weak Fit", color: "bg-red-500/10 text-red-600 border-red-200" }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Candidate</DialogTitle>
          <DialogDescription>
            Upload a resume and Gemini AI will score the fit and generate personalized interview questions.
          </DialogDescription>
        </DialogHeader>

        {/* Success state */}
        {result ? (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="size-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">Candidate Added!</h3>
            </div>

            {result.resumeScore !== null && (
              <Card className="p-4 space-y-3 border-none bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">AI Resume Analysis</span>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getFitLabel(result.resumeScore).color}`}>
                      <Star className="size-3 fill-current" />
                      {result.resumeScore}/10 — {getFitLabel(result.resumeScore).label}
                    </div>
                  </div>
                </div>
                {result.resumeSummary && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.resumeSummary}</p>
                )}
              </Card>
            )}

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="candidateName">Full Name</Label>
              <Input id="candidateName" name="candidateName" placeholder="John Doe" required className="h-10" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="candidateEmail">Email Address</Label>
              <Input id="candidateEmail" name="candidateEmail" type="email" placeholder="john@example.com" required className="h-10" />
            </div>

            {/* Resume Upload */}
            <div className="space-y-2">
              <Label>Resume (PDF)</Label>
              <div
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/40"
                }`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault()
                  setDragOver(false)
                  const file = e.dataTransfer.files[0]
                  if (file) handleFile(file)
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
                />
                {resumeFile ? (
                  <div className="flex items-center gap-3">
                    <FileText className="size-6 text-primary" />
                    <span className="text-sm font-medium text-foreground">{resumeFile.name}</span>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setResumeFile(null) }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="size-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-foreground">Drop PDF here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">AI will analyze it and score the fit</p>
                  </>
                )}
              </div>
              {resumeFile && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Star className="size-3 text-amber-500" />
                  Gemini will generate a resume fit score and personalized questions
                </p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? (
                  <><Loader2 className="size-4 animate-spin" /> Analyzing Resume...</>
                ) : (
                  <>Add Candidate</>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
