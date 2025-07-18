import { Banner } from "@/models/banner-model";
import { Brand } from "@/models/brand-model";
import Elysia, { t } from "elysia";

export const brandController = new Elysia({
  prefix: "/brand",
  detail: {
    tags: ["User - Brand"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
})
.get(
  "/all",
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
);
