import { Dipping } from "@/models/dippings-model";
import Elysia, { t } from "elysia";

export const dippingsController = new Elysia({
  prefix: "/dippings",
  detail: {
    tags: ["User - Dippings"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
}).get(
  "/",
  async ({ query }) => {
    try {
      const { page, limit, q } = query;
      const _limit = limit || 10;
      const _page = page || 1;

      const searchQuery: Partial<Record<string, unknown>> = {};

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
        dippings,
        status: true,
        total: totalDippings,
        message: "Dippings Fetched Successfully",
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
      page: t.Optional(t.Number({ default: 1 })),
      limit: t.Optional(t.Number({ default: 10 })),
      q: t.Optional(t.String({})),
    }),
  }
);
