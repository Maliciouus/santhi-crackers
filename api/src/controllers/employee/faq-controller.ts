import { Faqs } from "@/models/faqs-model";
import Elysia, { t } from "elysia";

export const userfaqsController = new Elysia({
  prefix: "/faqs",
  detail: {
    tags: ["User - Faqs"],
  },
}).get(
  "/all",
  async ({ query }) => {
    try {
      const { page, limit } = query;
      let _limit = limit || 10;
      let _page = page || 1;

      const faqs = await Faqs.find({
        isActive: true,
      })
        .skip((_page - 1) * _limit)
        .limit(_limit)
        .sort({ createdAt: -1 })
        .select("question answer")
        .exec();

      const totalFaqs = await Faqs.countDocuments({
        isActive: true,
      });

      return {
        faqs,
        status: true,
        total: totalFaqs,
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
      summary: "Get all FAQS for admin panel",
    },
  }
);
