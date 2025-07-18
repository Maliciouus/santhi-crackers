import { Banner } from "@/models/banner-model";
import Elysia, { t } from "elysia";

export const bannerController = new Elysia({
  prefix: "/banner",
  detail: {
    tags: ["User - Banner"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
}).get(
  "/all",
  async ({ query }) => {
    try {
      const { limit, page } = query;

      let _limit = limit || 10;
      let _page = page || 1;

      const banners = await Banner.find(
        {
          active: true,
        },
        "bannerImage bannerTitle bannerDescription"
      )
        .skip((_page - 1) * _limit)
        .limit(_limit)
        .sort({ createdAt: -1 })
        .exec();

      const totalBanners = await Banner.countDocuments({
        active: true,
      });

      return {
        banners,
        status: true,
        total: totalBanners,
        message: "Banners Fetched Successfully",
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
      summary: "Get all banners",
    },
  }
);
