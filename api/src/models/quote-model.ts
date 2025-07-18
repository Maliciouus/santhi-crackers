import { Schema, model } from "mongoose";

interface Quotes {
  quote: string;
  isActive: boolean;
}

const QuoteSchema = new Schema<Quotes>(
  {
    quote: {
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

export const Quotes = model<Quotes>("Quotes", QuoteSchema);
