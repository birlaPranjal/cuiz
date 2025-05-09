import { kv } from "@vercel/kv"

// Prefix keys for different collections
const QUIZ_PREFIX = "quiz:"
const USER_PREFIX = "user:"
const SUBMISSION_PREFIX = "submission:"

// Helper functions for common operations
export async function getQuiz(id: string) {
  return kv.get(`${QUIZ_PREFIX}${id}`)
}

export async function getAllQuizzes() {
  const keys = await kv.keys(`${QUIZ_PREFIX}*`)
  if (keys.length === 0) return []

  const quizzes = await kv.mget(...keys)
  return quizzes.filter(Boolean)
}

export async function getQuizzesByTeacher(teacherId: string) {
  const keys = await kv.keys(`${QUIZ_PREFIX}*`)
  if (keys.length === 0) return []

  const quizzes = await kv.mget(...keys)
  return quizzes.filter((quiz: any) => quiz && quiz.teacherId === teacherId)
}

export async function getQuizzesForStudent(studentId: string) {
  const keys = await kv.keys(`${QUIZ_PREFIX}*`)
  if (keys.length === 0) return []

  const quizzes = await kv.mget(...keys)
  return quizzes.filter((quiz: any) => quiz && quiz.assignedTo && quiz.assignedTo.includes(studentId))
}

export async function createQuiz(quiz: any) {
  const id = crypto.randomUUID()

  // Process the quiz data to ensure it's in the right format
  const quizWithMeta = {
    ...quiz,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Make sure questions is an array
    questions: Array.isArray(quiz.questions) ? quiz.questions : [],
    // Add default values for other fields
    attempts: 0,
    avgScore: 0,
  }

  await kv.set(`${QUIZ_PREFIX}${id}`, quizWithMeta)
  return { id, ...quizWithMeta }
}

export async function updateQuiz(id: string, quiz: any) {
  const existing = await getQuiz(id)
  if (!existing) return null

  const updatedQuiz = {
    ...existing,
    ...quiz,
    id,
    updatedAt: new Date().toISOString(),
  }

  await kv.set(`${QUIZ_PREFIX}${id}`, updatedQuiz)
  return updatedQuiz
}

export async function deleteQuiz(id: string) {
  return kv.del(`${QUIZ_PREFIX}${id}`)
}

// User operations
export async function getUser(id: string) {
  return kv.get(`${USER_PREFIX}${id}`)
}

export async function getUserByEmail(email: string) {
  const keys = await kv.keys(`${USER_PREFIX}*`)
  if (keys.length === 0) return null

  const users = await kv.mget(...keys)
  return users.find((user: any) => user && user.email === email) || null
}

export async function createUser(user: any) {
  const id = crypto.randomUUID()
  const userWithMeta = {
    ...user,
    id,
    createdAt: new Date().toISOString(),
  }

  await kv.set(`${USER_PREFIX}${id}`, userWithMeta)
  return { id, ...userWithMeta }
}

// Submission operations
export async function getSubmission(id: string) {
  return kv.get(`${SUBMISSION_PREFIX}${id}`)
}

export async function getSubmissionsByQuiz(quizId: string) {
  const keys = await kv.keys(`${SUBMISSION_PREFIX}*`)
  if (keys.length === 0) return []

  const submissions = await kv.mget(...keys)
  return submissions.filter((sub: any) => sub && sub.quizId === quizId)
}

export async function getSubmissionsByStudent(studentId: string) {
  const keys = await kv.keys(`${SUBMISSION_PREFIX}*`)
  if (keys.length === 0) return []

  const submissions = await kv.mget(...keys)
  return submissions.filter((sub: any) => sub && sub.studentId === studentId)
}

export async function createSubmission(submission: any) {
  const id = crypto.randomUUID()
  const submissionWithMeta = {
    ...submission,
    id,
    submittedAt: new Date().toISOString(),
  }

  await kv.set(`${SUBMISSION_PREFIX}${id}`, submissionWithMeta)
  return { id, ...submissionWithMeta }
}

