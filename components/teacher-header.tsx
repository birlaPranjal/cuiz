"use client"

import { useState } from "react"
import Link from "next/link"
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
import { Menu, BookOpen, FileText, BarChart2, LogOut, User } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export default function TeacherHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Active link helper
  const isActive = (path: string) => {
    if (pathname?.startsWith(path)) {
      return "font-medium text-black";
    }
    return "text-gray-600 hover:text-black transition-colors";
  }

  const handleLogout = () => {
    // In a real app, this would handle logout logic
    router.push("/")
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-soft sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/dashboard/teacher" className="text-xl font-bold text-black mr-10">
            QuizGen
          </Link>

          <nav className="hidden md:flex space-x-8">
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
          </nav>
        </div>

        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border border-gray-200">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Teacher" />
                  <AvatarFallback className="bg-gray-900 text-white">TD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Teacher Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

