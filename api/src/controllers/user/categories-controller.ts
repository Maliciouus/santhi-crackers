import { Config } from "@/models/config-model";
import { Product } from "@/models/product";
import Elysia, { t } from "elysia";
import { ProductCategory } from "../../models/product-category";

export const categoriesController = new Elysia({
  prefix: "/categories",
  detail: {
    tags: ["User - Categories"],
  },
})
  // .get(
  //   "/all",
  //   async ({ query }) => {
  //     try {
  //       const { limit, page } = query;

  //       let _limit = limit || 50;
  //       let _page = page || 1;

  //       const categories = await ProductCategory.find(
  //         {
  //           active: true,
  //         },
  //         "name image colorCode searchImage iosColorCode"
  //       )
  //         .sort({ order: 1 })
  //         .skip((_page - 1) * _limit)
  //         .limit(_limit)
  //         .exec();

  //       const categoryPromises = categories.map(async (category) => {
  //         const totalProducts = await Product.countDocuments({
  //           category: category._id,
  //           active: true,
  //         });

  //         return {
  //           ...category.toObject(),
  //           totalProducts,
  //         };
  //       });

  //       let updatedCategories = await Promise.all(categoryPromises);

  //       updatedCategories = updatedCategories.sort((a, b) => {
  //         return a.order - b.order;
  //       });

  //       return {
  //         categories: updatedCategories,
  //         status: "success",
  //       };
  //     } catch (error) {
  //       console.log(error);
  //       return {
  //         error,
  //         status: "error",
  //       };
  //     }
  //   },
  //   {
  //     query: t.Object({
  //       page: t.Optional(t.Number({ default: 1 })),
  //       limit: t.Optional(t.Number({ default: 50 })),
  //     }),
  //     detail: {
  //       summary: "Get all categories for app side",
  //     },
  //   }
  // )
  .get(
    "/all",
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
    "/count",
    async ({ query }) => {
      try {
        const { limit, page } = query;

        let _limit = limit || 10;
        let _page = page || 1;

        const categories = await ProductCategory.find({
          active: true,
        })
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ name: 1 })
          .exec();

        const updatedCategories = await Promise.all(
          categories.map(async (category) => {
            const productCount = await Product.countDocuments({
              category: category._id,
              active: true,
            });

            return {
              ...category.toObject(),
              productCount,
              nonVegProducts: 0,
              vegProducts: 0,
            };
          })
        );

        return {
          categories: updatedCategories,
          status: "success",
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
        summary: "Get all categories for app side",
      },
    }
  );
