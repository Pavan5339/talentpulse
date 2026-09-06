# Setup and Run Instructions

This guide provides step-by-step instructions to configure, initialize, and run the **TalentPulse** application locally.

---

## 📋 Prerequisites

Ensure you have the following installed and set up before proceeding:
1.  **Node.js**: Version 18.x or higher.
2.  **Supabase Account**: A free database and storage project instance.
3.  **Groq Cloud Account**: For LLM processing (specifically using the `llama-3.3-70b-versatile` model).
4.  **Vapi Account**: A real-time voice conversational AI account to handle WebRTC audio streams.
5.  **Brevo Account**: For transaction email delivery (SMTP invites).

---

## 🔑 Environment Variables Configuration

Create a file named `.env.local` in the root of the `ai-interview-app` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://<your-project-id>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Vapi Web Voice AI Configuration
NEXT_PUBLIC_VAPI_PUBLIC_KEY="your-vapi-public-key"

# Groq Cloud AI Engine Configuration
GROQ_API_KEY="your-groq-api-key"

# Brevo Email Configuration
BREVO_API_KEY="your-brevo-api-key"
```

### Where to Find Keys:
*   **Supabase keys**: Go to **Project Settings -> API** in your Supabase dashboard.
*   **Vapi keys**: Go to **Dashboard -> Account -> Keys** in your Vapi console.
*   **Groq keys**: Create an API key in the **Groq Console** (under API Keys).
*   **Brevo keys**: Go to **SMTP & API** under your Brevo account drop-down.

---

## 🗄️ Database and Storage Setup (Supabase)

### 1. SQL Tables Schema
Run the following script in the **Supabase SQL Editor** to create the tables:

```sql
-- Create jobs table
create table jobs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  duration integer default 15,
  types jsonb default '["technical"]'::jsonb,
  shareable_link text unique not null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create interviews table
create table interviews (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references jobs(id) on delete cascade not null,
  candidate_name text not null,
  candidate_email text not null,
  status text default 'PENDING' not null,
  resume_url text,
  resume_text text,
  resume_score integer,
  resume_summary text,
  custom_questions jsonb,
  evaluation_summary jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 2. Storage Setup
The resume screening feature requires a storage bucket to upload candidate PDF resumes:
1.  Go to **Storage** in the Supabase Sidebar.
2.  Click **New Bucket** and name it `resumes`.
3.  Set the bucket to **Public** (so public URLs can be generated).
4.  Add a storage policy to allow public inserts/reads:
    *   Click **Policies** next to the `resumes` bucket.
    *   Create a policy allowing `ALL` operations (or `INSERT` and `SELECT`) for authenticated and anonymous users, or adjust it to fit your security model.

### 3. Authentication Configuration
By default, Supabase requires email confirmation for new signups. If you want to sign up test accounts instantly without email validation:
1.  Go to **Authentication -> Providers -> Email** in the Supabase Dashboard.
2.  Toggle **OFF** the **Confirm email** option.
3.  Click **Save**.

---

## ⚙️ Local Installation & Run

1.  Navigate to the `ai-interview-app` directory:
    ```bash
    cd ai-interview-app
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the Next.js development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Production Build

To test or build the application for deployment:

1.  Compile the production code:
    ```bash
    npm run build
    ```

2.  Start the production server:
    ```bash
    npm start
    ```
