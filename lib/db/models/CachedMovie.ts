import mongoose, { Document, Schema } from 'mongoose';

export interface ICachedMovie extends Document {
  tmdbId: number;
  title: string;
  year: string;
  data: Record<string, any>;
  cachedAt: Date;
}

const CachedMovieSchema = new Schema<ICachedMovie>({
  tmdbId: {
    type: Number,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  year: {
    type: String,
    default: '',
  },
  data: {
    type: Schema.Types.Mixed,
    required: true,
  },
  cachedAt: {
    type: Date,
    default: Date.now,
    expires: 7 * 24 * 60 * 60,
  },
});
CachedMovieSchema.index({ title: 'text' });
CachedMovieSchema.index({ title: 1, year: 1 });

const CachedMovie =
  mongoose.models.CachedMovie || mongoose.model<ICachedMovie>('CachedMovie', CachedMovieSchema);

export default CachedMovie;
