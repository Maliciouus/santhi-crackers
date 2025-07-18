import { Config } from "@/models/config-model";
import dayjs from "dayjs";
import Elysia, { t } from "elysia";

import { ProductCategory } from "../../models/product-category";
import { Product } from "@/models/product";
import { deleteFile, saveFile } from "@/lib/file";

export const productCategoryController = new Elysia({
  prefix: "/productcategory",
  detail: {
    tags: ["Admin - Product Category"],
  },
})
.get(
  "/all",
  async ({ query }) => {
    try {
      const { page, limit, q } = query;

      const _limit = Number(limit) || 10;
      const _page = Number(page) || 1;

      const searchQuery: Record<string, unknown> = {
        isDeleted: false,
      };

      if (q && q.trim() !== "") {
        searchQuery.name = { $regex: q, $options: "i" };
      }

      const categories = await ProductCategory.find(searchQuery)
        .sort({ createdAt: 1,_id:1 })
        .skip((_page - 1) * _limit)
        .limit(_limit)
        .exec();

      const totalCategories = await ProductCategory.countDocuments(searchQuery);

      return {
        message: "Categories Fetched Successfully",
        categories,
        status: "success",
        total: totalCategories,
        page: _page,
        limit: _limit,
        totalPages: Math.ceil(totalCategories / _limit),
      };
    } catch (error) {
      console.error("Error fetching categories:", error);
      return {
        status: "error",
        message: "Failed to fetch categories",
        error: error instanceof Error ? error.message : error,
      };
    }
  },
  {
    query: t.Object({
      page: t.String({ default: "1" }), // strings from URL query
      limit: t.String({ default: "10" }),
      q: t.String({ default: "" }),
    }),
    detail: {
      summary: "Get all product categories for admin panel",
    },
  }
)

  .get(
    "/activeStatus",
    async () => {
      try {
        const categories = await ProductCategory.find({ isDeleted: false })
          .select("active")
          .exec();

        if (!categories.length) {
          return {
            message: "No categories found",
            status: "error",
            majorityActive: false,
          };
        }
        const activeCount = categories.filter((cat) => cat.active).length;
        // const inactiveCount = categories.length - activeCount;

        return {
          message: "Active status fetched successfully",
          status: "success",
          activeStatus: activeCount > 0,
        };
      } catch (error: any) {
        console.error(error);
        return {
          error: error.message,
          status: "error",
        };
      }
    },
    {
      detail: {
        summary: "Check if majority of product categories are active",
      },
    }
  )

  .post(
    "/create",
    async ({ body, set }) => {
      try {
        const { name, description, image, code } = body;
  
        const existing = await ProductCategory.findOne({
          name,
          isDeleted: false,
        });
  
        if (existing) {
          return { message: "Category already exists", status: false };
        }
  
        const category = await ProductCategory.create({
          name,
          description,
          code, // Add the code field
          active: true,
        });
  
        if (image) {
          const { ok, filename } = await saveFile(image, "product-category");
  
          if (!ok) {
            set.status = 400;
            return { message: "Error uploading image", status: false };
          }
  
          category.image = filename;
          await category.save();
        }
  
        return {
          message: "Category Created Successfully",
          data: {
            name: category.name,
          },
          status: true,
        };
      } catch (error) {
        console.error(error);
        return {
          status: false,
          error,
        };
      }
    },
    {
      body: t.Object({
        name: t.String({
          default: "Category",
        }),
        description: t.String({
          default: "Category",
        }),
        image: t.File({}),
        code: t.String({
          default: "000",
        }),
      }),
      detail: {
        summary: "Create a new product category",
      },
    }
  )
  
  .get(
    "/select",
    async () => {
      try {
        const categories = await ProductCategory.find({
          active: true,
          isDeleted: false,
        })
          .select("name categoryNumber _id")
          .sort({ order: 1 })
          .exec();

        return {
          categories,
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
      detail: {
        summary: "Get all product categories for admin panel dropdown",
      },
    }
  )
  
.delete(
  "/:id",
  async ({ params }) => {
    try {
      const category = await ProductCategory.findById(params.id);

      if (!category) {
        return { message: "Category not found" };
      }

      // Toggle active status
      category.active = !category.active;

      // Update products based on the new category status
      await Product.updateMany(
        { category: params.id },
        { $set: { active: category.active } }
      );

      await category.save();

      return {
        message: `Category ${category.active ? "activated" : "deactivated"} successfully`,
        status: true,
      };
    } catch (error) {
      console.error(error);
      return {
        error,
      };
    }
  },
  {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: "Toggle category active status",
    },
  }
)

  
  .delete(
    "/activeStatus",
    async ({ query }) => {
      try {
        const { active, reason } = query;

        await ProductCategory.updateMany({ isDeleted: false }, { active });

        const config = await Config.findOne();

        if (config) {
          if (reason) {
            config.shopCloseReason = reason;
          } else {
            config.shopCloseReason = "";
          }

          await config.save();
        }

        return {
          message: `All categories ${
            active ? "enabled" : "disabled"
          } successfully`,
          status: true,
        };
      } catch (error) {
        console.error(error);
        return { error };
      }
    },
    {
      query: t.Object({
        active: t.Boolean(),
        reason: t.Optional(
          t.String({
            default: "",
          })
        ),
      }),
      detail: {
        summary: "Enable or disable all categories",
      },
    }
  )

  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const category = await ProductCategory.findById(params.id);
  
        if (!category) {
          return { message: "Category not found", status: false };
        }
  
        const { name, description, image, code } = body;
  
        if (image) {
          const { ok, filename } = await saveFile(image, "product-category");
          if (!ok) {
            return { message: "Failed to upload image", status: false };
          }
  
          if (category.image) {
            deleteFile(category.image);
          }
  
          category.image = filename;
        }
  
        await category.updateOne({
          name,
          description,
          code, // Add the code field
        });
  
        await category.save();
  
        return {
          message: "Category updated successfully",
          status: true,
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
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.String({
          default: "Category",
        }),
        description: t.String({
          default: "Category",
        }),
        image: t.Optional(t.File({})),
        code: t.String({
          default: "000",
        }),
      }),
      detail: {
        summary: "Update a category",
      },
    }
  )
  
  .delete(
    "/permanent/:id",
    async ({ params }) => {
      try {
        const category = await ProductCategory.findById(params.id);

        if (!category) {
          return { message: "Category not found" };
        }

        category.isDeleted = true;
        category.active=false;
        await category.save();

        return {
          message: "Category deleted successfully",
          status: true,
        };
      } catch (error) {
        console.error(error);
        return {
          error,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Delete a category permanently",
      },
    }
  );
