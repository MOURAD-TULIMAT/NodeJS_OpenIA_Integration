import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("ChatMessage", chatMessageSchema);
