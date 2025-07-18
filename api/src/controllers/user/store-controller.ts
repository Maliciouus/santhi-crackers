import { StoreModel } from "@/models/store-model";
import Elysia, { t } from "elysia";

export const StoreController = new Elysia({
    prefix: "/store",
    detail: {
      tags: ["User - Store"],
    },
  })

.get(
    "/",
    async ({ params }) => {
    //   const { id } = params;
  const id="67ecbdcf9caf259ca5a81b8b"
      const store = await StoreModel.findById(id);
  
      if (!store) {
        return {
          message: "store not found",
          status: false,
        };
      }
  
      return {
       store,
        status: true,
        message: "store fetched successfully",
      };
    },
    {
      detail: {
        summary: "Get store details by ID",
      },
    }
  )