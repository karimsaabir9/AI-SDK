import mongoose, { Document, Schema } from 'mongoose';

export interface IMovie extends Document {
  title: string;
  year: number;
  genre: string;
  rating: number;
  director: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const MovieSchema = new Schema<IMovie>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1888, 'Year must be after 1888'],
      max: [new Date().getFullYear() + 5, 'Year is too far in the future'],
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [0, 'Rating must be between 0 and 10'],
      max: [10, 'Rating must be between 0 and 10'],
    },
    director: {
      type: String,
      required: [true, 'Director is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

MovieSchema.index({ title: 'text', description: 'text' });
MovieSchema.index({ genre: 1 });
MovieSchema.index({ rating: -1 });
MovieSchema.index({ year: -1 });

const Movie = mongoose.models.Movie || mongoose.model<IMovie>('Movie', MovieSchema);

export default Movie;
