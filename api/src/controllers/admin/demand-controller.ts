import { saveFile } from "@/lib/file";
import { DemandProduct } from "@/models/user/demand-model";
import Elysia, { t } from "elysia";

export const demandController = new Elysia({
  prefix: "/demand",
  detail: {
    tags: ["Admin - Demand"],
    security: [{ bearerAuth: [] }],
  },
})
.get(
  "/",
  async ({ query, set }) => {
    try {
      const { page, limit, q } = query;
      const _limit = limit || 10;
      const _page = page || 1;

      const matchStage: Record<string, unknown> = {};

      // Add search functionality
      if (q) {
        matchStage["$or"] = [
          { productName: { $regex: q, $options: "i" } },
          { brandName: { $regex: q, $options: "i" } },
          { message: { $regex: q, $options: "i" } },
          { "userId.username": { $regex: q, $options: "i" } },
          { "userId.mobile": { $regex: q, $options: "i" } },
        ];
      }

      const aggregatePipeline = [
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userId",
          },
        },
        { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
      ];

      const demandsPipeline: any = [
        ...aggregatePipeline,
        { $skip: (_page - 1) * _limit },
        { $limit: _limit },
      ];

      const countPipeline: any = [...aggregatePipeline, { $count: "total" }];

      const [demands, totalCountResult] = await Promise.all([
        DemandProduct.aggregate(demandsPipeline),
        DemandProduct.aggregate(countPipeline),
      ]);

      const totalDemands = totalCountResult[0]?.total || 0;

      return {
        status: true,
        data: demands,
        total: totalDemands,
      };
    } catch (error: any) {
      console.error("Error fetching demands:", error);
      set.status = 500;
      return {
        status: false,
        message: "Failed to fetch demand requests",
        error: error.message,
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
      q: t.String({
        default: "",
      }),
    }),
    detail: {
      summary: "Get all demand requests with pagination and search",
    },
  }
);