"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Menu, BookOpen, FileText, BarChart2, CheckSquare, LogOut, User, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "./AuthProvider"

type NavbarProps = {
  showAuthButtons?: boolean;
}

export function Navbar({ showAuthButtons = true }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const isTeacher = isAuthenticated && user?.role === 'teacher'
  const isStudent = isAuthenticated && user?.role === 'student'
  
  const userInitials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() 
    : '?'

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false })
      router.push('/login')
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Active link helper
  const isActive = (path: string) => {
    if (pathname?.startsWith(path)) {
      return "font-medium text-black";
    }
    return "text-gray-600 hover:text-black transition-colors";
  }

  // If still loading auth state, render a simpler version
  if (isLoading) {
    return (
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-black">
              QuizGen
            </Link>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-soft">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-black mr-10">
            QuizGen
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex space-x-8">
              {isTeacher && (
                <>
                  <Link href="/dashboard/teacher" className={`${isActive('/dashboard/teacher')} flex items-center`}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link href="/quiz/create" className={`${isActive('/quiz/create')} flex items-center`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Quiz
                  </Link>
                  <Link
                    href="/dashboard/teacher?tab=results"
                    className={`${isActive('/dashboard/teacher?tab=results')} flex items-center`}
                  >
                    <BarChart2 className="h-4 w-4 mr-2" />
                    Results
                  </Link>
                </>
              )}
              
              {isStudent && (
                <>
                  <Link href="/dashboard/student" className={`${isActive('/dashboard/student')} flex items-center`}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/student?tab=completed"
                    className={`${isActive('/dashboard/student?tab=completed')} flex items-center`}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Completed Quizzes
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {!isAuthenticated && showAuthButtons ? (
            <div className="hidden md:flex space-x-3">
              <Button variant="outline" size="sm" asChild className="border-gray-300 hover:bg-gray-100 hover:text-black">
                <Link href="/login" className="flex items-center">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild className="bg-black text-white hover:bg-gray-800">
                <Link href="/register" className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register
                </Link>
              </Button>
            </div>
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border border-gray-200">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt={user?.name || 'User'} />
                    <AvatarFallback className="bg-gray-900 text-white">{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {user?.role === 'teacher' ? 'Teacher Account' : 'Student Account'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="border-r border-gray-200">
              <SheetHeader>
                <SheetTitle className="text-left">QuizGen</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4 mt-6">
                {!isAuthenticated && showAuthButtons ? (
                  <>
                    <Link
                      href="/login"
                      className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <LogIn className="h-5 w-5 mr-3" />
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <UserPlus className="h-5 w-5 mr-3" />
                      Register
                    </Link>
                  </>
                ) : isAuthenticated ? (
                  <>
                    {isTeacher && (
                      <>
                        <Link
                          href="/dashboard/teacher"
                          className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <BookOpen className="h-5 w-5 mr-3" />
                          Dashboard
                        </Link>
                        <Link
                          href="/quiz/create"
                          className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <FileText className="h-5 w-5 mr-3" />
                          Create Quiz
                        </Link>
                        <Link
                          href="/dashboard/teacher?tab=results"
                          className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <BarChart2 className="h-5 w-5 mr-3" />
                          Results
                        </Link>
                      </>
                    )}
                    
                    {isStudent && (
                      <>
                        <Link
                          href="/dashboard/student"
                          className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <BookOpen className="h-5 w-5 mr-3" />
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard/student?tab=completed"
                          className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <CheckSquare className="h-5 w-5 mr-3" />
                          Completed Quizzes
                        </Link>
                      </>
                    )}
                    
                    <div className="pt-4 mt-4 border-t border-gray-200">
                      <Button
                        variant="ghost"
                        className="flex items-center w-full justify-start px-3 text-gray-700"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5 mr-3" />
                        Log out
                      </Button>
                    </div>
                  </>
                ) : null}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
} 