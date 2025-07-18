import { model, Schema } from "mongoose";

interface ConfigInterface {
  deliveryCharge: number;
  platformFee: number;
  freeDeliveryMinDistance: number;
  deliveryFreeAfter: number;
  shopCloseReason?: string;
}

const configSchema = new Schema<ConfigInterface>(
  {
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    freeDeliveryMinDistance: {
      type: Number,
      default: 0,
    },
    shopCloseReason: {
      type: String,
      default: "",
    },
    deliveryFreeAfter: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Config = model<ConfigInterface>("Config", configSchema);
