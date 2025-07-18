import Elysia, { t } from "elysia";
import { Manager } from "../../models/manager-model";
import { Employee } from "@/models/emp/employee-model";

const employeeController = new Elysia({
  prefix: "/employee",
  detail: {
    tags: ["Admin - Employee"],
  },
})
  .post(
    "/create",
    async ({ body }) => {
      try {
        const { email, password, username } = body;

        const existing = await Employee.findOne({ email });

        if (existing) {
          return { message: "Email already exists" };
        }

        const employee = await Employee.create({
          email,
          password,
          role: "employee",
          active: true,
          name: username,
        });

        await employee.save();

        return {
          message: "Employee Created Successfully",
          data: {
            email: employee.email,
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
          default: "employee@gmail.com",
        }),
        username: t.String({
          default: "Random Employee",
        }),
        password: t.String({
          default: "Employee",
        }),
      }),
      detail: {
        summary: "Create a new employee",
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

        const users = await Employee.find(searchQuery)
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ createdAt: -1 })
          .select("name email createdAt status active")
          .exec();

        const totalUsers = await Employee.countDocuments(searchQuery);

        return {
          employees: users,
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
        summary: "Get all employees for admin panel",
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
          return { message: "Employee not found" };
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
        summary: "Get a employee by id",
      },
    }
  )
  .delete(
    "/:id",
    async ({ params, query }) => {
      try {
        const { id } = params;
        const { permanent } = query;

        const manager = await Employee.findById(id);

        if (!manager) {
          return { message: "Employee Not Found" };
        }

        if (permanent) {
          manager.active = false;
          manager.isDeleted = true;

          await manager.save();

          return {
            message: "Employee permanently deleted",
            status: true,
          };
        }

        manager.active = !manager.active;

        await manager.save();

        return {
          message: `Employee  ${
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

        const employee = await Employee.findById(id);

        if (!employee) {
          return { message: "Employee Not Found", status: false };
        }

        employee.name = username || employee.name;
        employee.email = email || employee.email;
        employee.password = password || employee.password;

        await employee.save();

        return {
          message: "Employee Updated Successfully",
          status: true,
          data: employee,
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
export { employeeController };
