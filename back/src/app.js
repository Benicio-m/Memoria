import { Hono } from "hono";
import { cors } from "hono/cors";
import mongoose from "mongoose";
import rooms from "./routes/rooms.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: [
      "https://jornalmemoria.vercel.app",
      "http://localhost:5173",
    ],
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.route("/rooms", rooms);

app.get("/", (c) => {
  return c.json({ ok: true, message: "API funcionando" });
});

// Conexão reutilizável com o MongoDB (importante em serverless)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function conectarMongo() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default app;