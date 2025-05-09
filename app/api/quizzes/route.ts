import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import connectToDatabase from '@/lib/db';
import Quiz from '@/models/Quiz';

// Get all quizzes (teachers get all, students get published quizzes)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    let quizzes;
    if (session.user.role === 'teacher') {
      // Teachers can see all quizzes they created
      quizzes = await Quiz.find({ createdBy: session.user.id });
    } else {
      // Students can see all quizzes (they will filter on the frontend by assigned quizzes)
      quizzes = await Quiz.find({});
    }

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { message: 'Error fetching quizzes' },
      { status: 500 }
    );
  }
}

// Create a new quiz
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a teacher
    if (session.user.role !== 'teacher') {
      return NextResponse.json(
        { message: 'Only teachers can create quizzes' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { title, description, questions, pdfUrl } = data;

    // Validate input
    if (!title || !description || !questions || questions.length === 0) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Create quiz
    const quiz = await Quiz.create({
      title,
      description,
      questions,
      createdBy: session.user.id,
      pdfUrl
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { message: 'Error creating quiz' },
      { status: 500 }
    );
  }
}

