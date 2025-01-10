import OpenAI from 'openai'
import { redis } from './redis'
import { CACHE_TIMES } from './redis'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type FeedbackRequest = {
  submissionContent: string
  assignmentDescription: string
  rubric?: string
  previousFeedback?: string[]
}

export type FeedbackResponse = {
  feedback: string
  score?: number
  suggestions: string[]
  strengths: string[]
  areas_for_improvement: string[]
}

export async function generateAIFeedback({
  submissionContent,
  assignmentDescription,
  rubric,
  previousFeedback,
}: FeedbackRequest): Promise<FeedbackResponse> {
  const cacheKey = `feedback_${submissionContent.slice(0, 50)}`
  const cachedFeedback = await redis.get(cacheKey)
  
  if (cachedFeedback) {
    return JSON.parse(cachedFeedback)
  }

  const prompt = `
    Assignment Description: ${assignmentDescription}
    ${rubric ? `Rubric: ${rubric}` : ''}
    ${previousFeedback ? `Previous Feedback: ${previousFeedback.join('\n')}` : ''}
    
    Student Submission: ${submissionContent}
    
    Please provide detailed feedback including:
    1. Overall assessment
    2. Specific strengths
    3. Areas for improvement
    4. Actionable suggestions
    5. Score (if rubric provided)
    
    Format the response as JSON with the following structure:
    {
      "feedback": "overall feedback",
      "score": optional number,
      "suggestions": ["suggestion1", "suggestion2"],
      "strengths": ["strength1", "strength2"],
      "areas_for_improvement": ["area1", "area2"]
    }
  `

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an experienced educator providing detailed, constructive feedback on student submissions.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
  })

  const response = JSON.parse(completion.choices[0].message.content) as FeedbackResponse

  // Cache the feedback
  await redis.setex(cacheKey, CACHE_TIMES.ONE_DAY, JSON.stringify(response))

  return response
}

export async function generateQuizFeedback(
  questions: { content: string; type: string; answer: string }[],
  studentAnswers: { questionId: string; answer: string }[]
): Promise<{ feedback: string; explanations: { questionId: string; explanation: string }[] }> {
  const prompt = questions
    .map((q, i) => `
      Question ${i + 1}: ${q.content}
      Correct Answer: ${q.answer}
      Student Answer: ${studentAnswers[i]?.answer || 'No answer provided'}
    `)
    .join('\n\n')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an AI tutor providing detailed explanations for quiz answers.',
      },
      {
        role: 'user',
        content: `Please provide detailed explanations for the following quiz responses:\n${prompt}`,
      },
    ],
  })

  const explanations = questions.map((q, i) => ({
    questionId: studentAnswers[i]?.questionId,
    explanation: completion.choices[0].message.content.split('\n\n')[i] || '',
  }))

  return {
    feedback: completion.choices[0].message.content,
    explanations,
  }
}

export async function analyzeCodeSubmission(
  submission: string,
  tests: string[],
  language: string
): Promise<{
  feedback: string
  suggestions: string[]
  performance: string
  complexity: string
}> {
  const prompt = `
    Language: ${language}
    Code Submission:
    ${submission}
    
    Test Cases:
    ${tests.join('\n')}
    
    Please analyze the code for:
    1. Correctness
    2. Code quality
    3. Performance
    4. Time/Space complexity
    5. Best practices
    6. Potential improvements
  `

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert code reviewer providing detailed analysis of code submissions.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  return {
    feedback: completion.choices[0].message.content,
    suggestions: [],  // Parse from completion
    performance: '', // Parse from completion
    complexity: '',  // Parse from completion
  }
} 