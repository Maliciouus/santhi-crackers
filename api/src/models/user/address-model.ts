import { model, Schema } from "mongoose";

interface Address {
  receiverName: string;
  receiverMobile: string;
  flatorHouseno: string;
  area: string;
  landmark: string;
  addressString: string;
  latitude: string;
  longitude: string;
  active: boolean;
  isPrimary: boolean;
  addressType?: string;
  userId: Schema.Types.ObjectId;
  totalDistance?: number;
  deliveryFee?: number;
  deliverySeconds?: number;
  mapPloygonResponse?: string;
}

const addressSchema = new Schema<Address>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverName: {
      type: String,
      required: true,
    },
    receiverMobile: {
      type: String,
      required: true,
    },
    flatorHouseno: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    area: {
      type: String,
      required: true,
    },
    landmark: {
      type: String,
      required: true,
    },
    addressString: {
      type: String,
      // required: true,
    },
    addressType: {
      type: String,
      required: true,
    },
    latitude: {
      type: String,
      required: true,
    },
    longitude: {
      type: String,
      required: true,
    },
    mapPloygonResponse: {
      type: String,
      default: "",
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
  },
  {
    timestamps: true,
    autoIndex: true,
  }
);

export const Address = model<Address>("Address", addressSchema);
