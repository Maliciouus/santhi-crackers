import { UserCoupon } from "@/models/user-coupon-model";
import { User } from "@/models/user-model";
import { StoreType } from "@/types";
import Elysia from "elysia";

export const couponController = new Elysia({
  prefix: "/coupon",
  detail: {
    tags: ["User - Coupons"],
  },
}).get(
  "/getmycoupons",
  async ({ store }) => {
    const userId = (store as StoreType)["id"];

    const user = await User.findById(userId);

    if (!user) {
      return {
        message: "User not found",
        status: false,
      };
    }

    const yourCoupons = await UserCoupon.find({
      user: userId,
    }).populate({
      path: "coupons.coupon",
      select: "code discount description",
    });

    return {
      yourCoupons,
      status: true,
    };
  },
  {
    detail: {
      summary: "Get My Coupons",
      description: "Get My Coupons",
    },
  }
);
