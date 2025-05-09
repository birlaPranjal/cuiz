"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Clock, BookOpen, Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import StudentHeader from "@/components/student-header"
import { toast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"

interface Quiz {
  _id: string;
  title: string;
  description: string;
  questions: any[];
  createdAt: string;
  createdBy: {
    _id: string;
    name: string;
  };
}

interface Submission {
  _id: string;
  quiz: string | Quiz;
  student: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
}

interface EnhancedQuiz extends Quiz {
  completed: boolean;
  score?: number;
  submissionId?: string;
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const [quizzes, setQuizzes] = useState<EnhancedQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const router = useRouter();

  const fetchDashboardData = async () => {
    if (status === 'loading') return;
    
    if (!session) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all available quizzes
      const quizzesRes = await fetch('/api/quizzes');
      
      if (!quizzesRes.ok) {
        throw new Error('Failed to fetch quizzes');
      }
      
      const quizzesData = await quizzesRes.json();
      
      // Fetch user's submissions
      const submissionsRes = await fetch('/api/submissions');
      
      if (!submissionsRes.ok) {
        throw new Error('Failed to fetch submissions');
      }
      
      const submissionsData = await submissionsRes.json();
      
      // Combine quizzes with submission data
      const enhancedQuizzes = quizzesData.map((quiz: Quiz) => {
        const submission = submissionsData.find((sub: Submission) => {
          const quizId = typeof sub.quiz === 'string' ? sub.quiz : sub.quiz._id;
          return quizId === quiz._id;
        });
        
        return {
          ...quiz,
          completed: !!submission,
          score: submission ? Math.round((submission.score / submission.totalQuestions) * 100) : undefined,
          submissionId: submission?._id
        };
      });
      
      setQuizzes(enhancedQuizzes);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "Failed to load dashboard data");
      
      toast({
        title: "Error",
        description: "Failed to load dashboard data. You can try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDashboardData();
  }, [session, status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!session) {
    // Redirect to login page
    router.push('/login');
    return null;
  }
  
  if (session.user.role !== 'student') {
    // Redirect if not a student
    router.push('/dashboard/teacher');
    return null;
  }
  
  // Show error state with retry button
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button onClick={fetchDashboardData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }
  
  // Loading state inside the dashboard layout
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
            <p className="text-gray-500">Loading your quizzes...</p>
          </div>
        </main>
      </div>
    );
  }

  const pendingQuizzes = quizzes.filter(quiz => !quiz.completed);
  const completedQuizzes = quizzes.filter(quiz => quiz.completed);

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Available Quizzes</CardTitle>
              <BookOpen className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quizzes.length}</div>
              <p className="text-xs text-gray-500">{pendingQuizzes.length} pending completion</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedQuizzes.length}</div>
              <p className="text-xs text-gray-500">Out of {quizzes.length} total</p>
              <Progress 
                value={quizzes.length > 0 ? (completedQuizzes.length / quizzes.length) * 100 : 0} 
                className="h-2 mt-2" 
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedQuizzes.length > 0
                  ? Math.round(
                      completedQuizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0) /
                      completedQuizzes.length
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-gray-500">From completed quizzes</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pending Quizzes</TabsTrigger>
            <TabsTrigger value="completed">Completed Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="grid gap-6">
              {pendingQuizzes.map((quiz) => (
                <Card key={quiz._id}>
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>
                      {quiz.questions.length} questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Created on</p>
                      <p className="text-lg font-semibold">{new Date(quiz.createdAt).toLocaleDateString()}</p>
                    </div>
                    {quiz.description && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-500">Description</p>
                        <p className="text-sm text-gray-700">{quiz.description}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Link href={`/quiz/${quiz._id}/take`} className="w-full">
                      <Button className="w-full">Start Quiz</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}

              {pendingQuizzes.length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-gray-500">No pending quizzes. You're all caught up!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid gap-6">
              {completedQuizzes.map((quiz) => (
                <Card key={quiz._id}>
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>
                      {quiz.questions.length} questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Your Score</p>
                        <p className="text-2xl font-bold">{quiz.score}%</p>
                        <Progress value={quiz.score} className="h-2 mt-1" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <p className="text-green-500 font-medium">Completed</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/quiz/${quiz._id}/results?submissionId=${quiz.submissionId}`} className="w-full">
                      <Button variant="outline" className="w-full">
                        View Results
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}

              {completedQuizzes.length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">You haven't completed any quizzes yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

