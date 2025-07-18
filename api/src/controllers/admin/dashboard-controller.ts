import { User } from "@/models/user-model";
import { OrderModel } from "@/models/user/order-model";
import dayjs from "dayjs";
import Elysia, { t } from "elysia";

export const dashboardController = new Elysia({
  prefix: "/dashboard",
  detail: {
    tags: ["Admin - Dashboard"],
  },
})
  .get(
    "/",
    async () => {
      const todayStart = dayjs().startOf("day").toDate();
      const todayEnd = dayjs().endOf("day").toDate();
      const lastMonthStart = dayjs()
        .subtract(1, "month")
        .startOf("month")
        .toDate();
      const lastMonthEnd = dayjs().subtract(1, "month").endOf("month").toDate();

      const totalOrders = await OrderModel.countDocuments();

      const todayOrders = await OrderModel.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd },
      });

      const newCustomers = await User.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd },
      });

      const orders = await OrderModel.aggregate([
        {
          $group: {
            _id: null,
            avgOrderValue: { $avg: "$totalPrice" },
          },
        },
      ]);

      const avgOrderValue = orders[0]?.avgOrderValue || 0;

      return {
        message: "Dashboard fetched successfully",
        status: true,
        data: {
          totalOrders,
          todayOrders,
          newCustomers,
          avgOrderValue: avgOrderValue.toFixed(2),
        },
      };
    },
    {
      detail: {
        description: "Get Dashboard Stats",
        summary: "Get Dashboard Stats",
      },
    }
  )
  .get(
    "/orderhistory",
    async () => {
      const todayEnd = dayjs().endOf("day").toDate();

      const thisMonthStart = dayjs().startOf("month").toDate();

      const orders = await OrderModel.find()
        .sort({
          createdAt: -1,
        })
        .populate("user")
        .limit(5);

      const thisMonthOrders = await OrderModel.countDocuments({
        createdAt: { $gte: thisMonthStart, $lte: todayEnd },
      });

      return {
        message: "Dashboard fetched successfully",
        status: true,
        orders,
        thisMonthOrders,
      };
    },
    {
      detail: {
        description: "Get Dashboard Stats with Order Trends",
        summary: "Get Dashboard Stats with Order Trends",
      },
    }
  )
  .get(
    "/top-sellers",
    async () => {
      const topSellers = await OrderModel.aggregate([
        {
          $group: {
            _id: "$user",
            totalPrice: { $sum: "$totalPrice" },
          },
        },
        { $sort: { totalPrice: -1 } },
        { $limit: 5 },
      ]);

      return {
        message: "Top Sellers fetched successfully",
        data: topSellers,
        status: true,
      };
    },
    {
      detail: {
        description: "Get Top Sellers",
        summary: "Get Top Sellers",
      },
    }
  )
  .get(
    "/overviewchart",
    async ({ set, query }) => {
      const filter = query.filter || "month";
      const year = +query.year || dayjs().year();
      const month = +query.month || dayjs().month() + 1;
      const day = +query.day || 1;

      try {
        if (filter === "day") {
          const startDate = dayjs(`${year}-${month}-${day}`)
            .startOf("day")
            .toDate();
          const endDate = dayjs(`${year}-${month}-${day}`)
            .endOf("day")
            .toDate();

          const count = await OrderModel.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
          });

          return [count];
        } else if (filter === "week") {
          const weeks = Array.from({ length: 4 }, (_, i) => {
            const startDate = dayjs(`${year}-${month}`)
              .startOf("month")
              .add(i * 7, "day")
              .toDate();
            const endDate = dayjs(startDate).add(6, "day").toDate();

            return OrderModel.countDocuments({
              createdAt: { $gte: startDate, $lte: endDate },
            });
          });

          return Promise.all(weeks);
        } else if (filter === "month") {
          const daysInMonth = dayjs(`${year}-${month}`).daysInMonth();
          const dailyOrders = Array.from({ length: daysInMonth }, (_, i) => {
            const startDate = dayjs(`${year}-${month}-${i + 1}`)
              .startOf("day")
              .toDate();
            const endDate = dayjs(startDate).endOf("day").toDate();

            return OrderModel.countDocuments({
              createdAt: { $gte: startDate, $lte: endDate },
            });
          });

          return Promise.all(dailyOrders);
        } else if (filter === "year") {
          const monthlyOrders = Array.from({ length: 12 }, (_, i) => {
            const startDate = dayjs(`${year}-${i + 1}-01`)
              .startOf("month")
              .toDate();
            const endDate = dayjs(startDate).endOf("month").toDate();

            return OrderModel.countDocuments({
              createdAt: { $gte: startDate, $lte: endDate },
            });
          });

          return Promise.all(monthlyOrders);
        }
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    {
      detail: {
        description: "Get Overview Chart",
        summary: "Get Overview Chart",
      },
      query: t.Object({
        month: t.String(),
        year: t.String(),
        filter: t.String(),
        day: t.String(),
      }),
    }
  );
