
import { DemandProduct } from "@/models/user/demand-model";
import Elysia, { t } from "elysia";
import { isValidObjectId } from "mongoose";
import { StoreType } from "@/types";
import { saveFile } from "@/lib/file-s3";
export const demandController = new Elysia({
  prefix: "/demand",
  detail: {
    tags: ["User - Demand"],
    security: [{ bearerAuth: [] }],
  },
})
.post(
  "/create",
  async ({ body, set, store }) => {
    try {
      const userId = (store as StoreType)["id"];
      
      if (!isValidObjectId(userId)) {
        set.status = 400;
        return { message: "Invalid user", status: false };
      }
      
      const { productName, message, file, imgURL, quantity, ratePreference, brandName, timePreference } = body;
      
      let fileToSave = null;
      
      if (file && !imgURL) {
        const { ok, filename } = await saveFile(file, "demand");
        if (!ok) {
          return { message: "Failed to upload file", status: false };
        }
        fileToSave = filename;
      } else if (imgURL) {
        fileToSave = imgURL;
      }
      
      // Save demand request
      const demand = new DemandProduct({
        userId: userId,
        productName,
        message,
        quantity: Number(quantity),
        ratePreference,
        brandName,
        timePreference,
        file: fileToSave,
      });
      
      await demand.save();
      
      return {
        message: "Demand request created successfully",
        status: true,
        data: demand,
      };
    } catch (error: any) {
      console.error("Error creating demand request:", error);
      return { error: error.message, status: false };
    }
  },
  {
    detail: { summary: "Create a new demand request" },
    body: t.Object({
      productName: t.String({ minLength: 3 }),
      message: t.String({ minLength: 3 }),
      quantity: t.String(),
      ratePreference: t.String(),
      timePreference: t.String(),
      brandName: t.String(),
      imgURL: t.Optional(t.String()),
      file: t.Optional(t.File()),
    }),
  }
)