import { model, Schema } from "mongoose";

interface Store {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  storeDescription: string;
  storeImage: string;
  latitude: string;
  longitude: string;
  gstNumber: string;
  fssaiNumber: string;
  legalEntityName: string;
  active: boolean;
  isDeleted: boolean;
  regulationNumber:string;
}

const StoreSchema = new Schema<Store>(
  {
    storeName: {
      type: String,
      required: true,
    },
    storeAddress: {
      type: String,
    },

    storePhone: {
      type: String,
    },

    storeEmail: {
      type: String,
    },

    storeDescription: {
      type: String,
    },
    latitude: {
      type: String,
    },
    longitude: {
      type: String,
    },
    storeImage: {
      type: String,
    },
    regulationNumber:{
      type:String,
    },
    gstNumber: {
      type: String,
    },
    legalEntityName: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  
  },
  {
    timestamps: true,
  }
);

export const StoreModel = model<Store>(
  "Store",
  StoreSchema
);
