import { sendNotification } from "@/lib/firebase";
import { razor } from "@/lib/razorpay";
import { DeliveryAgent } from "@/models/delivery-agent";
import { Product } from "@/models/product";
import { User } from "@/models/user-model";
import { OrderModel } from "@/models/user/order-model";
import dayjs from "dayjs";
import Elysia, { t } from "elysia";
import  ComboOffer  from "@/models/combo-model";
import axios from "axios";

export const adminOrderController = new Elysia({
  prefix: "/orders",
  detail: {
    tags: ["Admin - Orders"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
})
  .get(
    "/today",
    async ({ query }) => {
      try {
        const { page, limit, q, status } = query;
        const _limit = limit || 10;
        const _page = page || 1;

        const matchStage: Record<string, unknown> = {};

        // Filter orders for today using dayjs
        const startOfDay = dayjs().startOf("day").toDate();
        const endOfDay = dayjs().endOf("day").toDate();

        // Add date range filter for today
        matchStage["createdAt"] = { $gte: startOfDay, $lte: endOfDay };

        if (q) {
          matchStage["$or"] = [
            { orderId: { $regex: q, $options: "i" } },
            { "userData.username": { $regex: q, $options: "i" } },
            { "userData.mobile": { $regex: q, $options: "i" } },
          ];
        }

        if (status) {
          matchStage["status"] = status;
        }

        const aggregatePipeline = [
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "userData",
            },
          },
          { $unwind: "$userData" },
          { $match: matchStage },
          { $sort: { createdAt: -1 } },
        ];

        const ordersPipeline: any = [
          ...aggregatePipeline,
          { $skip: (_page - 1) * _limit },
          { $limit: _limit },
          { $project: { products: 0 } },
        ];

        const countPipeline: any = [...aggregatePipeline, { $count: "total" }];

        const [orders, totalCountResult] = await Promise.all([
          OrderModel.aggregate(ordersPipeline),
          OrderModel.aggregate(countPipeline),
        ]);

        const totalOrders = totalCountResult[0]?.total || 0;

        return {
          message: "Orders Fetched Successfully",
          status: "success",
          total: totalOrders,
          orders,
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
        status: t.String({
          default: "",
        }),
      }),
      detail: {
        summary: "Get all Orders for admin panel",
      },
    }
  )
  .get(
    "/all",
    async ({ query }) => {
      try {
        const { page, limit, q, status } = query;
        const _limit = limit || 10;
        const _page = page || 1;

        const matchStage: Record<string, unknown> = {};

        if (q) {
          matchStage["$or"] = [
            { orderId: { $regex: q, $options: "i" } },
            { "userData.username": { $regex: q, $options: "i" } },
            { "userData.mobile": { $regex: q, $options: "i" } },
          ];
        }

        if (status) {
          matchStage["status"] = status;
        }

        const aggregatePipeline = [
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "userData",
            },
          },
          { $unwind: "$userData" },
          { $match: matchStage },
          { $sort: { createdAt: -1 } },
        ];

        const ordersPipeline: any = [
          ...aggregatePipeline,
          { $skip: (_page - 1) * _limit },
          { $limit: _limit },
          { $project: { products: 0 } },
        ];

        const countPipeline: any = [...aggregatePipeline, { $count: "total" }];

        const [orders, totalCountResult] = await Promise.all([
          OrderModel.aggregate(ordersPipeline),
          OrderModel.aggregate(countPipeline),
        ]);

        const totalOrders = totalCountResult[0]?.total || 0;

        return {
          message: "Orders Fetched Successfully",
          status: "success",
          total: totalOrders,
          orders,
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
        status: t.String({
          default: "",
        }),
      }),
      detail: {
        summary: "Get all Orders for admin panel",
      },
    }
  )
  .get(
    "/order",
    async ({ query }) => {
      try {
        const { orderId } = query;
  
        // Step 1: Fetch order without productId populated
        const order = await OrderModel.findById(orderId)
          .populate("user")
          .populate("addressId")
          .lean();
  
        if (!order) {
          return { message: "Order not found", status: "error" };
        }
  
        // Step 2: Manually populate products
        const populatedProducts = await Promise.all(
          order.products.map(async (item) => {
            let populatedProductId = null;
            let populatedOfferProductId = null;
  
            // Populate the main productId
            const normalProduct = await Product.findById(item.productId)
              .select("productName brand images")
              .populate("brand", "name")
              .lean();
  
            if (normalProduct) {
              populatedProductId = {
                _id: normalProduct._id,
                productName: normalProduct.productName,
                brand: normalProduct.brand,
                images: normalProduct.images,
                isCombo: false,
              };
            } else {
              // Try to populate from ComboOffer if normal product not found
              const combo = await ComboOffer.findById(item.productId)
                .select("comboName image comboPrice")
                .lean();
  
              if (combo) {
                populatedProductId = {
                  _id: combo._id,
                  productName: combo.comboName,
                  brand: { name: "Combo Offer" },
                  images: [combo.image],
                  isCombo: true,
                };
              }
            }
  
            // Populate the selectedOffer.onMRP.productId if exists
            if (
              item.selectedOffer?.onMRP?.productId
            ) {
              const offerProduct = await Product.findById(item.selectedOffer.onMRP.productId)
                .select("productName brand images")
                .populate("brand", "name")
                .lean();
  
              if (offerProduct) {
                populatedOfferProductId = {
                  _id: offerProduct._id,
                  productName: offerProduct.productName,
                  brand: offerProduct.brand,
                  images: offerProduct.images,
                  isCombo: false,
                };
              }
            }
  
            // Return the modified product
            return {
              ...item,
              productId: populatedProductId,
              selectedOffer: item.selectedOffer
                ? {
                    ...item.selectedOffer,
                    onMRP: item.selectedOffer.onMRP
                      ? {
                          ...item.selectedOffer.onMRP,
                          productId: populatedOfferProductId || item.selectedOffer.onMRP.productId,
                        }
                      : undefined,
                  }
                : undefined,
            };
          })
        );
  
        return {
          message: "Order Fetched Successfully",
          status: "success",
          order: {
            ...order,
            products: populatedProducts,
          },
        };
      } catch (error) {
        console.error(error);
        return { error, status: "error" };
      }
    },
    {
      query: t.Object({
        orderId: t.String({
          pattern: `^[a-fA-F0-9]{24}$`,
        }),
      }),
      detail: {
        summary: "Get Order for admin panel",
      },
    }
  )
   

  .patch(
    "/update-status/:id",
    async ({ params, body, set }) => {
      const startTime = Date.now(); // Start time for logging
  
      try {
        const { id } = params;
        const { status } = body;
  
        console.log(`Starting order status update for order ID: ${id}`);
  
        const order = await OrderModel.findById(id);
        if (!order) {
          console.log(`Order not found for ID: ${id}`);
          set.status = 404;
          return { message: "Order not found", status: "error" };
        }
  
        const user = await User.findById(order.user);
        if (!user) {
          console.log(`User not found for ID: ${order.user}`);
          set.status = 404;
          return { message: "User not found", status: "error" };
        }
  
        console.log(`Order and user fetched in ${Date.now() - startTime}ms`);
  
        // Update order status first
        order.status = status;
        await order.save();
        console.log(`Order status updated and saved in ${Date.now() - startTime}ms`);
  
        // Send notification asynchronously, log error but don't block
        if (status === "dispatched") {
          sendNotification(
            user.fcmToken,
            "On the Way! In transit",
            `Your order ${order.orderId} is dispatched. Track your order for updates.`
          ).catch((notificationError) => {
            console.error("Failed to send dispatched notification:", notificationError);
          });
          console.log(`Notification triggered for dispatched status in ${Date.now() - startTime}ms`);
        }
  
        if (status === "accepted") {
          sendNotification(
            user.fcmToken,
            "Your Order has been Accepted",
            `Your order ${order.orderId} is being accepted. We’ll notify you once it's out for dispatch.`
          ).catch((notificationError) => {
            console.error("Failed to send accepted notification:", notificationError);
          });
          console.log(`Notification triggered for accepted status in ${Date.now() - startTime}ms`);
        }
  
        set.status = 200;
        return {
          message: "Order status updated successfully",
          status: "success",
          order,
        };
      } catch (error) {
        console.error("Error updating order status:", error);
        set.status = 500;
        return {
          message: "Failed to update order status",
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        status: t.String(),
      }),
    }
  )
 
  .get(
    "/ordercount",
    async ({ query }) => {
      try {
        const orderStatuses = [
          "pending",
          "accepted",
          "rejected",
          "dispatched",
          "cancelled",
          "delivered",
        ];

        const orderCounts = await OrderModel.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]);

        const classifiedCounts = orderStatuses.map((status) => {
          const matchingStatus = orderCounts.find(
            (item) => item._id === status
          );
          return {
            status,
            count: matchingStatus ? matchingStatus.count : 0,
          };
        });

        return {
          message: "Order Count Fetched Successfully",
          status: true,
          data: classifiedCounts,
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
      query: t.Object({
        status: t.String({
          default: "",
        }),
      }),
      detail: {
        summary: "Get Status and Count of Orders for admin panel",
      },
    }
  )
  // .post(
  //   "/updatequantity",
  //   async ({ body, set, store }) => {
  //     const { orderId, productId, quantity } = body;

  //     try {
  //       if (quantity < 1) {
  //         set.status = 400;
  //         throw new Error("Invalid quantity");
  //       }

  //       const order = await OrderModel.findById(orderId);
  //       if (!order) {
  //         set.status = 404;
  //         throw new Error("Order not found");
  //       }

  //       const productDoc = await Product.findById(productId);
  //       if (!productDoc) {
  //         set.status = 404;
  //         throw new Error("Product not found");
  //       }

  //       const productIndex = order.products.findIndex(
  //         (p) => p.productId.toString() === productId
  //       );

  //       if (productIndex === -1) {
  //         set.status = 404;
  //         throw new Error("Product not found in order");
  //       }

  //       const existingProduct = order.products[productIndex];
  //       if (!existingProduct) {
  //         set.status = 404;
  //         throw new Error("Product not found in order");
  //       }

  //       const dipsTotal =
  //         existingProduct.dips?.reduce(
  //           (sum, dip) => sum + dip.totalAmount,
  //           0
  //         ) || 0;

  //       const productGstAmount = (productDoc.price * productDoc.gst) / 100;
  //       const totalTax = productGstAmount * quantity;

  //       order.products[productIndex] = {
  //         ...existingProduct,
  //         quantity: quantity,
  //         totalAmount: quantity * productDoc.price + dipsTotal,
  //         productId: productDoc._id,
  //         price: productDoc.price,
  //         name: productDoc.productName,
  //         dips: existingProduct.dips || [],
  //         suggestions: existingProduct.suggestions,
  //         customSuggestion: existingProduct.customSuggestion,
  //       };

  //       const subtotal = order.products.reduce(
  //         (sum, product) => sum + product.totalAmount,
  //         0
  //       );
  //       const tax = totalTax;
  //       const totalPrice = subtotal + tax;

  //       const updatedOrder = await OrderModel.findOneAndUpdate(
  //         { _id: order._id },
  //         {
  //           $set: {
  //             products: order.products,
  //             subtotal,
  //             tax: Number(tax.toFixed(2)),
  //             totalPrice,
  //             lastUpdated: new Date(),
  //           },
  //         },
  //         { new: true }
  //       );

  //       return {
  //         message: "Order updated successfully",
  //         status: true,
  //         order: updatedOrder,
  //       };
  //     } catch (error) {
  //       console.error(error);
  //       set.status = set.status || 400;
  //       return {
  //         message: "Failed to update order",
  //         status: false,
  //         error: error instanceof Error ? error.message : "Unknown error",
  //       };
  //     }
  //   },
  //   {
  //     detail: {
  //       summary: "Update product quantity in order",
  //       description: "Update the quantity of an existing product in an order",
  //     },
  //     body: t.Object({
  //       orderId: t.String({
  //         pattern: "^[a-fA-F0-9]{24}$",
  //       }),
  //       productId: t.String({
  //         pattern: "^[a-fA-F0-9]{24}$",
  //       }),
  //       quantity: t.Number({
  //         minimum: 1,
  //       }),
  //     }),
  //   }
  // )
  // .post(
  //   "/updatequantities",
  //   async ({ body, set, store }) => {
  //     const { orderId, products } = body;

  //     try {
  //       const order = await OrderModel.findById(orderId);
  //       if (!order) {
  //         set.status = 404;
  //         throw new Error("Order not found");
  //       }

  //       for (const updateItem of products) {
  //         const { productId, quantity } = updateItem;

  //         if (quantity < 1) {
  //           set.status = 400;
  //           throw new Error(`Invalid quantity for product ${productId}`);
  //         }

  //         const productDoc = await Product.findById(productId);
  //         if (!productDoc) {
  //           set.status = 404;
  //           throw new Error(`Product not found: ${productId}`);
  //         }

  //         const productIndex = order.products.findIndex(
  //           (p) => p.productId.toString() === productId
  //         );

  //         if (productIndex === -1) {
  //           set.status = 404;
  //           throw new Error(`Product not found in order: ${productId}`);
  //         }

  //         const existingProduct = order.products[productIndex];
  //         if (!existingProduct) {
  //           set.status = 404;
  //           throw new Error(`Product not found in order: ${productId}`);
  //         }

  //         const dipsTotal =
  //           existingProduct.dips?.reduce(
  //             (sum, dip) => sum + dip.totalAmount,
  //             0
  //           ) || 0;

  //         const productGstAmount = (productDoc.price * productDoc.gst) / 100;
  //         const totalTax = productGstAmount * quantity;

  //         order.products[productIndex] = {
  //           ...existingProduct,
  //           quantity: quantity,
  //           totalAmount: quantity * productDoc.price + dipsTotal,
  //           productId: productDoc._id,
  //           price: productDoc.price,
  //           name: productDoc.productName,
  //           dips: existingProduct.dips || [],
  //           suggestions: existingProduct.suggestions,
  //           customSuggestion: existingProduct.customSuggestion,
  //         };
  //       }

  //       const subtotal = order.products.reduce(
  //         (sum, product) => sum + product.totalAmount,
  //         0
  //       );

  //       let totalTax = 0;
  //       for (const product of order.products) {
  //         const productDoc = await Product.findById(product.productId);
  //         if (!productDoc) {
  //           set.status = 404;
  //           throw new Error(`Product not found: ${product.productId}`);
  //         }

  //         const productGstAmount = (productDoc.price * productDoc.gst) / 100;
  //         totalTax += productGstAmount * product.quantity;
  //       }

  //       const totalPrice = subtotal + totalTax;

  //       const updatedOrder = await OrderModel.findOneAndUpdate(
  //         { _id: order._id },
  //         {
  //           $set: {
  //             products: order.products,
  //             subtotal,
  //             tax: Number(totalTax.toFixed(2)),
  //             totalPrice,
  //             lastUpdated: new Date(),
  //           },
  //         },
  //         { new: true }
  //       );

  //       return {
  //         message: "Order updated successfully",
  //         status: true,
  //         order: updatedOrder,
  //       };
  //     } catch (error) {
  //       console.error(error);
  //       set.status = set.status || 400;
  //       return {
  //         message: "Failed to update order",
  //         status: false,
  //         error: error instanceof Error ? error.message : "Unknown error",
  //       };
  //     }
  //   },
  //   {
  //     detail: {
  //       summary: "Update multiple product quantities in order",
  //       description:
  //         "Update the quantities of multiple products in an order in a single request",
  //     },
  //     body: t.Object({
  //       orderId: t.String({
  //         pattern: "^[a-fA-F0-9]{24}$",
  //       }),
  //       products: t.Array(
  //         t.Object({
  //           productId: t.String({
  //             pattern: "^[a-fA-F0-9]{24}$",
  //           }),
  //           quantity: t.Number({
  //             minimum: 1,
  //           }),
  //         })
  //       ),
  //     }),
  //   }
  // )

  .post(
    "/removeproduct",
    async ({ body, set, store }) => {
      const { orderId, productId } = body;

      try {
        const order = await OrderModel.findById(orderId);
        if (!order) {
          set.status = 404;
          throw new Error("Order not found");
        }

        const productIndex = order.products.findIndex(
          (p) => p.productId.toString() === productId
        );

        if (productIndex === -1) {
          set.status = 404;
          throw new Error(`Product not found in order: ${productId}`);
        }

        order.products.splice(productIndex, 1);

        const subtotal = order.products.reduce(
          (sum, product) => sum + product.totalAmount,
          0
        );

        let totalTax = 0;
        for (const product of order.products) {
          const productDoc = await Product.findById(product.productId);

          if (!productDoc) {
            set.status = 404;
            throw new Error(`Product not found: ${product.productId}`);
          }

          const productGstAmount = (productDoc.price * productDoc.gst) / 100;
          totalTax += productGstAmount * product.quantity;
        }

        const totalPrice = subtotal + totalTax;

        const updatedOrder = await OrderModel.findOneAndUpdate(
          { _id: order._id },
          {
            $set: {
              products: order.products,
              subtotal,
              tax: Number(totalTax.toFixed(2)),
              totalPrice,
              lastUpdated: new Date(),
            },
          },
          { new: true }
        );

        return {
          message: "Product removed successfully",
          status: true,
          order: updatedOrder,
        };
      } catch (error) {
        console.error(error);
        set.status = set.status || 400;
        return {
          message: "Failed to remove product from order",
          status: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      detail: {
        summary: "Remove product from order",
        description: "Remove a product from the list of products in the order",
      },
      body: t.Object({
        orderId: t.String({
          pattern: "^[a-fA-F0-9]{24}$",
        }),
        productId: t.String({
          pattern: "^[a-fA-F0-9]{24}$",
        }),
      }),
    }
  )
  .patch(
    "/verify-payment/:id",
    async ({ params, body, set }) => {
      try {
        const { id } = params;
        const { paymentStatus } = body;
  
        // Validate paymentStatus
        const validStatuses = ["initiated", "completed", "failed"];
        if (!validStatuses.includes(paymentStatus)) {
          set.status = 400;
          return {
            message: "Invalid payment status",
            status: "error",
          };
        }
  
        const order = await OrderModel.findById(id);
        if (!order) {
          set.status = 404;
          return {
            message: "Order not found",
            status: "error",
          };
        }
  
        // Update payment status
        order.paymentStatus = paymentStatus as "initiated" | "completed" | "failed";

        if (paymentStatus === "completed") {
          order.status = "accepted";
          if (order.paymentImages && order.paymentImages.length > 0) {
            order.paymentImages.forEach((image) => {
              image.verified = true;
            });
          }
        }
        else if (paymentStatus === "failed") {
          if (order.paymentImages && order.paymentImages.length > 0) {
            order.paymentImages.forEach((image) => {
              image.verified = false;
            });
          }
        }
  
        await order.save();
  
        set.status = 200;
        return {
          message: "Payment status updated successfully",
          status: "success",
          order,
        };
      } catch (error) {
        set.status = 500;
        return {
          message: "Failed to update payment status",
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        paymentStatus: t.String(),
      }),
    }
  )  