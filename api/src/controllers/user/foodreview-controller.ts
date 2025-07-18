import { FoodReview } from "@/models/user/food-review-model";
import { StoreType } from "@/types";
import Elysia, { t } from "elysia";

export const foodReviewController = new Elysia({
  prefix: "/foodreview",
  detail: {
    tags: ["User - Food Review"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
})
  .post(
    "/create",
    async ({ body, store }) => {
      try {
        const userId = (store as StoreType)["id"];

        const { food, rating, review } = body;
        const foodReview = await FoodReview.create({
          food,
          rating: rating || 0,
          review: review || "",
          user: userId,
        });
        await foodReview.save();
        return { message: "Review Created Successfully", data: foodReview };
      } catch (error) {
        console.error(error);
        return { error };
      }
    },
    {
      body: t.Object({
        food: t.String(),
        rating: t.Optional(t.Number()),
        review: t.Optional(t.String()),
      }),
      detail: {
        summary: "Create a food review",
        description: "Create a food review",
      },
    },
  )
  .get(
    "/all",
    async ({ query, store }) => {
      try {
        const userId = (store as StoreType)["id"];
        const { page, limit } = query;
        const _limit = limit || 10;
        const _page = page || 1;
        const foodReviews = await FoodReview.find({ user: userId })
          .populate("food", "productName images")
          .limit(_limit)
          .skip((_page - 1) * _limit);

        return { message: "All Food Reviews", data: foodReviews };
      } catch (error) {
        console.error(error);
        return { error };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ default: 1 })),
        limit: t.Optional(t.Number({ default: 10 })),
      }),
      detail: {
        summary: "Get all food reviews",
      },
    },
  )
  .put(
    "/:id",
    async ({ params, body, store, set }) => {
      try {
        const userId = (store as StoreType)["id"];
        const { id } = params;
        const { rating, review } = body;

        const updatedReview = await FoodReview.findOneAndUpdate(
          { _id: id, user: userId },
          {
            $set: {
              rating: rating,
              review: review,
            },
          },
          {
            new: true,
            runValidators: true,
          },
        ).populate("food", "productName images");

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
          }),
        ),
        review: t.Optional(
          t.String({
            minLength: 1,
            maxLength: 500,
          }),
        ),
      }),
      detail: {
        summary: "Update a food review",
        description: "Update rating and review of an existing food review",
      },
    },
  );
