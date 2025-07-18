import { model, Schema, Types } from "mongoose";

interface CartProduct {
  offerType: string;
  productId: Types.ObjectId;
  selectedOffer: {
    onMRP: any;
    type: {
      offerType: {
        type: String,
        enum: ['Discount', 'onMRP', 'Flat', 'Negotiate'],
        required: true,
      },
      discount: Number,
      onMRP: {
        subType: {
          type: String,
          enum: ['Need', 'Complimentary'],
        },
        message: String,
        productId: {
          type: Types.ObjectId,
          ref: "Product",
        },
        
        reductionValue: Number,
      },
      flatAmount: Number,
      negotiate: {
        negotiatedPrice: {
          type: Number,
        },
        attempts: [{
          amount: {
            type: Number,
          },
          attemptNumber: {
            type: Number,
          },
          _id: false
        }],
      },
    },
    required: false,
  },
  quantity: number;
  totalAmount: number;
  options?: { [key: string]: any }; // Dynamic options object
  name?: string;
  price: number;
}

interface Cart {
  user: Types.ObjectId;
  products: CartProduct[];
  subtotal: number;
  tax: number;
  totalPrice: number;
  status: "active" | "completed" | "abandoned";
  lastUpdated: Date;
  totalDistance?: number;
  deliveryFee?: number;
  deliverySeconds?: number;
  platformFee?: number;
  tempCouponDiscount?: number;
  gstAmount?: number;
  finalPrice?: number;
  tempDeliveryFee?: number;
}


const CartProductSchema = new Schema<CartProduct>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  selectedOffer: {
    type: {
      offerType: {
        type: String,
        enum: ['Discount', 'onMRP', 'Flat', 'Negotiate'],
        required: true,
      },
      discount: {
        type: Number,
        required: function() {
          return this.offerType === 'Discount';
        },
      },
      onMRP: {
        type: {
          subType: {
            type: String,
            enum: ['Need', 'Complementary'],
            required: true,
          },
          message: {
            type: String,
            required: function() {
                  //@ts-ignore
              return this.subType === 'Need';
            },
          },
          productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: function() {
                  //@ts-ignore
              return this.subType === 'Complimentary';
            },
          },
          reductionValue: {
            type: Number,
            required: true,
          },
        },
        required: function() {
              //@ts-ignore
          return this.offerType === 'onMRP';
        },
      },
      flatAmount: {
        type: Number,
        required: function() {
          return this.offerType === 'Flat';
        },
      },
      negotiate: {
        type: {
          negotiatedPrice: {
            type: Number,
          },
          attempts: [
            {
              amount: Number,
              attemptNumber: Number,
            },
          ],
        },
        required: function() {
          return this.offerType === 'Negotiate';
        },
      },
    },
    required: false,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, "Total amount cannot be negative"],
  },
  options: [
    {
      title: String,
      value: String,
    },
  ],
  name: String,
  price: {
    type: Number,
    required: true,
    default: 0,
  },
});


const CartSchema = new Schema<Cart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    products: [CartProductSchema],
    tempCouponDiscount: {
      type: Number,
      default: 0,
    },
    gstAmount: {
      type: Number,
    },
    finalPrice: {
      type: Number,
    },
    tempDeliveryFee: {
      type: Number,
    },
    subtotal: {
      type: Number,
      default: 0,
      min: [0, "Subtotal cannot be negative"],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, "Tax cannot be negative"],
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: [0, "Total price cannot be negative"],
    },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    totalDistance: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    deliverySeconds: {
      type: Number,
      default: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

CartSchema.index({ user: 1, status: 1 });
CartSchema.index({ lastUpdated: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // Auto-delete after 7 days

export const CartModel = model<Cart>("Cart", CartSchema);