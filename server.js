import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";
import mongoose from "mongoose";
import ChatMessage from "./models/ChatMessage.js";

dotenv.config();
mongoose.connect("mongodb://localhost:27017/ai_chat", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));
const app = express();
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const conversations = {}; // { userId: [messages...] }

app.post("/chat", async (req, res) => {
  const { userId, message } = req.body;

  await ChatMessage.create({ userId, role: "user", content: message });

  const history = await ChatMessage.find({ userId }).sort({ timestamp: 1 });

  const messages = history.map(m => ({ role: m.role, content: m.content }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
  });

  const reply = response.choices[0].message;

  // Save assistant reply
  await ChatMessage.create({ userId, role: "assistant", content: reply.content });

  res.json({ reply: reply.content });
});

app.listen(3001, () => console.log("Server running on http://localhost:3001"));
