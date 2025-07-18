import Elysia, { t } from "elysia";
import { deleteFile, saveFile } from "../../lib/file-s3";
import { Dipping } from "../../models/dippings-model";

export const dippingsController = new Elysia({
  prefix: "/dippings",
  detail: {
    tags: ["Admin - Dipping"],
  },
})
  .post(
    "/create",
    async ({ body }) => {
      try {
        const { name, image, price } = body;

        const existing = await Dipping.findOne({
          $or: [{ name }],
        });

        if (existing) {
          return { message: "Dipping already exists", status: false };
        }

        const { ok, filename } = await saveFile(image, "dipping");

        if (!ok) {
          return { message: "Failed to upload image", status: false };
        }

        const dipping = await Dipping.create({
          name,
          image: filename,
          price,
          active: true,
        });

        await dipping.save();

        return {
          message: "Dipping Created Successfully",
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
      body: t.Object({
        name: t.String({
          default: "Dipping",
        }),
        image: t.File({}),
        price: t.String({
          default: "0",
        }),
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

        const dippings = await Dipping.find(searchQuery)
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ createdAt: -1 })
          .select("name price image active createdAt")
          .exec();

        const totalDippings = await Dipping.countDocuments(searchQuery);

        return {
          message: "Dippings Fetched Successfully",
          dippings: dippings,
          status: true,
          total: totalDippings,
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
        const dipping = await Dipping.findById(id);
        return {
          message: "Dipping Fetched Successfully",
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
        summary: "Get a Dipping by id",
      },
    }
  )
  .put(
    "/:id",
    async ({ body, params }) => {
      try {
        const { id } = params;
        const { name, image, price } = body;

        const dipping = await Dipping.findById(id);

        if (!dipping) {
          return { message: "Dipping not found", status: false };
        }

        if (image) {
          const { ok, filename } = await saveFile(image, "dipping");
          if (!ok) {
            return { message: "Failed to upload image", status: false };
          }
          deleteFile(dipping.image);
          dipping.image = filename;
        }

        await dipping.updateOne(
          {
            name,
            price,
          },
          { new: true }
        );
        await dipping.save();
        return {
          message: "Dipping Updated Successfully",
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
          default: "Dipping",
        }),
        image: t.Optional(t.File({})),
        price: t.String({
          default: "0",
        }),
      }),
      detail: {
        summary: "Update a Dipping by id",
      },
    }
  )
  .delete(
    "/:id",
    async ({ params, query }) => {
      try {
        const { id } = params;
        const dipping = await Dipping.findById(id);
        const { permanent } = query;
        if (!dipping) {
          return { message: "Dipping not found", status: false };
        }

        if (!dipping) {
          return { message: "Dipping not found" };
        }

        if (permanent) {
          dipping.active = false;
          dipping.isDeleted = true;

          await dipping.save();
          return {
            message: "Category permanently deleted",
            status: true,
          };
        }
        dipping.active = !dipping.active;

        await dipping.save();

        return {
          message: `Dipping ${
            dipping.active ? "activated" : "deactivated"
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
        summary: "Delete a Dipping by id",
      },
    }
  )
  .get(
    "/select",
    async () => {
      try {
        const dippings = await Dipping.find({
          active: true,
        })
          .select("name price _id")
          .exec();

        return {
          message: "Dippings Fetched Successfully",
          dippings,
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
        summary: "Get all dippings for admin panel dropdown",
      },
    }
  )
  .delete(
    "/permanent/:id",
    async ({ params }) => {
      try {
        const { id } = params;

        const dipping = await Dipping.findById(id);

        if (!dipping) {
          throw new Error("Dipping not found");
        }
        if (dipping.image) deleteFile(dipping.image);

        await dipping.deleteOne();

        return {
          status: true,
          message: "Dipping deleted successfully",
        };
      } catch (error) {}
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Delete a dipping permanently",
      },
    }
  );
