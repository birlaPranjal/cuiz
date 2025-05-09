import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { OpenAI } from 'openai';
import connectToDatabase from '@/lib/db';
import Quiz from '@/models/Quiz';

interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface Question {
  question: string;
  options: QuestionOption[];
}

interface RequestBody {
  text: string;
  numQuestions?: number;
  title?: string;
  description?: string;
  saveToDb?: boolean;
}

// Initialize OpenAI client using environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, using fallback sample questions');
      const body = await req.json() as RequestBody;
      const { text, numQuestions = 5 } = body;
      const sampleQuestions = generateSampleQuestions(text, numQuestions);
      
      return NextResponse.json({
        success: true,
        questions: sampleQuestions,
        warning: 'Using sample questions (OpenAI API key not configured)'
      });
    }

    const session = await getServerSession(authOptions);

    const body = await req.json() as RequestBody;
    const { text, numQuestions = 5, title, description, saveToDb = false } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Valid text content is required' },
        { status: 400 }
      );
    }

    let questions: Question[] = [];
    
    // Try to use OpenAI for question generation
    try {
      questions = await generateQuestionsWithAI(text, numQuestions);
      console.log('Generated questions with AI');
    } catch (aiError) {
      console.error('AI question generation failed:', aiError);
      // Fallback to sample questions if AI fails
      questions = generateSampleQuestions(text, numQuestions);
      console.log('Using fallback sample questions');
    }

    // Save to database if requested
    if (saveToDb && title) {
      try {
        await connectToDatabase();
        
        const newQuiz = await Quiz.create({
          title: title || 'Untitled Quiz',
          description: description || '',
          questions,
          createdBy: session?.user?.id || 'teacher'
        });
        
        return NextResponse.json({
          success: true,
          questions,
          quiz: newQuiz
        });
      } catch (dbError) {
        console.error('Failed to save quiz to database:', dbError);
        // Continue to return questions even if DB save fails
      }
    }

    return NextResponse.json({
      success: true,
      questions
    });

  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate questions', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

async function generateQuestionsWithAI(text: string, numQuestions: number): Promise<Question[]> {
  const promptText = `
    Generate ${numQuestions} multiple-choice questions based on the following text.
    Format your response as a valid JSON object with a "questions" array where each question has:
    1. "question": The question text
    2. "options": An array of 4 options, each with "text" and "isCorrect" (boolean) properties
    
    Make sure:
    - Only one option should be correct per question
    - Questions should test understanding of key concepts
    - Options should be plausible but clearly different
    - Questions should be diverse and cover different concepts from the text
    
    Text to base questions on:
    ${text.substring(0, 4000)} // Limit to prevent token overflow
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a helpful assistant that generates quiz questions based on educational content." },
      { role: "user", content: promptText }
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  try {
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Empty response from AI");
    }
    
    const parsedResponse = JSON.parse(responseContent);
    const questions = parsedResponse.questions || [];
    
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("No valid questions returned from AI");
    }
    
    // Validate the structure of the returned questions
    return questions.map((q: any) => ({
      question: q.question,
      options: q.options.map((o: any) => ({
        text: o.text,
        isCorrect: o.isCorrect
      }))
    }));
  } catch (error) {
    console.error("Error parsing AI response:", error);
    throw new Error("Failed to parse AI-generated questions");
  }
}

function generateSampleQuestions(text: string, numQuestions: number): Question[] {
  const questions: Question[] = [];
  
  for (let i = 0; i < numQuestions; i++) {
    const startIndex = Math.floor(Math.random() * Math.max(text.length - 100, 1));
    const snippet = text
      .substring(startIndex, startIndex + Math.min(100, text.length - startIndex))
      .split(' ')
      .slice(0, 10)
      .join(' ')
      .trim();
    
    questions.push({
      question: `Question ${i + 1} about: "${snippet}..."?`,
      options: [
        { text: `Answer option A for question ${i + 1}`, isCorrect: i % 4 === 0 },
        { text: `Answer option B for question ${i + 1}`, isCorrect: i % 4 === 1 },
        { text: `Answer option C for question ${i + 1}`, isCorrect: i % 4 === 2 },
        { text: `Answer option D for question ${i + 1}`, isCorrect: i % 4 === 3 },
      ]
    });
  }
  
  return questions;
} 