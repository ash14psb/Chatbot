// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    name: String,
    email: String,
    photoURL: String,
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
