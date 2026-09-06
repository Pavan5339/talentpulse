"use client"

import { useState, useTransition } from "react"
import { loginAction, signupAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Loader2, Bot } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function AuthForm() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [isPending, startTransition] = useTransition()

  async function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = isLogin ? await loginAction(formData) : await signupAction(formData)
      if (result && result.error) {
        toast.error(result.error)
      } else if (result && result.success) {
        if (!isLogin) toast.success("Account created successfully!")
        router.push("/dashboard")
      }
    })
  }

  return (
    <div>
        <div className="flex flex-col items-center mb-8 gap-2">
            <div className="bg-primary p-3 rounded-2xl text-white shadow-lg">
                <Bot className="size-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">TalentPulse</h1>
        </div>
        
        <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
        <CardHeader className="text-center space-y-2 pb-6">
            <CardTitle className="text-2xl font-bold">{isLogin ? "Welcome back" : "Create an account"}</CardTitle>
            <CardDescription className="text-slate-500 text-base">
            {isLogin ? "Enter your email to sign in to your dashboard" : "Enter your email below to completely automate interviewing"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form action={onSubmit} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required disabled={isPending} className="h-12" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required disabled={isPending} className="h-12" />
            </div>
            <Button className="w-full h-12 text-base font-semibold transition-all active:scale-[0.98]" type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isLogin ? "Sign In" : "Sign Up"}
            </Button>
            </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm text-slate-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="font-semibold text-primary hover:underline" disabled={isPending}>
                {isLogin ? "Sign up" : "Sign in"}
            </button>
            </div>
            <div className="text-xs text-center text-slate-400 mt-4">
               By continuing, you agree to our <Link href="#" className="underline">Terms of Service</Link> and <Link href="#" className="underline">Privacy Policy</Link>.
            </div>
        </CardFooter>
        </Card>
    </div>
  )
}
