import Elysia, { t } from "elysia";

import { Dipping } from "../../models/dippings-model";
import { Brand } from "@/models/brand-model";
import { deleteFile, saveFile } from "@/lib/file";

export const brandsController = new Elysia({
  prefix: "/brands",
  detail: {
    tags: ["Admin - Brand"],
  },
})
  .post(
    "/create",
    async ({ body }) => {
      try {
        const { name, image } = body;

        const existing = await Brand.findOne({
          $or: [{ name }],
        });

        if (existing) {
          return { message: "Brand already exists", status: false };
        }

        const { ok, filename } = await saveFile(image, "brand");

        if (!ok) {
          return { message: "Failed to upload image", status: false };
        }

        const brand = await Brand.create({
          name,
          image: filename,
          active: true,
        });

        await brand.save();

        return {
          message: "Brand Created Successfully",
          status: true,
          data: brand,
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
      body: t.Object({
        name: t.String({
          default: "Brand",
        }),
        image: t.File({}),
      }),
    }
  )
  .get(
    "/all",
    async ({ query }) => {
      try {
        const { page, limit, q } = query;
        const _limit = limit || 10;
        const _page = page || 1;

        const searchQuery: Partial<Record<string, unknown>> = {
          isDeleted: false,
        };

        if (q) {
          searchQuery.name = { $regex: q, $options: "i" };
        }

        const brands = await Brand.find(searchQuery)
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ createdAt: -1 })
          .select("name price image active createdAt")
          .exec();

        const totalBrands = await Brand.countDocuments(searchQuery);

        return {
          message: "Brands Fetched Successfully",
          brands: brands,
          status: true,
          total: totalBrands,
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
      query: t.Object({
        page: t.Optional(t.Number({ default: 1 })),
        limit: t.Optional(t.Number({ default: 10 })),
        q: t.Optional(t.String({})),
      }),
    }
  )
  .get(
    "/get/:id",
    async ({ params }) => {
      try {
        const { id } = params;
        const dipping = await Brand.findById(id);
        return {
          message: "Brand Fetched Successfully",
          data: dipping,
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
      detail: {
        summary: "Get a Brand by id",
      },
    }
  )
  .put(
    "/:id",
    async ({ body, params }) => {
      try {
        const { id } = params;
        const { name, image } = body;

        const brand = await Brand.findById(id);

        if (!brand) {
          return { message: "Brand not found", status: false };
        }

        if (image) {
          const { ok, filename } = await saveFile(image, "brand");
          if (!ok) {
            return { message: "Failed to upload image", status: false };
          }
          deleteFile(brand.image);
          brand.image = filename;
        }

        await brand.updateOne(
          {
            name,
          },
          { new: true }
        );
        await brand.save();
        return {
          message: "Brand Updated Successfully",
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
      body: t.Object({
        name: t.String({
          default: "Brand",
        }),
        image: t.Optional(t.File({})),
      }),
      detail: {
        summary: "Update a Brand by id",
      },
    }
  )
  .delete(
    "/:id",
    async ({ params, query }) => {
      try {
        const { id } = params;
        const brand = await Brand.findById(id);
        const { permanent } = query;
        if (!brand) {
          return { message: "Brand not found", status: false };
        }

        if (!brand) {
          return { message: "Brand not found" };
        }

        if (permanent) {
          brand.active = false;
          brand.isDeleted = true;

          await brand.save();
          return {
            message: "Brand permanently deleted",
            status: true,
          };
        }
        brand.active = !brand.active;

        await brand.save();

        return {
          message: `Brand ${
            brand.active ? "activated" : "deactivated"
          } successfully`,
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
      query: t.Object({
        permanent: t.Boolean({
          default: false,
        }),
      }),
      detail: {
        summary: "Delete a Brand by id",
      },
    }
  )
  .get(
    "/select",
    async () => {
      try {
        const brand = await Brand.find({
          active: true,
        })
          .select("name image _id")
          .exec();

        return {
          message: "Brands Fetched Successfully",
          brand,
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
      detail: {
        summary: "Get all brands for admin panel dropdown",
      },
    }
  )
  .delete(
    "/permanent/:id",
    async ({ params }) => {
      try {
        const { id } = params;

        const brand = await Brand.findById(id);

        if (!brand) {
          throw new Error("Brand not found");
        }
        if (brand.image) deleteFile(brand.image);

        await brand.deleteOne();

        return {
          status: true,
          message: "Brand deleted successfully",
        };
      } catch (error) {}
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Delete a Brand permanently",
      },
    }
  );
