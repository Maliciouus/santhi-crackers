import { model, Schema } from "mongoose";

interface Demand {
  userId: Schema.Types.ObjectId;
  productName: string;
  message: string;
  brandName:string;
  quantity:number;
  timePreference:string;
  ratePreference:string;
  response:string;
  file: string; // Assuming file paths or URLs are stored as strings
}

const DemandSchema = new Schema<Demand>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    timePreference:{
type:String,
    },
    ratePreference:{
      type:String,
          },
    quantity:{
type:Number,
required:true
    },
    brandName:{
      type:String,
      required:true,
    },
    message: {
      type: String,
      required: true,
    },
    response:{
      type:String,
      default:""
    },
    file:
      {
        type: String,
      },
  },
  {
    timestamps: true,
  }
);

export const DemandProduct = model<Demand>("DemandProduct", DemandSchema);
