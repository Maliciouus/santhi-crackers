import { Schema, model } from "mongoose";

interface Unit {
  name: string;
  isDeleted: boolean;
  isActive:boolean
}

const unitSchema = new Schema<Unit>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isActive:{
        type:Boolean,
        default:true
    }
  },
  { timestamps: true }
);

export const UnitModel = model<Unit>("Unit", unitSchema);
