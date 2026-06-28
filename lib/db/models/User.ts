import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  age: number;
  favoriteGenre: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age must be non-negative'],
      max: [150, 'Age is invalid'],
    },
    favoriteGenre: {
      type: String,
      required: [true, 'Favorite genre is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ age: 1 });
UserSchema.index({ favoriteGenre: 1 });

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
