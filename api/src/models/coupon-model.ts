import { Schema, model } from "mongoose";

interface CouponInterface {
  code: string;
  discount: number;
  active: boolean;
  description: string;
  minPrice: number;
  maxPrice: number;
  numberOfDays: number;
  createdAt: Date;
  deletedAt?: Date;
}

const couponSchema = new Schema<CouponInterface>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    active: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      required: true,
    },
    minPrice: {
      type: Number,
      required: true,
      min: 1,
    },
    maxPrice: {
      type: Number,
      required: true,
      min: 1,
    },
    numberOfDays: {
      type: Number,
      required: true,
      min: 1,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.index({ createdAt: 1 });
couponSchema.index({ active: 1 });

export const CouponModel = model<CouponInterface>("Coupon", couponSchema);
