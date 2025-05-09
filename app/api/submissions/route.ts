import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import connectToDatabase from '@/lib/db';
import Quiz from '@/models/Quiz';
import Submission from '@/models/Submission';

// Get all submissions for a user
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

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');
    const studentId = searchParams.get('studentId');

    await connectToDatabase();

    let submissions;

    if (session.user.role === 'teacher') {
      // Teachers can view submissions for their quizzes
      if (quizId) {
        // Check if teacher owns the quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz || quiz.createdBy.toString() !== session.user.id) {
          return NextResponse.json(
            { message: 'You do not have permission to view submissions for this quiz' },
            { status: 403 }
          );
        }
        
        // Get all submissions for the quiz
        submissions = await Submission.find({ quiz: quizId }).populate('student', 'name email');
      } else if (studentId) {
        // Get all submissions from a specific student for quizzes created by this teacher
        const teacherQuizzes = await Quiz.find({ createdBy: session.user.id }, '_id');
        const quizIds = teacherQuizzes.map(quiz => quiz._id);
        
        submissions = await Submission.find({
          quiz: { $in: quizIds },
          student: studentId
        }).populate('quiz', 'title').populate('student', 'name email');
      } else {
        // Get all submissions for all quizzes created by this teacher
        const teacherQuizzes = await Quiz.find({ createdBy: session.user.id }, '_id');
        const quizIds = teacherQuizzes.map(quiz => quiz._id);
        
        submissions = await Submission.find({
          quiz: { $in: quizIds }
        }).populate('quiz', 'title').populate('student', 'name email');
      }
    } else {
      // Students can only view their own submissions
      if (quizId) {
        submissions = await Submission.find({
          quiz: quizId,
          student: session.user.id
        }).populate({
          path: 'quiz',
          select: 'title description questions createdAt',
          populate: {
            path: 'questions'
          }
        });
      } else {
        submissions = await Submission.find({
          student: session.user.id
        }).populate({
          path: 'quiz',
          select: 'title description questions createdAt',
          populate: {
            path: 'questions'
          }
        });
      }
    }

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { message: 'Error fetching submissions' },
      { status: 500 }
    );
  }
}

// Create a new submission
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

    // Check if user is a student
    if (session.user.role !== 'student') {
      return NextResponse.json(
        { message: 'Only students can submit quizzes' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { quizId, answers } = data;

    if (!quizId || !answers) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Get the quiz to calculate the score
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return NextResponse.json(
        { message: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Check if student has already submitted this quiz
    const existingSubmission = await Submission.findOne({
      quiz: quizId,
      student: session.user.id
    });

    if (existingSubmission) {
      return NextResponse.json(
        { message: 'You have already submitted this quiz' },
        { status: 400 }
      );
    }

    // Calculate the score
    let score = 0;
    const processedAnswers = answers.map((answer: { questionIndex: number; selectedOptionIndex: number }) => {
      const question = quiz.questions[answer.questionIndex];
      const isCorrect = question?.options[answer.selectedOptionIndex]?.isCorrect || false;
      
      if (isCorrect) {
        score += 1;
      }

      return {
        ...answer,
        isCorrect
      };
    });

    // Create submission
    const submission = await Submission.create({
      quiz: quizId,
      student: session.user.id,
      answers: processedAnswers,
      score,
      totalQuestions: quiz.questions.length
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { message: 'Error creating submission' },
      { status: 500 }
    );
  }
}

