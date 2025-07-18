import { Schema, model } from "mongoose";


const otpCountSchema = new Schema({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  count: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

export const OtpCountModel = model("OtpCount", otpCountSchema);

