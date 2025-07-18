import { model, Schema } from "mongoose";

interface TimingsInterface {
  startTime: string;
  endTime: string;
  name: string;
  description: string;
  isActive: boolean;
}

const TimingsSchema = new Schema<TimingsInterface>(
  {
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Timings = model<TimingsInterface>("Timings", TimingsSchema);
