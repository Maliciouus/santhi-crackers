import { sendNotification } from "@/lib/firebase";
// import { razor } from "@/lib/razorpay";
import { generateRandomString } from "@/lib/util";
import { broadcastMessage } from "@/lib/ws-store";
import { CouponModel } from "@/models/coupon-model";
import { StoreModel } from "@/models/store-model";
import { Address } from "@/models/user/address-model";
import { OrderModel } from "@/models/user/order-model";
import { StoreType } from "@/types";
import axios from "axios";
import Elysia, { t } from "elysia";
import mongoose from "mongoose";
import { Product } from "@/models/product";
import  ComboOffer  from "@/models/combo-model";
import { EmpOrderModel } from "@/models/emp/order-model";
import { Employee } from "@/models/emp/employee-model";
import { PreUser } from "@/models/emp/preUser-model";
import { EmpCartModel } from "@/models/emp/cart-model";

export const userOrderController = new Elysia({
  prefix: "/orders",
  detail: {
    tags: ["User - Orders"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
})
.post(
  '/order',
  async ({ set, store, body }) => {
    try {
      // Step 1: Extract empId from store and userId, address from body
      const empId = (store as StoreType)['id'];
      const { userId, address } = body;

      // Step 2: Fetch the employee
      const employee = await Employee.findById(empId);
      if (!employee) {
        set.status = 404;
        return { message: 'Employee not found', status: false };
      }

      // Step 3: Fetch the PreUser
      const user = await PreUser.findById(userId);
      if (!user) {
        set.status = 404;
        return { message: 'PreUser not found', status: false };
      }

      // Step 4: Fetch the active cart for the PreUser
      const cart = await EmpCartModel.findOne({
        emp: new mongoose.Types.ObjectId(empId),
        status: 'active',
      }).populate('products.productId');

      if (!cart) {
        set.status = 404;
        return { message: 'No active cart found for Employee', status: false };
      }

      // Step 5: Validate stock for all products in the cart
      const stockValidationErrors = [];
      const validProducts = [];

      for (const cartItem of cart.products) {
        const product = await Product.findById(cartItem.productId);

        if (!product) {
          stockValidationErrors.push({
            productId: cartItem.productId,
            message: "Product not found",
          });
          continue;
        }

        if (product.stock < cartItem.quantity) {
          stockValidationErrors.push({
            productId: cartItem.productId,
            productName: product.productName,
            requestedQuantity: cartItem.quantity,
            availableStock: product.stock,
            message: `Insufficient stock for ${product.productName}. Available: ${product.stock}, Requested: ${cartItem.quantity}`,
          });
        } else {
          validProducts.push({
            cartItem,
            product,
          });
        }
      }

      // If any products have insufficient stock, return error
      if (stockValidationErrors.length > 0) {
        set.status = 400;
        return {
          message: "Some products have insufficient stock",
          status: false,
          errors: stockValidationErrors,
          validProducts: validProducts.map(item => ({
            productId: item.cartItem.productId,
            productName: item.product.productName,
            availableStock: item.product.stock,
          })),
        };
      }

      // Step 6: Fetch the store
      const eStore = await StoreModel.findOne({});
      if (!eStore) {
        set.status = 404;
        return { message: 'Store not found', status: false };
      }

      // Step 7: Generate order ID and invoice ID
      const orderId = generateRandomString(6, 'JME');
      const invoiceId = generateRandomString(8, 'INV');

      // Step 8: Prepare order products
      const orderProducts = cart.products.map(product => ({
        productId: product.productId,
        quantity: product.quantity,
        totalAmount: product.totalAmount,
        price: product.price,
        options: product.options,
      }));

      // Step 9: Prepare address object for the order
      const orderAddress = {
        flatNo: address.flatNo,
        area: address.area,
        nearbyPlaces: address.nearbyPlaces || '',
      };

      // Step 10: Create the order
      const order = new EmpOrderModel({
        employee: empId,
        user: userId,
        store: eStore._id,
        products: orderProducts,
        address: orderAddress,
        orderId,
        invoiceId,
        subtotal: cart.subtotal,
        tax: cart.tax,
        totalPrice: cart.totalPrice,
        platformFee: cart.platformFee || 0,
        deliveryPrice: cart.deliveryFee || 0,
        status: 'pending',
        paymentStatus: 'pending',
      });

      // Save the order
      await order.save();

      // Step 11: Reduce product stock and keep track of updated products
      const updatedProducts = [];
      try {
        for (const { cartItem, product } of validProducts) {
          product.stock -= cartItem.quantity;
          await product.save();
          updatedProducts.push({ productId: product._id, stock: product.stock + cartItem.quantity }); // Store original stock for potential rollback
        }
      } catch (error) {
        // Rollback: Delete the created order and restore stock if stock update fails
        await EmpOrderModel.deleteOne({ _id: order._id });
        for (const updatedProduct of updatedProducts) {
          await Product.updateOne(
            { _id: updatedProduct.productId },
            { stock: updatedProduct.stock }
          );
        }
        throw new Error('Failed to update product stock');
      }

      // Step 12: Clear the cart
      try {
        cart.products = [];
        cart.subtotal = 0;
        cart.tax = 0;
        cart.totalPrice = 0;
        cart.deliveryFee = 0;
        cart.platformFee = 0;
        cart.totalDistance = 0;
        cart.deliverySeconds = 0;
        await cart.save();
      } catch (error) {
        // Rollback: Delete the order and restore stock if cart clearing fails
        await EmpOrderModel.deleteOne({ _id: order._id });
        for (const updatedProduct of updatedProducts) {
          await Product.updateOne(
            { _id: updatedProduct.productId },
            { stock: updatedProduct.stock }
          );
        }
        throw new Error('Failed to clear the cart');
      }

      // Step 13: Broadcast and notify after successful order creation
      broadcastMessage(`New Order with Order ID: ${orderId} is placed by Employee for ${user.username}`);
      // await sendNotification(
      //   user.fcmToken,
      //   'Order Placed!',
      //   `Your order #${orderId} has been placed successfully by an employee.`
      // );

      return {
        message: 'Order created successfully',
        status: true,
        order,
        paymentRequired: false,
      };
    } catch (error) {
      set.status = 500;
      return {
        message: 'Failed to create order',
        status: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  {
    body: t.Object({
      userId: t.String({
        pattern: `^[a-fA-F0-9]{24}$`,
        error: 'Invalid PreUser ID',
      }),
      address: t.Object({
        flatNo: t.String({ minLength: 1, error: 'Flat number is required' }),
        area: t.String({ minLength: 1, error: 'Area is required' }),
        nearbyPlaces: t.Optional(t.String()),
      }),
      couponId: t.Optional(
        t.String({
          pattern: `^[a-fA-F0-9]{24}$`,
          error: 'Invalid coupon ID',
        })
      ),
    }),
    detail: {
      summary: 'Create order for PreUser by Employee (without payment)',
      description: 'Create a new order for a PreUser from their cart, initiated by an employee, using address from body payload',
    },
  }
)

  
.get(
  "/orderhistory",
  async ({ set, store }) => {
    const empId = (store as StoreType)["id"];

    try {
      // Calculate start and end of today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const orders = await EmpOrderModel.find(
        {
          employee: empId,
          createdAt: { $gte: startOfToday, $lte: endOfToday },
        },
      ). populate(
        {path: "user",
          select:"username address mobile HospitalMedicalName"
        }
      )
        .sort({ createdAt: -1 })
        .lean();

      const ordersWithPopulatedProducts = await Promise.all(
        orders.map(async (order) => {
          const populatedProducts = await Promise.all(
            order.products.map(async (item) => {
              const normal = await Product.findById(item.productId)
                .select("productName brand images")
                .populate("brand", "name")
                .lean();

              if (normal) {
                return {
                  ...item,
                  productId: {
                    _id: normal._id,
                    productName: normal.productName,
                    brand: normal.brand,
                    images: normal.images,
                    isCombo: false,
                  },
                };
              }

              const combo = await ComboOffer.findById(item.productId)
                .select("comboName image comboPrice")
                .lean();

              if (combo) {
                return {
                  ...item,
                  productId: {
                    _id: combo._id,
                    productName: combo.comboName,
                    brand: { name: "Combo Offer" },
                    images: [combo.image],
                    isCombo: true,
                  },
                };
              }

              return {
                ...item,
                productId: null,
              };
            })
          );

          return {
            ...order,
            products: populatedProducts,
          };
        })
      );

      return {
        message: "Today's Orders Fetched Successfully",
        status: true,
        orders: ordersWithPopulatedProducts,
      };
    } catch (error) {
      set.status = 500;
      return {
        message: "Failed to fetch order",
        status: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  {
    detail: {
      summary: "Get today's order history",
      description: "Get the order history for the authenticated user for today only",
    },
  }
)


  .get(
    "/:id",
    async ({ params }) => {
      try {
        const { id } = params;
  
        const order = await EmpOrderModel.findById(id)
          .populate({
            path: "user",
            select: "username address mobile HospitalMedicalName",
          })
          .lean(); // Make it plain JS object
  
        if (!order) {
          return { message: "Order not found", status: false };
        }
  
        // Loop through products to populate each productId
        const populatedProducts = await Promise.all(
          order.products.map(async (item) => {
            let normal = await Product.findById(item.productId)
              .select("productName brand images")
              .populate("brand", "name")
              .lean();
  
            if (normal) {
              return {
                ...item,
                productId: {
                  _id: normal._id,
                  productName: normal.productName,
                  brand: normal.brand,
                  images: normal.images,
                  isCombo: false,
                },
              };
            }
  
            // Try combo product if normal not found
            let combo = await ComboOffer.findById(item.productId)
              .select("comboName image comboPrice")
              .lean();
  
            if (combo) {
              return {
                ...item,
                productId: {
                  _id: combo._id,
                  productName: combo.comboName,
                  brand: { name: "Combo Offer" },
                  images: [combo.image],
                  isCombo: true,
                },
              };
            }
  
            // If neither found
            return {
              ...item,
              productId: null,
            };
          })
        );
  
        return {
          message: "Order Fetched Successfully",
          data: {
            ...order,
            products: populatedProducts,
          },
          status: true,
        };
      } catch (error:any) {
        console.error("Error fetching order:", error);
        return {
          error: error.message,
          status: false,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Get a Order by id",
      },
    }
  )
  
  .post(
    "/cancel/:orderId",
    async ({ params, store, set }) => {
      try {
        const empId = (store as StoreType)["id"];
        const { orderId } = params;
  
        // 1. Find the order for the current employee
        const order = await EmpOrderModel.findOne({ _id: orderId, employee: empId });
  
        if (!order) {
          set.status = 404;
          return { message: "Order not found", status: false };
        }
  
        // 2. Validate order status
        const cancelableStatus = ["pending", "accepted"];
        if (!cancelableStatus.includes(order.status)) {
          set.status = 400;
          return { message: "Order cannot be cancelled", status: false };
        }
  
        // 3. Find employee
        const emp = await Employee.findById(order.employee);
        if (!emp) {
          set.status = 404;
          return { message: "Employee not found", status: false };
        }
  
        // 4. Restore stock for each product
        for (const item of order.products) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: item.quantity } }
          );
        }
  
        // 5. Broadcast and update order status
        broadcastMessage(
          `An Order with Order ID: ${order.orderId} was cancelled by User ${emp.name}`
        );
  
        // 6. Update order status
        await EmpOrderModel.findByIdAndUpdate(
          orderId,
          { status: "cancelled" }
        );
  
        return {
          message: "Order cancelled successfully",
          status: true,
        };
  
      } catch (error) {
        console.error(error);
        set.status = 500;
        return {
          message: "Internal server error",
          error: error instanceof Error ? error.message : error,
          status: false,
        };
      }
    },
    {
      params: t.Object({
        orderId: t.String(),
      }),
      detail: {
        summary: "Cancel Order by id",
        description: "Cancels an order and restores product stock",
        tags: ["Orders"]
      },
    }
  )
  