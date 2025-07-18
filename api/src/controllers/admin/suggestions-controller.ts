import Elysia, { t } from "elysia";
import { deleteFile, saveFile } from "../../lib/file-s3";
import { Suggetions } from "../../models/suggetions";

export const suggetionsController = new Elysia({
  prefix: "/suggestion",
  detail: {
    tags: ["Admin - Suggetions"],
  },
})
  .post(
    "/create",
    async ({ body }) => {
      try {
        const { name, icon, active } = body;

        const existing = await Suggetions.findOne({
          $or: [{ name }],
        });

        if (existing) {
          return { message: "Suggetion already exists", status: false };
        }

        const { filename, ok } = await saveFile(icon, "suggetion-icons");

        if (!ok) {
          return { message: "Icon not uploaded", status: false };
        }

        const suggetions = await Suggetions.create({
          name,
          active,
          icon: filename,
        });

        await suggetions.save();

        return {
          message: "Suggetion Created Successfully",
          status: true,
          name: suggetions.name,
        };
      } catch (error) {
        console.error(error);
        return {
          status: false,
          error,
          message: "Something went wrong!",
        };
      }
    },
    {
      body: t.Object({
        name: t.String({
          examples: "Breakfast",
        }),
        icon: t.File({}),
        active: t.Boolean({
          default: true,
        }),
      }),
      detail: {
        summary: "Create a new Suggetion",
      },
    }
  )
  .get(
    "/all",
    async ({ query }) => {
      try {
        const { page, limit } = query;
        let _limit = limit || 10;
        let _page = page || 1;

        const suggetions = await Suggetions.find({
          isDeleted: false,
        })
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ createdAt: -1 })
          .select("name icon active createdAt")
          .exec();

        const totalsuggetions = await Suggetions.countDocuments({});

        return {
          suggetions: suggetions,
          message: "Suggetions Fetched Successfully",
          status: true,
          total: totalsuggetions,
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
        page: t.Number({
          default: 1,
        }),
        limit: t.Number({
          default: 10,
        }),
      }),
      detail: {
        summary: "Get all suggetions for admin panel",
      },
    }
  )
  .get(
    "/select",
    async ({ query }) => {
      try {
        const { page, limit, q } = query;
        let _limit = limit || 10;
        let _page = page || 1;

        const searchQuery: Partial<Record<string, unknown>> = {};

        if (q) {
          searchQuery.name = { $regex: q, $options: "i" };
        }

        const suggetions = await Suggetions.find(searchQuery)
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ name: 1 })
          .select("name icon")
          .exec();

        const totalsuggetions = await Suggetions.countDocuments({});

        return {
          suggetions,
          status: true,
          total: totalsuggetions,
        };
      } catch (error) {
        return {
          error,
          status: "error",
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
        q: t.Optional(
          t.String({
            default: "",
          })
        ),
      }),
      detail: {
        summary:
          "Get all suggetions (like suggetions food) in admin panel dropdown",
      },
    }
  )
  .delete(
    "/:id",
    async ({ params, query }) => {
      try {
        const { id } = params;
        const { permanent } = query;
        const suggetion = await Suggetions.findById(id);

        if (!suggetion) {
          throw new Error("Suggetion not found");
        }

        if (permanent) {
          suggetion.active = false;
          suggetion.isDeleted = true;
          await suggetion.save();

          return {
            status: true,
            message: "Suggetion permanently deleted",
          };
        }
        suggetion.active = !suggetion.active;
        await suggetion.save();

        return {
          status: true,
          message: `Suggetion ${
            suggetion.active ? "activated" : "deactivated"
          } successfully`,
        };
      } catch (error) {
        console.error(error);
        return {
          error,
          status: false,
          message: "Something went wrong!",
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
        summary: "Delete a suggetion permanently",
      },
    }
  );
