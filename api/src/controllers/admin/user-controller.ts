import { User } from "@/models/user-model";
import { OrderModel } from "@/models/user/order-model";
import Elysia, { t } from "elysia";

const usersControllerAdmin = new Elysia({
  prefix: "/users",
  detail: {
    tags: ["Admin - Users"],
  },
})
  .get(
    "/all",
    async ({ query }) => {
      try {
        const { page, limit, q } = query;
        let _limit = limit || 10;
        let _page = page || 1;

        const searchQuery: any = {
          active: true,
        };

        if (q) {
          searchQuery.username = { $regex: q, $options: "i" };
        }

        const users = await User.find(searchQuery)
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ createdAt: -1 })
          .select("username email mobile active createdAt fcmToken")
          .exec();

        const totalUsers = await User.countDocuments({
          active: true,
        });

        return {
          users,
          status: "success",
          total: totalUsers,
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
        q: t.Optional(
          t.String({
            default: "",
          })
        ),
      }),
      detail: {
        summary: "Get all users for admin panel",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      try {
        const { id } = params;

        const user = await User.findById(id, "-password");

        if (!user) {
          return { message: "User not found" };
        }

        return {
          user,
          status: "success",
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
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Get a user by id",
      },
    }
  )
  .get(
    "/orderhistory",
    async ({ set, query }) => {
      const { page, limit } = query;

      let _limit = limit || 10;
      let _page = page || 1;

      try {
        const { userId } = query;
        const orders = await OrderModel.find({ user: userId }, "-products")
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ createdAt: -1 })
          .populate("user")
          .lean()
          .exec();

        const total = await OrderModel.countDocuments({ user: userId });

        return {
          message: "Order Fetched Successfully",
          status: true,
          orders,
          total,
        };
      } catch (error) {
        set.status = 500;
        return {
          message: "Failed to fetch order",
          status: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      query: t.Object({
        userId: t.String({}),
        page: t.Number({
          default: 1,
        }),
        limit: t.Number({
          default: 10,
        }),
      }),
      detail: {
        summary: "Get order history",
        description: "Get the order history of the authenticated user",
      },
    }
  );

export { usersControllerAdmin };
