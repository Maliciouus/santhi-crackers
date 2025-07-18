import mongoose from 'mongoose';

const SpecificationSchema = new mongoose.Schema({
  name: {
    type: String, 
    required: true,
    unique:true
  },
  fields: {
    type: [String],  
    required: true
  },
  isDeleted:{
    type:Boolean,
    default:false,
  }
});

export const SpecificationModel = mongoose.model('Specification', SpecificationSchema);
