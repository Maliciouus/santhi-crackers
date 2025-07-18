import { Schema, model } from "mongoose";

interface BannerInterface {
  bannerImage: string;
  bannerTitle: string;
  bannerDescription: string;
  active: boolean;
}

const bannerSchema = new Schema<BannerInterface>(
  {
    bannerImage: {
      type: String,
      required: true,
    },
    bannerTitle: {
      type: String,
      required: true,
    },
    bannerDescription: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Banner = model<BannerInterface>("Banner", bannerSchema);
