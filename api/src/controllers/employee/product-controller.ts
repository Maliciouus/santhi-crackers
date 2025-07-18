import { StoreType } from "@/types";
import { add, format } from "date-fns";
import Elysia, { t } from "elysia";
import { Types } from "mongoose";
import { Product } from "../../models/product";
import { Favorites } from "../../models/user/favorites-model";
import { NegotiateOffer } from "@/models/offer-model";
import { User } from "@/models/user-model";
import { Brand } from "@/models/brand-model";
import { Config } from "@/models/config-model";
import { ProductCategory } from "@/models/product-category";

export const productController = new Elysia({
  prefix: "/products",
  detail: {
    tags: ["Employee - Product"],
  },
})
.get(
  "/",
  async ({ query }) => {
    const { page, limit, q, rating, userId, category, brand, minPrice, maxPrice } = query;

    const _limit = parseInt(limit as any) || 10;
    const _page = parseInt(page as any) || 1;

    let matchFilter: any = { active: true, isDeleted: false };

    if (q) {
      matchFilter.$or = [{ productName: { $regex: q, $options: "i" } }];
    }

    if (rating) {
      const ratingNumber = parseInt(rating, 10);
      if (ratingNumber >= 1 && ratingNumber <= 5) {
        matchFilter.ratings = ratingNumber;
      }
    }

    try {

      const aggregationPipeline: any[] = [
        { $match: matchFilter },
        {
          $lookup: {
            from: "productcategories",
            localField: "category",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },
        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brandDetails",
          },
        },
        { $unwind: "$brandDetails" },
        {
          $addFields: {
            available: {
              $cond: [{ $gt: ["$stock", 0] }, true, false]
            }
          },
        },
        {
          $project: {
            _id: 1,
            productName: 1,
            ratings: 1,
            images: 1,
            description: 1,
            categoryId: "$categoryDetails._id",
            categoryName: "$categoryDetails.name",
            brandId: "$brandDetails._id",
            brandName: "$brandDetails.name",
            available: 1
          }
        }
      ];

      const allProducts = await Product.aggregate(aggregationPipeline);

      let userFavorites: string[] = [];

      if (userId) {
        const favorites = await Favorites.findOne({ user: userId });
        userFavorites = favorites?.products?.map((p: any) => p.toString()) || [];
      }

      const total = allProducts.length;
      const paginatedProducts = allProducts.slice((_page - 1) * _limit, _page * _limit).map(product => ({
        ...product,
        favorite: userFavorites.includes(product._id.toString()),
      }));

      return {
        data: paginatedProducts,
        total,
        page: _page,
        limit: _limit,
        status: true,
      };
    } catch (error) {
      console.error(error);
      return {
        error,
        status: false,
        message: "Something went wrong",
      };
    }
  },
  {
    detail: {
      summary: "Get all active products with filters",
      description: "Supports filtering by multiple categories, brands, price ranges, and ratings. Categories and brands can be comma-separated for multiple values."
    },
    query: t.Object({
      page: t.Optional(t.Number({ default: 1 })),
      limit: t.Optional(t.Number({ default: 10 })),
      q: t.Optional(t.String({ default: "" })),
      rating: t.Optional(t.String()),
      userId: t.Optional(t.String()),
      category: t.Optional(t.String({ description: "Comma-separated category IDs" })),
      brand: t.Optional(t.String({ description: "Comma-separated brand IDs" })),
      minPrice: t.Optional(t.String()),
      maxPrice: t.Optional(t.String()),
    }),
  }
)


.get(
    "/:id",
    async ({ params, query }) => {
      try {
        const { id } = params;
        const { userId } = query;
  
        const product: any = await Product.findById(id)
          .populate({
            path: "category",
            select: "name categoryNumber",
          })
          .populate({
            path: "brand",
            select: "name",
          })
          .exec();
  
        if (!product) {
          return {
            error: "Product not found",
            status: false,
          };
        }
  
        let userFavorites: String[] = [];
  
        if (userId) {
          const favorites = await Favorites.findOne({ user: userId });
          userFavorites = favorites?.products || [];
        }
  
        const { price, strikePrice, discount, onMRP,negotiate,negotiateLimit,flat,...rest } = product._doc;
  
        const newProduct = {
          ...rest,
          favorite: userFavorites.includes(product._id.toString()),
        };
  
        return {
          message: "Product Fetched Successfully",
          data: newProduct,
          status: true,
        };
      } catch (error) {
        console.error(error);
        return {
          error,
          status: "error",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        userId: t.Optional(t.String()),
      }),
      detail: {
        summary: "Get a product by id",
      },
    }
  )
  

  
  .get(
    "/brands/all",
    async ({ query }) => {
      try {
        const { limit, page } = query;
  
        let _limit = limit || 10;
        let _page = page || 1;
  
        const brands = await Brand.find(
          {
            active: true,
          },
          "name image _id"
        )
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ createdAt: -1 })
          .exec();
  
        const totalBrands = await Brand.countDocuments({
          active: true,
        });
  
        return {
          brands,
          status: true,
          total: totalBrands,
          message: "Brands Fetched Successfully",
        };
      } catch (error) {
        console.error(error);
        return {
          error,
          status: false,
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
      }),
      detail: {
        summary: "Get all brands",
      },
    }
  )
  .get(
    "/categories/all",
    async ({ query }) => {
      try {
        const { limit, page } = query;

        let _limit = limit || 10;
        let _page = page || 1;

        const categories = await ProductCategory.find(
          {
            active: true,
            isDeleted: false,
          },
          "name image _id"
        )
          .sort({ order: 1 })
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .exec();

        // const categoryPromises = categories.map(async (category) => {
        //   const totalProducts = await Product.countDocuments({
        //     category: category._id,
        //     active: true,
        //   });

        //   return totalProducts > 0
        //     ? { ...category.toObject(), totalProducts }
        //     : null;
        // });

        // let updatedCategories = (await Promise.all(categoryPromises)).filter(
        //   (category) => category !== null
        // );

        // updatedCategories = updatedCategories.sort((a, b) => {
        //   //@ts-ignore
        //   return a.order - b.order;
        // });

        let reason = "";

        const config = await Config.findOne();

        // if (config && updatedCategories.length <= 0) {
        //   reason = config.shopCloseReason ?? "";
        // }

        return {
          // categories: updatedCategories,
          categories,
          status: "success",
          showMessage: reason,
        };
      } catch (error) {
        console.log(error);
        return {
          error,
          status: "error",
        };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ default: 1 })),
        limit: t.Optional(t.Number({ default: 10 })),
      }),
      detail: {
        summary: "Get all categories for app side, excluding empty categories",
      },
    }
  )
  
  .get(
    "/search",
    async ({ query, store }) => {
      const { page, limit, q } = query;
      const userId = (store as StoreType)["id"];
  
      let _limit = limit || 10;
      let _page = page || 1;
  
      let filter: any = { active: true };
  
      if (q) {
        filter.productName = {
          $regex: q.trim().split("").join(".*"),
          $options: "i",
        };
      }
  
      let userFavorites: String[] = [];
  
      try {
        if (userId) {
          const favorites = await Favorites.findOne({ user: userId });
          userFavorites = favorites?.products || [];
        }
  
        const mergedFilter = { ...filter };
  
        let productsPromise = Product.aggregate([
          { $match: mergedFilter },
          {
            $lookup: { // Add this stage to populate brand
              from: "brands", // The collection name for brands
              localField: "brand", // Field in products collection
              foreignField: "_id", // Field in brands collection
              as: "brand" // Output array field
            }
          },
          { $unwind: "$brand" }, // Convert the array to an object
          {
            $addFields: {
              favorite: {
                $in: ["$_id", userFavorites],
              },
            },
          },
          {
            $group: {
              _id: "$_id",
              productDetails: {
                $first: "$$ROOT",
              },
            },
          },
          {
            $replaceRoot: { newRoot: "$productDetails" },
          },
          {
            $project: {
              productName: 1,
              images: 1,
              description: 1,
              brand: { // Include specific brand fields you want
                _id: 1,
                name: 1,
                logo: 1,
                // Add other brand fields you need
              },
            },
          },
          { $skip: (_page - 1) * _limit },
          { $limit: _limit },
        ]);
  
        const totalPromise = Product.countDocuments(filter);
  
        const [products, total] = await Promise.all([
          productsPromise,
          totalPromise,
        ]);
        
        return {
          data: products,
          total,
          page: _page,
          limit: _limit,
          status: true,
        };
      } catch (error) {
        console.error(error);
        return {
          error,
          status: false,
          message: "Something went wrong",
        };
      }
    },
    {
      detail: {
        summary: "Search through all products",
      },
      query: t.Object({
        page: t.Optional(t.Number({ default: 1 })),
        limit: t.Optional(t.Number({ default: 10 })),
        q: t.Optional(t.String({ default: "" })),
      }),
    }
  )