import { Hono } from "hono";
import { sign } from "hono/jwt";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middleware/auth.js";
import { Resend } from "resend";
import Teacher from "../../models/Teacher.js";
import Room from "../../models/Room.js";
import Group from "../../models/Group.js";
import News from "../../models/News.js";
import { conectarMongo } from "../app.js";
const rooms = new Hono();
const resend = new Resend(process.env.RESEND_API_KEY);
// Rotas: 
// Login do professor
rooms.post("/write", async (c) => {
  try {
    await conectarMongo()
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Informe e-mail e senha" }, 400);
    }

    const teacher = await Teacher.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!teacher) {
      return c.json({ error: "Usuário não encontrado" }, 404);
      console.log("Usuário não encontrado:", email);
    }

    const senhaValida = await bcrypt.compare(password, teacher.password);

    if (!senhaValida) {
      return c.json({ error: "Senha incorreta" }, 401);
      console.error("Senha incorreta para o usuário:", email);
    }

    const token = await sign(
      {
        sub: teacher._id.toString(),
        name: teacher.name,
        role: teacher.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      },
      process.env.JWT_SECRET,
      "HS256"
    );

    const teachers = await Teacher.find(
      { role: "professor" },
      "name email"
    ).sort({ name: 1 });

    return c.json({
      ok: true,
      token,
      user: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role,
        profilePhoto: teacher.profilePhoto,
      },
      teachers,
    });
  } catch (err) {
    console.error("Erro no /write:", err);
    return c.json({ error: "Erro interno no login" }, 500);
  }
});

// Listar solicitações de entrada pendentes
// (grupos que aguardam autorização do professor)
rooms.get("/groups/pending", authMiddleware, async (c) => {
  try {
    await conectarMongo()
    const user = c.get("user");

    // Apenas professores podem ver a fila de autorização
    if (user.role !== "professor") {
      return c.json(
        { error: "Acesso restrito a professores" },
        403
      );
    }

    // Busca todas as salas em que este professor é responsável
    const teacherRooms = await Room.find({
      teachers: user.sub,
    }).select("_id");

    const roomIds = teacherRooms.map((room) => room._id);

    // Busca os grupos pendentes dessas salas
    const groups = await Group.find({
      roomId: { $in: roomIds },
      status: "pendente",
    })
      .sort({ createdAt: -1 })
      .select("name members roomId status createdAt");

    return c.json({
      ok: true,
      groups,
    });
  } catch (err) {
    console.error("Erro ao listar solicitações pendentes:", err);
    return c.json(
      { error: "Erro ao listar solicitações pendentes" },
      500
    );
  }
});

// Grupo entra na sala com código + nomes dos integrantes
// Grupo entra na sala com código + nomes dos integrantes
rooms.post("/join", async (c) => {
  try {
    await conectarMongo();

    const { code, name, members } = await c.req.json();

    if (!code || !name) {
      return c.json(
        { error: "Informe o código da sala e o nome do grupo" },
        400
      );
    }
    if(room.status === "bloqueada") {
      return c.json({ error: "Sala bloqueada pelo professor" }, 403);
    }
    const room = await Room.findOne({
      code: code.trim().toUpperCase(),
    });

    if (!room) {
      return c.json({ error: "Sala não encontrada" }, 404);
    }

    const groupName = name.trim();

    // Aceita members como string "João, Maria" ou array ["João", "Maria"]
    const memberList = Array.isArray(members)
      ? members.map((m) => String(m).trim()).filter(Boolean)
      : (members || "").split(",").map((m) => m.trim()).filter(Boolean);

    let group = await Group.findOne({
      roomId: room._id,
      name: groupName,
    });

    if (!group) {
      group = await Group.create({
        roomId: room._id,
        name: groupName,
        members: memberList,
        status: "pendente",
      });

      const teachers = await Teacher.find({
        _id: { $in: room.teachers },
      });

      for (const teacher of teachers) {
        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: teacher.email,
            subject: "Novo grupo aguardando autorização",
            html: `
              <p>O grupo <strong>${group.name}</strong> solicitou acesso à sala <strong>${room.name}</strong>.</p>
              <p>Integrantes: ${group.members.join(", ") || "não informados"}</p>
              <p>Acesse o painel para autorizar ou recusar.</p>
            `,
          });
        } catch (emailErr) {
          console.error("Erro ao enviar e-mail:", emailErr);
        }
      }
    }

    if (group.status === "recusado") {
      return c.json(
        { error: "Este grupo foi recusado pelo professor" },
        403
      );
    }

    const token = await sign(
      {
        sub: group._id.toString(),
        name: group.name,
        role: "aluno",
        roomId: room._id.toString(),
        groupStatus: group.status,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      },
      process.env.JWT_SECRET,
      "HS256"
    );

    return c.json({
      ok: true,
      token,
      group: {
        id: group._id,
        name: group.name,
        status: group.status,
        members: group.members,
      },
      message:
        group.status === "autorizado"
          ? "Acesso liberado"
          : "Aguardando autorização do professor",
    });
  } catch (err) {
    console.error("Erro no /join:", err);
    return c.json({ error: "Erro ao entrar na sala" + err.message }, 500);
  }
});

// Autorizar ou recusar grupo em uma sala
// PATCH /rooms/:roomId/groups/:groupId
rooms.patch("/:roomId/groups/:groupId", authMiddleware, async (c) => {
  try {
    await conectarMongo()
    const user = c.get("user");
    const { roomId, groupId } = c.req.param();
    const { status } = await c.req.json();

    if (user.role !== "professor") {
      return c.json({ error: "Acesso restrito a professores" }, 403);
    }

    if (!["autorizado", "recusado"].includes(status)) {
      return c.json(
        { error: 'Status inválido. Use "autorizado" ou "recusado".' },
        400
      );
    }

    // confirma que a sala pertence ao professor logado
    const room = await Room.findOne({
      _id: roomId,
      teachers: user.sub,
    });

    if (!room) {
      return c.json(
        { error: "Sala não encontrada ou você não tem acesso." },
        404
      );
    }

    const group = await Group.findOne({
      _id: groupId,
      roomId: room._id,
    });

    if (!group) {
      return c.json({ error: "Grupo não encontrado nesta sala." }, 404);
    }

    group.status = status;
    await group.save();

    return c.json({
      ok: true,
      message: `Grupo ${status} com sucesso.`,
      group,
    });
  } catch (err) {
    console.error("Erro ao autorizar/recusar grupo:", err);
    return c.json({ error: "Erro ao atualizar status do grupo." }, 500);
  }
});

// Verificar professor/aluno logado
rooms.get("/me", authMiddleware, async (c) => {
  try {
    await conectarMongo()
    const user = c.get("user");

    if (user.role === "professor") {
      const teacher = await Teacher.findById(user.sub).select(
        "name email role profilePhoto"
      );

      if (!teacher) {
        return c.json({ error: "Professor não encontrado" }, 404);
      }

      return c.json({
        ok: true,
        user: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          role: teacher.role,
          profilePhoto: teacher.profilePhoto || "",
        },
      });
    }

    if (user.role === "aluno") {
      const student = await Group.findById(user.sub).select(
        "name email status roomId"
      );

      if (!student) {
        return c.json({ error: "Aluno não encontrado" }, 404);
      }

      if (student.status !== "autorizado") {
        return c.json({ error: "Aluno não autorizado" }, 403);
      }

      return c.json({
        ok: true,
        user: {
          id: student._id,
          name: student.name,
          email: student.email,
          role: "aluno",
          roomId: student.roomId,
        },
      });
    }

    return c.json({ error: "Tipo de usuário inválido" }, 403);
  } catch (err) {
    console.error("Erro no /me:", err);
    return c.json({ error: "Erro ao verificar login" }, 500);
  }
});

// Logout do professor
rooms.post("/logout", authMiddleware, async (c) => {
  try {
    await conectarMongo()
    const user = c.get("user");

    return c.json({
      ok: true,
      message: "Logout realizado com sucesso",
      userId: user.sub,
    });
  } catch (err) {
    console.error("Erro no logout:", err);
    return c.json({ error: "Erro ao realizar logout" }, 500);
  }
});

// Criar sala
rooms.post("/", authMiddleware, async (c) => {
  try {
    const { name, teacherIds } = await c.req.json();

    if (!name) {
      return c.json({ error: "O nome da sala é obrigatório" }, 400);
    }

    const code = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const room = await Room.create({
      name,
      code,
      teachers: teacherIds || [],
      createdBy: c.get("user").sub,
    });

    return c.json({
      ok: true,
      room,
    });
  } catch (err) {
    console.error("Erro ao criar sala:", err);
    return c.json({ error: "Erro ao criar sala" }, 500);
  }
});

// Listar salas abertas do professor logado
// Listar salas abertas do professor logado (com grupos e membros)
rooms.get("/open", authMiddleware, async (c) => {
  try {
    await conectarMongo();
    const user = c.get("user");

    if (user.role !== "professor") {
      return c.json({ ok: false, error: "Acesso restrito a professores" }, 403);
    }

    const salas = await Room.find({ teachers: user.sub }).sort({ createdAt: -1 }).select("name code createdAt").populate("createdBy", "name profilePhoto").lean();

    const groups = await Group.find({ roomId: { $in: salas.map(r => r._id) } })
      .select("name members roomId status createdAt")
      .lean();

    const salasComGrupos = salas.map(r => ({
      ...r,
      groups: groups.filter(g => String(g.roomId) === String(r._id)),
    }));

    return c.json({ ok: true, rooms: salasComGrupos });
  } catch (err) {
    console.error("Erro no /rooms/open:", err);
    return c.json({ ok: false, error: "Erro ao listar salas" }, 500);
  }
});

// Bloquear ou desbloquear sala
rooms.patch("/:roomId/status", authMiddleware, async (c) => {
  try {
    await conectarMongo();
    const user = c.get("user");
    const { roomId } = c.req.param();
    const { status } = await c.req.json();

    if (user.role !== "professor") {
      return c.json({ error: "Acesso restrito a professores" }, 403);
    }

    if (!["aberta", "bloqueada"].includes(status)) {
      return c.json({ error: "Status inválido" }, 400);
    }

    const room = await Room.findOne({
      _id: roomId,
      teachers: user.sub,
    });

    if (!room) {
      return c.json({ error: "Sala não encontrada" }, 404);
    }

    room.status = status;
    await room.save();

    return c.json({ ok: true, message: `Sala ${status}`, room });
  } catch (err) {
    console.error("Erro ao alterar status da sala:", err);
    return c.json({ error: "Erro ao alterar status da sala" }, 500);
  }
});

// ─────────── NOTÍCIAS ───────────

// Criar notícia (aluno logado)
rooms.post("/news", authMiddleware, async (c) => {
  try {
    await conectarMongo();
    const user = c.get("user");
    const { title, subtitle, content, iconImage } = await c.req.json();

    if (!title || !content) {
      return c.json({ error: "Informe título e conteúdo" }, 400);
    }

    const group = await Group.findById(user.sub);
    if (!group || group.status !== "autorizado") {
      return c.json({ error: "Grupo não autorizado" }, 403);
    }

    const news = await News.create({
      roomId: group.roomId,
      groupId: group._id,
      authors: group.name,
      title,
      subtitle: subtitle || "",
      iconImage: iconImage || "",
      content,
    });

    return c.json({ ok: true, news });
  } catch (err) {
    console.error("Erro ao salvar notícia:", err);
    return c.json({ error: "Erro ao salvar notícia" }, 500);
  }
});

// Editar notícia (só o grupo dono)
rooms.put("/news/:id", authMiddleware, async (c) => {
  try {
    await conectarMongo();
    const user = c.get("user");
    const { title, subtitle, content, iconImage } = await c.req.json();

    const news = await News.findById(c.req.param("id"));
    if (!news) return c.json({ error: "Notícia não encontrada" }, 404);

    if (String(news.groupId) !== String(user.sub)) {
      return c.json({ error: "Você não pode editar esta notícia" }, 403);
    }

    if (title !== undefined) news.title = title;
    if (subtitle !== undefined) news.subtitle = subtitle;
    if (content !== undefined) news.content = content;
    if (iconImage !== undefined) news.iconImage = iconImage;

    await news.save();
    return c.json({ ok: true, news });
  } catch (err) {
    console.error("Erro ao editar notícia:", err);
    return c.json({ error: "Erro ao editar notícia" }, 500);
  }
});

// Notícias do grupo do aluno logado
rooms.get("/news/mine", authMiddleware, async (c) => {
  try {
    await conectarMongo();
    const user = c.get("user");
    const news = await News.find({ groupId: user.sub }).sort({ createdAt: -1 });
    return c.json({ ok: true, news });
  } catch (err) {
    console.error("Erro ao listar notícias do grupo:", err);
    return c.json({ error: "Erro ao listar notícias" }, 500);
  }
});

// Todas as notícias (home do jornal)
rooms.get("/news", async (c) => {
  try {
    await conectarMongo();
    const news = await News.find()
      .sort({ createdAt: -1 })
      .select("title subtitle iconImage authors content createdAt");
    return c.json({ ok: true, news });
  } catch (err) {
    console.error("Erro ao listar notícias:", err);
    return c.json({ error: "Erro ao listar notícias" }, 500);
  }
});

// 4 destaques aleatórios (mudam a cada dia)
rooms.get("/news/highlights", async (c) => {
  try {
    await conectarMongo();
    const all = await News.find().select("title iconImage authors content createdAt");
    const seed = new Date().toISOString().slice(0, 10);
    const sorted = [...all].sort((a, b) =>
      (seed + a._id).localeCompare(seed + b._id)
    );
    return c.json({ ok: true, highlights: sorted.slice(0, 4) });
  } catch (err) {
    console.error("Erro ao listar destaques:", err);
    return c.json({ error: "Erro ao listar destaques" }, 500);
  }
});

// Uma notícia completa
rooms.get("/news/:id", async (c) => {
  try {
    await conectarMongo();
    const news = await News.findById(c.req.param("id"));
    if (!news) return c.json({ error: "Notícia não encontrada" }, 404);
    return c.json({ ok: true, news });
  } catch (err) {
    console.error("Erro ao buscar notícia:", err);
    return c.json({ error: "Erro ao buscar notícia" }, 500);
  }
});

// Adicionar comentário
rooms.post("/news/:id/comments", async (c) => {
  try {
    await conectarMongo();
    const { author, text } = await c.req.json();
    if (!text || !text.trim()) {
      return c.json({ error: "Escreva um comentário" }, 400);
    }
    const news = await News.findById(c.req.param("id"));
    if (!news) return c.json({ error: "Notícia não encontrada" }, 404);

    news.comments.push({ author: author || "Anônimo", text: text.trim() });
    await news.save();
    return c.json({ ok: true, news });
  } catch (err) {
    console.error("Erro ao comentar:", err);
    return c.json({ error: "Erro ao comentar" }, 500);
  }
});

rooms.delete(
  "/news/:id",
  authMiddleware,
  async (c) => {
    try {
      const id = c.req.param("id");

      const news = await News.findById(id);

      if (!news) {
        return c.json(
          { message: "Notícia não encontrada." },
          404
        );
      }

      await news.deleteOne();

      return c.json({
        message: "Notícia excluída com sucesso.",
      });
    } catch (error) {
      console.error(error);

      return c.json(
        { message: "Erro ao excluir a notícia." },
        500
      );
    }
  }
);

export default rooms;