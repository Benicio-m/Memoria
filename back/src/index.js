import { serve } from "@hono/node-server";
import mongoose from "mongoose";
import "dotenv/config";
import app from "./app.js";
import { conectarMongo } from "./app.js"; // se conectarMongo estiver aqui

const port = Number(process.env.PORT || 8787);

try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB conectado");

  serve({ fetch: app.fetch, port });
  console.log(`API rodando em http://localhost:${port}`);
} catch (err) {
  console.error("Erro ao conectar no MongoDB:", err);
  process.exit(1);
}