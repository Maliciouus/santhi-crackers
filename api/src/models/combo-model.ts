import { Schema, model } from "mongoose";

const comboOfferSchema = new Schema({
    comboName: {
        type: String,
    },
    image: {
        type: String,
    },
    productsIncluded: [
        {
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
            }
        },
    ],
    comboPrice: {
        type: Number,
        required: true,
    },
    comboDescription: {
        type: String
    },
    strikePrice: {
        type: Number,
    },
    active: {
        type: Boolean,
        default: true
    },
    isDeleted:{
        type:Boolean,
        default:false
    }

}, {
    timestamps: true,
});

export default model("ComboOffer", comboOfferSchema);