import { model, Schema } from "mongoose";

interface PrivacyPolicyInterface {
  content: string;
  delta: string;
}

export const PrivacyPolicy = new Schema(
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

export const PrivacyPolicyModel = model<PrivacyPolicyInterface>(
  "PrivacyPolicy",
  PrivacyPolicy
);
