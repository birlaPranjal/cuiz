"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import TeacherHeader from "@/components/teacher-header"

interface IOption {
  text: string;
  isCorrect: boolean;
}

interface IQuestion {
  question: string;
  options: IOption[];
}

interface IQuiz {
  _id: string;
  title: string;
  description: string;
  questions: IQuestion[];
  createdAt: string;
  createdBy: string;
}

export default function EditQuiz({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [quiz, setQuiz] = useState<IQuiz | null>(null)

  // Fetch the quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      if (status === "loading") return
      
      if (!session) {
        router.push("/login")
        return
      }
      
      // Check if the user is a teacher
      if (session.user.role !== "TEACHER") {
        toast({
          title: "Unauthorized",
          description: "Only teachers can edit quizzes",
          variant: "destructive",
        })
        router.push("/dashboard/student")
        return
      }
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/quizzes/${params.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch quiz")
        }

        const data = await response.json()
        setQuiz(data)
      } catch (error) {
        console.error("Error fetching quiz:", error)
        toast({
          title: "Error",
          description: "Failed to load quiz data",
          variant: "destructive",
        })
        router.push("/dashboard/teacher")
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuiz()
  }, [params.id, router, session, status])

  // Update quiz title
  const updateTitle = (value: string) => {
    if (quiz) {
      setQuiz({ ...quiz, title: value })
    }
  }

  // Update quiz description
  const updateDescription = (value: string) => {
    if (quiz) {
      setQuiz({ ...quiz, description: value })
    }
  }

  // Update question text
  const updateQuestion = (index: number, value: string) => {
    if (quiz) {
      const updatedQuestions = [...quiz.questions]
      updatedQuestions[index] = { ...updatedQuestions[index], question: value }
      setQuiz({ ...quiz, questions: updatedQuestions })
    }
  }

  // Update option text
  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    if (quiz) {
      const updatedQuestions = [...quiz.questions]
      const updatedOptions = [...updatedQuestions[questionIndex].options]
      updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], text: value }
      updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex], options: updatedOptions }
      setQuiz({ ...quiz, questions: updatedQuestions })
    }
  }

  // Toggle correct option
  const toggleCorrectOption = (questionIndex: number, optionIndex: number) => {
    if (quiz) {
      const updatedQuestions = [...quiz.questions]
      const updatedOptions = [...updatedQuestions[questionIndex].options]
      
      // Set all options to false first
      updatedOptions.forEach((opt, idx) => {
        updatedOptions[idx] = { ...opt, isCorrect: idx === optionIndex }
      })
      
      updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex], options: updatedOptions }
      setQuiz({ ...quiz, questions: updatedQuestions })
    }
  }

  // Add a new question
  const addQuestion = () => {
    if (quiz) {
      const newQuestion: IQuestion = {
        question: "",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      }
      setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion] })
    }
  }

  // Delete a question
  const deleteQuestion = (index: number) => {
    if (quiz && quiz.questions.length > 1) {
      const updatedQuestions = quiz.questions.filter((_, i) => i !== index)
      setQuiz({ ...quiz, questions: updatedQuestions })
    } else {
      toast({
        title: "Error",
        description: "Quiz must have at least one question",
        variant: "destructive",
      })
    }
  }

  // Add an option to a question
  const addOption = (questionIndex: number) => {
    if (quiz) {
      const updatedQuestions = [...quiz.questions]
      const updatedOptions = [...updatedQuestions[questionIndex].options]
      
      if (updatedOptions.length < 6) {
        updatedOptions.push({ text: "", isCorrect: false })
        updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex], options: updatedOptions }
        setQuiz({ ...quiz, questions: updatedQuestions })
      } else {
        toast({
          title: "Limit Reached",
          description: "Maximum 6 options per question",
          variant: "destructive",
        })
      }
    }
  }

  // Delete an option from a question
  const deleteOption = (questionIndex: number, optionIndex: number) => {
    if (quiz) {
      const updatedQuestions = [...quiz.questions]
      const updatedOptions = updatedQuestions[questionIndex].options.filter((_, i) => i !== optionIndex)
      
      // Ensure at least 2 options remain
      if (updatedOptions.length < 2) {
        toast({
          title: "Error",
          description: "Question must have at least 2 options",
          variant: "destructive",
        })
        return
      }
      
      // Ensure there's always one correct option
      const hasCorrectOption = updatedOptions.some(opt => opt.isCorrect)
      
      if (!hasCorrectOption) {
        updatedOptions[0] = { ...updatedOptions[0], isCorrect: true }
      }
      
      updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex], options: updatedOptions }
      setQuiz({ ...quiz, questions: updatedQuestions })
    }
  }

  // Save the quiz
  const saveQuiz = async () => {
    if (!quiz) return
    
    // Validate the quiz
    if (!quiz.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Quiz title is required",
        variant: "destructive",
      })
      return
    }
    
    // Validate questions
    for (let i = 0; i < quiz.questions.length; i++) {
      if (!quiz.questions[i].question.trim()) {
        toast({
          title: "Validation Error",
          description: `Question ${i + 1} text is required`,
          variant: "destructive",
        })
        return
      }
      
      // Validate options
      for (let j = 0; j < quiz.questions[i].options.length; j++) {
        if (!quiz.questions[i].options[j].text.trim()) {
          toast({
            title: "Validation Error",
            description: `Option ${j + 1} in question ${i + 1} text is required`,
            variant: "destructive",
          })
          return
        }
      }
      
      // Ensure exactly one correct option
      const correctOptions = quiz.questions[i].options.filter(opt => opt.isCorrect)
      if (correctOptions.length !== 1) {
        toast({
          title: "Validation Error",
          description: `Question ${i + 1} must have exactly one correct option`,
          variant: "destructive",
        })
        return
      }
    }
    
    try {
      setIsSaving(true)
      
      const response = await fetch(`/api/quizzes/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quiz),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update quiz")
      }
      
      toast({
        title: "Success",
        description: "Quiz updated successfully",
      })
      
      router.push("/dashboard/teacher")
    } catch (error) {
      console.error("Error updating quiz:", error)
      toast({
        title: "Error",
        description: "Failed to update quiz",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Quiz not found</p>
          <Link href="/dashboard/teacher">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard/teacher">
            <Button variant="ghost" className="pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mt-2">Edit Quiz</h1>
        </div>

        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Quiz details */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={quiz.title} 
                  onChange={(e) => updateTitle(e.target.value)} 
                  placeholder="Enter quiz title" 
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea 
                  id="description" 
                  value={quiz.description} 
                  onChange={(e) => updateDescription(e.target.value)} 
                  placeholder="Enter quiz description" 
                  rows={3} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Questions</h2>
              <Button onClick={addQuestion}>
                <Plus className="mr-2 h-4 w-4" /> Add Question
              </Button>
            </div>

            {quiz.questions.map((question, qIndex) => (
              <Card key={qIndex} className="relative">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <CardTitle className="text-xl">Question {qIndex + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteQuestion(qIndex)}
                    className="h-8 w-8"
                    title="Delete question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor={`question-${qIndex}`}>Question Text</Label>
                    <Textarea
                      id={`question-${qIndex}`}
                      value={question.question}
                      onChange={(e) => updateQuestion(qIndex, e.target.value)}
                      placeholder="Enter question text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Options (select the correct one)</Label>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-start space-x-3 pt-2">
                        <Checkbox 
                          id={`option-${qIndex}-${oIndex}`} 
                          checked={option.isCorrect}
                          onCheckedChange={() => toggleCorrectOption(qIndex, oIndex)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Input
                            value={option.text}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${oIndex + 1}`}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteOption(qIndex, oIndex)}
                          className="h-8 w-8"
                          title="Delete option"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => addOption(qIndex)}
                    disabled={question.options.length >= 6}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Option
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={saveQuiz} disabled={isSaving} size="lg">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Quiz"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
} 