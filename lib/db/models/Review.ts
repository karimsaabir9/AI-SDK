import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReview extends Document {
  movieId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    movieId: {
      type: Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie reference is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be between 1 and 10'],
      max: [10, 'Rating must be between 1 and 10'],
    },
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ movieId: 1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ movieId: 1, userId: 1 }, { unique: true });

const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
