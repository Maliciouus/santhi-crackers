import { calculateRoadDistance } from "@/lib/util";
import { Config } from "@/models/config-model";
import { CouponModel } from "@/models/coupon-model";
import { Dipping } from "@/models/dippings-model";
import { Product } from "@/models/product";
import { StoreModel } from "@/models/store-model";
import { User } from "@/models/user-model";
import { Address } from "@/models/user/address-model";
import { CartModel } from "@/models/user/cart-model";
import  ComboOffer  from "@/models/combo-model";
import { StoreType } from "@/types";
import { add, format } from "date-fns";
import Elysia, { t } from "elysia";
import mongoose from "mongoose";
import { FlatOffer } from "@/models/offer-model";
import { broadcastMessage } from "@/lib/ws-store";
import { sendNotification } from "@/lib/firebase";
import { NotificationModel } from "@/models/notification-model";

export const userCartController = new Elysia({
  prefix: "/cart",
  detail: {
    tags: ["User - Cart"],
    security: [{ bearerAuth: [] }],
  },
})
.get("/", async ({ store, set, query }) => {
  const userId = (store as StoreType)["id"];
  const { addressId, couponCode } = query;

  try {
    const cart = await CartModel.findOne({
      user: new mongoose.Types.ObjectId(userId),
      status: "active",
    }).populate({
      path: "products.productId",
      select: "productName comboName comboPrice price images gst stock discount",
    });

    if (!cart) {
      return { message: "No active cart found", status: false };
    }

    const user = await User.findById(userId);
    if (!user) {
      return { message: "User not found", status: false };
    }

    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    // Calculate subtotal, tax, and discount
    for (const product of cart.products) {
      let _product = product as any;
      let basePrice = _product.productId?.price || 0;
      let finalPrice = basePrice;

      // Calculate discount based on product discount
      const discountPercent = _product.productId?.discount || 0;
      const discountAmount = basePrice * (discountPercent / 100);
      finalPrice = basePrice - discountAmount;
      totalDiscount += discountAmount * _product.quantity;

      _product.price = finalPrice;
      _product.totalAmount = finalPrice * _product.quantity;
      subtotal += _product.totalAmount;

      // Calculate GST
      const gstAmount = (finalPrice * _product.quantity * (_product.productId?.gst || 0)) / 100;
      totalTax += gstAmount;
    }

    const roundedTax = Math.round(totalTax * 100) / 100;
    let totalPrice = subtotal + roundedTax;

    // Coupon validation and application
    let couponDiscount = 0;
    let couponErrorMessage = null;

    if (couponCode) {
      const coupon = await CouponModel.findOne({ code: couponCode, active: true, deletedAt: null });
      if (coupon) {
        const isValid = subtotal >= coupon.minPrice && subtotal <= coupon.maxPrice;
        if (isValid) {
          couponDiscount = (subtotal * coupon.discount) / 100;
          totalPrice -= couponDiscount;
          totalDiscount += couponDiscount;
        } else {
          couponErrorMessage = "Coupon not applicable: Subtotal does not meet price range";
        }
      } else {
        couponErrorMessage = "Invalid or inactive coupon code";
      }
    }

    // Update the response cart totals
    const responseCart = {
      ...cart.toObject(),
      subtotal,
      tax: roundedTax,
      totalPrice,
    };

    const availableCoupons = await CouponModel.find({
      active: true,
      minPrice: { $lte: totalPrice },
      maxPrice: { $gte: totalPrice },
    }).sort({ discount: -1 });

    const storeData = await StoreModel.findOne({});
    const storeCords = {
      lat: storeData?.latitude || "8.176293718844061",
      long: storeData?.longitude || "8.176293718844061",
    };

    if (addressId) {
      const config = await Config.findOne();
      if (!config) throw new Error("Config not found");

      let { freeDeliveryMinDistance = 0, deliveryFreeAfter = 0 } = config;

      const address = await Address.findById(addressId);
      if (address) {
        const { distance: { value: calculatedDistance }, duration: { value: calculatedSeconds } } = await calculateRoadDistance(
          Number(storeCords.lat),
          Number(storeCords.long),
          Number(address.latitude),
          Number(address.longitude),
          []
        );

        responseCart.totalDistance = calculatedDistance;
        responseCart.deliverySeconds = calculatedSeconds;
        responseCart.platformFee = 5;

        let distanceToCharge = Math.max(calculatedDistance / 1000 - freeDeliveryMinDistance, 0);
        let deliveryFee = Math.ceil(distanceToCharge * 10);

        if (deliveryFreeAfter > 0 && totalPrice >= deliveryFreeAfter) {
          deliveryFee = 0;
        }

        responseCart.deliveryFee = deliveryFee;
      }
    } else {
      responseCart.totalDistance = 0;
      responseCart.deliverySeconds = 0;
      responseCart.deliveryFee = 0;
      responseCart.platformFee = 5;
    }

    return {
      message: "Cart details retrieved successfully",
      status: true,
      totalDistance: responseCart.totalDistance,
      cart: responseCart,
      summary: {
        subtotal,
        totalDiscount,
        tax: roundedTax,
        totalPrice,
        couponDiscount,
      },
      deliveryFee: responseCart.deliveryFee,
      platformFee: responseCart.platformFee,
      coupons: availableCoupons,
      deliverySeconds: responseCart.deliverySeconds,
      deliveryMinutes: Math.ceil(responseCart.deliverySeconds / 60),
      couponError: couponErrorMessage,
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
})
.post(
  "/update",
  async ({ body, set, store }) => {
    const { products } = body;
    const userId = (store as StoreType)["id"];

    try {
      const user = await User.findById(userId);
      if (!user) {
        set.status = 404;
        return { message: "User not found", status: false };
      }

      let cart = await CartModel.findOne({ user: userId, status: "active" });
      if (!cart) {
        cart = await CartModel.create({
          user: userId,
          products: [],
          status: "active",
        });
      }

      let totalTax = 0;
      // Start with existing products
      let updatedProducts = [...cart.products];

      for (const product of products) {
        const { productId, quantity, options = [] } = product;

        if (quantity < 1) {
          set.status = 400;
          return { message: `Invalid quantity for product ${productId}`, status: false };
        }

        // Try finding product from Product or ComboOffer
        let productDoc = await Product.findById(productId)
          .select("price gst discount name description images stock");
        if (!productDoc) {
          productDoc = await ComboOffer.findById(productId)
            .select("price gst discount name description images");
          if (!productDoc) {
            set.status = 404;
            return { message: `Product ${productId} not found`, status: false };
          }
        }

        // Check stock for regular products
        if (productDoc instanceof Product && productDoc.stock < quantity) {
          set.status = 400;
          return { 
            message: `Only ${productDoc.stock} items available for ${productDoc.name}`,
            status: false 
          };
        }

        const basePrice = productDoc.price;
        const discount = productDoc.discount || 0;
        const discountedPrice = basePrice - (basePrice * discount / 100);
        const productTotal = quantity * discountedPrice;
        const gstAmount = (productTotal * productDoc.gst) / 100;
        totalTax += gstAmount;

        // Check if product already exists in cart
        const existingIndex = updatedProducts.findIndex(
          p => p.productId.toString() === productId.toString()
        );

        const productData = {
          productId: productDoc._id,
          quantity,
          price: discountedPrice,
          totalAmount: productTotal,
          options,
          name: productDoc.name,
          image: productDoc.images?.[0] || null,
          discount
        };

        if (existingIndex !== -1) {
          // Update existing product
          updatedProducts[existingIndex] = productData;
        } else {
          // Add new product
          updatedProducts.push(productData);
        }
      }

      const subtotal = updatedProducts.reduce((sum, p) => sum + p.totalAmount, 0);
      const tax = Number(totalTax.toFixed(2));
      const totalPrice = subtotal + tax;

      cart = await CartModel.findOneAndUpdate(
        { _id: cart._id },
        {
          $set: {
            products: updatedProducts,
            subtotal,
            tax,
            totalPrice,
            lastUpdated: new Date(),
          },
        },
        { new: true }
      ).populate({
        path: "products.productId",
        select: "name price images",
        model: "Product"
      });

      return {
        message: "Cart updated successfully",
        status: true,
        cart,
        summary: {
          subtotal,
          tax,
          totalPrice,
        },
      };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return {
        message: "Failed to update cart",
        status: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
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

      // Check Product model first
      let productDoc = await Product.findById(productId).select("price gst productName");
      let isCombo = false;

      // If not found in Product, check ComboOffer model
      if (!productDoc) {
        productDoc = await ComboOffer.findById(productId).select("comboPrice gst comboName");
        if (!productDoc) {
          set.status = 404;
          throw new Error("Product not found");
        }
        isCombo = true;
      }

      // Determine price, gst, and name based on model
          //@ts-ignore
      const price = isCombo ? productDoc.comboPrice : productDoc.price;
      const gst = isCombo?5:productDoc.gst; // Assuming gst field exists in both models
          //@ts-ignore
      const name = isCombo ? productDoc.comboName : productDoc.productName;

      // Debug: Log product details
      // console.log("Product Details:", {
      //   productId,
      //   price,
      //   gst,
      //   name,
      //   isCombo,
      // });

      // Validate price and gst
      if (typeof price !== "number" || isNaN(price)) {
        console.error("Invalid price:", price);
        set.status = 400;
        throw new Error("Invalid product price");
      }
      if (typeof gst !== "number" || isNaN(gst)) {
        console.error("Invalid gst:", gst);
        set.status = 400;
        throw new Error("Invalid product GST");
      }

      if (quantity < 1) {
        set.status = 400;
        throw new Error("Invalid quantity");
      }

      const existingProductIndex = cart.products.findIndex(
        (p) => p.productId.toString() === productId
      );

      if (existingProductIndex === -1) {
        set.status = 404;
        throw new Error("Product not found in cart");
      }

      const existingProduct = cart.products[existingProductIndex];

      // Calculate GST
      const productGstAmount = (price * gst * quantity) / 100;
      console.log("GST Calculation:", {
        price,
        gst,
        quantity,
        productGstAmount,
      });

      let totalTax = productGstAmount;
      console.log("Total Tax:", totalTax);

      // Update product in cart
      cart.products[existingProductIndex] = {
        ...existingProduct,
        quantity: quantity,
        totalAmount: quantity * price,
        productId: productDoc._id,
        price: price,
        name: name,
            //@ts-ignore
        options: existingProduct.options,
            //@ts-ignore
        selectedOffer: existingProduct?.selectedOffer,
      };

      // Debug: Log updated product
      console.log("Updated Product:", cart.products[existingProductIndex]);

      // Calculate subtotal
      const subtotal = cart.products.reduce(
        (sum, product) => {
          const amount = typeof product.totalAmount === "number" && !isNaN(product.totalAmount) ? product.totalAmount : 0;
          console.log("Product in Subtotal:", {
            productId: product.productId.toString(),
            totalAmount: product.totalAmount,
            amountUsed: amount,
          });
          return sum + amount;
        },
        0
      );
      console.log("Subtotal:", subtotal);

      // Calculate rounded tax
      const roundedTax = Math.round(totalTax * 100) / 100;
      console.log("Rounded Tax:", roundedTax);

      // Calculate total price
      const totalPrice = subtotal + roundedTax;
      console.log("Total Price:", totalPrice);

      // Validate totalPrice
      if (isNaN(totalPrice)) {
        console.error("Total Price is NaN", { subtotal, roundedTax });
        set.status = 400;
        throw new Error("Invalid total price calculation");
      }

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
        { new: true }
      );

      return {
        message: "Cart updated successfully",
        status: true,
        cart: updatedCart,
      };
    } catch (error) {
      console.error("Error in updatequantity:", error);
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
  }
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
          { new: true }
        );

        if (!cart) {
          set.status = 404;
          throw new Error("Product not found in cart");
        }

        const subtotal = cart.products.reduce(
          (sum, product) => sum + product.totalAmount,
          0
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
          { new: true }
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
    }
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
    }
  )
  .get(
    "/count",
    async ({ store, set }) => {
      const userId = (store as StoreType)["id"];

      try {
        const cart = await CartModel.findOne({
          user: new mongoose.Types.ObjectId(userId),
          status: "active",
        });

        if (!cart) {
          return {
            message: "No active cart found",
            status: true, // Still a successful response, just no cart
            count: 0,
          };
        }

        const productCount = cart.products.reduce((total, item) => total + (item.quantity || 0), 0);

        return {
          message: "Cart product count retrieved successfully",
          status: true,
          count: productCount,
        };
      } catch (error) {
        console.log(error);
        set.status = 500;
        return {
          message: "Failed to get cart product count",
          status: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      detail: {
        summary: "Get user's cart product count",
        description: "Retrieve the number of products in the user's active cart",
      },
    }
  )
  .post("/updateCombo", async ({ body, set, store }) => {
    //@ts-ignore
    const { products } = body;
    const userId = (store as StoreType)["id"];
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        set.status = 404;
        return { message: "User not found", status: false };
      }
  
      let cart = await CartModel.findOne({ user: userId, status: "active" });
      if (!cart) {
        cart = await CartModel.create({
          user: userId,
          products: [],
          status: "active",
        });
      }
  
      let totalTax = 0;
      let subtotalBeforeDiscount = 0;
      let totalDiscount = 0;
  
      const comboProductIds = products.map((p: { productId: { toString: () => any; }; }) => p.productId.toString());
  
      // Keep only non-combo products in cart
      const existingNonComboProducts = cart.products.filter(
        (p: any) => !comboProductIds.includes(p.productId.toString())
      );
  
      const updatedComboProducts = [];
  
      for (const product of products) {
        const productDoc = await ComboOffer.findById(product.productId);
        const gst = 5;
  
        if (!productDoc) {
          set.status = 404;
          return {
            message: `Product ${product.productId} not found in ComboOffer`,
            status: false,
          };
        }
  
        if (product.quantity < 1) {
          set.status = 400;
          return {
            message: `Invalid quantity for product ${product.productId}`,
            status: false,
          };
        }
  
        const basePrice = productDoc.comboPrice;
        let finalPrice = basePrice;
        const productTotal = finalPrice * product.quantity;
        const taxAmount = Math.round((productTotal * gst) / 100);
        totalTax += taxAmount;
        subtotalBeforeDiscount += basePrice * product.quantity;
  
        updatedComboProducts.push({
          productId: productDoc._id,
          quantity: product.quantity,
          price: finalPrice,
          totalAmount: productTotal,
          options: product.options || [],
          name: productDoc.comboName,
        });
      }
  
      const finalProductList = [...existingNonComboProducts, ...updatedComboProducts];
  
      const subtotal = finalProductList.reduce((sum, p: any) => sum + p.totalAmount, 0);
      const platformFee = 5;
      //@ts-ignore
      cart.products = finalProductList;
      cart.tempCouponDiscount = 0;
      cart.subtotal = subtotal;
      cart.tax = totalTax;
      cart.totalPrice = subtotal + totalTax + platformFee;
      cart.platformFee = platformFee;
      cart.lastUpdated = new Date();
  
      await cart.save();
  
      return {
        message: "Cart updated successfully",
        status: true,
        cart,
        summary: {
          subtotalBeforeDiscount,
          totalDiscount,
          subtotal,
          tax: totalTax,
          totalPrice: cart.totalPrice,
        },
      };
    } catch (err) {
      console.error("Error updating cart:", err);
      set.status = 500;
      return { message: "Something went wrong", status: false };
    }
  })


  .post(
    "/reorder",
    async ({ body, set, store }) => {
      const { products } = body;
      const userId = (store as StoreType)["id"];
  
      try {
        const user = await User.findById(userId);
        if (!user) {
          set.status = 404;
          return { message: "User not found", status: false };
        }
  
        let cart = await CartModel.findOne({ user: userId, status: "active" });
  
        if (!cart) {
          cart = await CartModel.create({
            user: userId,
            products: [],
            status: "active",
          });
        }
  
        let totalTax = 0;
        let updatedProducts = [...cart.products];
        let totalDiscount = 0;
        let subtotalBeforeDiscount = 0;
  
        for (const product of products) {
          let productDoc = await Product.findById(product.productId).select("price gst");
          let isCombo = false;
  
          if (!productDoc) {
            productDoc = await ComboOffer.findById(product.productId).select("price gst");
            if (!productDoc) {
              set.status = 404;
              return { message: `Product ${product.productId} not found`, status: false };
            }
            isCombo = true;
          }
  
          if (product.quantity < 1) {
            set.status = 400;
            return { message: `Invalid quantity for product ${product.productId}`, status: false };
          }
  
          const basePrice = productDoc.price;
          subtotalBeforeDiscount += basePrice * product.quantity;
  
          let selectedOffer = null;
          let finalPrice = basePrice;
          let discountAmount = 0;
  
          if (product.selectedOffer?.offerType === 'Flat') {
            selectedOffer = {
              offerType: 'Flat',
              flatAmount: product.selectedOffer.flatAmount,
            };
      //@ts-ignore
            discountAmount = product.selectedOffer.flatAmount;
            finalPrice = basePrice - discountAmount;
            totalDiscount += discountAmount * product.quantity;
          }
  
          const productTotal = product.quantity * finalPrice;
  
          const productData = {
            productId: productDoc._id,
            quantity: product.quantity,
            totalAmount: productTotal,
            price: finalPrice,
            options: product.options || [],
            ...(selectedOffer && { selectedOffer }),
          };
  
          const existingProductIndex = updatedProducts.findIndex(p =>
            p.productId.toString() === productDoc._id.toString()
          );
  
          if (existingProductIndex !== -1) {
            // Merge quantities and total
                //@ts-ignore
            updatedProducts[existingProductIndex].quantity += product.quantity;
                //@ts-ignore
            updatedProducts[existingProductIndex].totalAmount += productTotal;
          } else {
                //@ts-ignore
            updatedProducts.push(productData);

          }
  
          const gstAmount = (finalPrice * product.quantity * productDoc.gst) / 100;
          totalTax += gstAmount;
        }
  
        for (const product of products) {
          if (
            product.selectedOffer?.offerType === 'onMRP' &&
            product.selectedOffer.onMRP?.subType === 'Complementary' &&
            product.selectedOffer.onMRP.productId
          ) {
            const complementaryProduct = await Product.findById(product.selectedOffer.onMRP.productId).select("price gst");
            if (!complementaryProduct) {
              set.status = 404;
              return { message: `Complementary product ${product.selectedOffer.onMRP.productId} not found`, status: false };
            }
  
            const compProductData = {
              productId: complementaryProduct._id,
              quantity: 1,
              totalAmount: 0,
              price: 0,
              options: [],
              selectedOffer: {
                offerType: 'onMRP',
                onMRP: {
                  subType: 'Complementary',
                  reductionValue: 100,
                  productId: product.productId,
                },
              },
            };
  
            const existingCompIndex = updatedProducts.findIndex(p =>
              p.productId.toString() === complementaryProduct._id.toString() &&
                  //@ts-ignore
              p.selectedOffer?.onMRP?.subType === 'Complementary' &&
                  //@ts-ignore
              p.selectedOffer?.onMRP?.productId?.toString() === product.productId
            );
  
            if (existingCompIndex !== -1) {
                  //@ts-ignore
              updatedProducts[existingCompIndex] = compProductData;
            } else {
                  //@ts-ignore
              updatedProducts.push(compProductData);
            }
          }
        }
  
        const seenComplementary = new Set();
        updatedProducts = updatedProducts.filter(product => {
          if (product.selectedOffer?.onMRP?.subType === 'Complementary') {
            const key = `${product.productId}_${product.selectedOffer.onMRP.productId}`;
            if (seenComplementary.has(key)) return false;
            seenComplementary.add(key);
          }
          return true;
        });
  
        const subtotal = updatedProducts.reduce((sum, product) => sum + product.totalAmount, 0);
        const tax = Number(totalTax.toFixed(2));
        const totalPrice = subtotal + tax;
  
        cart = await CartModel.findOneAndUpdate(
          { _id: cart._id },
          {
            $set: {
              products: updatedProducts,
              subtotal,
              tax,
              totalPrice,
              lastUpdated: new Date(),
            },
          },
          { new: true }
        )
          .populate('products.productId')
          .populate('products.selectedOffer.onMRP.productId');
  
        return {
          message: "Cart updated successfully",
          status: true,
          cart,
          summary: {
            subtotalBeforeDiscount,
            totalDiscount,
            subtotal,
            tax,
            totalPrice,
          },
        };
      } catch (error) {
        console.error(error);
        set.status = error instanceof Error && error.message.includes("not found") ? 404 : 400;
        return {
          message: "Failed to update cart",
          status: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      detail: {
        summary: "Reorder products to cart",
        description: "Add products to cart with optional reorder mode (merge quantities)",
      },
      body: t.Object({
        products: t.Array(
          t.Object({
            productId: t.String({
              pattern: "^[a-fA-F0-9]{24}$",
            }),
            quantity: t.Number({
              minimum: 1,
            }),
            options: t.Optional(t.Array(t.Any())),
            selectedOffer: t.Optional(
              t.Union([
                t.Object({
                  offerType: t.Union([
                    t.Literal('Discount'),
                    t.Literal('onMRP'),
                    t.Literal('Flat'),
                    t.Literal('Negotiate'),
                  ]),
                  discount: t.Optional(t.Number()),
                  onMRP: t.Optional(
                    t.Object({
                      subType: t.Union([
                        t.Literal('Need'),
                        t.Literal('Complementary'),
                      ]),
                      reductionValue: t.Number(),
                      message: t.Optional(t.String()),
                      productId: t.Optional(t.String({
                        pattern: "^[a-fA-F0-9]{24}$",
                      })),
                    })
                  ),
                  flatAmount: t.Optional(t.Number()),
                  negotiate: t.Optional(
                    t.Object({
                      negotiatedPrice: t.Number(),
                      attempts: t.Optional(
                        t.Array(
                          t.Object({
                            amount: t.Number(),
                            attemptNumber: t.Number(),
                          })
                        )
                      ),
                    })
                  ),
                }),
                t.Null()
              ])
            ),
          })
        ),
      }),
    }
  );
  
  
  