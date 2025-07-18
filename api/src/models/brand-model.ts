import { Schema, model } from "mongoose";

interface Brand {
  name: string;
  image: string;
  active: boolean;
  isDeleted: boolean;
}

const BrandSchema = new Schema<Brand>(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
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

export const Brand = model<Brand>("Brand", BrandSchema);
