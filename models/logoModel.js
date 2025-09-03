import mongoose from "mongoose";
const logoSchema = new mongoose.Schema({
  logoUrl: {
    type: String,
    required: true
  },
},{timestamps:true});
const logo = mongoose.model("logo", logoSchema);
export default logo;