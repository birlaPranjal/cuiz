"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { getSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Upload, CheckCircle, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import TeacherHeader from "@/components/teacher-header"
import { PdfExtractor } from "@/components/PdfExtractor"

interface QuestionOption {
  text: string;
  isCorrect: boolean;
  id?: string;
}

interface Question {
  question: string;
  options: QuestionOption[];
  id?: string;
  correctAnswer?: string;
}

interface GeneratedQuestion {
  id: string;
  question: string;
  options: QuestionOption[] & { id: string }[];
  correctAnswer: string;
}

export default function CreateQuiz() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setGenerationError(null)

    try {
      const session = await getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, numQuestions }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate questions')
      }

      const data = await response.json()
      if (data.questions) {
        const questionsWithIds: GeneratedQuestion[] = data.questions.map((q: Question, index: number) => ({
          ...q,
          id: `question-${index}`
        }))
        setGeneratedQuestions(questionsWithIds)
        localStorage.setItem('generatedQuestions', JSON.stringify(questionsWithIds))
        router.push('/quiz/review')
      }
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleExtractedTextChange = (text: string) => {
    setExtractedText(text);
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append('file', file)
      
      // Upload the file to our API
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Upload failed")
      }
      
      const data = await response.json()
      
      // Set the PDF URL from the response
      setPdfUrl(data.url)
      setStep(2)
      
      toast({
        title: "Upload successful",
        description: "Your PDF has been uploaded successfully.",
      })
    } catch (error) {
      console.error("Error uploading:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error uploading your PDF.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleGenerateQuestions = async () => {
    if (!extractedText) {
      toast({
        title: "No text extracted",
        description: "Please extract text from the PDF first.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGenerationError(null)

    try {
      // Send the extracted text to generate questions
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text: extractedText,
          numQuestions: 5, // Generate 5 questions
          title: title,
          description: description,
          saveToDb: false // We'll save later with selected questions
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || "Failed to generate questions")
      }

      const data = await response.json()
      
      // Check if we have questions in the expected format
      const questionsArray = data.questions || []
      
      if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
        throw new Error("No questions were generated")
      }
      
      // Format the questions to match the expected UI format
      const formattedQuestions = questionsArray.map((q, index) => ({
        id: `q${index + 1}`,
        question: q.question,
        options: q.options.map((opt: QuestionOption, i: number) => ({
          id: String.fromCharCode(97 + i), // a, b, c, d
          text: opt.text,
          isCorrect: opt.isCorrect
        })),
        correctAnswer: q.options.findIndex((opt: QuestionOption) => opt.isCorrect) !== -1 
          ? String.fromCharCode(97 + q.options.findIndex((opt: QuestionOption) => opt.isCorrect)) 
          : 'a'
      }))
      
      setGeneratedQuestions(formattedQuestions)
      setSelectedQuestions(formattedQuestions)
      setStep(3)

      toast({
        title: "Questions generated",
        description: `${formattedQuestions.length} questions have been generated using AI.`,
      })
    } catch (error) {
      console.error("Error generating questions:", error)
      setGenerationError(error instanceof Error ? error.message : "Failed to generate questions")

      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "There was an error generating questions.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions((prev) => {
      // If the question is already selected, remove it
      if (prev.some((q) => q.id === questionId)) {
        return prev.filter((q) => q.id !== questionId)
      }

      // Otherwise, add it
      const questionToAdd = generatedQuestions.find((q) => q.id === questionId)
      if (questionToAdd) {
        return [...prev, questionToAdd]
      }

      return prev
    })
  }

  const handleSaveQuiz = async () => {
    if (!title) {
      toast({
        title: "Title required",
        description: "Please provide a title for your quiz.",
        variant: "destructive",
      })
      return
    }

    if (selectedQuestions.length === 0) {
      toast({
        title: "No questions selected",
        description: "Please select at least one question for your quiz.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Format the questions to match the expected API format
      const formattedQuestions = selectedQuestions.map(q => ({
        question: q.question,
        options: q.options.map((opt: { text: string, id: string, isCorrect: boolean }) => ({
          text: opt.text,
          isCorrect: opt.id === q.correctAnswer
        }))
      }))

      const quizData = {
        title,
        description,
        questions: formattedQuestions,
        pdfUrl: pdfUrl
      }

      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quizData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || "Failed to create quiz")
      }

      const data = await response.json()

      toast({
        title: "Quiz created",
        description: "Your quiz has been created successfully.",
      })

      router.push("/dashboard/teacher")
    } catch (error) {
      console.error("Error saving quiz:", error)
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "There was an error saving your quiz.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Quiz</h1>
          <p className="text-gray-500">Upload a PDF and generate questions with AI</p>
        </div>

        <div className="flex mb-8">
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"}`}
            >
              1
            </div>
            <div className={`ml-2 ${step >= 1 ? "text-gray-900" : "text-gray-500"}`}>Upload PDF</div>
          </div>
          <div className={`w-16 h-0.5 mx-2 self-center ${step >= 2 ? "bg-purple-600" : "bg-gray-200"}`}></div>
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"}`}
            >
              2
            </div>
            <div className={`ml-2 ${step >= 2 ? "text-gray-900" : "text-gray-500"}`}>Extract & Edit</div>
          </div>
          <div className={`w-16 h-0.5 mx-2 self-center ${step >= 3 ? "bg-purple-600" : "bg-gray-200"}`}></div>
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"}`}
            >
              3
            </div>
            <div className={`ml-2 ${step >= 3 ? "text-gray-900" : "text-gray-500"}`}>Create Quiz</div>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF Document</CardTitle>
              <CardDescription>Upload a PDF document containing the study material</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="pdf">PDF Document</Label>
                  <Input id="pdf" type="file" accept=".pdf" onChange={handleFileChange} />
                </div>

                {file && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>File selected</AlertTitle>
                    <AlertDescription>
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpload} disabled={!file || isUploading} className="w-full">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload and Process PDF
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Extract and Edit Content</CardTitle>
              <CardDescription>Extract text from the PDF and edit if needed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Biology Midterm Quiz"
                    className="mb-2"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Quiz Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a brief description of this quiz"
                    className="mb-4"
                  />
                </div>

                <div>
                  <Label>PDF Content</Label>
                  <div className="mt-2">
                    <PdfExtractor file={file} onExtractedTextChange={handleExtractedTextChange} />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                onClick={handleGenerateQuestions} 
                disabled={isGenerating || !extractedText}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Questions"
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Create Quiz</CardTitle>
              <CardDescription>Review and select questions for your quiz</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {generationError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Generation Warning</AlertTitle>
                    <AlertDescription>
                      There was an issue with AI generation. Using sample questions instead.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Quiz Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Biology Midterm Quiz"
                    />
                  </div>
                  <div>
                    <Label>Selected Questions</Label>
                    <div className="p-2 bg-gray-100 rounded-md">
                      <p className="text-lg font-bold">{selectedQuestions.length}</p>
                      <p className="text-sm text-gray-500">of {generatedQuestions.length} generated</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Quiz Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a brief description of this quiz"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Generated Questions</Label>
                  <div className="space-y-4">
                    {generatedQuestions.map((question, index) => (
                      <Card
                        key={question.id}
                        className={`border-2 ${
                          selectedQuestions.some((q) => q.id === question.id)
                            ? "border-purple-500"
                            : "border-transparent"
                        }`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">Question {index + 1}</CardTitle>
                            <Button
                              variant={selectedQuestions.some((q) => q.id === question.id) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleQuestionSelection(question.id)}
                            >
                              {selectedQuestions.some((q) => q.id === question.id) ? "Selected" : "Select"}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="font-medium mb-2">{question.question}</p>
                          <div className="space-y-1">
                            {question.options.map((option) => (
                              <div
                                key={option.id}
                                className={`p-2 rounded-md ${
                                  option.id === question.correctAnswer
                                    ? "bg-green-100 border border-green-300"
                                    : "bg-gray-50 border border-gray-200"
                                }`}
                              >
                                <span className="font-medium mr-2">{option.id?.toUpperCase() || ''}.</span>
                                {option.text}
                                {option.id === question.correctAnswer && (
                                  <span className="ml-2 text-green-600 text-sm">(Correct Answer)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleSaveQuiz} disabled={isSaving || selectedQuestions.length === 0}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Create Quiz"
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </main>
    </div>
  )
}

