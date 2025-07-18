import { Schema, model } from "mongoose";

interface DeliveryAgent {
  phone: String;
  name: string;
  password: string;
  image: string;
  role: string;
  active: boolean;
  isDeleted: boolean;
  employeeId: string;
  fcmToken: string;
  totalRatings: number;
  ratings: string;
}

const delivberyAgentSchema = new Schema<DeliveryAgent>(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    ratings: {
      type: String,
    },
    totalRatings: {
      type: Number,
    },
    role: {
      type: String,
      default: "deliveryAgent",
      required: true,
    },
    fcmToken: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    autoIndex: true,
  }
);

delivberyAgentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await Bun.password.hash(this.password);

  next();
});

export const DeliveryAgent = model<DeliveryAgent>(
  "DeliveryAgent",
  delivberyAgentSchema
);
