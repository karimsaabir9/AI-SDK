import mongoose, { Document, Schema } from 'mongoose';

export interface IJoke extends Document {
  jokeId: string;
  joke: string;
  thumbsUp: number;
  thumbsDown: number;
  source: 'api' | 'local';
  createdAt: Date;
  updatedAt: Date;
}

const JokeSchema = new Schema<IJoke>(
  {
    jokeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    joke: {
      type: String,
      required: [true, 'Joke text is required'],
      trim: true,
    },
    thumbsUp: {
      type: Number,
      default: 0,
      min: 0,
    },
    thumbsDown: {
      type: Number,
      default: 0,
      min: 0,
    },
    source: {
      type: String,
      enum: ['api', 'local'],
      default: 'api',
    },
  },
  {
    timestamps: true,
  }
);

JokeSchema.index({ jokeId: 1 }, { unique: true });
JokeSchema.index({ thumbsUp: -1 });

const Joke = mongoose.models.Joke || mongoose.model<IJoke>('Joke', JokeSchema);

export default Joke;
