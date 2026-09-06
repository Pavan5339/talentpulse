"use server"

export async function sendInterviewInvitesAction(
  candidates: any[],
  jobTitle: string,
  interviewLink: string,
  candidatePreviews: any[] = [] // new param
) {
  const apiKey = process.env.BREVO_API_KEY

  if (!apiKey) {
    return { error: "BREVO_API_KEY is not configured in .env.local" }
  }

  try {
    const emailPromises = candidates.map(async (candidate, idx) => {
      const personalLink = `${interviewLink}?email=${encodeURIComponent(candidate.candidate_email)}&name=${encodeURIComponent(candidate.candidate_name)}`
      const payload = {
        sender: {
          name: process.env.BREVO_SENDER_NAME || "TalentPulse AI",
          email: process.env.BREVO_SENDER_EMAIL || "invites@talentpulse.ai"
        },
        to: [
          {
            email: candidate.candidate_email,
            name: candidate.candidate_name
          }
        ],
        subject: `Interview Invitation: ${jobTitle}`,
        htmlContent: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #2563eb;">Interview Invitation</h2>
            <p>Hi <strong>${candidate.candidate_name}</strong>,</p>
            <p>You have been invited to complete an AI-powered interview for the <strong>${jobTitle}</strong> position.</p>
            <p>This is an automated text and voice interview. It will take approximately 15 minutes to complete.</p>
            
            <div style="margin: 30px 0;">
              <a href="${personalLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Start Interview Now
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              If you have any questions, please reply to the recruiter who shared this link.<br/>
              Best of luck!
            </p>
          </div>
        `
      }

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": apiKey
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Brevo API Error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    })

    await Promise.all(emailPromises)
    return { success: true, count: candidates.length }

  } catch (error: any) {
    console.error("Error sending emails via Brevo:", error)
    return { success: false, error: error.message || "An unexpected error occurred while sending emails via Brevo." }
  }
}




