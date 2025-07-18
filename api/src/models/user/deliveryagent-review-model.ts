import { model, Schema } from "mongoose";

interface DeliveryAgentReview {
  user: Schema.Types.ObjectId;
  deliveryAgent: Schema.Types.ObjectId;
  order: Schema.Types.ObjectId;
  rating: number;
  review: string;
  createdAt: Date;
  updatedAt: Date;
}

const deliveryAgentReviewSchema = new Schema<DeliveryAgentReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deliveryAgent: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryAgent",
      required: true,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
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

export const DeliveryAgentReview = model<DeliveryAgentReview>(
  "DeliveryAgentReview",
  deliveryAgentReviewSchema
);
