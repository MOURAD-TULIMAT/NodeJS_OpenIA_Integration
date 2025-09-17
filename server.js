import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use("/", chatRoutes);

connectDB(process.env.MONGO_URI);

app.listen(3001, () =>
  console.log("🚀 Server running on http://localhost:3001")
);
