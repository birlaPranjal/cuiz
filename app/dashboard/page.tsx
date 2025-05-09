"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { useAuth } from "@/components/AuthProvider"

export default function DashboardRedirect() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    // Handle redirection based on authentication and role
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login')
        return
      }

      if (user?.role === 'teacher') {
        router.replace('/dashboard/teacher')
      } else if (user?.role === 'student') {
        router.replace('/dashboard/student')
      }
    }
  }, [isAuthenticated, isLoading, router, user])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Redirecting to your dashboard...</p>
          {user?.role && (
            <p className="text-sm text-gray-500 mt-2">
              Detected role: {user.role === 'teacher' ? 'Teacher' : 'Student'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 