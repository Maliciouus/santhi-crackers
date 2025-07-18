import { calculateRoadDistance } from "@/lib/util";
import { Config } from "@/models/config-model";
import { CouponModel } from "@/models/coupon-model";
import { Dipping } from "@/models/dippings-model";
import { Product } from "@/models/product";
import { StoreModel } from "@/models/store-model";
import { User } from "@/models/user-model";
import { Address } from "@/models/user/address-model";
import  ComboOffer  from "@/models/combo-model";
import { StoreType } from "@/types";
import { add, format } from "date-fns";
import Elysia, { t } from "elysia";
import mongoose from "mongoose";
import { Employee } from "@/models/emp/employee-model";
import { EmpCartModel } from "@/models/emp/cart-model";

export const userCartController = new Elysia({
  prefix: "/cart",
  detail: {
    tags: ["User - Cart"],
    security: [{ bearerAuth: [] }],
  },
})
.get("/", async ({ store, set, query }) => {
  const empId = (store as StoreType)["id"];
  const { addressId } = query;

  try {
    const cart = await EmpCartModel.findOne({
      emp: new mongoose.Types.ObjectId(empId),
      status: "active",
    }).populate({
      path: "products.productId",
      select: "productName comboName comboPrice price images gst stock strikePrice",
    });

    if (!cart) {
      return { message: "No active cart found", status: false };
    }

    const employee = await Employee.findById(empId);
    if (!employee) {
      return { message: "Employee not found", status: false };
    }

    // Handle missing or combo product patch
    for (let i = 0; i < cart.products.length; i++) {
      const product = cart.products[i];

      if (!product.productId || !product.productId.productName) {
        const rawId = product._id.toString();
        const cartItem = await EmpCartModel.findOne(
          { "products._id": rawId },
          { "products.$": 1 }
        );
        const actualId = cartItem?.products?.[0]?.productId;

        const combo = await ComboOffer.findById(actualId);
        if (combo) {
          const fakeProduct: any = {
            _id: combo._id,
            productName: combo.comboName,
            price: combo.comboPrice,
            strikePrice: combo.strikePrice,
            images: [combo.image],
            gst: 0,
            isCombo: true,
            comboDescription: combo.comboDescription,
            productsIncluded: combo.productsIncluded,
          };
          cart.products[i].productId = fakeProduct;
        }
      }
    }

    const storeData = await StoreModel.findOne({});
    const storeCords = {
      lat: storeData?.latitude || "8.176293718844061",
      long: storeData?.longitude || "8.176293718844061",
    };

    if (addressId) {
      const config = await Config.findOne();
      if (!config) throw new Error("Config not found");

      const {
        freeDeliveryMinDistance = 0,
        deliveryFreeAfter = 0,
      } = config;

      const address = await Address.findById(addressId);
      if (address) {
        const {
          distance: { value: calculatedDistance },
          duration: { value: calculatedSeconds },
        } = await calculateRoadDistance(
          Number(storeCords.lat),
          Number(storeCords.long),
          Number(address.latitude),
          Number(address.longitude),
          []
        );

        cart.totalDistance = calculatedDistance;
        cart.deliverySeconds = calculatedSeconds;
        cart.platformFee = 5;

        let distanceToCharge = Math.max(
          calculatedDistance / 1000 - freeDeliveryMinDistance,
          0
        );
        let deliveryFee = Math.ceil(distanceToCharge * 10);

        if (deliveryFreeAfter > 0) {
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

    await cart.save();

    return {
      message: "Cart details retrieved successfully",
      status: true,
      cart,
      deliveryFee: cart.deliveryFee,
      platformFee: cart.platformFee,
      totalDistance: cart.totalDistance,
      deliverySeconds: cart.deliverySeconds,
      deliveryMinutes: Math.ceil(cart.deliverySeconds / 60),
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
    const empId = (store as StoreType)["id"];

    try {
      const employee = await Employee.findById(empId);
      if (!employee) {  // Fixed variable name (was Employee)
        set.status = 404;
        return { message: "Employee not found", status: false };
      }

      let cart = await EmpCartModel.findOne({ emp: empId, status: "active" });

      if (!cart) {
        cart = await EmpCartModel.create({
          emp: empId,
          products: [],
          status: "active",
          subtotal: 0,
          tax: 0,
          totalPrice: 0
        });
      }

      // For employees, we'll set all amounts to 0
      const isEmployee = employee?.role === 'employee';

      let updatedProducts = [...cart.products];

      for (const product of products) {
        let productDoc = await Product.findById(product.productId).select("price gst");
        let isCombo = false;
        
        if (!productDoc) {
          productDoc = await ComboOffer.findById(product.productId).select("price gst");
          if (!productDoc) {
            set.status = 404;
            return { message: `Product ${product.productId} not found in Product or ComboOffer`, status: false };
          }
          isCombo = true;
        }

        if (product.quantity < 1) {
          set.status = 400;
          return { message: `Invalid quantity for product ${product.productId}`, status: false };
        }

        const productData = {
          productId: productDoc._id,
          quantity: product.quantity,
          totalAmount: 0, // Always 0 for employees
          price: 0,       // Always 0 for employees
          options: product.options || [],
          // No offers for employees
          selectedOffer: undefined
        };

        const existingProductIndex = updatedProducts.findIndex(p => 
          p.productId.toString() === productDoc._id.toString()
        );

        if (existingProductIndex !== -1) {
          updatedProducts[existingProductIndex] = productData;
        } else {
          updatedProducts.push(productData);
        }
      }

      // Always set financial values to 0 for employees
      const updateData = {
        products: updatedProducts,
        subtotal: 0,
        tax: 0,
        totalPrice: 0,
        lastUpdated: new Date()
      };

      cart = await EmpCartModel.findOneAndUpdate(
        { _id: cart._id },
        { $set: updateData },
        { new: true }
      ).populate('products.productId');

      return {
        message: "Cart updated successfully",
        status: true,
        cart,
        summary: {
          subtotalBeforeDiscount: 0,
          totalDiscount: 0,
          subtotal: 0,
          tax: 0,
          totalPrice: 0
        }
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
  }
)
.post(
  "/updatequantity",
  async ({ body, set, store }) => {
    const { productId, quantity } = body;
    const empId = (store as StoreType)["id"];

    try {
      const emp = await Employee.findById(empId);
      if (!emp) {
        set.status = 404;
        throw new Error("Employee not found");
      }

      const cart = await EmpCartModel.findOne({
        emp: empId,
        status: "active",
      });

      if (!cart) {
        set.status = 404;
        throw new Error("Cart not found");
      }

      // Check Product model first
      let productDoc = await Product.findById(productId).select("productName");
      let isCombo = false;

      // If not found in Product, check ComboOffer model
      if (!productDoc) {
        productDoc = await ComboOffer.findById(productId).select("comboName");
        if (!productDoc) {
          set.status = 404;
          throw new Error("Product not found");
        }
        isCombo = true;
      }

      const name = isCombo ? productDoc.comboName : productDoc.productName;

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

      // Update only quantity and basic info, set financials to 0
      cart.products[existingProductIndex] = {
        ...existingProduct,
        quantity: quantity,
        totalAmount: 0,
        price: 0,
        name: name,
        productId: productDoc._id,
        options: existingProduct.options,
      };

      const updatedCart = await EmpCartModel.findOneAndUpdate(
        { _id: cart._id },
        {
          $set: {
            products: cart.products,
            subtotal: 0,
            tax: 0,
            totalPrice: 0,
            lastUpdated: new Date(),
          },
        },
        { new: true }
      ).select("-subtotal -tax -totalPrice"); // Do not return financial fields

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
      summary: "Update product quantity (no financials)",
      description: "Update product quantity without applying financials or offers",
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
      const empId = (store as StoreType)["id"];
      const { productId } = params;

      try {
        let cart = await EmpCartModel.findOne({
          emp: empId,
          status: "active",
        });

        if (!cart) {
          set.status = 404;
          throw new Error("Cart not found");
        }

        cart = await EmpCartModel.findOneAndUpdate(
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

        cart = await EmpCartModel.findOneAndUpdate(
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
        const cart = await EmpCartModel.findOne({
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
      const empId = (store as StoreType)["id"];

      try {
        const cart = await EmpCartModel.findOne({
          emp: new mongoose.Types.ObjectId(empId),
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
    const { products } = body;
    const empId = (store as StoreType)["id"];
  
    try {
      const emp = await Employee.findById(empId);
      if (!emp) {
        set.status = 404;
        return { message: "Employee not found", status: false };
      }
  
      let cart = await EmpCartModel.findOne({ emp: empId, status: "active" });
      if (!cart) {
        cart = await EmpCartModel.create({
          emp: empId,
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
  
        let cart = await EmpCartModel.findOne({ user: userId, status: "active" });
  
        if (!cart) {
          cart = await EmpCartModel.create({
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
            updatedProducts[existingProductIndex].quantity += product.quantity;
            updatedProducts[existingProductIndex].totalAmount += productTotal;
          } else {
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
              p.selectedOffer?.onMRP?.subType === 'Complementary' &&
              p.selectedOffer?.onMRP?.productId?.toString() === product.productId
            );
  
            if (existingCompIndex !== -1) {
              updatedProducts[existingCompIndex] = compProductData;
            } else {
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
  
        cart = await EmpCartModel.findOneAndUpdate(
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
  
  
  