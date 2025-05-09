"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUp, Plus, BookOpen, BarChart, Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import TeacherHeader from "@/components/teacher-header"
import { toast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { Navbar } from "@/components/Navbar"

interface Quiz {
  _id: string;
  title: string;
  description: string;
  questions: any[];
  createdAt: string;
  createdBy: string;
}

interface QuizWithStats extends Quiz {
  attempts: number;
  avgScore: number;
}

export default function TeacherDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizWithStats[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("quizzes");
  const router = useRouter();

  const fetchDashboardData = async () => {
    if (isLoading) return;
    
    if (!isAuthenticated) {
      return;
    }

    try {
      setLoadingData(true);
      setError(null);
      
      // Fetch quizzes
      const quizzesRes = await fetch('/api/quizzes');
      
      if (!quizzesRes.ok) {
        throw new Error('Failed to fetch quizzes');
      }
      
      const quizzesData = await quizzesRes.json();
      
      // Fetch submissions per quiz for statistics
      const submissionsRes = await fetch('/api/submissions');
      
      if (!submissionsRes.ok) {
        throw new Error('Failed to fetch submissions');
      }
      
      const submissionsData = await submissionsRes.json();
      
      // Calculate statistics for each quiz
      const quizzesWithStats = quizzesData.map((quiz: Quiz) => {
        const quizSubmissions = submissionsData.filter((sub: any) => 
          sub.quiz === quiz._id || sub.quiz._id === quiz._id
        );
        
        const attempts = quizSubmissions.length;
        const avgScore = attempts > 0 
          ? Math.round(quizSubmissions.reduce((sum: number, sub: any) => 
              sum + (sub.score / sub.totalQuestions * 100), 0) / attempts) 
          : 0;
          
        return {
          ...quiz,
          attempts,
          avgScore
        };
      });
      
      setQuizzes(quizzesWithStats);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "Failed to load dashboard data");
      
      toast({
        title: "Error",
        description: "Failed to load dashboard data. You can try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      fetchDashboardData();
    }
  }, [isLoading, isAuthenticated]);

  // Handle authentication and role check
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'teacher') {
        router.push('/dashboard/student');
      }
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state with retry button
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
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
  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
            <p className="text-gray-500">Loading your dashboard data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <div className="flex gap-4">
            <Link href="/quiz/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Quiz
              </Button>
            </Link>
            <Button variant="outline" onClick={fetchDashboardData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
              <BookOpen className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quizzes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <FileUp className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quizzes.reduce((sum, quiz) => sum + quiz.attempts, 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <BarChart className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quizzes.length > 0
                  ? Math.round(quizzes.reduce((sum, quiz) => sum + quiz.avgScore, 0) / quizzes.length)
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="quizzes">My Quizzes</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="quizzes">
            <div className="grid gap-6">
              {quizzes.map((quiz) => (
                <Card key={quiz._id}>
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>
                      Created on {new Date(quiz.createdAt).toLocaleDateString()} • {quiz.questions.length} questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Attempts</p>
                        <p className="text-2xl font-bold">{quiz.attempts}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Avg. Score</p>
                        <p className="text-2xl font-bold">{quiz.avgScore}%</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Link href={`/quiz/${quiz._id}/edit`}>
                      <Button variant="outline">Edit Quiz</Button>
                    </Link>
                    <Link href={`/quiz/${quiz._id}/results/teacher`}>
                      <Button>View Results</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}

              {quizzes.length === 0 && (
                <div className="text-center p-12 bg-white rounded-lg shadow-sm">
                  <div className="flex justify-center mb-4">
                    <FileUp className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No quizzes yet</h3>
                  <p className="text-gray-500 mb-4">Create your first quiz to get started.</p>
                  <Link href="/quiz/create">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Create Quiz
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="results">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Quiz Results Overview</h2>
              
              {quizzes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No quiz data available yet.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {quizzes.map((quiz) => (
                    <div key={quiz._id} className="border-b pb-6 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-medium">{quiz.title}</h3>
                        <div className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded">
                          {quiz.attempts} attempts
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Average Score</span>
                          <span className="font-medium">{quiz.avgScore}%</span>
                        </div>
                        <Progress value={quiz.avgScore} className="h-2" />
                      </div>
                      <div className="mt-4">
                        <Link href={`/quiz/${quiz._id}/results/teacher`}>
                          <Button variant="outline" size="sm">View Detailed Results</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

