import { Schema, model } from "mongoose";

interface Faqs {
  question: string;
  answer: string;
  isActive: boolean;
}

const FaqSchema = new Schema<Faqs>(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
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

export const Faqs = model<Faqs>("Faqs", FaqSchema);
