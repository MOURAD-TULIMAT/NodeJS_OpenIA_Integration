import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const conversations = {}; // { userId: [messages...] }

app.post("/chat", async (req, res) => {
  const { userId, message } = req.body;

  if (!conversations[userId]) {
    conversations[userId] = [];
  }

  conversations[userId].push({ role: "user", content: message });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: conversations[userId],
  });

  const reply = response.choices[0].message;
  conversations[userId].push(reply);

  res.json({ reply: reply.content });
});
app.listen(3001, () => console.log("Server running on http://localhost:3001"));
