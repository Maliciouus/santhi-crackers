import { sendNotification } from "@/lib/firebase";
import { razor } from "@/lib/razorpay";
import { DeliveryAgent } from "@/models/delivery-agent";
import { Product } from "@/models/product";
import { User } from "@/models/user-model";
import dayjs from "dayjs";
import Elysia, { t } from "elysia";
import  ComboOffer  from "@/models/combo-model";
import { EmpOrderModel } from "@/models/emp/order-model";
import { PreUser } from "@/models/emp/preUser-model";

export const adminEmpOrderController = new Elysia({
  prefix: "/empOrders",
  detail: {
    tags: ["Admin - EmpOrders"],
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
          EmpOrderModel.aggregate(ordersPipeline),
          EmpOrderModel.aggregate(countPipeline),
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
        const { page, limit, q, status, empId } = query;
        const _limit = limit || 10;
        const _page = page || 1;
        
        const matchStage: Record<string, unknown> = {};
        
        // Filter by employee ID if provided
        if (empId) {
          matchStage["employee"] = new Types.ObjectId(empId);
        }
        
        // Search functionality
        if (q) {
          matchStage["$or"] = [
            { orderId: { $regex: q, $options: "i" } },
            { "userData.username": { $regex: q, $options: "i" } },
            { "userData.mobile": { $regex: q, $options: "i" } },
          ];
        }
        
        // Filter by status if provided
        if (status) {
          matchStage["status"] = status;
        }
        
        const aggregatePipeline = [
          {
            $lookup: {
              from: "preusers", // Changed from users to preusers based on the ref in schema
              localField: "user",
              foreignField: "_id",
              as: "userData",
            },
          },
          { $unwind: "$userData" },
          {
            $lookup: {
              from: "employees",
              localField: "employee",
              foreignField: "_id",
              as: "employeeData",
            },
          },
          { $unwind: "$employeeData" },
          {
            $lookup: {
              from: "stores",
              localField: "store",
              foreignField: "_id",
              as: "storeData",
            },
          },
          { $unwind: "$storeData" },
          { $match: matchStage },
          { $sort: { createdAt: -1 } },
        ];
        
        const ordersPipeline: any = [
          ...aggregatePipeline,
          { $skip: (_page - 1) * _limit },
          { $limit: _limit },
          {
            $project: {
              _id: 1,
              orderId: 1,
              employee: 1,
              employeeData: {
                _id: 1,
                name: 1,
                employeeId: 1
              },
              user: 1,
              userData: {
                _id: 1,
                username: 1,
                mobile: 1,
                profileImage: 1
              },
              store: 1,
              storeData: {
                _id: 1,
                name: 1
              },
              address: 1,
              subtotal: 1,
              tax: 1,
              totalPrice: 1,
              status: 1,
              paymentStatus: 1,
              invoiceId: 1,
              createdAt: 1,
              updatedAt: 1
            },
          },
        ];
        
        const countPipeline: any = [...aggregatePipeline, { $count: "total" }];
        
        const [orders, totalCountResult] = await Promise.all([
          EmpOrderModel.aggregate(ordersPipeline),
          EmpOrderModel.aggregate(countPipeline),
        ]);
        
        const totalOrders = totalCountResult[0]?.total || 0;
        
        return {
          message: "Employee Orders Fetched Successfully",
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
        empId: t.Optional(t.String({
          pattern: `^[a-fA-F0-9]{24}$`,
        })),
      }),
      detail: {
        summary: "Get all Employee Orders",
      },
    }
  )
  .get(
    "/order",
    async ({ query }) => {
      try {
        const { orderId } = query;
        const order = await EmpOrderModel.findById(orderId)
          .populate("user")
          .populate("products.productId")
          .lean()
          .exec();
        if (!order) {
          return { message: "Order not found", status: "error" };
        }
        return {
          message: "Order Fetched Successfully",
          status: "success",
          order,
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
    async ({ params, body }) => {
      try {
        const { id } = params;
        const { status } = body;

        const order = await EmpOrderModel.findById(id);
        if (!order) {
          return { message: "Order not found", status: "error" };
        }
        const user = await PreUser.findById(order.user);

        if (!user) {
          return { message: "User not found", status: "error" };
        }

        if (status == "cancelled" || status == "rejected") {
          // const refund = razor.payments.refund(order.razorPayId, {
          //   amount: order.totalPrice * 100,
          //   notes: {
          //     reason: "Order Cancelled",
          //   },
          //   receipt: order.orderId,
          //   speed: "normal",
          // });

          // console.log(refund);

          // await sendNotification(
          //   user.fcmToken,
          //   "Order Cancelled",
          //   "Your order " +
          //     order.orderId +
          //     " has been cancelled. Contact support for assistance."
          // );
        }

        // if (status == "picked") {
        //   await sendNotification(
        //     user.fcmToken,
        //     "On the Way!",
        //     "Your order " +
        //       order.orderId +
        //       "  is out for delivery. Track your order for updates."
        //   );
        // }

        if (status == "accepted") {
    
          order.preparedAt = new Date(Date.now());

          await order.save();

          // await sendNotification(
          //   user.fcmToken,
          //   "Dispatching Your Order",
          //   "Your order " +
          //     order.orderId +
          //     " is being dispatched. We’ll notify you once it's out for delivery."
          // );
        }

        order.status = status;
        await order.save();

        return {
          message: "Order status updated successfully",
          status: "success",
          order,
        };
      } catch (error) {
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
  // .patch(
  //   "/assign-agent/:id",
  //   async ({ params, body }) => {
  //     try {
  //       const { id } = params;
  //       const { agentId } = body;

  //       const order = await EmpOrderModel.findById(id);
  //       if (!order) {
  //         return { message: "Order not found", status: "error" };
  //       }

  //       const agent = await DeliveryAgent.findById(agentId);

  //       if (!agent) {
  //         return { message: "Something not found", status: "error" };
  //       }

  //       await sendNotification(
  //         agent.fcmToken,
  //         `A New Order assigned to you.`,
  //         "Order ID: " + order.orderId + " is assigned to you"
  //       );

  //       order.deliveryAgent = new ObjectId(agentId);
  //       await order.save();

  //       return {
  //         message: "Delivery agent assigned successfully",
  //         status: "success",
  //         order,
  //       };
  //     } catch (error) {
  //       return {
  //         message: "Failed to assign delivery agent",
  //         status: "error",
  //         error: error instanceof Error ? error.message : "Unknown error",
  //       };
  //     }
  //   },
  //   {
  //     params: t.Object({
  //       id: t.String(),
  //     }),
  //     body: t.Object({
  //       agentId: t.String(),
  //     }),
  //   }
  // )
  .get(
    "/ordercount",
    async ({ query }) => {
      try {
        const orderStatuses = [
          "pending",
          "accepted",
          "rejected",
          "ready for delivery",
          "cancelled",
          "delivered",
        ];

        const orderCounts = await EmpOrderModel.aggregate([
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
  .post(
    "/updatequantity",
    async ({ body, set, store }) => {
      const { orderId, productId, quantity } = body;

      try {
        if (quantity < 1) {
          set.status = 400;
          throw new Error("Invalid quantity");
        }

        const order = await EmpOrderModel.findById(orderId);
        if (!order) {
          set.status = 404;
          throw new Error("Order not found");
        }

        const productDoc = await Product.findById(productId);
        if (!productDoc) {
          set.status = 404;
          throw new Error("Product not found");
        }

        const productIndex = order.products.findIndex(
          (p) => p.productId.toString() === productId
        );

        if (productIndex === -1) {
          set.status = 404;
          throw new Error("Product not found in order");
        }

        const existingProduct = order.products[productIndex];
        if (!existingProduct) {
          set.status = 404;
          throw new Error("Product not found in order");
        }

        const dipsTotal =
          existingProduct.dips?.reduce(
            (sum, dip) => sum + dip.totalAmount,
            0
          ) || 0;

        const productGstAmount = (productDoc.price * productDoc.gst) / 100;
        const totalTax = productGstAmount * quantity;

        order.products[productIndex] = {
          ...existingProduct,
          quantity: quantity,
          totalAmount: quantity * productDoc.price + dipsTotal,
          productId: productDoc._id,
          price: productDoc.price,
          name: productDoc.productName,
          dips: existingProduct.dips || [],
          suggestions: existingProduct.suggestions,
          customSuggestion: existingProduct.customSuggestion,
        };

        const subtotal = order.products.reduce(
          (sum, product) => sum + product.totalAmount,
          0
        );
        const tax = totalTax;
        const totalPrice = subtotal + tax;

        const updatedOrder = await EmpOrderModel.findOneAndUpdate(
          { _id: order._id },
          {
            $set: {
              products: order.products,
              subtotal,
              tax: Number(tax.toFixed(2)),
              totalPrice,
              lastUpdated: new Date(),
            },
          },
          { new: true }
        );

        return {
          message: "Order updated successfully",
          status: true,
          order: updatedOrder,
        };
      } catch (error) {
        console.error(error);
        set.status = set.status || 400;
        return {
          message: "Failed to update order",
          status: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      detail: {
        summary: "Update product quantity in order",
        description: "Update the quantity of an existing product in an order",
      },
      body: t.Object({
        orderId: t.String({
          pattern: "^[a-fA-F0-9]{24}$",
        }),
        productId: t.String({
          pattern: "^[a-fA-F0-9]{24}$",
        }),
        quantity: t.Number({
          minimum: 1,
        }),
      }),
    }
  )
  .post(
    "/updatequantities",
    async ({ body, set, store }) => {
      const { orderId, products } = body;

      try {
        const order = await EmpOrderModel.findById(orderId);
        if (!order) {
          set.status = 404;
          throw new Error("Order not found");
        }

        for (const updateItem of products) {
          const { productId, quantity } = updateItem;

          if (quantity < 1) {
            set.status = 400;
            throw new Error(`Invalid quantity for product ${productId}`);
          }

          const productDoc = await Product.findById(productId);
          if (!productDoc) {
            set.status = 404;
            throw new Error(`Product not found: ${productId}`);
          }

          const productIndex = order.products.findIndex(
            (p) => p.productId.toString() === productId
          );

          if (productIndex === -1) {
            set.status = 404;
            throw new Error(`Product not found in order: ${productId}`);
          }

          const existingProduct = order.products[productIndex];
          if (!existingProduct) {
            set.status = 404;
            throw new Error(`Product not found in order: ${productId}`);
          }

          const dipsTotal =
            existingProduct.dips?.reduce(
              (sum, dip) => sum + dip.totalAmount,
              0
            ) || 0;

          const productGstAmount = (productDoc.price * productDoc.gst) / 100;
          const totalTax = productGstAmount * quantity;

          order.products[productIndex] = {
            ...existingProduct,
            quantity: quantity,
            totalAmount: quantity * productDoc.price + dipsTotal,
            productId: productDoc._id,
            price: productDoc.price,
            name: productDoc.productName,
            dips: existingProduct.dips || [],
            suggestions: existingProduct.suggestions,
            customSuggestion: existingProduct.customSuggestion,
          };
        }

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

        const updatedOrder = await EmpOrderModel.findOneAndUpdate(
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
          message: "Order updated successfully",
          status: true,
          order: updatedOrder,
        };
      } catch (error) {
        console.error(error);
        set.status = set.status || 400;
        return {
          message: "Failed to update order",
          status: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      detail: {
        summary: "Update multiple product quantities in order",
        description:
          "Update the quantities of multiple products in an order in a single request",
      },
      body: t.Object({
        orderId: t.String({
          pattern: "^[a-fA-F0-9]{24}$",
        }),
        products: t.Array(
          t.Object({
            productId: t.String({
              pattern: "^[a-fA-F0-9]{24}$",
            }),
            quantity: t.Number({
              minimum: 1,
            }),
          })
        ),
      }),
    }
  )

  .post(
    "/removeproduct",
    async ({ body, set, store }) => {
      const { orderId, productId } = body;

      try {
        const order = await EmpOrderModel.findById(orderId);
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

        const updatedOrder = await EmpOrderModel.findOneAndUpdate(
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
  );
