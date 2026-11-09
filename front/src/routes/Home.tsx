import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import '../App.css'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { ScrollArea } from '../components/ui/scroll-area'
import { InstagramLogoIcon, FacebookLogoIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input';
import { CheckIcon, Lock, LockOpen, Pencil, Plus, Trash, XIcon } from 'lucide-react';
import { Avatar, AvatarImage } from '../components/ui/avatar';
import { toast, Toaster } from '@/components/ui/toast';
import { Link } from 'react-router';

type User = {
  id: string;
  name: string;
  email: string;
  role: "professor" | "aluno";
  profilePhoto?: string;
  roomId?: string;
};

type Noticia = {
  _id: string;
  title: string;
  subtitle?: string;
  authors: string;
  createdAt: string;
};

function Home() {
  const navigate = useNavigate();

  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [gottenRooms, setGottenRooms] = useState<any[]>([])
  const [pendingGroups, setPendingGroups] = useState<any[]>([])
  const [professor, setProfessor] = useState<any>(null)
  const [bloqueandoId, setBloqueandoId] = useState<string | null>(null)
  const [salaAbertaId, setSalaAbertaId] = useState<string | null>(null)

  const [user, setUser] = useState<User | null>(null);
  const [allGroups, setAllGroups] = useState<any[]>([]);

  const [minhasMaterias, setMinhasMaterias] = useState<Noticia[]>([]);
  const [carregandoMaterias, setCarregandoMaterias] = useState(true);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  async function handleAutorizar(
    salaId: string,
    grupoId: string,
    status: "autorizado" | "recusado"
  ) {
    if (!salaId || !grupoId) {
      setError("IDs da sala ou do grupo não encontrados.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/rooms/${String(salaId)}/groups/${String(grupoId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const text = await res.text();
      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        setError("Resposta inválida do servidor.");
        return;
      }

      if (res.ok && data?.ok) {
        setPendingGroups(prev =>
          prev.filter(
            g => String(g._id) !== String(grupoId)
          )
        );

        setAllGroups(prev =>
          prev.map(g =>
            String(g._id) === String(grupoId)
              ? { ...g, status }
              : g
          )
        );

        setGottenRooms(prev =>
          prev.map(sala => {
            if (
              String(sala._id) !== String(salaId)
            ) {
              return sala;
            }

            return {
              ...sala,
              groups: (sala.groups || []).map(
                (g: any) =>
                  String(g._id) === String(grupoId)
                    ? { ...g, status }
                    : g
              ),
            };
          })
        );

        toast.add({
          title:
            status === "autorizado"
              ? "Grupo autorizado"
              : "Grupo recusado",
          description:
            status === "autorizado"
              ? "O grupo agora é membro da sala."
              : "O grupo não terá acesso à sala.",
          type: "success",
        });
      } else {
        setError(
          data?.error ||
            "Erro ao atualizar status do grupo."
        );
      }
    } catch (err) {
      console.error(
        "Erro ao autorizar/recusar:",
        err
      );
      setError(
        "Erro de conexão ao atualizar status."
      );
    }
  }

  async function handleAlterarStatusSala(
    salaId: string,
    status: "aberta" | "bloqueada"
  ) {
    if (!salaId || salaId === "undefined" || bloqueandoId) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Sua sessão expirou. Entre novamente.");
      return;
    }

    setBloqueandoId(salaId);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/rooms/${salaId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.error || "Erro ao alterar o status da sala."
        );
      }

      const statusSalvo = data.room?.status;

      if (
        statusSalvo !== "aberta" &&
        statusSalvo !== "bloqueada"
      ) {
        throw new Error(
          "O servidor não retornou um status válido para a sala."
        );
      }

      setGottenRooms((salas) =>
        salas.map((sala) =>
          String(sala._id || sala.id) === salaId
            ? { ...sala, status: statusSalvo }
            : sala
        )
      );

      toast.add({
        title:
          statusSalvo === "bloqueada"
            ? "Sala bloqueada"
            : "Sala desbloqueada",
        description: "A alteração foi salva.",
        type: "success",
      });
    } catch (err) {
      console.error("Erro ao alterar status da sala:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Erro de conexão ao alterar o status da sala."
      );
    } finally {
      setBloqueandoId(null);
    }
  }

  async function handleExcluirMateria(id: string) {
    if (!id || excluindoId) return;

    const confirmou = window.confirm(
      "Tem certeza que deseja excluir esta matéria? Esta ação não pode ser desfeita."
    );

    if (!confirmou) return;

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Sua sessão expirou. Entre novamente.");
      return;
    }

    setExcluindoId(id);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/rooms/news/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error || "Erro ao excluir a matéria."
        );
      }

      setMinhasMaterias((materias) =>
        materias.filter(
          (materia) => String(materia._id) !== String(id)
        )
      );

      toast.add({
        title: "Matéria excluída",
        description: "A matéria foi removida com sucesso.",
        type: "success",
      });
    } catch (err) {
      console.error("Erro ao excluir matéria:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Erro de conexão ao excluir a matéria."
      );
    } finally {
      setExcluindoId(null);
    }
  }

  function getLoggedUser(): User | null {
    const stored = localStorage.getItem("user");

    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  }

  const logout = async () => {
    const token = localStorage.getItem("token")

    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/rooms/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      } catch (error) {
        console.log("Erro ao chamar logout: ", error)
      }

      localStorage.removeItem("token")
      localStorage.removeItem("user")
      navigate("/")
    }
  }

  async function createRoom() {
    const usr = getLoggedUser()

    if (!usr?.id) {
      return;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        name: roomName,
        teacherIds: [usr.id],
      }),
    });

    const data = await response.json();

    if (response.ok && data.ok) {
      toast.add({ title: "Sala criada: ", description: data.room.name, type: "success" });
    } else {
      setError(data.error || "Erro ao criar sala");
      console.log(error)
    }
  }

  useEffect(() => {
    async function pegarSalas() {
      const token = localStorage.getItem("token")

      const rooms = await fetch(`${import.meta.env.VITE_API_URL}/rooms/open`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await rooms.json()

      console.log(data)

      if (rooms.ok && data.ok) {
        setGottenRooms(data.rooms)
      }
    }

    async function pegarUsuariosPendentes() {
      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/rooms/groups/pending`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const text = await response.text();

        let data: any = null;

        try {
          data = text ? JSON.parse(text) : null;
        } catch (parseError) {
          console.error("Resposta não é JSON válido:", text);
          setPendingGroups([]);
          return;
        }

        if (
          response.ok &&
          data &&
          data.ok === true &&
          Array.isArray(data.groups)
        ) {
          setPendingGroups(data.groups);
        } else {
          setPendingGroups([]);
        }
      } catch (err) {
        console.error("Erro ao buscar usuários pendentes:", err);
        setPendingGroups([]);
      }
    }

    async function pegarProfessor() {
      const token = localStorage.getItem('token');

      const res = await fetch(`${import.meta.env.VITE_API_URL}/rooms/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.ok) setProfessor(data.user);
    }

    pegarProfessor();
    pegarUsuariosPendentes()
    pegarSalas()
  }, [])

  useEffect(() => {
    async function verificarLogado() {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/escrever");
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/rooms/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/escrever");
          return;
        }

        if (data.user.role !== "professor") {
          navigate("/aluno");
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error("Erro ao verificar login:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/escrever");
      }
    }

    verificarLogado();
  }, [navigate]);

  useEffect(() => {
    async function pegarMinhasMaterias() {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/escrever");
        return;
      }

      setCarregandoMaterias(true);
      setError("");

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/rooms/news/mine`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.ok) {
          throw new Error(
            data?.error || "Erro ao carregar suas matérias."
          );
        }

        setMinhasMaterias(
          Array.isArray(data.news) ? data.news : []
        );
      } catch (err) {
        console.error("Erro ao carregar matérias:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Erro de conexão ao carregar matérias."
        );
      } finally {
        setCarregandoMaterias(false);
      }
    }

    pegarMinhasMaterias();
  }, [navigate]);

  return (
    <ScrollArea className="w-full h-dvh bg-border">
      <Toaster />

      <div className="flex flex-col h-full min-h-dvh w-full">
        <div className="w-full bg-border mt-0 mb-2 sm:mb-4 md:mb-6">
          <Card className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 p-4 sm:p-6">
            <div className="flex flex-col items-center justify-start h-full">
              <p className="font-konkhmer-sleokchher font-400 text-lg font-normal whitespace-nowrap">Um site:</p>

              <div className="flex flex-row items-center justify-center md:justify-start h-full gap-3 mt-2">
                <img src="https://i.ibb.co/C37cbVFf/image.png" className="h-14 sm:h-16 w-auto object-contain" />
                <img src="https://bit.ly/partnership-logo-2" className="h-10 sm:h-12 w-auto object-contain" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <Link to="/" className="text-3xl sm:text-4xl font-normal font-konkhmer-sleokchher font-400 whitespace-nowrap">Jornal Memória</Link>
              <h2 className="text-xl sm:text-2xl font-normal font-la-belle-aurore font-400">Tempo em letras</h2>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <p className="font-konkhmer-sleokchher font-400 text-lg font-normal whitespace-nowrap">Acesse nossas redes sociais:</p>

              <div className="flex flex-row items-center justify-center md:justify-end h-full gap-3 mt-2">
                <a className="text-4xl sm:text-5xl" href="https://www.facebook.com/cpfundamentalemedio/"><FacebookLogoIcon className="text-5xl sm:text-6xl" /></a>
                <a className="text-4xl sm:text-5xl" href="https://www.instagram.com/colegiopresbiterianomackenzie/"><InstagramLogoIcon className="text-5xl sm:text-6xl" /></a>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-1 w-full items-start justify-start bg-border font-konkhmer-sleokchher font-400 font-normal p-0">
          <div className="flex flex-col flex-1 w-full items-start justify-start bg-border font-konkhmer-sleokchher font-400 font-normal p-0">
            <Card className="flex flex-col items-center justify-center shadow-accent-foreground shadow-md w-full max-w-7xl p-2 sm:p-3 m-0 rounded-md">
              <div className="flex flex-row items-center justify-end w-full max-w-2.5xl p-2 sm:p-3 m-0">
                <div className="flex flex-col flex-1 w-full items-start justify-center ml-8! font-konkhmer-sleokchher font-400 font-normal p-0">
                  <h1 className="text-xl text-left sm:text-2xl md:text-4xl">Salas</h1>
                </div>

                <Avatar>
                  <AvatarImage src={professor?.profilePhoto} alt="foto" />
                </Avatar>

                <h2 className="text-accent-foreground rounded-md text-base sm:text-lg pl-2">{professor?.name}</h2>

                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger className="w-10 h-10 pl-2 bg-transparent hover:bg-border text-accent-foreground text-center rounded-md sm:text-lg"><Plus /></DialogTrigger>

                  <DialogContent className="rounded-md max-h-auto">
                    <DialogHeader>
                      <DialogTitle className="font-konkhmer-sleokchher text-2xl">Criar</DialogTitle>

                      <Input placeholder="Nome da sala" className="font-konkhmer-sleokchher rounded-md" onChange={(e) => setRoomName(e.target.value)} />

                      <div className="flex items-center justify-end gap-2 font-konkhmer-sleokchher">
                        <Button className="w-25 h-10 mt-2 bg-transparent hover:bg-border text-accent-foreground rounded-md text-base sm:text-lg" onClick={() => setOpen(!open)}>Cancelar</Button>

                        <Button className="w-20 h-10 mt-2 bg-green-600 hover:bg-green-700 text-accent-foreground rounded-md text-base sm:text-lg" onClick={() => {
                          createRoom()
                          return setOpen(!open)
                        }}>Ok</Button>
                      </div>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>

                <Button className="w-20 h-10 bg-green-600 hover:bg-green-700 text-accent-foreground rounded-md text-base sm:text-lg" onClick={logout}>Sair</Button>
              </div>

              {error && (
                <p className="w-full px-4 pb-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <div className="flex flex-1 flex-col w-full items-start justify-start ml-8! shadow-accent-foreground font-konkhmer-sleokchher font-400 font-normal p-0">
                {gottenRooms.map(r => (
                  <div className="flex flex-1 flex-row w-full items-center justify-center shadow-accent-foreground font-konkhmer-sleokchher font-400 font-normal p-0" key={r._id || r.id}>
                    <div className="w-xl items-start justify-center font-konkhmer-sleokchher font-400 font-normal p-0">
                      <h2 className="text-start text-xl">
                        {r.name}

                        {r.status === "bloqueada" && (
                          <span className="ml-2 inline-flex items-center rounded-md bg-red-500/10 px-2 py-1 text-xs text-red-600">
                            <Lock className="mr-1 h-3 w-3" />
                            Bloqueada
                          </span>
                        )}
                      </h2>
                    </div>

                    <Dialog open={salaAbertaId === String(r._id || r.id)} onOpenChange={(aberto) => setSalaAbertaId(aberto ? String(r._id || r.id) : null)}>
                      <DialogTrigger className="text-center text-xl rounded-md hover:bg-border width-lg! p-1">Código: {r.code}</DialogTrigger>

                      <DialogContent className="rounded-md">
                        <DialogHeader className="flex flex-col">
                          <DialogTitle className="font-konkhmer-sleokchher text-2xl">Informações da sala</DialogTitle>

                          <h2 className="font-konkhmer-sleokchher text-start text-xl">Código: {r.code}</h2>

                          <h2 className="font-konkhmer-sleokchher text-start text-xl">Grupos pendentes:</h2>

                          {r.groups?.filter((g: any) => g.status === 'pendente').map((g: any) => (
                            <div key={g._id} className="flex flex-col items-center justify-start w-full max-w-2.5xl p-2 sm:p-3 m-0 font-konkhmer-sleokchher">
                              <div className="flex flex-row items-center justify-start w-full max-w-2.5xl p-2 sm:p-3 m-0 font-konkhmer-sleokchher">
                                <h2 className="text-center text-lg whitespace-nowrap">{g.name}</h2>

                                <div className="flex w-full items-center justify-end place-content-start gap-2">
                                  <Button className="w-8 h-8 bg-transparent hover:bg-border text-accent-foreground rounded-md text-base sm:text-lg" onClick={() => handleAutorizar(r._id, g._id, 'autorizado')}><CheckIcon /></Button>
                                  <Button className="w-8 h-8 bg-transparent hover:bg-border text-accent-foreground rounded-md text-base sm:text-lg" onClick={() => handleAutorizar(r._id, g._id, 'recusado')}><XIcon /></Button>
                                </div>
                              </div>
                            </div>
                          ))}

                          {r.groups?.filter((g: any) => g.status === 'pendente').length === 0 && (
                            <p className="ml-4 text-base opacity-70 font-konkhmer-sleokchher font-400 font-normal">Nenhum grupo pendente.</p>
                          )}

                          <h2 className="font-konkhmer-sleokchher font-normal font-400 text-start text-xl">Grupos membros:</h2>

                          {r.groups?.filter((g: any) => g.status === 'autorizado').map((g: any) => (
                            <div key={g._id} className="mb-2 ml-4">
                              <ul className="ml-4 list-disc text-base font-konkhmer-sleokchher font-normal font-400">
                                {g.members?.length
                                  ? g.members.map((m: string, i: number) => <li key={i}>{m}</li>)
                                  : g.name.split(",").map((m: string, i: number) => <li key={i}>{m.trim()}</li>)
                                }
                              </ul>
                            </div>
                          ))}

                          {r.groups?.filter((g: any) => g.status === 'autorizado').length === 0 && (
                            <p className="ml-4 text-base opacity-70 font-konkhmer-sleokchher font-400 font-normal">Nenhum grupo autorizado ainda.</p>
                          )}

                          <div className="items-center justify-end gap-2">
                            <Button type="button" className="w-25 h-10 mt-2 bg-green-600 hover:bg-green-700 text-accent-foreground rounded-md text-base sm:text-lg font-konkhmer-sleokchher" onClick={() => setSalaAbertaId(null)}>
                              Ok
                            </Button>
                          </div>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>

                    <h2 className="flex flex-row justify-start items-center text-xl rounded-md hover:bg-border p-1">
                      Criada por:
                      <Avatar className="ml-2 mr-2">
                        <AvatarImage src={r.createdBy?.profilePhoto} alt="foto" />
                      </Avatar>

                      {r.createdBy.name}
                    </h2>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={bloqueandoId !== null}
                      onClick={() =>
                        handleAlterarStatusSala(
                          String(r._id || r.id),
                          r.status === "bloqueada"
                            ? "aberta"
                            : "bloqueada"
                        )
                      }
                      className="ml-3 h-10 rounded-md text-base sm:text-lg"
                    >
                      {bloqueandoId === String(r._id || r.id) ? (
                        "Salvando..."
                      ) : r.status === "bloqueada" ? (
                        <>
                          <LockOpen className="mr-2 h-4 w-4" />
                          Desbloquear
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Bloquear
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                <div className="flex flex-col flex-1 w-full items-start justify-center ml-8! font-konkhmer-sleokchher font-400 font-normal p-0">
                  <h1 className="text-xl sm:text-2xl md:text-4xl">
                    Minhas matérias
                  </h1>
                </div>
                <Button
                  type="button"
                  className="h-10 bg-green-600 hover:bg-green-700 text-accent-foreground rounded-md text-base sm:text-lg"
                  onClick={() => navigate("/adicionar-coluna")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>

              {carregandoMaterias ? (
                <p className="mt-6 text-base opacity-70" role="status">
                  Carregando suas matérias...
                </p>
              ) : minhasMaterias.length === 0 ? (
                <p className="mt-6 text-base opacity-70">
                  Você ainda não escreveu nenhuma matéria.
                </p>
              ) : (
                <ul className="mt-6 w-full space-y-3">
                  {minhasMaterias.map((materia) => (
                    <li
                      key={materia._id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 sm:p-4"
                    >
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl wrap-break-word">
                          {materia.title}
                        </h2>

                        {materia.subtitle && (
                          <p className="text-sm opacity-70 wrap-break-word">
                            {materia.subtitle}
                          </p>
                        )}

                        <p className="text-xs opacity-70 mt-1">
                          Publicada em{" "}
                          {new Date(
                            materia.createdAt
                          ).toLocaleDateString("pt-BR")}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            navigate(
                              `/noticia/${materia._id}`
                            )
                          }
                        >
                          Ver
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            navigate(
                              `/adicionar-coluna/${materia._id}`
                            )
                          }
                        >
                          Editar
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          disabled={
                            excluindoId === materia._id
                          }
                          onClick={() =>
                            handleExcluirMateria(
                              materia._id
                            )
                          }
                        >
                          <Trash className="mr-2 h-4 w-4" />

                          {excluindoId === materia._id
                            ? "Excluindo..."
                            : "Excluir"}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

export default Home
