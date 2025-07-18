import { Schema, model } from "mongoose";

interface Dipping {
  name: string;
  image: string;
  price: number;
  active: boolean;
  isDeleted: boolean;
}

const DippingSchema = new Schema<Dipping>(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
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

export const Dipping = model<Dipping>("Dipping", DippingSchema);
