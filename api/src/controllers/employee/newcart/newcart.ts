import { calculateRoadDistance } from "@/lib/util";
import { Config } from "@/models/config-model";
import { CouponModel } from "@/models/coupon-model";
import { Dipping } from "@/models/dippings-model";
import { Product } from "@/models/product";
import { StoreModel } from "@/models/store-model";
import { User } from "@/models/user-model";
import { Address } from "@/models/user/address-model";
import { CartModel } from "@/models/user/cart-model";
import { StoreType } from "@/types";
import { add, format } from "date-fns";
import Elysia, { t } from "elysia";
import mongoose from "mongoose";

export const newuserCartController = new Elysia({
  prefix: "/newcart",
  detail: {
    tags: ["User - New Cart"],
    security: [{ bearerAuth: [] }],
  },
})
  .get(
    "/",
    async ({ store, set, query }) => {
      const userId = (store as StoreType)["id"];
      const { addressId, couponId } = query;

      try {
        const cart = await CartModel.findOne(
          {
            user: new mongoose.Types.ObjectId(userId),
            status: "active",
          },
          "-products.suggestions -products.dips",
        ).populate({
          path: "products.productId",
          select: "productName price images gst timing",
          populate: {
            path: "timing",
            select: "startTime endTime",
          },
        });

        if (!cart) {
          return { message: "No active cart found", status: false };
        }

        let currentServerTime = format(new Date(), "HH:mm");

        if (process.env.ENV === "PROD") {
          const updatedTime = add(new Date(), { hours: 5, minutes: 30 });
          currentServerTime = format(updatedTime, "HH:mm");
        }

        let discountPercentage = 0;
        if (couponId) {
          const coupon = await CouponModel.findById(couponId);
          if (!coupon) return { message: "Invalid coupon", status: false };
          discountPercentage = coupon.discount || 0;
        }

        let subtotal = 0;
        let totalDiscount = 0;
        let totalTax = 0;

        const updatedProducts = cart.products.map((product) => {
          const _product = product as any;
          const isAvailable = _product?.productId?.timing?.some((time: any) => {
            return (
              currentServerTime >= time.startTime &&
              currentServerTime <= time.endTime
            );
          });

          const originalPrice = _product.productId.price;
          const quantity = _product.quantity;

          const discountedPrice =
            originalPrice - (originalPrice * discountPercentage) / 100;
          const gstAmount =
            (discountedPrice * (_product.productId.gst || 0)) / 100;

          subtotal += discountedPrice * quantity;
          totalDiscount += (originalPrice - discountedPrice) * quantity;
          totalTax += gstAmount * quantity;

          return {
            ..._product._doc,
            available: isAvailable,
            discountedPrice: discountedPrice.toFixed(2),
            gstAmount: gstAmount.toFixed(2),
            finalPrice: (discountedPrice + gstAmount).toFixed(2),
          };
        });

        const filteredProducts = updatedProducts.filter(
          (product) => product.available === true,
        );

        subtotal = parseFloat(subtotal.toFixed(2));
        totalDiscount = parseFloat(totalDiscount.toFixed(2));
        totalTax = parseFloat(totalTax.toFixed(2));
        const totalPrice = parseFloat((subtotal + totalTax).toFixed(2));

        cart.products = filteredProducts;

        await cart.save();

        cart.subtotal = subtotal;
        cart.tax = totalTax;
        cart.totalPrice = totalPrice;

        const availableCoupons = await CouponModel.find({
          active: true,
          minPrice: { $lte: cart.totalPrice },
          maxPrice: { $gte: cart.totalPrice },
        }).sort({ discount: -1 });

        let restaurent = await StoreModel.findOne({});
        let restaurentCords = {
          lat: restaurent?.latitude || "8.176293718844061",
          long: restaurent?.longitude || "8.176293718844061",
        };

        if (addressId) {
          const config = await Config.findOne();

          if (!config) {
            throw new Error("Config not found");
          }

          let { freeDeliveryMinDistance, deliveryFreeAfter } = config;

          freeDeliveryMinDistance = Math.max(freeDeliveryMinDistance || 0, 0);
          deliveryFreeAfter = Math.max(deliveryFreeAfter || 0, 0);

          const address = await Address.findById(addressId);

          if (address) {
            const {
              distance: { value: calculatedDistance },
              duration: { value: calculatedSeconds },
            } = await calculateRoadDistance(
              Number(restaurentCords.lat),
              Number(restaurentCords.long),
              Number(address.latitude),
              Number(address.longitude),
              [],
            );

            cart.totalDistance = calculatedDistance;
            cart.deliverySeconds = calculatedSeconds;
            cart.platformFee = 5;

            let distanceToCharge = calculatedDistance / 1000;

            if (
              freeDeliveryMinDistance > 0 &&
              distanceToCharge <= freeDeliveryMinDistance
            ) {
              distanceToCharge = 0;
            }
            let deliveryFee = 0;
            if (distanceToCharge > freeDeliveryMinDistance) {
              let extraDistance = distanceToCharge - freeDeliveryMinDistance; 
              deliveryFee = Math.ceil(extraDistance) * 10;
            }

            if (deliveryFreeAfter > 0 && cart.totalPrice >= deliveryFreeAfter) {
              deliveryFee = 0;
            }

            cart.deliveryFee = deliveryFee;
          }
        } else {
          cart.totalDistance = 0;
          cart.deliverySeconds = 0;
          cart.deliveryFee = 0;
          cart.platformFee = 5;
        }

        const finalCart = await CartModel.findOne({
          user: userId,
          status: "active",
        });

        if (finalCart) {
          finalCart.tempCouponDiscount = discountPercentage;
          finalCart.tempDeliveryFee = cart.deliveryFee;

          await finalCart.save();
        }

        let finalPrice = cart.deliveryFee
          ? totalPrice + cart.deliveryFee
          : totalPrice;

        return {
          message: "Cart details retrieved successfully",
          status: true,
          totalDistance: cart.totalDistance,
          cart,
          subtotal,
          tax: totalTax,
          coupons: availableCoupons,
          deliveryFee: cart.deliveryFee,
          platformFee: cart.platformFee,
          deliverySeconds: cart.deliverySeconds,
          deliveryMinutes: 0,
          totalPrice: finalPrice,
          totalDiscount,
        };
      } catch (error) {
        console.log(error);
        set.status = 500;
        return {
          message: "Failed to get cart",
          status: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      detail: {
        summary: "Get a users cart",
        description: "Get a users cart",
      },
      query: t.Object({
        addressId: t.Optional(
          t.String({
            pattern: `^[a-fA-F0-9]{24}$`,
          }),
        ),
        couponId: t.Optional(
          t.String({
            default: "",
          }),
        ),
      }),
    },
  )
  .post(
    "/update",
    async ({ body, set, store }) => {
      const { products } = body;
      const userId = (store as StoreType)["id"];

      try {
        const user = await User.findById(userId);
        if (!user) {
          set.status = 404;
          throw new Error("User not found");
        }

        let cart = await CartModel.findOne({
          user: userId,
          status: "active",
        });

        if (!cart) {
          cart = await CartModel.create({
            user: userId,
            products: [],
            status: "active",
          });
        }

        let totalTax = 0;

        for (const product of products) {
          const productDoc = await Product.findById(product.productId);
          if (!productDoc) {
            throw new Error(`Product ${product.productId} not found`);
          }

          if (product.quantity < 1) {
            throw new Error(
              `Invalid quantity for product ${product.productId}`,
            );
          }

          const gstAmount =
            (productDoc.price * product.quantity * productDoc.gst) / 100;
          totalTax += gstAmount;

          const processedDips = await Promise.all(
            product.dips.map(async (dip) => {
              const dipDoc = await Dipping.findById(dip.productId);
              if (!dipDoc) {
                throw new Error(`Dip not found: ${dip.productId}`);
              }

              return {
                productId: dipDoc._id,
                quantity: dip.quantity,
                totalAmount: dip.quantity * dipDoc.price,
                price: dipDoc.price,
                name: dipDoc.name,
              };
            }),
          );

          const existingProductIndex = cart.products.findIndex(
            (p) => p.productId.toString() === product.productId,
          );

          if (existingProductIndex === -1) {
            const productTotal = product.quantity * productDoc.price;
            const dipsTotal = processedDips.reduce(
              (sum, dip) => sum + dip.totalAmount,
              0,
            );

            cart.products.push({
              productId: productDoc._id,
              quantity: product.quantity,
              totalAmount: productTotal + dipsTotal,
                //@ts-ignore
              suggestions: product.suggestions,
              customSuggestion: product.customSuggestion,
              dips: processedDips,
              price: productDoc.price,
            });
          } 
        }

        const subtotal = cart.products.reduce(
          (sum, product) => sum + product.totalAmount,
          0,
        );
        const tax = Number(totalTax.toFixed(2));
        const totalPrice = subtotal + tax;

        cart = await CartModel.findOneAndUpdate(
          { _id: cart._id },
          {
            $set: {
              products: cart.products,
              subtotal,
              tax,
              totalPrice,
              lastUpdated: new Date(),
            },
          },
          { new: true },
        );

        return {
          message: "Cart updated successfully",
          status: true,
          cart,
        };
      } catch (error) {
        console.error(error);
        set.status =
          error instanceof Error && error.message.includes("not found")
            ? 404
            : 400;
        return {
          message: "Failed to update cart",
          status: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      detail: {
        summary: "Update cart",
        description: "Update cart",
      },
      body: t.Object({
        products: t.Array(
          t.Object({
            productId: t.String({
              pattern: `^[a-fA-F0-9]{24}$`,
            }),
            image: t.Optional(
              t.String({
                default: "",
              }),
            ),
            quantity: t.Number({
              minimum: 1,
            }),
            customSuggestion: t.Optional(t.String()),
            suggestions: t.Array(t.String()),
            dips: t.Array(
              t.Object({
                quantity: t.Number({
                  minimum: 1,
                }),
                productId: t.String({
                  pattern: `^[a-fA-F0-9]{24}$`,
                }),
              }),
            ),
          }),
        ),
      }),
    },
  )
  .post(
    "/updatequantity",
    async ({ body, set, store }) => {
      const { productId, quantity } = body;
      const userId = (store as StoreType)["id"];

      try {
        const user = await User.findById(userId);
        if (!user) {
          set.status = 404;
          throw new Error("User not found");
        }

        const cart = await CartModel.findOne({
          user: userId,
          status: "active",
        });

        if (!cart) {
          set.status = 404;
          throw new Error("Cart not found");
        }

        const productDoc = await Product.findById(productId);
        if (!productDoc) {
          set.status = 404;
          throw new Error("Product not found");
        }

        if (quantity < 1) {
          set.status = 400;
          throw new Error("Invalid quantity");
        }

        const existingProductIndex = cart.products.findIndex(
          (p) => p.productId.toString() === productId,
        );

        if (existingProductIndex === -1) {
          set.status = 404;
          throw new Error("Product not found in cart");
        }

        const existingProduct = cart.products[existingProductIndex];
  

        const productGstAmount =
          (productDoc.price * productDoc.gst * quantity) / 100;

        let totalTax = productGstAmount;

        // @ts-ignore
        cart.products[existingProductIndex] = {
          ...existingProduct,
          quantity: quantity,
          totalAmount: quantity * productDoc.price ,
          productId: productDoc._id,
          price: productDoc.price,
          name: productDoc.productName,
          // dips: existingProduct!.dips || [],
          // suggestions: existingProduct!.suggestions || [],
          // customSuggestion: existingProduct!.customSuggestion,
        };

        const subtotal = cart.products.reduce(
          (sum, product) => sum + product.totalAmount,
          0,
        );
        const roundedTax = Math.round(totalTax * 100) / 100;

        const totalPrice = subtotal + roundedTax;

        const updatedCart = await CartModel.findOneAndUpdate(
          { _id: cart._id },
          {
            $set: {
              products: cart.products,
              subtotal,
              tax: roundedTax,
              totalPrice,
              lastUpdated: new Date(),
            },
          },
          { new: true },
        );

        return {
          message: "Cart updated successfully",
          status: true,
          cart: updatedCart,
        };
      } catch (error) {
        console.error(error);
        set.status = set.status || 400;
        return {
          message: "Failed to update cart",
          status: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      detail: {
        summary: "Update product quantity",
        description: "Update product quantity for an existing product in cart",
      },
      body: t.Object({
        productId: t.String({
          pattern: "^[a-fA-F0-9]{24}$",
        }),
        quantity: t.Number({
          minimum: 1,
        }),
      }),
    },
  )
  .delete(
    "/remove-product/:productId",
    async ({ params, set, store }) => {
      const userId = (store as StoreType)["id"];
      const { productId } = params;

      try {
        let cart = await CartModel.findOne({
          user: userId,
          status: "active",
        });

        if (!cart) {
          set.status = 404;
          throw new Error("Cart not found");
        }

        cart = await CartModel.findOneAndUpdate(
          { _id: cart._id },
          {
            $pull: {
              products: { productId: new mongoose.Types.ObjectId(productId) },
            },
          },
          { new: true },
        );

        if (!cart) {
          set.status = 404;
          throw new Error("Product not found in cart");
        }

        const subtotal = cart.products.reduce(
          (sum, product) => sum + product.totalAmount,
          0,
        );
        const tax = subtotal;
        const totalPrice = subtotal + tax;

        cart = await CartModel.findOneAndUpdate(
          { _id: cart._id },
          {
            $set: {
              subtotal,
              tax,
              totalPrice,
              lastUpdated: new Date(),
            },
          },
          { new: true },
        );

        return {
          message: "Product removed from cart",
          status: true,
          cart,
        };
      } catch (error) {
        set.status = 404;
        return {
          message: "Failed to remove product",
          status: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        productId: t.String({
          pattern: `^[a-fA-F0-9]{24}$`,
        }),
      }),
      detail: {
        summary: "Delete a users cart",
        description: "Delete a users cart",
      },
    },
  )
  .delete(
    "/removeall",
    async ({ set, store }) => {
      const userId = (store as StoreType)["id"];

      try {
        const cart = await CartModel.findOne({
          user: userId,
          status: "active",
        });

        if (!cart) {
          set.status = 404;
          throw new Error("Cart not found");
        }

        cart.products = [];
        cart.subtotal = 0;
        cart.tax = 0;
        cart.totalPrice = 0;

        await cart.save();

        return {
          message: "Cart removed successfully",
          status: true,
          cart,
        };
      } catch (error) {
        console.error(error);
        set.status = 500;
        return {
          message: "Failed to remove cart",
          status: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      detail: {
        summary: "Delete all products from user cart.",
        description: "Delete all products from user cart.",
      },
    },
  );
