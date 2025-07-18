import Elysia, { t } from "elysia";
import { Manager } from "../../models/manager-model";

const managerController = new Elysia({
  prefix: "/manager",
  detail: {
    tags: ["Admin - Manager"],
  },
})
  .post(
    "/create",
    async ({ body }) => {
      try {
        const { email, password, username } = body;

        const existing = await Manager.findOne({ email });

        if (existing) {
          return { message: "Email already exists" };
        }

        const manager = await Manager.create({
          email,
          password,
          role: "manager",
          active: true,
          name: username,
        });

        await manager.save();

        return {
          message: "Manager Created Successfully",
          data: {
            email: manager.email,
          },
        };
      } catch (error) {
        console.error(error);
        return {
          error,
        };
      }
    },
    {
      body: t.Object({
        email: t.String({
          format: "email",
          default: "manager@kingschic.com",
        }),
        username: t.String({
          default: "Random Manager",
        }),
        password: t.String({
          default: "manager",
        }),
      }),
      detail: {
        summary: "Create a new manager",
      },
    }
  )
  .get(
    "/all",
    async ({ query }) => {
      try {
        const { page, limit, q } = query;
        let _limit = limit || 10;
        let _page = page || 1;

        const searchQuery: any = {
          isDeleted: false,
        };

        if (q) {
          searchQuery.name = { $regex: q, $options: "i" };
        }

        const users = await Manager.find(searchQuery)
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ createdAt: -1 })
          .select("name email createdAt status active")
          .exec();

        const totalUsers = await Manager.countDocuments(searchQuery);

        return {
          managers: users,
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
        q: t.String({
          default: "",
        }),
      }),
      detail: {
        summary: "Get all managers for admin panel",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      try {
        const { id } = params;

        const user = await Manager.findById(id, "-password");

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
        id: t.String({
          default: "",
        }),
      }),
      detail: {
        summary: "Get a manager by id",
      },
    }
  )
  .delete(
    "/:id",
    async ({ params, query }) => {
      try {
        const { id } = params;
        const { permanent } = query;

        const manager = await Manager.findById(id);

        if (!manager) {
          return { message: "Manager Not Found" };
        }

        if (permanent) {
          manager.active = false;
          manager.isDeleted = true;

          await manager.save();

          return {
            message: "Manager permanently deleted",
            status: true,
          };
        }

        manager.active = !manager.active;

        await manager.save();

        return {
          message: `Manager  ${
            manager.active ? "activated" : "deactivated"
          } successfully`,
          status: true,
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
        id: t.String({
          default: "",
        }),
      }),
      query: t.Object({
        permanent: t.Boolean({
          default: false,
        }),
      }),
      detail: {
        summary: "Delete a manager by id",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const { id } = params;
        const { username, password, email } = body;

        const manager = await Manager.findById(id);

        if (!manager) {
          return { message: "Manager Not Found", status: false };
        }

        manager.name = username || manager.name;
        manager.email = email || manager.email;
        manager.password = password || manager.password;

        await manager.save();

        return {
          message: "Manager Updated Successfully",
          status: true,
          data: manager,
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
        id: t.String({
          default: "",
        }),
      }),
      body: t.Object({
        username: t.String({
          default: "",
        }),
        email: t.String({
          default: "",
        }),
        password: t.String({
          default: "",
        }),
      }),
      detail: {
        summary: "Update a manager by id",
      },
    }
  );
export { managerController };
