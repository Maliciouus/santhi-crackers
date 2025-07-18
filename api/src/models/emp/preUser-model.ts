import { model, Schema, Document } from "mongoose";


interface BasePreUser extends Document {
  mobile: number;
  username?: string;
  role: string;
  active: boolean;
  address: {
    flatNo: string;
    area: string;
    nearbyPlaces: string;
  };
  userType: string;
}


interface IndividualUser extends BasePreUser {

  HospitalMedicalName:string;
}


interface FirmUser extends BasePreUser {
  HospitalMedicalName: string;
  GSTIN: string;
}


const baseSchema = new Schema<BasePreUser>(
  {
    mobile: { type: Number, required: true, index: true },
    username: { type: String, default: "" },
    role: { type: String, default: "preuser", required: true },
    active: { type: Boolean, required: true },
    address: {
      flatNo: { type: String, required: true },
      area: { type: String, required: true },
      nearbyPlaces: { type: String, required: true },
    },
  },
  {
    timestamps: true,
    discriminatorKey: "type", // ⬅️ Key for discriminator
  }
);

// 🔹 Base Model
const PreUser = model<BasePreUser>("PreUser", baseSchema);

// 🔹 Individual Schema
const individualSchema = new Schema<IndividualUser>({
  HospitalMedicalName: { type: String },
});

// 🔹 Firm Schema
const firmSchema = new Schema<FirmUser>({
  HospitalMedicalName: { type: String, required: true },
  GSTIN: { type: String, required: true },
});

// 🔹 Discriminators
const IndividualUser = PreUser.discriminator<IndividualUser>(
  "IndividualUser",
  individualSchema
);

const FirmUser = PreUser.discriminator<FirmUser>("FirmUser", firmSchema);

// Export only base by default
export { PreUser, IndividualUser, FirmUser };
