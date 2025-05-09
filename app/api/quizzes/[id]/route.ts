import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectToDatabase from '@/lib/db';
import Quiz from '@/models/Quiz';
import Submission from '@/models/Submission';

// Get a specific quiz
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const id = params.id;
    await connectToDatabase();

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return NextResponse.json(
        { message: 'Quiz not found' },
        { status: 404 }
      );
    }

    // If student is viewing, check if they're allowed
    if (session.user.role === 'student') {
      // Students can view any quiz, but they might need to check if it's assigned to them in the frontend
    }

    // If teacher is viewing, check if they own the quiz
    if (session.user.role === 'teacher' && quiz.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { message: 'You do not have permission to view this quiz' },
        { status: 403 }
      );
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { message: 'Error fetching quiz' },
      { status: 500 }
    );
  }
}

// Update a quiz
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { message: 'Only teachers can update quizzes' },
        { status: 403 }
      );
    }

    const id = params.id;
    const data = await request.json();
    
    await connectToDatabase();

    // Find quiz and check ownership
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return NextResponse.json(
        { message: 'Quiz not found' },
        { status: 404 }
      );
    }

    if (quiz.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { message: 'You do not have permission to update this quiz' },
        { status: 403 }
      );
    }

    // Update quiz
    const updatedQuiz = await Quiz.findByIdAndUpdate(id, data, { new: true });
    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json(
      { message: 'Error updating quiz' },
      { status: 500 }
    );
  }
}

// Delete a quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { message: 'Only teachers can delete quizzes' },
        { status: 403 }
      );
    }

    const id = params.id;
    await connectToDatabase();

    // Find quiz and check ownership
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return NextResponse.json(
        { message: 'Quiz not found' },
        { status: 404 }
      );
    }

    if (quiz.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this quiz' },
        { status: 403 }
      );
    }

    // Delete quiz
    await Quiz.findByIdAndDelete(id);
    
    // Also delete all submissions for this quiz
    await Submission.deleteMany({ quiz: id });

    return NextResponse.json(
      { message: 'Quiz deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json(
      { message: 'Error deleting quiz' },
      { status: 500 }
    );
  }
}

