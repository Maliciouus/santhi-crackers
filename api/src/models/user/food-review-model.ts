import { model, Schema } from "mongoose";

interface FoodReview {
  user: Schema.Types.ObjectId;
  food: Schema.Types.ObjectId;
  rating: number;
  review: string;
  createdAt: Date;
  updatedAt: Date;
}

const foodReviewSchema = new Schema<FoodReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    food: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const FoodReview = model<FoodReview>("FoodReview", foodReviewSchema);
