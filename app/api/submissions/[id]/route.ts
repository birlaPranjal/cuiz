import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectToDatabase from '@/lib/db';
import Quiz from '@/models/Quiz';
import Submission from '@/models/Submission';

// Get a specific submission
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

    const submissionId = params.id;
    await connectToDatabase();

    // Use deep population to get all quiz details including questions
    const submission = await Submission.findById(submissionId)
      .populate({
        path: 'quiz',
        populate: {
          path: 'questions',
        }
      })
      .populate('student', 'name email');

    if (!submission) {
      return NextResponse.json(
        { message: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (session.user.role === 'student') {
      // Students can only view their own submissions
      if (submission.student._id.toString() !== session.user.id) {
        return NextResponse.json(
          { message: 'You do not have permission to view this submission' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'teacher') {
      // Teachers can only view submissions for quizzes they created
      const quiz = await Quiz.findById(submission.quiz._id);
      if (!quiz || quiz.createdBy.toString() !== session.user.id) {
        return NextResponse.json(
          { message: 'You do not have permission to view this submission' },
          { status: 403 }
        );
      }
    }

    // Convert to plain object to ensure all nested objects are included
    const plainSubmission = JSON.parse(JSON.stringify(submission));

    return NextResponse.json(plainSubmission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { message: 'Error fetching submission', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

