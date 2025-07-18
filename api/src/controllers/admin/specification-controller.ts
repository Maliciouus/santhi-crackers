import Elysia, { t } from "elysia";
import { SpecificationModel } from "@/models/specification-model";

export const specificationController = new Elysia({
  prefix: "/specification",
  detail: {
    tags: ["Admin - Timings"],
  },
})
.post(
  "/addspec",
  async ({ set, body }) => {
    try {
      const { name, fields } = body;
      const specification = await SpecificationModel.findOne({ name });

      if (specification) {
        set.status = 404;
        return {
          message: "Specification category already exists",
          ok: false,
        };
      }
      else{
        const newSpecification = new SpecificationModel({
          name,
          fields
        });
  
        await newSpecification.save();
  
        set.status = 200;
        return {
          message: "Specification created successfully",
          ok: true,
        };
      }
      
    } catch (error:any) {
      set.status = 400;
      console.error("Error creating specification:", error);
      return {
        ok: false,
        message: error.message,
      };
    }
  },
  {
    body: t.Object({
     name: t.String(),
      fields: t.Array(t.String()), 
    }),
    detail: {
      tags: ["Specifications"],
      description: "Define a new specification category with a list of fields",
    },
  }
)
.patch(
  "/update/:id",
  async ({ set, body,params }) => {
    try {
      const categoryId = params.id;
      const {  name, fields } = body;

      const updatedSpecification = await SpecificationModel.findByIdAndUpdate(
        categoryId,
        { category: name, fields },
        { new: true }
      );

      if (!updatedSpecification) {
        set.status = 404;
        return {
          message: "Specification not found",
          ok: false,
        };
      }

      set.status = 200;
      return {
        message: "Specification updated successfully",
        ok: true,
        data: updatedSpecification
      };
    } catch (error: any) {
      set.status = 400;
      console.error("Error updating Specification:", error);
      return {
        ok: false,
        message: error.message,
      };
    }
  },
  {
    body: t.Object({
      name: t.String(),
      fields: t.Array(t.String()),
    }),
    detail: {
      tags: ["Specifications"],
      description: "Update the name and fields of a specification",
    },
  }
)

.get(
  "/all",
  async ({ query }) => {
    try {
      const { page, limit } = query;
      const _limit = limit || 10;
      const _page = page || 1;

      const specifications = await SpecificationModel.find({
        isDeleted: { $ne: true } // Exclude soft-deleted records
      })
        .skip((_page - 1) * _limit)
        .limit(_limit)
        .sort({ createdAt: -1 }) // Sort by newest first
        .exec();

      const totalSpecifications = await SpecificationModel.countDocuments({
        isDeleted: { $ne: true }
      });

      return {
        specifications,
        status: true,
        total: totalSpecifications,
      };
    } catch (error:any) {
      console.error("Error retrieving specifications:", error);
      return {
        error: error.message,
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
      summary: "Get all Specifications excluding deleted ones",
    },
  }
)

  .delete(
    "/delete/:id",
    async ({ set, params }) => {
      try {
        const  {id}  = params;
  
        const result = await SpecificationModel.findByIdAndUpdate(id,
          {
            isDeleted:true
          }
        );
  
        if (!result) {
          set.status = 404;
          return { message: "Specification not found", ok: false };
        }
  
        set.status = 200;
        return {
          message: "Specification deleted successfully",
          ok: true,
        };
      } catch (error: any) {
        set.status = 400;
        console.error("Error deleting Specification:", error);
        return { ok: false, message: error.message };
      }
    },
    {
      detail: {
        tags: ["Specifications"],
        description: "Delete a Specification",
      },
    }
  )
