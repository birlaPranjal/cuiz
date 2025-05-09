"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BookOpen, FileText, Users } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gray-50 py-20 md:py-28">
        <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Generate Quizzes from PDFs with AI
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
              Upload your study materials, let AI create intelligent questions, and distribute quizzes to your
              students with instant results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/register">
                <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-6 py-6 h-auto">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="border-gray-300 hover:bg-gray-100 px-6 py-6 h-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 relative h-[350px] w-full shadow-medium rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Image 
                src="/placeholder-hero.svg" 
                alt="Quiz Generation" 
                width={500} 
                height={350}
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border border-gray-200 shadow-soft hover-lift">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-gray-800" />
                </div>
                <CardTitle className="text-xl">Upload PDFs</CardTitle>
                <CardDescription className="text-gray-600">Simply upload your study materials</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our system extracts the content and prepares it for quiz generation. No manual typing required.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-soft hover-lift">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-gray-800" />
                </div>
                <CardTitle className="text-xl">AI-Generated Questions</CardTitle>
                <CardDescription className="text-gray-600">Let AI create multiple-choice questions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our AI analyzes the content and generates relevant multiple-choice questions with answer options.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-soft hover-lift">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-gray-800" />
                </div>
                <CardTitle className="text-xl">Share & Track Results</CardTitle>
                <CardDescription className="text-gray-600">Distribute quizzes and monitor performance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Share quizzes with your students and get detailed reports on their performance and progress.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="bg-white rounded-xl shadow-medium p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to transform your teaching?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto">
              Join thousands of educators using QuizGen to create engaging assessments in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register?role=teacher">
                <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-6 py-6 h-auto">
                  Join as Teacher
                </Button>
              </Link>
              <Link href="/register?role=student">
                <Button size="lg" variant="outline" className="border-gray-300 hover:bg-gray-100 px-6 py-6 h-auto">
                  Join as Student
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-4">QuizGen</h3>
              <p className="text-gray-400">
                AI-powered quiz generation for teachers and students.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Links</h3>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-400 hover:text-white">Features</Link></li>
                <li><Link href="/login" className="text-gray-400 hover:text-white">Login</Link></li>
                <li><Link href="/register" className="text-gray-400 hover:text-white">Register</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">© {new Date().getFullYear()} QuizGen. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

