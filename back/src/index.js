import { Hono } from "hono";
import { serve } from "@hono/node-server";
import mongoose from "mongoose";
import "dotenv/config";
import { cors } from "hono/cors";

import rooms from "./routes/rooms.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.json({
    ok: true,
    message: "API do portal de notícias está funcionando",
  });
});

app.route("/rooms", rooms);

const port = Number(process.env.PORT || 8787);

try {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log("MongoDB conectado");

  serve({
    fetch: app.fetch,
    port,
  });

  console.log(`API rodando em http://localhost:${port}`);
} catch (err) {
  console.error("Erro ao conectar no MongoDB:", err);
  process.exit(1);
}