import { Hono } from "hono";
import { cors } from "hono/cors";
import rooms from "./routes/rooms.js";
import mongoose from "mongoose";

const app = new Hono();
app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "https://jornalmemoria.vercel.app");
  c.header("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }
  await next();
});

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function conectarMongo() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}



app.get("/ping", (c) => c.json({ ok: true, versao: "teste-cors" }));
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

app.get("/", (c) => {
  return c.json({ ok: true, message: "API do portal de notícias está funcionando" });
});

app.route("/rooms", rooms);

export default app;