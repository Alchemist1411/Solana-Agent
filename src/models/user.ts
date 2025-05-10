import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  publicKey: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  tokens: { type: Number, default: 100 }
});

const User = mongoose.model("User", userSchema);

export default User;
