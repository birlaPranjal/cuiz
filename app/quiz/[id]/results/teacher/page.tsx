"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { BarChart, ArrowLeft, Loader2, Download, Eye } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import TeacherHeader from "@/components/teacher-header"

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
    questions: any[];
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

export default function TeacherQuizResults({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [submissions, setSubmissions] = useState<ISubmission[]>([])
  const [quiz, setQuiz] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 100,
    questionsStats: [] as { questionIndex: number; correctCount: number; incorrectCount: number }[]
  })

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    // Check if the user is a teacher
    if (session.user.role !== "teacher") {
      toast({
        title: "Unauthorized",
        description: "Only teachers can view quiz statistics",
        variant: "destructive",
      })
      router.push('/dashboard/student')
      return;
    }

    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch quiz details
        const quizResponse = await fetch(`/api/quizzes/${params.id}`)
        
        if (!quizResponse.ok) {
          throw new Error("Failed to fetch quiz")
        }
        
        const quizData = await quizResponse.json()
        setQuiz(quizData)
        
        // Fetch submissions for this quiz
        const submissionsResponse = await fetch(`/api/submissions?quizId=${params.id}`)
        
        if (!submissionsResponse.ok) {
          throw new Error("Failed to fetch submissions")
        }
        
        const submissionsData = await submissionsResponse.json()
        setSubmissions(submissionsData)
        
        // Calculate statistics
        if (submissionsData.length > 0) {
          let totalScore = 0
          let highestScore = 0
          let lowestScore = 100
          
          // Initialize question stats
          const questionStats: { questionIndex: number; correctCount: number; incorrectCount: number }[] = []
          
          for (let i = 0; i < quizData.questions.length; i++) {
            questionStats.push({
              questionIndex: i,
              correctCount: 0,
              incorrectCount: 0
            })
          }
          
          // Process each submission
          submissionsData.forEach((submission: ISubmission) => {
            const scorePercentage = Math.round((submission.score / submission.totalQuestions) * 100)
            totalScore += scorePercentage
            
            if (scorePercentage > highestScore) {
              highestScore = scorePercentage
            }
            
            if (scorePercentage < lowestScore) {
              lowestScore = scorePercentage
            }
            
            // Process question statistics
            submission.answers.forEach((answer) => {
              if (answer.isCorrect) {
                questionStats[answer.questionIndex].correctCount++
              } else {
                questionStats[answer.questionIndex].incorrectCount++
              }
            })
          })
          
          setStats({
            totalSubmissions: submissionsData.length,
            averageScore: Math.round(totalScore / submissionsData.length),
            highestScore,
            lowestScore: submissionsData.length > 0 ? lowestScore : 0,
            questionsStats: questionStats
          })
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load quiz results",
          variant: "destructive",
        })
        router.push('/dashboard/teacher')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router, session, status])

  const exportToCSV = () => {
    if (!submissions.length || !quiz) return
    
    // Create CSV header
    let csvContent = "Student Name,Email,Submission Date,Score,Percentage\n"
    
    // Add data rows
    submissions.forEach(submission => {
      const scorePercentage = Math.round((submission.score / submission.totalQuestions) * 100)
      const row = [
        submission.student.name,
        submission.student.email,
        new Date(submission.submittedAt).toLocaleString(),
        `${submission.score}/${submission.totalQuestions}`,
        `${scorePercentage}%`
      ]
      csvContent += row.join(",") + "\n"
    })
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${quiz.title.replace(/\s+/g, '_')}_results.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Export Successful",
      description: "Results exported to CSV file",
    })
  }

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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold mt-2">{quiz.title} - Results</h1>
            {submissions.length > 0 && (
              <Button onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highestScore}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Lowest Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowestScore}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Question Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Question Performance</CardTitle>
            <CardDescription>Percentage of students who answered each question correctly</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.questionsStats.map((question, index) => {
              const total = question.correctCount + question.incorrectCount
              const correctPercentage = total > 0 ? Math.round((question.correctCount / total) * 100) : 0
              
              return (
                <div key={index} className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Question {index + 1}</span>
                    <span className="text-sm font-medium">{correctPercentage}% correct</span>
                  </div>
                  <Progress value={correctPercentage} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Student Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Submissions</CardTitle>
            <CardDescription>All submissions for this quiz</CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => {
                    const scorePercentage = Math.round((submission.score / submission.totalQuestions) * 100)
                    
                    return (
                      <TableRow key={submission._id}>
                        <TableCell className="font-medium">{submission.student.name}</TableCell>
                        <TableCell>{submission.student.email}</TableCell>
                        <TableCell>{new Date(submission.submittedAt).toLocaleString()}</TableCell>
                        <TableCell>{submission.score}/{submission.totalQuestions}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={scorePercentage} 
                              className="h-2 w-20" 
                            />
                            <span>{scorePercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/quiz/${params.id}/results?submissionId=${submission._id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <BarChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No submissions yet for this quiz</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}