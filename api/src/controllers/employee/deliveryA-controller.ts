import { DeliveryAgentReview } from "@/models/user/deliveryagent-review-model";
import { StoreType } from "@/types";
import Elysia, { t } from "elysia";

export const deliveryAgentReviewController = new Elysia({
  prefix: "/deliveryagent/review",
  detail: {
    tags: ["User - Delivery Agent Review"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
})
  .post(
    "/create",
    async ({ body, store, set }) => {
      try {
        const userId = (store as StoreType)["id"];

        const { deliveryAgent, rating, review, orderId } = body;
        const deliveryAgentReview = await DeliveryAgentReview.create({
          deliveryAgent,
          rating,
          review,
          user: userId,
          order: orderId,
        });

        return {
          message: "Review Created Successfully",
          data: deliveryAgentReview,
          status: true,
        };
      } catch (error) {
        console.error(error);
        set.status = 500;
        return {
          error: "Failed to create review",
          status: false,
        };
      }
    },
    {
      body: t.Object({
        deliveryAgent: t.String(),
        rating: t.Number({
          minimum: 1,
          maximum: 5,
        }),
        review: t.String(),
        orderId: t.String({
          pattern: `^[a-fA-F0-9]{24}$`,
        }),
      }),
      detail: {
        summary: "Create a delivery agent review",
        description: "Create a delivery agent review",
      },
    }
  )
  .get(
    "/all",
    async ({ query, store, set }) => {
      try {
        const userId = (store as StoreType)["id"];
        const { page, limit } = query;
        const _limit = limit || 10;
        const _page = page || 1;

        const reviews = await DeliveryAgentReview.find({ user: userId })
          .populate("deliveryAgent", "name profileImage")
          .populate("order", "orderId totalAmount")
          .limit(_limit)
          .skip((_page - 1) * _limit)
          .sort({ createdAt: -1 });

        const total = await DeliveryAgentReview.countDocuments({
          user: userId,
        });

        return {
          message: "All Delivery Agent Reviews",
          data: reviews,
          total: total,
          status: true,
        };
      } catch (error) {
        console.error(error);
        set.status = 500;
        return {
          error: "Failed to fetch reviews",
          status: false,
        };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ default: 1 })),
        limit: t.Optional(t.Number({ default: 10 })),
      }),
      detail: {
        summary: "Get all delivery agent reviews",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body, store, set }) => {
      try {
        const userId = (store as StoreType)["id"];
        const { id } = params;
        const { rating, review } = body;

        const updatedReview = await DeliveryAgentReview.findOneAndUpdate(
          { _id: id, user: userId },
          {
            $set: {
              rating,
              review,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        )
          .populate("deliveryAgent", "name profileImage")
          .populate("order", "orderId totalAmount");

        if (!updatedReview) {
          set.status = 404;
          return {
            message:
              "Review not found or you don't have permission to edit this review",
            status: false,
          };
        }

        return {
          message: "Review updated successfully",
          data: updatedReview,
          status: true,
        };
      } catch (error) {
        console.error(error);
        set.status = 500;
        return {
          error: "Failed to update review",
          status: false,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        rating: t.Optional(
          t.Number({
            minimum: 1,
            maximum: 5,
          })
        ),
        review: t.Optional(
          t.String({
            minLength: 1,
            maxLength: 500,
          })
        ),
      }),
      detail: {
        summary: "Update a delivery agent review",
        description:
          "Update rating and review of an existing delivery agent review",
      },
    }
  );
