import mongoose, { Document, Schema } from 'mongoose';

export interface IToolAnalytics extends Document {
  toolName: string;
  timestamp: Date;
  executionTime: number;
  success: boolean;
  query?: string;
  errorMessage?: string;
}

const ToolAnalyticsSchema = new Schema<IToolAnalytics>({
  toolName: {
    type: String,
    required: true,
    enum: ['queryDatabase', 'searchMovies', 'getJoke', 'rateJoke'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  executionTime: {
    type: Number,
    default: 0,
    min: 0,
  },
  success: {
    type: Boolean,
    required: true,
  },
  query: {
    type: String,
    default: '',
  },
  errorMessage: {
    type: String,
    default: '',
  },
});

ToolAnalyticsSchema.index({ toolName: 1, timestamp: -1 });
ToolAnalyticsSchema.index({ timestamp: -1 });

const ToolAnalytics =
  mongoose.models.ToolAnalytics ||
  mongoose.model<IToolAnalytics>('ToolAnalytics', ToolAnalyticsSchema);

export default ToolAnalytics;
