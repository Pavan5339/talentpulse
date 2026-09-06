import { AuthForm } from "../login/auth-form"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/20 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <AuthForm />
      </div>
    </div>
  )
}
