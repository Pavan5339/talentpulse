import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Bot, Video, Zap, CheckCircle2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl text-white">
            <Bot className="size-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">TalentPulse</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
            Go to Dashboard
          </Link>
          <Button asChild className="font-semibold shadow-sm rounded-full px-6">
             <Link href="/dashboard">Get Started Free</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-40 flex flex-col items-center text-center px-4 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none">
             <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-3xl" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/10 blur-3xl" />
          </div>
          
          <div className="max-w-4xl space-y-8 relative z-10">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-4">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Now powered by Gemini 2.5 Flash
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
              Hire Top Talent with <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Voice AI Interviews
              </span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
              Automate your screening process. TalentPulse conducts real-time, 
              two-way conversational technical interviews and provides an instantly graded executive summary.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg font-semibold rounded-full shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
                <Link href="/dashboard">
                  Start Interviewing <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold rounded-full border-slate-300 hover:bg-slate-100">
                <Link href="#features">
                  See how it works
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to scale hiring</h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">Stop reading resumes. Let TalentPulse actually talk to your candidates and find the ones who truly know what they are doing.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-100 p-4 rounded-2xl w-fit mb-6 text-blue-600">
                <Video className="size-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Live WebRTC Voice</h3>
              <p className="text-slate-600 leading-relaxed">
                Using Vapi, candidates talk directly to our AI through their microphone in real-time, with sub-500ms latency. No awkward typing.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 p-4 rounded-2xl w-fit mb-6 text-indigo-600">
                <Zap className="size-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Evaluation</h3>
              <p className="text-slate-600 leading-relaxed">
                As soon as the interview ends, our LLM engines analyze the transcript to issue a 1-10 technical score and a highly detailed summary.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-emerald-100 p-4 rounded-2xl w-fit mb-6 text-emerald-600">
                <CheckCircle2 className="size-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Zero Bias Hiring</h3>
              <p className="text-slate-600 leading-relaxed">
                Every candidate gets the exact same structured interview based perfectly on your custom Job Description constraints.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-24 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How it works</h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">Get your first technical screening running in under 5 minutes.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 lg:gap-12 relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-[44px] left-[12%] right-[12%] h-1 bg-gradient-to-r from-blue-100 via-purple-100 to-emerald-100 z-0 rounded-full" />

              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-blue-50 border-8 border-white flex items-center justify-center text-blue-600 font-bold text-2xl shadow-sm mb-6 group-hover:scale-110 group-hover:shadow-blue-200 group-hover:shadow-lg transition-all duration-300">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Create a Job</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-[250px]">
                  Paste your job description. TalentPulse instantly generates a custom interview template.
                </p>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-indigo-50 border-8 border-white flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-sm mb-6 group-hover:scale-110 group-hover:shadow-indigo-200 group-hover:shadow-lg transition-all duration-300">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Invite Candidates</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-[250px]">
                  Upload resumes to get a baseline fit score, then automatically email unique interview links.
                </p>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-purple-50 border-8 border-white flex items-center justify-center text-purple-600 font-bold text-2xl shadow-sm mb-6 group-hover:scale-110 group-hover:shadow-purple-200 group-hover:shadow-lg transition-all duration-300">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Voice Screening</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-[250px]">
                  Candidates interact with our conversational AI via live WebRTC voice to prove their actual skills.
                </p>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-emerald-50 border-8 border-white flex items-center justify-center text-emerald-600 font-bold text-2xl shadow-sm mb-6 group-hover:scale-110 group-hover:shadow-emerald-200 group-hover:shadow-lg transition-all duration-300">
                  4
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Review & Hire</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-[250px]">
                  View AI grading, transcript, and full performance analysis inside your dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Extended Footer */}
      <footer className="w-full bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-primary p-2 rounded-xl text-white">
                <Bot className="size-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">TalentPulse</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              The modern way to conduct technical phone screens. Fully automated, unbiased, and powered by voice AI.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-6">Product</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#features" className="hover:text-blue-400 transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Security</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Integrations</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#" className="hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Legal</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-slate-500">© 2026 TalentPulse. Open source project.</p>
          <div className="flex gap-4 mt-4 md:mt-0 text-slate-500">
             <span className="text-sm">Built with Next.js, Supabase & Vapi</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
