import { model, Schema, Types } from "mongoose";

interface GroupInterface {
  name: string;
  image: string;
  isDeleted:boolean;
  isActive:boolean;
  products: Types.ObjectId[];
}

const GroupSchema = new Schema<GroupInterface>(
  {
    name: {
      type: String,
      required: true,
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    isActive:{
        type:Boolean,
        default:true
    },
    image: {
      type: String,
      required: false,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Group = model<GroupInterface>("Group", GroupSchema);
