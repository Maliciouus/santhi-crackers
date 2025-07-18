import { model, Schema } from "mongoose";

interface ProductCategoryInterface {
  name: string;
  description: string;
  image: string | null;
  active: boolean;
  isDeleted: boolean;
  code:number;
  reEnabledAt: Date | null;
}

const ProductCategorySchema = new Schema<ProductCategoryInterface>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: Number,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    reEnabledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const ProductCategory = model<ProductCategoryInterface>(
  "ProductCategory",
  ProductCategorySchema
);
