import Elysia, { t } from "elysia";
import comboModel from "@/models/combo-model";
import { saveFile } from "@/lib/file-s3";




export const comboOfferController = new Elysia({
  prefix: "/combo-offer",
  detail: { tags: ["Admin - Combo Offers"] },
}) 
.post(
  "/create",
  //@ts-ignore
  async ({ body, set }) => {
      try {
          const { comboName, comboDescription, comboPrice, strikePrice, productsIncluded, image } = body;

          // Parse productsIncluded from JSON string to array of objects
          const parsedProductsIncluded = JSON.parse(productsIncluded);

          const existing = await comboModel.findOne({
              comboName,
              isDeleted: false,
          });

          if (existing) {
              return { message: "ComboOffer already exists", status: false };
          }

          const combo = await comboModel.create({
              comboName,
              comboDescription,
              comboPrice,
              strikePrice,
              productsIncluded: parsedProductsIncluded, // Use the parsed array
              active: true,
          });

          if (image) {
              const { ok, filename } = await saveFile(image, "comboOffer");

              if (!ok) {
                  set.status = 400;
                  return { message: "Error uploading image", status: false };
              }

              combo.image = filename;
              await combo.save();
          }

          return {
              message: "Combo Offer Created Successfully",
              data: {
                  name: combo.comboName,
              },
              status: true,
          };
      } catch (error) {
          console.error(error);
          return {
              status: false,
              error,
          };
      }
  },
  {
      body: t.Object({
          comboName: t.String(),
          comboDescription: t.String(),
          comboPrice: t.String(),
          strikePrice: t.String(),
          productsIncluded: t.String(), // Accept as a JSON string
          image: t.File({}),
      }),
      detail: {
          summary: "Create a new product category",
      },
  }
)


  // Update Combo Offer
  .patch(
    "/update/:id",
    async ({ set, body, params }) => {
      try {
        const { id } = params;
  
        // Parse productsIncluded if it's a string
        const updatedData = {
          ...body,
          productsIncluded: typeof body.productsIncluded === 'string'
            ? JSON.parse(body.productsIncluded)
            : body.productsIncluded
        };
  
        // Update the existing document
        const updatedCombo = await comboModel.findByIdAndUpdate(
          id,
          { $set: updatedData }, // Use $set to update specific fields
          { new: true } // Return the updated document
        );
  
        if (!updatedCombo) {
          set.status = 404;
          return { message: "Combo Offer not found", ok: false };
        }
  
        set.status = 200;
        return { message: "Combo Offer updated successfully", ok: true, data: updatedCombo };
      } catch (error: any) {
        set.status = 400;
        return { ok: false, message: error.message };
      }
    },
    {
      // Use optional versions for all fields in update
      body: t.Object({
        comboName: t.Optional(t.String()),
        image: t.Optional(t.String()),
        productsIncluded: t.Optional(t.String()),
        comboPrice: t.Optional(t.String()),
        comboDescription: t.Optional(t.String()),
        strikePrice: t.Optional(t.String()),
        active: t.Optional(t.Boolean()),
      })
    }
  )

  // Get All Combo Offers
  .get(
    "/all",
    async ({ query }) => {
      try {
        const { page = 1, limit = 10 } = query;
        const comboOffers = await comboModel.find({ isDeleted: false })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate({path:'productsIncluded.productId',select:"productName images"})
          .sort({ createdAt: -1 });
        
          const totalOffers = await comboModel.countDocuments({ isDeleted: false });

        
        return { comboOffers, total: totalOffers, status: true };
      } catch (error: any) {
        return { error: error.message, status: "error" };
      }
    },
    {
      query: t.Object({
        page: t.Number({ default: 1 }),
        limit: t.Number({ default: 10 }),
      }),
    }
  )


  .delete(
    "/:id",
    async ({ params, query }) => {
      try {
        const { id } = params;
        const { permanent, type } = query;
        const combo = await comboModel.findById(id);

        if (!combo) {
          return { message: "Product not found" };
        }

        if (permanent) {
          combo.active = false;
          combo.isDeleted = true;

          await combo.save();

          return {
            message: "Product permanently deleted",
            status: true,
          };
        }
        else{
          combo.active=!combo.active;
        }
      
        await combo.save();
        return {
          message: `Product ${
            combo.active ? "activated" : "deactivated"
          } successfully `,
          status: true,
        };
      } catch (error) {
        console.error(error);
        return {
          error,
          status: false,
          message: "Something went wrong",
        };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      query: t.Object({
        permanent: t.Boolean({
          default: false,
        }),
        type: t.String({
          default: "date",
        }),
      }),
      detail: {
        summary: "Delete a product by id",
      },
    }
  )