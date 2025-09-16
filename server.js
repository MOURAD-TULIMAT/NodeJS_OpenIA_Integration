import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";
import mongoose from "mongoose";
import ChatMessage from "./models/ChatMessage.js";

dotenv.config();
mongoose.connect(process.env.MONGO_URI, {
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

    const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        stream: true,
    });

    let fullReply = "";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
            fullReply += delta;
            res.write(delta); // send piece to client
        }
    }

    // Save the final message
    await ChatMessage.create({ userId, role: "assistant", content: fullReply });
    res.end();
});

app.listen(3001, () => console.log("Server running on http://localhost:3001"));
