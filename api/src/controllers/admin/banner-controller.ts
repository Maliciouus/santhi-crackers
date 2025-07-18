import Elysia, { t } from "elysia";
import { Banner } from "../../models/banner-model";
import { deleteFile, saveFile } from "@/lib/file";

export const bannerController = new Elysia({
  prefix: "/banner",
  detail: {
    tags: ["Admin - Banner"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
})
  .post(
    "/create",
    async ({ body }) => {
      try {
        const { bannerDescription, bannerImage, bannerTitle } = body;

        const { ok, filename } = await saveFile(bannerImage, "banner");

        if (!ok) {
          return { message: "Failed to upload image", status: false };
        }

        const banner = await Banner.create({
          bannerImage: filename,
          bannerTitle,
          bannerDescription,
          active: true,
        });

        await banner.save();

        return {
          message: "Banner Created Successfully",
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
      detail: {
        summary: "Create a new banner from admin",
      },
      body: t.Object({
        bannerImage: t.File({
          required: true,
        }),
        bannerTitle: t.String({
          minLength: 3,
        }),
        bannerDescription: t.String({
          minLength: 3,
        }),

        active: t.Boolean({
          default: true,
        }),
      }),
    }
  )
  .get(
    "/all",
    async ({ query }) => {
      try {
        const { page, limit } = query;
        let _limit = limit || 10;
        let _page = page || 1;

        const banners = await Banner.find({
          active: true,
        })
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ createdAt: -1 })
          .select("bannerTitle bannerDescription bannerImage active")
          .exec();

        const totalBanners = await Banner.countDocuments({
          active: true,
        });

        return {
          banners: banners,
          status: true,
          total: totalBanners,
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
        page: t.Number({
          default: 1,
        }),
        limit: t.Number({
          default: 10,
        }),
      }),
      detail: {
        summary: "Get all Banner for admin panel",
      },
    }
  )
  .put(
    "/:id",
    async ({ body, params }) => {
      try {
        const { id } = params;
        const { bannerDescription, bannerImage, bannerTitle } = body;

        const banner = await Banner.findById(id);

        if (!banner) {
          return {
            message: "Banner not found",
            status: false,
          };
        }

        if (bannerImage) {
          const { ok, filename } = await saveFile(bannerImage, "banner");
          if (!ok) {
            return { message: "Failed to upload image", status: false };
          }
          deleteFile(banner.bannerImage);
          banner.bannerImage = filename;
        }

        banner.bannerTitle = bannerTitle || banner.bannerTitle;
        banner.bannerDescription =
          bannerDescription || banner.bannerDescription;

        await banner.save();

        return {
          message: "Banner Updated Successfully",
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
        id: t.String({
          examples: ["Object Id"],
        }),
      }),
      body: t.Object({
        bannerImage: t.Optional(t.File()),
        bannerTitle: t.Optional(
          t.String({
            minLength: 3,
          })
        ),
        bannerDescription: t.Optional(
          t.String({
            minLength: 3,
          })
        ),
        active: t.Optional(
          t.Boolean({
            default: true,
          })
        ),
      }),
      detail: {
        summary: "Update a banner by id",
      },
    }
  )

  .delete(
    "/:id",
    async ({ params }) => {
      try {
        const { id } = params;

        const banner = await Banner.findById(id);

        if (!banner) {
          return { message: "Banner not found", status: false };
        }

        if (banner.bannerImage) deleteFile(banner.bannerImage);

        await Banner.findOneAndDelete({ _id: id });

        return {
          message: "Banner Deleted Successfully",
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
        id: t.String({
          examples: ["Object Id"],
        }),
      }),
      detail: {
        summary: "Delete a banner by id",
      },
    }
  )
  .delete(
    "/permanent/:id",
    async ({ params }) => {
      try {
        const { id } = params;

        const banner = await Banner.findById(id);

        if (!banner) {
          throw new Error("Banner not found");
        }
        if (banner.bannerImage) deleteFile(banner.bannerImage);

        await banner.deleteOne();

        return {
          status: true,
          message: "Banner deleted successfully",
        };
      } catch (error) {}
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Delete a banner permanently",
      },
    }
  );
