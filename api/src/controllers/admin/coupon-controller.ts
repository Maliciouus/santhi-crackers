import { CouponModel } from "@/models/coupon-model";
import Elysia, { t } from "elysia";

export const couponController = new Elysia({
  prefix: "/coupon",
  detail: {
    tags: ["Admin - Coupon"],
  },
})
  .get(
    "/",
    async ({ set, query }) => {
      const { page, limit, q } = query;
      const _limit = limit || 10;
      const _page = page || 1;

      const filter = q ? { code: { $regex: q, $options: "i" } } : {};

      try {
        const coupons = await CouponModel.find(filter)
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ createdAt: -1 });

        const total = await CouponModel.countDocuments(filter);

        return {
          message: "Coupon List",
          data: coupons,
          status: true,
          total: total,
        };
      } catch (error) {
        set.status = 500;
        return {
          error,
        };
      }
    },
    {
      query: t.Object({
        page: t.Number({
          default: 1,
        }),
        limit: t.Number({
          default: 10,
        }),
        q: t.String({
          default: "",
        }),
      }),
    }
  )

  .post("/", async ({ body, set }) => {
    try {
      const coupon = await CouponModel.create(body);
      return {
        message: "Coupon created",
        data: coupon,
        status: true,
      };
    } catch (error) {
      set.status = 500;
      return {
        error,
        status: false,
      };
    }
  })
  .put(
    "/:id",
    async ({ body, params }) => {
      const { id } = params;
      const { code, description, discount, minPrice, maxPrice, numberOfDays } =
        body;

      try {
        const coupon = await CouponModel.findById(id);
        if (!coupon) {
          return { status: false, message: "Coupon not found" };
        }

        coupon.code = code ?? coupon.code;
        coupon.description = description ?? coupon.description;
        coupon.discount = discount ?? coupon.discount;
        coupon.minPrice = minPrice ?? coupon.minPrice;
        coupon.maxPrice = maxPrice ?? coupon.maxPrice;
        coupon.numberOfDays = numberOfDays ?? coupon.numberOfDays;

        const updatedCoupon = await coupon.save();

        return {
          status: true,
          message: "Coupon updated successfully",
          data: updatedCoupon,
        };
      } catch (error: any) {
        console.error("Error updating coupon:", error);
        return {
          status: false,
          message: "Failed to update coupon",
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        code: t.Optional(t.String()),
        description: t.Optional(t.String()),
        discount: t.Optional(t.Number()),
        minPrice: t.Optional(t.Number()),
        maxPrice: t.Optional(t.Number()),
        numberOfDays: t.Optional(t.Number()),
      }),
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .delete("/:id", async ({ params }) => {
    try {
      const { id } = params;
      const dipping = await CouponModel.findById(id);

      if (!dipping) {
        return { message: "Coupon not found", status: false };
      }

      await dipping.updateOne({
        active: !dipping.active,
      });

      await dipping.save();
      return {
        message: dipping.active
          ? "Coupon Deactivated Successfully"
          : "Coupon Activated Successfully",
        status: true,
      };
    } catch (error) {
      console.error(error);
      return {
        error,
        status: false,
      };
    }
  });
