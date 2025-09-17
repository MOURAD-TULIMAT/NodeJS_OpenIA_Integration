import OpenAI from "openai";
import ChatMessage from "../models/ChatMessage.js";
import { getWeather, tools } from "./tools.js";
import dotenv from "dotenv";
dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function buildMessages(userId, message) {
    await ChatMessage.create({ userId, role: "user", content: message });

    const history = await ChatMessage.find({ userId }).sort({ timestamp: 1 });

    return [
        {
            role: "system",
            content:
                "You are a helpful assistant. If you think using any of the available functions will improve your answer, you may call one. I will send you the result, and you must continue your response based on it.",
        },
        ...history.map((m) => ({
            role: m.role.toLowerCase(),
            content: m.content,
        })),
    ];
}

function startStream(messages) {
    return openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools: tools.map((f) => ({ type: "function", function: f })),
        stream: true,
    });
}

async function handleToolCall(toolCall, messages, res) {
    const args = JSON.parse(toolCall.function.arguments || "{}");
    const location = args.location || "Dubai";

    let fullReply = "";
    res.write(`using get weather tool for location: ${location}...\n`);
    const weatherResult = await getWeather(location);
    res.write(`\n\nresult: ${JSON.stringify(weatherResult)}\n\n`);

    // ✅ Save assistant's tool call properly
    messages.push({
        role: "assistant",
        tool_calls: [
            {
                id: toolCall.id,
                type: "function",
                function: {
                    name: toolCall.function.name,
                    arguments: toolCall.function.arguments,
                },
            },
        ],
    });

    // ✅ Add tool result
    messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(weatherResult),
    });

    // ✅ Second GPT call (streaming)
    const final = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        stream: true,
    });

    for await (const chunk2 of final) {
        const delta2 = chunk2.choices[0]?.delta;
        if (delta2?.content) {
            fullReply += delta2.content;
            res.write(delta2.content);
        }
    }

    return fullReply;
}

export async function handleChat(userId, message, res) {
    const messages = await buildMessages(userId, message);

    const stream = await startStream(messages);

    let fullReply = "";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
            fullReply += delta.content;
            res.write(delta.content);
        }

        const toolCall = delta?.tool_calls?.[0];
        if (toolCall?.function?.name) {
            const toolReply = await handleToolCall(toolCall, messages, res);
            fullReply += toolReply;
            break;
        }
    }

    await ChatMessage.create({ userId, role: "assistant", content: fullReply });
    res.end();
}
