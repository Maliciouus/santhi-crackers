import { model, Schema } from "mongoose";

interface SuggetionsInterface {
  name: string;
  icon: string;
  active: boolean;
  isDeleted: boolean;
}

const SuggetionsSchema = new Schema<SuggetionsInterface>(
  {
    name: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Suggetions = model<SuggetionsInterface>(
  "Suggetions",
  SuggetionsSchema
);
