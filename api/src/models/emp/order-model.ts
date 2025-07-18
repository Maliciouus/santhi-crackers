import { model, Schema, Types } from "mongoose";

interface OrderProduct {
  productId: Types.ObjectId;
  quantity: number;
  totalAmount: number;
  name: string;
  options?: Array<{
    title: string;
    value: string;
  }>;
}

interface Order {
  offerType: string;
  employee: Types.ObjectId;
  user: Types.ObjectId;
  products: OrderProduct[];
  address: {
    flatNo: string;
    area: string;
    nearbyPlaces: string;
  };
  store?: Types.ObjectId;
  orderId: string;
  deliveryPrice: number;
  platformFee: number;
  subtotal: number;
  tax: number;
  totalPrice: number;
  status: string;
  invoiceId: string;
  paymentStatus: "pending" | "completed" | "failed";
  preparedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmpOrderSchema = new Schema<Order>(
  {
    employee:{
        type: Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
        index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "PreUser",
      required: true,
      index: true,
    },
    orderId: {
      type: String,
    },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        options: [
          {
            title: String,
            value: String,
          },
        ],
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity must be at least 1"],
        },
        name: String,
      },
    ],
    // Direct address object
    address: {
      flatNo: { type: String, required: true },
      area: { type: String, required: true },
      nearbyPlaces: { type: String, required: true },
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    invoiceId: String,
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"],
    },
    tax: {
      type: Number,
      required: true,
      min: [0, "Tax cannot be negative"],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price cannot be negative"],
    },
    status: {
      type: String,
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

EmpOrderSchema.index({ user: 1, createdAt: -1 });
EmpOrderSchema.index({ status: 1 });
EmpOrderSchema.index({ deliveryAgent: 1, status: 1 });

export const EmpOrderModel = model<Order>("EmpOrder", EmpOrderSchema);