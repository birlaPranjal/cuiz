"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, ArrowLeft, Loader2, AlertTriangle } from "lucide-react"
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

interface IAnswer {
  questionIndex: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
}

interface ISubmission {
  _id: string;
  quiz: {
    _id: string;
    title: string;
    description: string;
    questions: IQuestion[];
  };
  student: {
    _id: string;
    name: string;
    email: string;
  };
  answers: IAnswer[];
  score: number;
  totalQuestions: number;
  submittedAt: string;
}

export default function QuizResults({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [submission, setSubmission] = useState<ISubmission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    const fetchResults = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Get submission ID from URL params or query
        const { searchParams } = new URL(window.location.href)
        const submissionId = searchParams.get("submissionId")

        console.log("Fetching results for submission:", submissionId, "or quiz:", params.id);

        if (!submissionId) {
          // Try to fetch the submission for this quiz
          console.log("Fetching submissions for quiz:", params.id);
          const submissionsResponse = await fetch(`/api/submissions?quizId=${params.id}`)
          
          if (!submissionsResponse.ok) {
            const errorData = await submissionsResponse.json();
            throw new Error(errorData.message || "Failed to fetch submissions")
          }
          
          const submissionsData = await submissionsResponse.json()
          console.log("Submissions data:", submissionsData);
          
          if (submissionsData && submissionsData.length > 0) {
            // Get the latest submission
            const latestSubmission = submissionsData[0]
            
            // Check if quiz data is complete
            if (!latestSubmission.quiz || !latestSubmission.quiz.questions) {
              throw new Error("Quiz data is incomplete");
            }
            
            setSubmission(latestSubmission)
          } else {
            // No submission found
            setError("No submission found for this quiz")
            toast({
              title: "No results found",
              description: "No submission found for this quiz",
              variant: "destructive",
            })
          }
        } else {
          // Fetch the specific submission
          console.log("Fetching specific submission:", submissionId);
          const response = await fetch(`/api/submissions/${submissionId}`)

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch submission")
          }

          const data = await response.json()
          console.log("Submission data:", data);
          
          // Check if quiz data is complete
          if (!data.quiz || !data.quiz.questions) {
            throw new Error("Quiz data is incomplete");
          }
          
          setSubmission(data)
        }
      } catch (error) {
        console.error("Error fetching results:", error)
        setError(error instanceof Error ? error.message : "An unknown error occurred")
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load results. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [params.id, router, session, status])

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentHeader />
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Results</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/dashboard/student">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentHeader />
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Results Found</h2>
            <p className="text-gray-600 mb-6">We couldn't find any results for this quiz.</p>
            <Link href="/dashboard/student">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Calculate score percentage safely
  const scorePercentage = submission.totalQuestions > 0 
    ? Math.round((submission.score / submission.totalQuestions) * 100) 
    : 0

  // Guard against missing quiz data
  if (!submission.quiz || !submission.quiz.questions || !Array.isArray(submission.quiz.questions)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/dashboard/student">
              <Button variant="ghost" className="pl-0">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mt-2">Quiz Results</h1>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Score</CardTitle>
              <CardDescription>Completed on {new Date(submission.submittedAt).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="text-6xl font-bold mb-4">{scorePercentage}%</div>
                <Progress value={scorePercentage} className="h-4 w-full max-w-md mb-2" />
                <p className="text-gray-500">
                  You got {submission.score} out of {submission.totalQuestions} questions correct.
                </p>
                <p className="text-amber-500 mt-4">
                  Detailed question information is not available.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-8 flex justify-center">
            <Link href="/dashboard/student">
              <Button size="lg">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard/student">
            <Button variant="ghost" className="pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mt-2">{submission.quiz.title} - Results</h1>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Score</CardTitle>
            <CardDescription>Completed on {new Date(submission.submittedAt).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="text-6xl font-bold mb-4">{scorePercentage}%</div>
              <Progress value={scorePercentage} className="h-4 w-full max-w-md mb-2" />
              <p className="text-gray-500">
                You got {submission.score} out of {submission.totalQuestions} questions correct.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Detailed Results</h2>

          {submission.quiz.questions.map((question, qIndex) => {
            const answer = submission.answers.find(a => a.questionIndex === qIndex);
            const isAnswered = !!answer;
            const isCorrect = isAnswered && answer.isCorrect;
            
            return (
              <Card key={qIndex} className={`border-l-4 ${isCorrect ? "border-l-green-500" : "border-l-red-500"}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-lg">Question {qIndex + 1}</CardTitle>
                    {isCorrect ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-1" />
                        <span>Correct</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <XCircle className="h-5 w-5 mr-1" />
                        <span>Incorrect</span>
                      </div>
                    )}
                  </div>
                  <CardDescription className="text-base font-medium text-gray-900 mt-1">
                    {question.question}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div
                        key={oIndex}
                        className={`p-3 rounded-md ${
                          isAnswered && answer.selectedOptionIndex === oIndex
                            ? option.isCorrect
                              ? "bg-green-100 border-green-300 border"
                              : "bg-red-100 border-red-300 border"
                            : option.isCorrect
                            ? "bg-green-50 border-green-200 border"
                            : "bg-gray-50 border-gray-200 border"
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-1">
                            <span className="font-medium mr-2">{String.fromCharCode(65 + oIndex)}.</span>
                            {option.text}
                          </div>
                          <div>
                            {isAnswered && answer.selectedOptionIndex === oIndex && (
                              <span className="text-sm font-medium text-gray-500">Your answer</span>
                            )}
                            {option.isCorrect && (
                              <span className="text-sm font-medium text-green-600 ml-2">Correct answer</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/dashboard/student">
            <Button size="lg">Back to Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

