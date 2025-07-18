import { Schema, model } from "mongoose";

const offerSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['flat', 'discount', 'negotiate', 'mrp']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
const flatOfferProductSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
});
offerSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const flatOfferSchema = new Schema({
    percentage: {
        type: Number,
        required: true
    },
    minPrd: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    items: [flatOfferProductSchema]
});
const negotiateItemSchema=new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    successPercentage: {
        type: Number,
        required: true
    },
    failurePercentage: {
        type: Number,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
})

const negotiateOfferSchema = new Schema({
    items: [negotiateItemSchema],
    noOfAttempts: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const discountItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
});
const mrpReductionSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    mrpReduction: {
        type: Number,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
});

const discountOfferSchema = new Schema({
    items: [discountItemSchema],
    isActive: {
        type: Boolean,
        default: true
    }
});

const mrpOfferSchema = new Schema({
    items: [mrpReductionSchema],
    isActive: {
        type: Boolean,
        default: true
    },
});

const Offer = model('Offer', offerSchema);
export const FlatOffer = Offer.discriminator('FlatOffer', flatOfferSchema);
export const NegotiateOffer = Offer.discriminator('NegotiateOffer', negotiateOfferSchema);
export const DiscountOffer = Offer.discriminator('DiscountOffer', discountOfferSchema);
export const MRPOffer = Offer.discriminator('MRPOffer', mrpOfferSchema);

export { Offer };
