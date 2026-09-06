"use server"

import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || "placeholder" // Prevents immediate crashing if loaded before env
})

export type ChatMessage = { role: "user" | "assistant" | "system", content: string }
export type JobContext = { title: string, description: string, duration?: number, types?: string[] }

export async function generateNextQuestion(jobContext: JobContext, chatHistory: ChatMessage[]) {
  const isInitial = chatHistory.length === 0;
  
  const systemPrompt = `
You are an expert technical AI interviewer named Alex.
Role: ${jobContext.title}
Context: ${jobContext.description}
Focus areas: ${(jobContext.types || []).join(", ") || "General Technical"}.
Duration: ${jobContext.duration || 15} minutes.

Instructions:
1. Conduct a professional, natural interview.
2. Ask ONLY **one** single, focused question at a time. No multi-part walls of text.
3. If this is the start of the chat, introduce yourself warmly in 1 short sentence, and then ask the first question.
4. If you are responding to the candidate, briefly acknowledge their answer, then ask the next relevant question.
5. If you feel the interview has reached a natural conclusion or enough core questions have been asked (approx 4-6), return isFinished = true and write a concluding remark thanking them for their time instead of a question.
  `

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt + "\n\nCRITICAL: Respond ONLY in valid JSON format. Do NOT wrap in markdown blocks like ```json. The JSON must have exactly two properties: `question` (string) and `isFinished` (boolean).",
      messages: isInitial ? [{ role: "user", content: "Hello, I am ready to start the interview." }] : chatHistory,
    })

    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const object = JSON.parse(cleanText);

    return { success: true, response: object }
  } catch (error) {
    console.error("Gemini Generation Error:", error)
    return { error: "Failed to generate AI response." }
  }
}

export async function generateInterviewEvaluation(jobContext: JobContext, chatHistory: ChatMessage[]) {
  const systemPrompt = `
You are an expert technical evaluator. Review the following interview transcript for the role of ${jobContext.title}.
Analyze the candidate's responses carefully and provide a structured JSON evaluation.
  `

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt + "\n\nCRITICAL: Respond ONLY in valid JSON format without markdown blocks. The JSON must match this structure exactly: { \"technicalScore\": number, \"communicationScore\": number, \"strengths\": string[], \"weaknesses\": string[], \"summary\": string, \"finalVerdict\": string }",
      messages: chatHistory,
    })

    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from AI response.");
    }

    const object = JSON.parse(jsonMatch[0]);
    return { success: true, evaluation: object }
  } catch (error: any) {
    console.error("Gemini Evaluation Error:", error)
    return { success: false, error: error.message || "Failed to generate evaluation." }
  }
}

export async function generatePreviewQuestionsAction(jobContext: JobContext) {
  const systemPrompt = `
You are an expert technical AI interviewer named Alex.
Role: ${jobContext.title}
Job Description: ${jobContext.description}
Focus Areas: ${(jobContext.types || []).join(", ")}.

Generate exactly 5 highly relevant interview questions specifically tailored to evaluate the required skills for this position.
Each question should be practical and test the candidate's actual competency in the focus areas. DO NOT write generic React questions unless the role explicitly requires React.
  `

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt + "\n\nCRITICAL: Respond ONLY with a valid JSON object containing a `questions` array of exactly 5 objects. Do NOT wrap in markdown blocks like ```json. Example format: { \"questions\": [ { \"question\": \"...\", \"type\": \"...\" } ] }",
      prompt: "Generate 5 specific questions based heavily on the job description. ONLY OUTPUT JSON.",
    })

    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanText);

    return { success: true, questions: parsed.questions || parsed }
  } catch (error: any) {
    console.error("Gemini Preview Generation Error:", error)
    // Fallback UI to prevent blocking the recruiter if Gemini is down
    return { 
      success: true, 
      questions: [
        { question: `Tell me about your previous experience working as a ${jobContext.title}.`, type: "Background" },
        { question: "Can you describe a challenging project you lead related to the required skills?", type: "Experience" },
        { question: "How do you ensure quality and handle difficult technical blockers?", type: "Problem Solving" }
      ]
    }
  }
}

export async function analyzeResumeAction(resumeText: string, jobContext: JobContext) {
  const systemPrompt = `
You are an expert technical recruiter and resume evaluator.
Job Title: ${jobContext.title}
Job Description: ${jobContext.description}
Focus Areas: ${(jobContext.types || []).join(", ")}.

You will be given a candidate's resume text. Your job is to:
1. Score how well the resume fits this specific role (1-10).
2. Write a short 2-sentence summary of the candidate's background.
3. Generate exactly 5 questions:
  - 2-3 questions probing specific claims, projects, or experiences mentioned in their resume.
  - 2-3 questions assessing their fundamental fit for the specific requirements and skills described in the job description.
  - The total must be exactly 5 questions.
  `

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt + "\n\nCRITICAL: Respond ONLY in valid JSON format without markdown blocks. Format exactly as: { \"resumeScore\": number, \"resumeSummary\": string, \"customQuestions\": [ { \"question\": string, \"type\": string } ] }",
      prompt: `Here is the candidate's resume:\n\n${resumeText.slice(0, 8000)}`, // trim to avoid token limits
    })

    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const object = JSON.parse(cleanText);

    return { success: true, ...object }
  } catch (error: any) {
    console.error("Resume Analysis Error:", error)
    return { success: false, error: error.message || "Failed to analyze resume" }
  }
}
