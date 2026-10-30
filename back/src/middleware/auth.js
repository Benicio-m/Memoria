import { verify } from "hono/jwt";

export async function authMiddleware(c, next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Token não fornecido" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verify(
      token,
      process.env.JWT_SECRET,
      "HS256"
    );

    c.set("user", payload);
    await next();
  } catch (err) {
    console.error("Erro no authMiddleware:", err);
    return c.json({ error: "Token inválido ou expirado" }, 401);
  }
}