# TalentPulse: AI-Powered Candidate Interviewing Platform

TalentPulse is a state-of-the-art web application that automates candidate screening, customized interview question generation, and real-time voice interviews. Built on Next.js, Supabase, Groq AI, and Vapi, it acts as an intelligent co-pilot for technical recruiters and hiring managers.

---

## 🚀 Key Features

*   **📊 Recruiter Dashboard**: Centralized hub to manage job postings, monitor active/pending candidate interviews, and view aggregated metrics (e.g., average resume scores, completion rates, and historical analytics).
*   **📄 Smart Resume Screening**: Integrates server-side PDF parsing (`unpdf`) with LLM analysis. It scores candidate resumes (1-10) against job requirements, provides summaries, and drafts tailored questions.
*   **🎙️ Real-Time Voice AI Interview Room**: Connects candidates to a live, human-like voice conversational assistant via **Vapi Web SDK**. Conducts interactive interviews while maintaining live webcam feeds and recording controls.
*   **🤖 Automated Grading & Final Verdicts**: Analyzes interview transcripts post-session to output structured evaluations detailing technical scores, communication ratings, strengths, weaknesses, and hiring recommendations.
*   **✉️ Seamless Email Invitations**: Dispatches personalized, secure token-based interview links to candidates' emails in one click via **Brevo SMTP**.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16/15+** | App Router, Server Actions, Dynamic Routes |
| **Language** | **TypeScript** | Static typing & codebase reliability |
| **Database & Storage**| **Supabase** | Client/Server-side DB integration & PDF resume bucket hosting |
| **AI LLM Engine** | **Vercel AI SDK + Groq** | Powered by `llama-3.3-70b-versatile` for screening and evaluations |
| **Voice Streaming AI** | **Vapi Web SDK** | Dynamic voice and text conversations with sub-second latency |
| **Styling** | **Tailwind CSS v4** | Modern component styling with CSS variables |
| **UI Components** | **Radix UI / shadcn/ui** | Accessible, custom-styled dialogs, selects, accordions, and cards |
| **Email Delivery** | **Brevo (SMTP / REST API)**| Handles secure candidate communications |
| **PDF Extraction** | **unpdf** | Server-compatible, zero-dependency PDF parser |

---

## 📂 Codebase Architecture

```
ai-interview-app/
├── app/                       # Next.js App Router root
│   ├── actions/               # Server Actions (database & API integrations)
│   │   ├── ai.ts              # Groq prompts, evaluation, and question generation
│   │   ├── auth.ts            # Supabase signup, login, logout flows
│   │   ├── emails.ts          # Brevo SMTP candidate invite dispatcher
│   │   ├── interviews.ts      # Fetching, creating, completing interviews
│   │   └── jobs.ts            # Creating, listing, deleting job roles
│   ├── create-interview/      # Recruiter workflow page to define job & parse resumes
│   ├── dashboard/             # Main metrics tracker & role list
│   ├── interview/[link]/      # Candidate entry page & active voice room
│   ├── job/[id]/              # Individual job role tracking & candidates list
│   ├── globals.css            # Tailwind configuration
│   └── page.tsx               # Marketing / Landing Page
├── components/                # shadcn/ui & custom React components
├── hooks/                     # Custom React hook utilities
├── lib/                       # Third-party wrappers & clients
│   └── supabase/              # Client & Server DB initializers
├── public/                    # Static assets & logos
└── styles/                    # Global stylesheet overrides
```

---

## 🔑 Crucial Server Actions

1.  [`app/actions/ai.ts`](file:///c:/Users/Asus/Desktop/AIInterview/ai-interview-app/app/actions/ai.ts): Drives conversational AI responses, resume match scores, dynamic question generation, and final candidate transcripts evaluation.
2.  [`app/actions/jobs.ts`](file:///c:/Users/Asus/Desktop/AIInterview/ai-interview-app/app/actions/jobs.ts): Manages job definitions and processes candidate listings, uploading resumes to Supabase Storage.
3.  [`app/actions/interviews.ts`](file:///c:/Users/Asus/Desktop/AIInterview/ai-interview-app/app/actions/interviews.ts): Interacts with candidate interviews, updates statuses, and commits AI evaluation scores back to the database.
4.  [`app/actions/emails.ts`](file:///c:/Users/Asus/Desktop/AIInterview/ai-interview-app/app/actions/emails.ts): Standardizes automated emails for candidate interview scheduling.

---

## 📖 How to Run the Project

For a full step-by-step installation and environment configuration guide, please refer to the detailed [INSTRUCTIONS.md](file:///c:/Users/Asus/Desktop/AIInterview/ai-interview-app/INSTRUCTIONS.md) in the project root.
