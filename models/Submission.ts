import mongoose from 'mongoose';

export interface IAnswer {
  questionIndex: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
}

export interface ISubmission extends mongoose.Document {
  quiz: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  answers: IAnswer[];
  score: number;
  totalQuestions: number;
  submittedAt: Date;
}

const AnswerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  selectedOptionIndex: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  }
});

const SubmissionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: [true, 'Please provide a quiz ID']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a student ID']
  },
  answers: {
    type: [AnswerSchema],
    required: [true, 'Please provide answers']
  },
  score: {
    type: Number,
    required: [true, 'Please provide a score']
  },
  totalQuestions: {
    type: Number,
    required: [true, 'Please provide total questions count']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema); 