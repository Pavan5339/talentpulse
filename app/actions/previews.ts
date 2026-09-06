"use server"

import { generatePreviewQuestionsAction, analyzeResumeAction } from "./ai"
import { extractText } from "unpdf"

export async function generateComprehensivePreviewAction(
  jobContext: { title: string; description: string; types: string[] },
  candidates: { name: string; email: string; resumeBase64?: string; resumeName?: string }[]
) {
  try {
    // 1. Generate Core Job Questions
    const coreQuestionsPromise = generatePreviewQuestionsAction(jobContext)

    // 2. Process each candidate's resume (if provided)
    const candidateAnalysisPromises = candidates.map(async (c) => {
      console.log(`[DEBUG] Processing candidate: ${c.name}, Resume provided: ${!!c.resumeBase64}`);
      if (c.resumeBase64) {
        try {
          const buffer = Buffer.from(c.resumeBase64, 'base64')
          console.log(`[DEBUG] Buffer created for ${c.name}. Size: ${buffer.length} bytes`);

          // Use unpdf - a server-friendly PDF text extractor (no worker needed)
          const { text: resumeText } = await extractText(new Uint8Array(buffer), { mergePages: true })
          console.log(`[DEBUG] PDF parsed for ${c.name}. Text length: ${resumeText?.length || 0}`);

          if (resumeText && resumeText.trim().length > 50) {
            console.log(`[DEBUG] Sending ${c.name}'s resume to Groq for analysis...`);
            const analysis = await analyzeResumeAction(resumeText, jobContext)
            
            if (analysis.success) {
              console.log(`[DEBUG] Groq analysis successful for ${c.name}. Score: ${analysis.resumeScore}`);
              return {
                name: c.name,
                email: c.email,
                resumeScore: analysis.resumeScore,
                resumeSummary: analysis.resumeSummary,
                customQuestions: analysis.customQuestions,
                resumeText: resumeText,
                hasAnalysis: true
              }
            } else {
              console.error(`[DEBUG] Groq analysis failed for ${c.name}:`, analysis.error);
            }
          } else {
            console.warn(`[DEBUG] Resume text for ${c.name} was too short or empty.`);
          }
        } catch (err: any) {
          console.error(`[DEBUG] Error analyzing resume for ${c.name}:`, err)
          return {
            name: c.name,
            email: c.email,
            hasAnalysis: false,
            error: `Resume Error: ${err.message || "Unknown error"}`
          }
        }
      }
      
      return {
        name: c.name,
        email: c.email,
        hasAnalysis: false,
        error: "No resume provided"
      }
    })

    const [coreRes, candidateResults] = await Promise.all([
      coreQuestionsPromise,
      Promise.all(candidateAnalysisPromises)
    ])

    return {
      success: true,
      coreQuestions: coreRes.success ? coreRes.questions : [],
      candidatePreviews: candidateResults
    }

  } catch (error) {
    console.error("Comprehensive Preview Error:", error)
    return { success: false, error: "Failed to generate comprehensive preview." }
  }
}
