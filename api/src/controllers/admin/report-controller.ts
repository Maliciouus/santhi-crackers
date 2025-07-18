import Elysia, { t } from "elysia";
// import XLSX from "xlsx";

export const reportController = new Elysia({
  prefix: "/report",
  detail: {
    tags: ["Admin - Report"],
  },
}).post(
  "/orderexport",
  async ({ query, set }) => {
    try {
      // const { q, status } = query;
      // const matchStage: Record<string, unknown> = {};
      // if (q) {
      //   matchStage["$or"] = [
      //     { orderId: { $regex: q, $options: "i" } },
      //     { "userData.username": { $regex: q, $options: "i" } },
      //     { "userData.mobile": { $regex: q, $options: "i" } },
      //   ];
      // }
      // if (status) {
      //   matchStage["status"] = status;
      // }
      // const aggregatePipeline = [
      //   {
      //     $lookup: {
      //       from: "users",
      //       localField: "user",
      //       foreignField: "_id",
      //       as: "userData",
      //     },
      //   },
      //   { $unwind: "$userData" },
      //   { $match: matchStage },
      //   { $sort: { createdAt: -1 } },
      // ];
      // const ordersPipeline: any = [
      //   ...aggregatePipeline,
      //   { $project: { products: 0 } },
      // ];
      // const countPipeline: any = [...aggregatePipeline, { $count: "total" }];
      // const [orders, totalCountResult] = await Promise.all([
      //   OrderModel.aggregate(ordersPipeline),
      //   OrderModel.aggregate(countPipeline),
      // ]);
      // const formattedOrders = orders.map((order) => ({
      //   OrderID: order.orderId,
      //   Username: order.userData.username,
      //   Mobile: order.userData.mobile,
      //   Status: order.status,
      //   CreatedAt: order.createdAt,
      // }));
      // const workbook = XLSX.utils.book_new();
      // const worksheet = XLSX.utils.json_to_sheet(formattedOrders);
      // XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
      // const filePath = `report.xlsx`;
      // XLSX.writeFile(workbook, filePath);
      // const file = Bun.file(filePath);
      // const buffer = await file.arrayBuffer();
      // const blob = new Blob([buffer], {
      //   type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // });
      // set.headers["Content-Type"] =
      //   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      // set.headers["Content-Disposition"] = `attachment; filename=report.xlsx`;
      // return blob;
    } catch (error) {
      console.error(error);
      return {
        error,
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
      status: t.String({
        default: "",
      }),
    }),
    detail: {
      summary: "Export all orders to CSV",
    },
  },
);
