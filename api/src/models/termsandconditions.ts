import { model, Schema } from "mongoose";

interface TermsAndConditions {
  content: string;
  delta: string;
}

export const TermsAndConditions = new Schema(
  {
    content: {
      type: String,
      required: false,
      default: "",
    },
    delta: {
      type: String,
      required: false,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const TermsAndConditionsModel = model<TermsAndConditions>(
  "TermsAndConditions",
  TermsAndConditions
);
