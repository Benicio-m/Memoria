import { Hono } from "hono";
import { sign } from "hono/jwt";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middleware/auth.js";
import { Resend } from "resend";
import Teacher from "../../models/Teacher.js";
import Room from "../../models/Room.js";
import Group from "../../models/Group.js";
import News from "../../models/News.js";

const rooms = new Hono();
const resend = new Resend(process.env.RESEND_API_KEY);
// Rotas:
// Login do professor
rooms.post("/write", async (c) => {
  try {
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
rooms.post("/join", async (c) => {
  try {
    const { code, name } = await c.req.json();

    if (!code || !name) {
      return c.json(
        {
          error:
            "Informe o código da sala e os nomes dos integrantes",
        },
        400
      );
    }

    const room = await Room.findOne({
      code: code.trim().toUpperCase(),
    });

    if (!room) {
      return c.json({ error: "Sala não encontrada" }, 404);
    }

    const groupName = name.trim();

    let group = await Group.findOne({
      roomId: room._id,
      name: groupName,
    });

    if (!group) {
      group = await Group.create({
        roomId: room._id,
        name: groupName,
        members: groupName
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean),
        status: "pendente",
      });

      const teachers = await Teacher.find({
        _id: { $in: room.teachers },
      });

      for (const teacher of teachers) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM,
          to: teacher.email,
          subject: "Novo grupo aguardando autorização",
          html: `
            <p>O grupo <strong>${group.name}</strong> solicitou acesso à sala <strong>${room.name}</strong>.</p>
            <p>Integrantes: ${group.members.join(", ")}</p>
            <p>Acesse o painel para autorizar ou recusar.</p>
          `,
        });
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
    return c.json({ error: "Erro ao entrar na sala" }, 500);
  }
});

// PATCH /api/salas/:id/alunos/:alunoId
router.patch('/:id/alunos/:alunoId', async (req, res) => {
  try {
    const { id, alunoId } = req.params;
    const { status, criadorId } = req.body;

    // valida o status
    if (!['aprovado', 'recusado'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido. Use "aprovado" ou "recusado".' });
    }

    const sala = await Sala.findById(id);
    if (!sala) {
      return res.status(404).json({ error: 'Sala não encontrada.' });
    }

    // só o criador da sala pode autorizar/recusar
    if (sala.criadorId !== criadorId) {
      return res.status(403).json({ error: 'Apenas o criador da sala pode fazer isso.' });
    }

    // encontra o aluno dentro da sala
    const aluno = sala.alunos.find(a => a.alunoId === alunoId);
    if (!aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado nesta sala.' });
    }

    aluno.status = status;
    await sala.save();

    res.json({ message: `Aluno ${status} com sucesso.`, sala });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar status do aluno.', detalhe: err.message });
  }
});

// Verificar professor/aluno logado
rooms.get("/me", authMiddleware, async (c) => {
  try {
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
      const student = await Student.findById(user.sub).select(
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

rooms.post("/:roomId/articles", authMiddleware, async (c) => {
  try {
    const roomId = c.req.param("roomId");
    const { title, content } = await c.req.json();

    const user = c.get("user");

    if (user.role !== "aluno") {
      return c.json({ error: "Apenas alunos podem criar notícias" }, 403);
    }

    if (user.roomId !== roomId) {
      return c.json({ error: "Aluno não pertence a esta sala" }, 403);
    }

    if (!title || !content) {
      return c.json(
        { error: "Título e conteúdo são obrigatórios" },
        400
      );
    }

    const news = await News.create({
      roomId,
      groupId: user.sub,
      title,
      content,
    });

    return c.json({
      ok: true,
      news,
    });
  } catch (err) {
    console.error("Erro ao criar notícia:", err);
    return c.json({ error: "Erro ao criar notícia" }, 500);
  }
});

rooms.put("/articles/:articleId", authMiddleware, async (c) => {
  try {
    const articleId = c.req.param("articleId");
    const { title, content } = await c.req.json();

    const user = c.get("user");

    if (user.role !== "aluno") {
      return c.json({ error: "Apenas alunos podem editar notícias" }, 403);
    }

    const news = await News.findOne({
      _id: articleId,
      groupId: user.sub,
    });

    if (!news) {
      return c.json(
        { error: "Notícia não encontrada ou não pertence a você" },
        404
      );
    }

    news.title = title ?? news.title;
    news.content = content ?? news.content;

    await news.save();

    return c.json({
      ok: true,
      news,
    });
  } catch (err) {
    console.error("Erro ao editar notícia:", err);
    return c.json({ error: "Erro ao editar notícia" }, 500);
  }
});

// Listar salas abertas do professor logado
rooms.get("/open", authMiddleware, async (c) => {
  try {
    const user = c.get("user");

    if (user.role !== "professor") {
      return c.json(
        { error: "Acesso restrito a professores" },
        403
      );
    }

    const rooms = await Room.find({
      teachers: user.sub,
    })
      .sort({ createdAt: -1 })
      .select("name code createdAt");

    return c.json({
      ok: true,
      rooms,
    });
  } catch (err) {
    console.error("Erro ao listar salas abertas:", err);
    return c.json(
      { error: "Erro ao listar salas abertas" },
      500
    );
  }
});

export default rooms;