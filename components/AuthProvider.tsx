"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type User = {
  id: string
  name: string
  email: string
  role: string
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  redirectToRoleDashboard: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  redirectToRoleDashboard: () => {}
})

export const useAuth = () => useContext(AuthContext)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Update user state when session changes
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true)
      return
    }

    if (status === 'authenticated' && session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role
      })
    } else {
      setUser(null)
    }

    setIsLoading(false)
  }, [session, status])

  // Use useCallback to memoize the redirect function
  const redirectToRoleDashboard = useCallback(() => {
    if (!user) return
    
    // Use setTimeout to move the navigation out of the render cycle
    setTimeout(() => {
      if (user.role === 'teacher') {
        router.push('/dashboard/teacher')
      } else if (user.role === 'student') {
        router.push('/dashboard/student')
      } else {
        router.push('/dashboard')
      }
    }, 0)
  }, [user, router])

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    redirectToRoleDashboard
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}