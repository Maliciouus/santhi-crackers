import Elysia, { t } from "elysia";
import { UnitModel } from "@/models/unit-model";

export const unitController = new Elysia({
  prefix: "/unit",
  detail: {
    tags: ["Admin - Unit"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
})
  .post(
    "/create",
    async ({ body }) => {
      try {
        const unit = await UnitModel.create({ name: body.name });
        return {
          message: "Unit created successfully",
          status: true,
          data: unit,
        };
      } catch (error) {
        console.error(error);
        return {
          message: "Failed to create unit",
          status: false,
          error,
        };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
      }),
      detail: { summary: "Create a unit" },
    }
  )

  // Get All Units with Pagination
  .get(
    "/all",
    async ({ query }) => {
      try {
        const { page = 1, limit = 10 } = query;
        const units = await UnitModel.find()
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ createdAt: -1 });

        const total = await UnitModel.countDocuments();

        return {
          status: true,
          data: units,
          total,
        };
      } catch (error) {
        console.error(error,"wdjiwhid");
        return {
          status: false,
          error,
        };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ default: 1 })),
        limit: t.Optional(t.Number({ default: 10 })),
      }),
      detail: { summary: "Get all units with pagination" },
    }
  )

  // Update Unit
  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const updated = await UnitModel.findByIdAndUpdate(
          params.id,
          { name: body.name },
          { new: true }
        );

        if (!updated) {
          return { status: false, message: "Unit not found" };
        }

        return {
          status: true,
          message: "Unit updated successfully",
          data: updated,
        };
      } catch (error) {
        return {
          status: false,
          error,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.String({ minLength: 1 }),
      }),
      detail: { summary: "Update a unit" },
    }
  )

  .delete(
    "/:id",
    async ({ params }) => {
      try {
        const updated = await UnitModel.findByIdAndUpdate(
          params.id,
          { isDeleted: true, isActive: false },
          { new: true }
        );

        if (!updated) {
          return { status: false, message: "Unit not found" };
        }

        return {
          status: true,
          message: "Unit deleted successfully (soft delete)",
        };
      } catch (error) {
        return {
          status: false,
          error,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: { summary: "Soft delete a unit" },
    }
  )

  // Toggle isActive status
  .put(
    "/toggle/:id",
    async ({ params }) => {
      try {
        const unit = await UnitModel.findById(params.id);
        if (!unit || unit.isDeleted) {
          return { status: false, message: "Unit not found or already deleted" };
        }

        unit.isActive = !unit.isActive;
        await unit.save();

        return {
          status: true,
          message: `Unit is now ${unit.isActive ? "active" : "inactive"}`,
          data: unit,
        };
      } catch (error) {
        return {
          status: false,
          error,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: { summary: "Toggle unit active status" },
    }
  )
