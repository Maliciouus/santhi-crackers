import { deleteFile, saveFile } from "@/lib/file-s3";
import { StoreModel } from "@/models/store-model";
import Elysia, { t } from "elysia";

export const adminStoreController = new Elysia({
  prefix: "/store",
  detail: {
    tags: ["Admin - Store"],
  },
})
  .post(
    "/create",
    async ({ body }) => {
      try {
        const {
          storeName,
          storeAddress,
          storePhone,
          storeDescription,
          latitude,
          longitude,
          storeEmail,
          regulationNumber,
          storeImage,
        } = body;

        const Estore = new StoreModel({
          storeName,
          storeAddress,
          storePhone,
          storeEmail,
          storeDescription,
          latitude,
          longitude,
          regulationNumber,
        });

        if (storeImage) {
          const { ok, filename } = await saveFile(
            storeImage,
            "store"
          );

          if (!ok) {
            return {
              error: "Failed to upload restaurent image",
            };
          }

        Estore.storeImage = filename;
        }

        await Estore.save();
        return {
          message: "store created successfully",
          status: true,
          data: Estore,
        };
      } catch (error) {
        if (error instanceof Error) {
          console.error(error);

          return {
            error: error.message,
          };
        } else {
          return {
            error,
          };
        }
      }
    },
    {
      body: t.Object({
        storeName: t.String(),
        storeAddress: t.String(),
        storePhone: t.String(),
        storeDescription: t.String(),
        latitude: t.String(),
        longitude: t.String(),
        storeImage: t.File(),
        storeEmail: t.String(),
        regulationNumber:t.String(),
      }),
      detail: {
        summary: "Create store",
      },
    }
  )
  .put(
    "/update/:id",
    async ({ body, params, set }) => {
      try {
        const { id } = params;
  
        const store = await StoreModel.findById(id);
  
        if (!store) {
          set.status = 404;
          return {
            message: "store not found",
            status: false,
          };
        }
  
        const {
          storeName,
          storeAddress,
          storePhone,
          storeDescription,
          latitude,
          longitude,
          storeEmail,
          storeImage,
          regulationNumber,
          gstNumber,
          legalEntityName,
        } = body;
  
        // Update fields
        store.storeName = storeName || store.storeName;
        store.storeAddress = storeAddress || store.storeAddress;
        store.storePhone = storePhone || store.storePhone;
        store.storeDescription = storeDescription || store.storeDescription;
        store.latitude = latitude || store.latitude;
        store.longitude = longitude || store.longitude;
        store.gstNumber = gstNumber || store.gstNumber;
        store.legalEntityName = legalEntityName || store.legalEntityName;
        store.regulationNumber = regulationNumber || store.regulationNumber;
        store.storeEmail = storeEmail || store.storeEmail;
  
        if (storeImage) {
          const { ok, filename } = await saveFile(storeImage, "store");
  
          if (!ok) {
            set.status = 400;
            return {
              error: "Failed to upload store image",
            };
          }
  
          if (store.storeImage) {
            deleteFile(store.storeImage,'store');
          }
  
          store.storeImage = filename;
        }
  
        await store.save();
  
        return {
          message: "Store details updated successfully",
          status: true,
          data: store,
        };
      } catch (error) {
        set.status = 400;
        if (error instanceof Error) {
          console.error(error);
          return {
            error: error.message,
          };
        }
        return {
          error: "An unexpected error occurred",
        };
      }
    },
    {
      body: t.Object({
        storeName: t.Optional(t.String({ default: "" })),
        storeAddress: t.Optional(t.String({ default: "" })),
        storeEmail: t.Optional(t.String({ default: "" })),
        storePhone: t.Optional(t.String({ default: "" })),
        storeDescription: t.Optional(t.String({ default: "" })),
        latitude: t.Optional(t.String({ default: "" })),
        longitude: t.Optional(t.String({ default: "" })),
        storeImage: t.Optional(t.File()),
        gstNumber: t.Optional(t.String({ default: "" })),
        legalEntityName: t.Optional(t.String({ default: "" })),
        regulationNumber:t.Optional(t.String({default:""})),
      }),
      detail: {
        summary: "Update store details by ID",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const { id } = params;
  
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
  
  
  .get(
    "/all",
    async ({ query, set }) => {
      try {
        const { q, page, limit } = query;
  
        let _page = Number(page) || 1;
        let _limit = Number(limit) || 10;
  
        const searchQuery: Partial<Record<string, unknown>> = {
          isDeleted: false,
        };
  
        if (q) {
          searchQuery.storeName = { $regex: q, $options: "i" };
        }
  
        const restaurents = await StoreModel.find(searchQuery)
          .skip((_page - 1) * _limit)
          .limit(_limit)
          .sort({ createdAt: -1 })
          .lean()
          .exec();
  
        return {
          restaurents,
          status: true,
          message: "Store fetched successfully",
        };
      } catch (error) {
        set.status = 400;
        return {
          error: error instanceof Error ? error.message : "Can't fetch Store",
          status: false,
        };
      }
    },
    {
      detail: {
        summary: "Get all stores",
      },
      query: t.Object({
        page: t.Number({
          default: 1,
        }),
        limit: t.Number({
          default: 10,
        }),
        q: t.Optional(t.String({ default: "" })),
      }),
    }
  )
  
  
  .delete(
    "/:id",
    async ({ params, query }) => {
      try {
        const { id } = params;
        const { permanent } = query;
        const Estore = await StoreModel.findById(id);
  
        if (!Estore) {
          return { message: "store not found" };
        }
  
        if (permanent) {
          Estore.active = false;
          Estore.isDeleted = true;
        } else {
          Estore.active = !Estore.active;
        }
  
        await Estore.save();
  
        return {
          message: `store ${Estore.active ? "activated" : "deactivated"} successfully`,
          status: true,
        };
      } catch (error) {
        console.error(error);
        return {
          error: error instanceof Error ? error.message : "Something went wrong",
          status: false,
        };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      query: t.Object({
        permanent: t.Boolean({ default: false }),
      }),
      detail: {
        summary: "Delete a store by ID",
      },
    }
  )
  
  