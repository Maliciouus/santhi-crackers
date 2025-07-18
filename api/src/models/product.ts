import { model, Schema, Types } from "mongoose";

interface Specification {
  name: string;
  fields: Record<string, string>;
}
interface ProductInterface {
  productName: string;
  category: Types.ObjectId;
  price: number;
  // strikePrice: number;
  ratings: number;
  productCode: string;
  description: string;
  images: string[];
  topSeller: boolean;
  gst: number;
  discount: number;
  stock:number;
  ageGroup: [String],
  occations: [String],
  brand:Types.ObjectId;
  active: boolean;
  unit: Types.ObjectId
  isDeleted: boolean;
  reEnabledAt: Date | null;
  ytLink:string;
  specifications?: Specification[];
  groups: Types.ObjectId[]; 
}



const ProductSchema = new Schema<ProductInterface>(
  {
    productName: {
      type: String,
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "ProductCategory",
      required: true,
    },
    ytLink: {
      type: String,
      default:""
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    stock:{
      type:Number,
      required:true,
    },
    //     strikePrice: {
    //   type: Number,
    //   required: true,
    // },
    ratings: {
      type: Number,
      // required: true,
      default: 1,
    },
ageGroup:[String],
occations:[String],
    productCode: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    topSeller: {
      type: Boolean,
      default: false,
    },
    gst: {
      type: Number,
      default: 0,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    reEnabledAt: {
      type: Date,
      default: null,
    },
    groups: [
      {
        type: Schema.Types.ObjectId,
        ref: "Group",
      },
    ],
    discount: { type: Number, default: 0 },
    specifications: [
      {
        name: { type: String },
        fields: { type: Map, of: String },
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const Product = model<ProductInterface>("Product", ProductSchema);
