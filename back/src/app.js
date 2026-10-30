import { Hono } from "hono";
import { cors } from "hono/cors";
import rooms from "./routes/rooms.js";

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