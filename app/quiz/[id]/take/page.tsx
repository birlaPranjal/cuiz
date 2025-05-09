"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Clock, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import StudentHeader from "@/components/student-header"

interface IOption {
  text: string;
  isCorrect: boolean;
}

interface IQuestion {
  question: string;
  options: IOption[];
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  questions: IQuestion[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function TakeQuiz({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [showConfirmExit, setShowConfirmExit] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'student') {
      router.push('/');
      return;
    }
    
    const fetchQuiz = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/quizzes/${params.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch quiz")
        }

        const data = await response.json()
        setQuiz(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load quiz. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuiz()
  }, [params.id, router, session, status])

  useEffect(() => {
    // Timer countdown
    if (!isLoading && timeLeft > 0 && quiz) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && quiz) {
      handleSubmitQuiz()
    }
  }, [timeLeft, isLoading, quiz])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  const handleAnswerChange = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }))
  }

  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    
    setIsSubmitting(true)

    try {
      // Format answers for submission
      const answers = Object.entries(selectedAnswers).map(([questionIndex, optionIndex]) => ({
        questionIndex: parseInt(questionIndex),
        selectedOptionIndex: optionIndex
      }));

      // Check if all questions are answered
      if (answers.length < quiz.questions.length) {
        if (!confirm('You have not answered all questions. Are you sure you want to submit?')) {
          setIsSubmitting(false);
          return;
        }
      }

      const submissionData = {
        quizId: quiz._id,
        answers
      }

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit quiz")
      }

      toast({
        title: "Quiz submitted",
        description: "Your answers have been submitted successfully.",
      })

      // Navigate to student dashboard
      router.push(`/dashboard/student`)
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "There was an error submitting your answers.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setShowConfirmSubmit(false)
    }
  }

  if (status === 'loading' || isLoading) {
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
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-500">Quiz not found or not accessible.</p>
          <Button onClick={() => router.push('/dashboard/student')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = (currentQuestionIndex / quiz.questions.length) * 100
  const answeredCount = Object.keys(selectedAnswers).length
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader />

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>{quiz.description}</CardDescription>
              </div>
              <div className="flex items-center bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                <Clock className="h-4 w-4 mr-2" />
                <span className="font-medium">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
              <span>
                {answeredCount} of {quiz.questions.length} answered
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestionIndex + 1}. {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedAnswers[currentQuestionIndex]?.toString() || ""}
              onValueChange={(value) => handleAnswerChange(currentQuestionIndex, parseInt(value))}
              className="space-y-3"
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 border p-3 rounded-md">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0}>
              Previous
            </Button>

            {isLastQuestion ? (
              <Button onClick={() => setShowConfirmSubmit(true)}>Submit Quiz</Button>
            ) : (
              <Button onClick={handleNextQuestion}>Next Question</Button>
            )}
          </CardFooter>
        </Card>

        <div className="text-center">
          <Button variant="outline" onClick={() => setShowConfirmExit(true)}>
            Save & Exit
          </Button>
        </div>
      </main>

      {/* Confirm Submit Dialog */}
      <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit the quiz? You have answered {answeredCount} out of {quiz.questions.length}{" "}
              questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitQuiz} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Quiz"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Exit Dialog */}
      <AlertDialog open={showConfirmExit} onOpenChange={setShowConfirmExit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to exit the quiz? Your progress will be saved, but you'll need to start from the
              beginning when you return.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/dashboard/student")}>Exit Quiz</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

