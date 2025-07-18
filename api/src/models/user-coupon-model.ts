import { model, Schema, Types } from "mongoose";

interface UserCoupon {
  user: Types.ObjectId;
  coupons: [
    {
      coupon: Types.ObjectId;
      expiredAt: Date;
    }
  ];
}

const userCouponSchema = new Schema<UserCoupon>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  coupons: [
    {
      coupon: {
        type: Schema.Types.ObjectId,
        ref: "Coupon",
        required: true,
      },
      expiredAt: {
        type: Date,
        required: true,
      },
    },
  ],
});

export const UserCoupon = model<UserCoupon>("UserCoupon", userCouponSchema);
