import Elysia, { t } from "elysia";
import { FlatOffer, NegotiateOffer, DiscountOffer, MRPOffer } from "@/models/offer-model";
import { Product } from "@/models/product";
import { Types } from "mongoose";

const flatSchema = t.Object({
  type: t.Literal("flat"),
  percentage: t.Number(),
  minPrd: t.Number(),
  isActive: t.Optional(t.Boolean()),
  items: t.Optional(t.Array(t.Object({
    productId: t.String(),
    active: t.Optional(t.Boolean())
  }))),
});

const negotiateSchema = t.Object({
  type: t.Literal("negotiate"),
  noOfAttempts: t.Number(),
  isActive: t.Optional(t.Boolean()),
  items: t.Array(
    t.Object({
      productId: t.String(),
      successPercentage: t.Number(),
      failurePercentage: t.Number(),
      MOQ: t.Number(),
      limit: t.Number()
    })
  ),
});

const discountSchema = t.Object({
  type: t.Literal("discount"),
  isActive: t.Optional(t.Boolean()),
  items: t.Array(
    t.Object({
      productId: t.String(),
      discount: t.Number(),
    })
  ),
});

const mrpSchema = t.Object({
  type: t.Literal("mrp"),
  isActive: t.Optional(t.Boolean()),
  items: t.Array(
    t.Object({
      productId: t.String(),
      mrpReduction: t.Number(),
    })
  ),
});

const offerBody = t.Union([flatSchema, negotiateSchema, discountSchema, mrpSchema]);

export const offerController = new Elysia({
  prefix: "/offer",
  detail: { tags: ["Admin - Offers"] },
})

// Create Offer
.post(
  "/create",
  async ({ body, set }) => {
    try {
      let offer;

      switch (body.type) {
        case "flat":
          // Create flat offer with the new schema structure
          const flatOfferData = { 
            ...body,
            items: body.items || [] // Ensure items is initialized if not provided
          };
          offer = await FlatOffer.create(flatOfferData);
          
          // Update products with the flat percentage value
          if (offer.items && offer.items.length > 0) {
            for (const item of offer.items) {
              await Product.findByIdAndUpdate(item.productId, { flat: offer.percentage });
            }
          }
          break;
        case "negotiate":
          offer = await NegotiateOffer.create({ ...body });
          break;
        case "discount":
          offer = await DiscountOffer.create({ ...body });
          break;
        case "mrp":
          offer = await MRPOffer.create({ ...body });
          break;
        default:
          set.status = 400;
          return { message: "Invalid offer type", status: false };
      }

      return { message: "Offer created successfully", data: offer, status: true };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { message: "Error creating offer", status: false, error };
    }
  },
  {
    body: offerBody,
    detail: { summary: "Create a new offer" },
  }
)

// Edit Offer
.patch(
  "/update/:id",
  async ({ params, body, set }) => {
    try {
      const { id } = params;
      const { type, ...updatedData } = body;
      let updatedOffer;

      switch (type) {
        case "flat":
          updatedOffer = await FlatOffer.findByIdAndUpdate(id, updatedData, { new: true });
          if (updatedOffer && updatedData.percentage !== undefined) {
            // Update all products referenced in the flat offer's items array
            if (updatedOffer.items && updatedOffer.items.length > 0) {
              const productIds = updatedOffer.items
                .filter(item => item.active)
                .map(item => item.productId);
                
              await Product.updateMany(
                { _id: { $in: productIds } },
                { flat: updatedData.percentage }
              );
            }
          }
          break;
        case "negotiate":
          updatedOffer = await NegotiateOffer.findByIdAndUpdate(id, updatedData, { new: true });
          break;
        case "discount":
          updatedOffer = await DiscountOffer.findByIdAndUpdate(id, updatedData, { new: true });
          break;
        case "mrp":
          updatedOffer = await MRPOffer.findByIdAndUpdate(id, updatedData, { new: true });
          break;
        default:
          set.status = 400;
          return { message: "Invalid offer type", status: false };
      }

      if (!updatedOffer) {
        set.status = 404;
        return { message: "Offer not found", status: false };
      }

      return { message: "Offer updated successfully", data: updatedOffer, status: true };
    } catch (error) {
      console.error(error);
      set.status = 400;
      return { status: false, error };
    }
  },
  {
    body: t.Object({
      type: t.String(),
      percentage: t.Optional(t.Number()),
      failurePercentage: t.Optional(t.Number()),
      successPercentage: t.Optional(t.Number()),
      MOQ: t.Optional(t.Number()),
      limit: t.Optional(t.Number()),
      minPrd: t.Optional(t.Number()),
      noOfAttempts: t.Optional(t.Number()),
      items: t.Optional(t.Array(
        t.Object({
          productId: t.String(),
          discount: t.Optional(t.Number()),
          active: t.Optional(t.Boolean()),
        })
      )),
      isActive: t.Optional(t.Boolean()),
    }),
    params: t.Object({ id: t.String() }),
  }
)

// Add Product to Offer (Both Discount & MRP Types & negotiate)
.post(
  '/:id/add-product',
  async ({ params, body, set }) => {
    try {
      const { id } = params;
      const { productId, discount, mrpReduction, successPercentage, failurePercentage, limit, MOQ, active } = body;

      const offer = await FlatOffer.findById(id) || await DiscountOffer.findById(id) || await MRPOffer.findById(id) || await NegotiateOffer.findById(id);
      if (!offer) {
        set.status = 404;
        return { message: 'Offer not found', status: false };
      }

      if (offer.type === 'flat') {
        // Check if product already exists in items array
        const alreadyExists = offer.items.some(
          (item) => item.productId.toString() === productId
        );

        if (alreadyExists) {
          set.status = 400;
          return { message: 'Product already exists in the offer list', status: false };
        }

        // Add product to items array with active status
        offer.items.push({ 
          productId, 
          active: active !== undefined ? active : true 
        });
        
        await Product.findByIdAndUpdate(productId, { flat: offer.percentage });
        await offer.save();
      } else {
        const existingProductIndex = offer.items.findIndex(
          (item) => item.productId.toString() === productId
        );

        if (existingProductIndex >= 0) {
          set.status = 400;
          return { message: 'Product already exists in the offer list', status: false };
        }

        if (offer.type === 'discount') {
          offer.items.push({ productId, discount });
          await Product.findByIdAndUpdate(productId, { discount }); // Add discount to Product
        } else if (offer.type === 'mrp') {
          offer.items.push({ productId, mrpReduction });
          await Product.findByIdAndUpdate(productId, { onMRP: mrpReduction }); // Add onMRP to Product
        } else if (offer.type === 'negotiate') {
          offer.items.push({ productId, successPercentage, failurePercentage });
          await Product.findByIdAndUpdate(productId, { negotiate: true, negotiateLimit: limit, negMOQ: MOQ }); // Add negotiate params
        }

        await offer.save();
      }
      
      return { message: 'Product added to offer successfully', data: offer, status: true };
    } catch (error) {
      console.error(error);
      set.status = 400;
      return { status: false, error };
    }
  },
  {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      productId: t.String(),
      discount: t.Optional(t.Number()),
      mrpReduction: t.Optional(t.Number()),
      successPercentage: t.Optional(t.Number()),
      failurePercentage: t.Optional(t.Number()),
      MOQ: t.Optional(t.Number()),
      limit: t.Optional(t.Number()),
      active: t.Optional(t.Boolean()),
    }),
    detail: { summary: 'Add a product to the offer' },
  }
)

// Remove Product from Offer (Both Discount & MRP Types & negotiate)
.delete(
  '/remove-product',
  async ({ query, set }) => {
    try {
      const { id, productId } = query;

      if (!id || !productId) {
        set.status = 400;
        return { message: 'Missing id or productId', status: false };
      }

      // Find the offer by ID
      const offer = await FlatOffer.findById(id) || await MRPOffer.findById(id) || await DiscountOffer.findById(id) || await NegotiateOffer.findById(id);
      if (!offer) {
        set.status = 404;
        return { message: 'Offer not found', status: false };
      }

      if (offer.type === 'flat') {
        // Remove the product from items array
        offer.items = offer.items.filter(
          (item) => item.productId.toString() !== productId
        );
        
        await Product.findByIdAndUpdate(productId, { flat: 0 });
        await offer.save();
      } else {
        offer.items = offer.items.filter(
          (item) => item.productId.toString() !== productId
        );

        await offer.save();

        if (offer.type === 'discount') {
          await Product.findByIdAndUpdate(productId, { discount: 0 }); // Remove discount from Product
        } else if (offer.type === 'mrp') {
          await Product.findByIdAndUpdate(productId, { onMRP: 0 }); // Remove onMRP from Product
        } else if (offer.type === 'negotiate') {
          await Product.findByIdAndUpdate(productId, { negotiate: false, $unset: { negotiateLimit: "", negMOQ: "" } });
        }
      }

      return {
        message: 'Product removed from offer successfully',
        data: offer,
        status: true,
      };
    } catch (error) {
      console.error(error);
      set.status = 400;
      return { status: false, error };
    }
  },
  {
    query: t.Object({
      id: t.String(),
      productId: t.String(),
    }),
    detail: { summary: 'Remove a product from the offer' },
  }
)

// Update Product Values in Offer (Both Discount & MRP Types)
.patch(
  "/update-products",
  async ({ query, body, set }) => {
    try {
      const { id } = query;
      const { products } = body;

      if (!id) {
        set.status = 400;
        return { message: "Offer ID is required", status: false };
      }

      const offer =
        (await FlatOffer.findById(id)) ||
        (await DiscountOffer.findById(id)) ||
        (await MRPOffer.findById(id)) ||
        (await NegotiateOffer.findById(id));

      if (!offer) {
        set.status = 404;
        return { message: "Offer not found", status: false };
      }

      const offerType = offer.type;

      for (const product of products) {
        const { productId, discount, mrpReduction, successPercentage, failurePercentage, limit, MOQ, active } = product;

        const index = offer.items.findIndex((item) => item.productId.toString() === productId);
        if (index === -1) continue;

        if (offerType === "flat") {
          // Update active status for flat offer product
          if (active !== undefined) {
            offer.items[index].active = active;
            // If active, update product with flat percentage, otherwise set to 0
            const flatValue = active ? offer.percentage : 0;
            await Product.findByIdAndUpdate(productId, { flat: flatValue });
          }
        } else if (offerType === "discount") {
          offer.items[index].discount = discount;
          await Product.findByIdAndUpdate(productId, { discount });
        } else if (offerType === "mrp") {
          offer.items[index].mrpReduction = mrpReduction;
          await Product.findByIdAndUpdate(productId, { onMRP: mrpReduction });
        } else if (offerType === "negotiate") {
          offer.items[index].successPercentage = successPercentage;
          offer.items[index].failurePercentage = failurePercentage;
          await Product.findByIdAndUpdate(productId, { negotiateLimit: limit, negMOQ: MOQ });
        }
      }

      await offer.save();

      return {
        message: "Product values updated successfully",
        data: offer,
        status: true,
      };
    } catch (error) {
      console.error("Error updating product values:", error);
      set.status = 400;
      return { status: false, error };
    }
  },
  {
    query: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      products: t.Array(
        t.Object({
          productId: t.String(),
          discount: t.Optional(t.Number()),
          mrpReduction: t.Optional(t.Number()),
          successPercentage: t.Optional(t.Number()),
          failurePercentage: t.Optional(t.Number()),
          limit: t.Optional(t.Number()),
          MOQ: t.Optional(t.Number()),
          active: t.Optional(t.Boolean()),
        })
      ),
    }),
    detail: { summary: "Update multiple product values in the offer" },
  }
)

// Get Offers
.get(
  "/",
  async ({ query, set }) => {
    const { type } = query;

    try {
      let offers;

      if (type) {
        switch (type) {
          case "flat":
            offers = await FlatOffer.find().populate('items.productId');
            break;
          case "negotiate":
            offers = await NegotiateOffer.find().populate('items.productId');
            break;
          case "discount":
            offers = await DiscountOffer.find().populate('items.productId');
            break;
          case "mrp":
            offers = await MRPOffer.find().populate('items.productId');
            break;
          default:
            set.status = 400;
            return { message: "Invalid offer type", status: false };
        }
      } else {
        const [flat, negotiate, discount, mrp] = await Promise.all([
          FlatOffer.find().populate('items.productId'),
          NegotiateOffer.find().populate('items.productId'),
          DiscountOffer.find().populate('items.productId'),
          MRPOffer.find().populate('items.productId'),
        ]);

        offers = [...flat, ...negotiate, ...discount, ...mrp];
      }

      if (!offers.length) {
        set.status = 404;
        return { message: "No offers found", status: false };
      }

      return { message: "Offers fetched successfully", data: offers, status: true };
    } catch (error) {
      console.error("Error fetching offers:", error);
      set.status = 500;
      return { status: false, error: "Failed to fetch offers" };
    }
  },
  {
    query: t.Object({
      type: t.Optional(t.String()),
    }),
    detail: { summary: "Get Offers (All or By Type)" },
  }
)
// Toggle Main Offer isActive Status
.patch(
  "/offer-active/:id",
  async ({ params, body, set }) => {
    try {
      const { id } = params;
      const { isActive } = body;

      if (isActive === undefined) {
        set.status = 400;
        return { message: "isActive field is required", status: false };
      }

      // Find the offer by ID
      const offer =
        (await FlatOffer.findById(id)) ||
        (await NegotiateOffer.findById(id)) ||
        (await DiscountOffer.findById(id)) ||
        (await MRPOffer.findById(id));

      if (!offer) {
        set.status = 404;
        return { message: "Offer not found", status: false };
      }

      // Update isActive status
      offer.isActive = isActive;


      // if (offer.type === "flat" && !isActive) {
      //   const productIds = offer.items
      //     .filter((item) => item.active)
      //     .map((item) => item.productId);
      //   if (productIds.length > 0) {
      //     await Product.updateMany(
      //       { _id: { $in: productIds } },
      //       { flat: 0 }
      //     );
      //   }
      // } else if (offer.type === "flat" && isActive) {
      //   const productIds = offer.items
      //     .filter((item) => item.active)
      //     .map((item) => item.productId);
      //   if (productIds.length > 0) {
      //     await Product.updateMany(
      //       { _id: { $in: productIds } },
      //       { flat: offer.percentage }
      //     );
      //   }
      // }

      await offer.save();

      return {
        message: `Offer ${isActive ? "activated" : "deactivated"} successfully`,
        data: offer,
        status: true,
      };
    } catch (error) {
      console.error("Error toggling offer active status:", error);
      set.status = 500;
      return { status: false, error: "Failed to toggle offer active status" };
    }
  },
  {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      isActive: t.Boolean(),
    }),
    detail: { summary: "Toggle the isActive status of an offer" },
  }
)

.patch(
  "/product-active/:id",
  async ({ params, body, set }) => {
    try {
      const { id } = params;
      const { productId, active } = body;

      if (!productId || active === undefined) {
        set.status = 400;
        return { message: "productId and active fields are required", status: false };
      }

      // Find the offer by ID
      const offer =
        (await FlatOffer.findById(id)) ||
        (await NegotiateOffer.findById(id)) ||
        (await DiscountOffer.findById(id)) ||
        (await MRPOffer.findById(id));

      if (!offer) {
        set.status = 404;
        return { message: "Offer not found", status: false };
      }

      // Find the product in the items array
      const itemIndex = offer.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (itemIndex === -1) {
        set.status = 404;
        return { message: "Product not found in offer", status: false };
      }

      // Update the active status of the product
      offer.items[itemIndex].active = active;

      // For FlatOffer, update the product's flat value
      // if (offer.type === "flat") {
      //   const flatValue = active && offer.isActive ? offer.percentage : 0;
      //   await Product.findByIdAndUpdate(productId, { flat: flatValue });
      // }

      await offer.save();

      return {
        message: `Product ${active ? "activated" : "deactivated"} in offer successfully`,
        data: offer,
        status: true,
      };
    } catch (error) {
      console.error("Error toggling product active status:", error);
      set.status = 500;
      return { status: false, error: "Failed to toggle product active status" };
    }
  },
  {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      productId: t.String(),
      active: t.Boolean(),
    }),
    detail: { summary: "Toggle the active status of a product in an offer" },
  }
)