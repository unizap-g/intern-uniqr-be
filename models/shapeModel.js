import mongoose from "mongoose";
const newModelSchema = new mongoose.Schema({
  shapeUrl: {
    type: String,
    required: true
  },
  type:{
    type: String,
    required: true
  },
  point:{
    type:Number,
    required: true,
    default:0
  }
},{timestamps:true});
const shape = mongoose.model("shape", newModelSchema);
export default shape;