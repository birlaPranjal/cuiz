import mongoose from 'mongoose';

export interface IOption {
  text: string;
  isCorrect: boolean;
}

export interface IQuestion {
  question: string;
  options: IOption[];
}

export interface IQuiz extends mongoose.Document {
  title: string;
  description: string;
  questions: IQuestion[];
  createdBy: mongoose.Types.ObjectId;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Please provide option text']
  },
  isCorrect: {
    type: Boolean,
    required: true
  }
});

const QuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Please provide a question']
  },
  options: {
    type: [OptionSchema],
    required: [true, 'Please provide options'],
    validate: {
      validator: function(options: IOption[]) {
        return options.length >= 2 && options.filter(option => option.isCorrect).length > 0;
      },
      message: 'Question must have at least 2 options and 1 correct answer'
    }
  }
});

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  questions: {
    type: [QuestionSchema],
    required: [true, 'Please provide questions'],
    validate: {
      validator: function(questions: IQuestion[]) {
        return questions.length > 0;
      },
      message: 'Quiz must have at least 1 question'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a user ID']
  },
  pdfUrl: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema); 