import mongoose, { Document, Model } from 'mongoose';

// Use Document from mongoose to ensure proper typing
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    maxlength: [60, 'Name cannot be more than 60 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student'
  }
}, { 
  timestamps: true 
});

// Safe model creation with error handling
let UserModel: Model<IUser>;

try {
  // Try to get existing model
  UserModel = mongoose.model<IUser>('User');
} catch (error) {
  // Model doesn't exist, create a new one
  UserModel = mongoose.model<IUser>('User', UserSchema);
}

export default UserModel; 