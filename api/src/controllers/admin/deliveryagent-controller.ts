import Elysia, { t } from "elysia";
import { DeliveryAgent } from "../../models/delivery-agent";

export const deliveryAgentController = new Elysia({
  prefix: "/deliveryagent",
  detail: {
    tags: ["Admin - Delivery Agent"],
  },
})
  .post(
    "/create",
    async ({ body }) => {
      try {
        const existing = await DeliveryAgent.findOne({
          $or: [{ phone: body.phone }],
        });

        if (existing) {
          return { message: "Delivery Agent already exists", status: false };
        }

        const agent = await DeliveryAgent.create(body);
        return {
          message: "Delivery Agent created successfully",
          data: agent,
          status: true,
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
      body: t.Object({
        name: t.String(),
        phone: t.String(),
        password: t.String(),
        employeeId: t.String(),
        active: t.Boolean({
          default: true,
        }),
      }),
      detail: {
        summary: "Create a delivery agent",
      },
    }
  )
  .get(
    "/all",
    async ({ query }) => {
      try {
        const { page, limit, q } = query;
        const _limit = limit || 10;
        const _page = page || 1;

        const agents = await DeliveryAgent.find({
          isDeleted: false,
          $or: [{ name: { $regex: q, $options: "i" } }],
        })
          .limit(_limit)
          .skip((_page - 1) * _limit)
          .exec();

        const totalAgents = await DeliveryAgent.countDocuments({
          isDeleted: false,
          $or: [{ name: { $regex: q, $options: "i" } }],
        });

        return {
          agents,
          status: "success",
          total: totalAgents,
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
        page: t.Number(),
        limit: t.Number(),
        q: t.String(),
      }),
      detail: {
        summary: "Get all delivery agents for admin panel dropdown",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      try {
        const { id } = params;
        const agent = await DeliveryAgent.findById(id);
        return {
          message: "Delivery Agent Fetched Successfully",
          data: agent,
          status: true,
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
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Get delivery agent by id",
      },
    }
  )
  .delete(
    "/:id",
    async ({ params, query }) => {
      try {
        const { id } = params;
        const { permanent } = query;
        const agent = await DeliveryAgent.findById(id);

        if (!agent) {
          return { message: "Delivery Agent not found", status: false };
        }

        if (permanent) {
          agent.active = false;
          agent.isDeleted = true;

          await agent.save();

          return {
            message: "Delivery Agent permanently deleted",
            status: true,
          };
        }

        agent.active = !agent.active;

        await agent.save();

        return {
          message: `Delivery Agent ${
            agent.active ? "activated" : "deactivated"
          } successfully`,
          status: true,
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
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        permanent: t.Boolean({
          default: false,
        }),
      }),
      detail: {
        summary: "Delete delivery agent by id",
      },
    }
  )
  .get(
    "/select",
    async ({}) => {
      try {
        const agents = await DeliveryAgent.find({
          isDeleted: false,
          active: true,
        })

          .select("name phone")
          .exec();
        return {
          agents,
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
      detail: {
        summary: "Get all delivery agents for admin panel dropdown",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const { id } = params;
        const { name, phone, employeeId, password } = body;
        const agent = await DeliveryAgent.findById(id);
        if (!agent) {
          return { message: "Delivery Agent not found", status: false };
        }

        agent.name = name || agent.name;
        agent.phone = phone?.toString() || agent.phone;
        agent.employeeId = employeeId || agent.employeeId;
        agent.password = password || agent.password;
        await agent.save();

        return {
          message: "Delivery Agent updated successfully",
          data: agent,
          status: true,
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
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        employeeId: t.Optional(t.String()),
        password: t.Optional(t.String()),
      }),
      detail: {
        summary: "Update delivery agent by id",
      },
    }
  );
