import { Product } from "@/models/product";
import { User } from "@/models/user-model";
import { Favorites } from "@/models/user/favorites-model";
import { StoreType } from "@/types";
import { add, format } from "date-fns";
import Elysia, { t } from "elysia";
import { Types, isValidObjectId } from "mongoose";

export const favoritesController = new Elysia({
  prefix: "/favorites",
  detail: {
    tags: ["User - Favorites"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
})
  .post(
    "/favorite",
    async ({ body, set, store }) => {
      const { productId } = body;
      const userId = (store as StoreType)["id"];

      if (!isValidObjectId(userId) || !isValidObjectId(productId)) {
        set.status = 400;
        return { message: "Invalid user or product id", status: false };
      }

      const [product, user] = await Promise.all([
        Product.findById(productId),
        User.findById(userId),
      ]);

      if (!product || !user) {
        set.status = 404;
        return { message: "Product or user not found", status: false };
      }

      let favorite = await Favorites.findOne({ user: userId });
      let action: "added" | "removed";

      if (!favorite) {
        favorite = new Favorites({ user: userId, products: [productId] });
        action = "added";
      } else if (!favorite.products.includes(productId)) {
        favorite.products.push(productId);
        action = "added";
      } else {
        favorite = await Favorites.findOneAndUpdate(
          { user: userId },
          { $pull: { products: productId } },
          { new: true }
        );
        action = "removed";
      }

      if (favorite) await favorite.save();

      return { message: `Favorite ${action} successfully`, status: true };
    },
    {
      body: t.Object({ productId: t.String() }),
      detail: {
        summary: "Add / Remove a product to favorites",
        description: "Add or remove a product to user's favorites",
      },
    }
  )
  .get(
    "/getfavorites",
    async ({ store, query }) => {
      const userId = (store as StoreType)["id"];
      const { page, limit, search, category, brand, minPrice, maxPrice } = query;
  
      let filter: any = { user: userId };
  
      // Convert comma-separated values to arrays
      const categoryIds = category ? category.split(",").map((id) => new Types.ObjectId(id)) : [];
      const brandIds = brand ? brand.split(",").map((id) => new Types.ObjectId(id)) : [];
  
      try {
        const _limit = limit || 10;
        const _page = page || 1;
  
        const favorites = await Favorites.find({ user: userId }) // Only filter by user initially
          .populate({
            path: "products",
            match: {
              ...(search && { productName: { $regex: search, $options: "i" } }),
              ...(categoryIds.length > 0 && { category: { $in: categoryIds } }),
              ...(brandIds.length > 0 && { brand: { $in: brandIds } }),
              ...(minPrice || maxPrice
                ? {
                    price: {
                      ...(minPrice ? { $gte: parseFloat(minPrice) } : {}),
                      ...(maxPrice ? { $lte: parseFloat(maxPrice) } : {}),
                    },
                  }
                : {}),
            },
            populate: [
              {
                path: "brand",
                select: "name",
              },
              {
                path: "category",
                select: "_id active",
              },
            ],
          })
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .lean()
          .exec();
  
        const updatedFavorites = favorites.map((favorite) => {
          favorite.products = favorite.products.filter((product: any) => product.category?.active);
          return favorite;
        });
  
        return {
          message: "Favorites fetched successfully",
          status: true,
          favorites: updatedFavorites,
        };
      } catch (error) {
        console.error(error);
        return {
          error: error instanceof Error ? error.message : "Unknown error",
          status: false,
        };
      }
    },
    {
      detail: {
        summary: "Get user's favorites with filters",
        description: "Get user's favorites with optional filtering by category, brand, and price range",
      },
      query: t.Object({
        page: t.Optional(t.Number({ default: 1 })),
        limit: t.Optional(t.Number({ default: 10 })),
        search: t.Optional(t.String()),
        category: t.Optional(t.String()), // Can be comma-separated
        brand: t.Optional(t.String()), // Can be comma-separated
        minPrice: t.Optional(t.String()),
        maxPrice: t.Optional(t.String()),
      }),
    }
  );
  
  
  
  // .get(
  //   "/getfavorites",
  //   async ({ store, query }) => {
  //     const userId = (store as StoreType)["id"];
  //     const { page, limit, type } = query;

  //     let filter: any = { user: userId };

  //     let currentServerTime = format(new Date(), "HH:mm");

  //     if (process.env.ENV === "PROD") {
  //       const updatedTime = add(new Date(), { hours: 5, minutes: 30 });
  //       currentServerTime = format(updatedTime, "HH:mm");
  //     }

  //     try {
  //       let _limit = limit || 10;
  //       let _page = page || 1;

  //       const favorites = await Favorites.find(filter)
  //         .populate({
  //           path: "products",
  //           match: type ? { type } : {},
  //           select: "-dippings -foodsuggetions",
  //           populate: [
  //             {
  //               path: "suggetions",
  //               select: "name icon",
  //             },
  //             {
  //               path: "timing",
  //             },
  //             {
  //               path: "category", 
  //               select: "active",
  //             },
  //           ],
  //         })
  //         .skip((_page - 1) * _limit)
  //         .limit(_limit)
  //         .lean()
  //         .exec();

  //       const updatedFavorites = favorites.map((favorite) => {
  //         favorite.products = favorite.products
  //         // .filter((product: any) => product.category?.active)
  //         .map((product: any) => {
  //           const isAvailable = product?.timing.some((time: any) => {
  //             const isWithinTimeRange =
  //               currentServerTime >= time.startTime &&
  //               currentServerTime <= time.endTime;
  //             return isWithinTimeRange;

  //           });

  //           return {
  //             ...product,
  //             available: isAvailable,
  //           };
  //         });
  //         return favorite;
  //       });
  //       return {
  //         message: "Favorites fetched successfully",
  //         status: true,
  //         favorites: updatedFavorites,
  //       };
  //     } catch (error) {
  //       console.error(error);

  //       return {
  //         error: error instanceof Error ? error.message : "Unknown error",
  //         status: false,
  //       };
  //     }
  //   },
  //   {
  //     detail: {
  //       summary: "Get user's favorites",
  //       description: "Get user's favorites",
  //     },
  //     query: t.Object({
  //       page: t.Number({
  //         default: 1,
  //       }),
  //       limit: t.Number({
  //         default: 10,
  //       }),
  //       type: t.Optional(t.String()),
  //     }),
  //   }
  // );
