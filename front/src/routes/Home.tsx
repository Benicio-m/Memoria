import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import '../App.css'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { ScrollArea } from '../components/ui/scroll-area'
import { InstagramLogoIcon, FacebookLogoIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input';
import { CheckIcon, Plus, XIcon } from 'lucide-react';
function Home() {
  const navigate = useNavigate();
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [openi, setOpeni] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [gottenRooms, setGottenRooms] = useState<any[]>([])
  const [pendingGroups, setPendingGroups] = useState<any[]>([])
  type User = {
    id: string;
    name: string;
    email: string;
    role: "professor" | "aluno";
    profilePhoto?: string;
    roomId?: string;
  };
  const [user, setUser] = useState<User | null>(null);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  async function handleAutorizar(salaId: string, grupoId: string, status: 'autorizado' | 'recusado') {
    if (!salaId || !grupoId) {
      setError("IDs da sala ou do grupo não encontrados.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/rooms/${String(salaId)}/groups/${String(grupoId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
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
        // remove dos pendentes e atualiza o status no allGroups
        setPendingGroups(prev => prev.filter(g => String(g._id) !== String(grupoId)));
        setAllGroups(prev => prev.map(g =>
          String(g._id) === String(grupoId) ? { ...g, status } : g
        ));
      } else {
        setError(data?.error || "Erro ao atualizar status do grupo.");
      }
    } catch (err) {
      console.error("Erro ao autorizar/recusar:", err);
      setError("Erro de conexão ao atualizar status.");
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
    if(token) {
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
      navigate("/escrever")
    }
  }
  async function createRoom() {
    const usr = getLoggedUser()
    if(!usr?.id) {
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
    if(response.ok && data.ok) {
      alert("Sala criada: " + data.room)
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
      if(rooms.ok && data.ok) {
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

        console.log("Status:", response.status);
        console.log("Resposta bruta:", text);

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
  return (
    <ScrollArea className="w-full h-dvh bg-border">
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
              <h1 className="text-3xl sm:text-4xl font-normal font-konkhmer-sleokchher font-400 whitespace-nowrap">Jornal Memória</h1>
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
        <div className="flex flex-1 w-full items-start justify-start ml-8 sm: ml-0 bg-border font-konkhmer-sleokchher font-400 font-normal p-0">
          <div className="flex flex-col flex-1 w-full items-start justify-start ml-8 sm:ml-0 bg-border font-konkhmer-sleokchher font-400 font-normal p-0">
            <Card className="flex flex-col items-center justify-center shadow-accent-foreground shadow-md w-full max-w-7xl p-2 sm:p-3 m-0 rounded-md">
              <div className="flex flex-row items-center justify-end w-full max-w-2.5xl p-2 sm:p-3 m-0">
                <div className="flex flex-col flex-1 w-full items-start justify-center ml-8! font-konkhmer-sleokchher font-400 font-normal p-0"> 
                  <h1 className="text-xl text-left sm:text-2xl md:text-4xl">Salas</h1>
                </div> 
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger className="w-10 h-10 pl-2 bg-transparent hover:bg-border text-accent-foreground text-center rounded-md sm:text-lg"><Plus /></DialogTrigger>
                  <DialogContent className="rounded-md max-h-auto">
                    <DialogHeader>
                      <DialogTitle className="font-konkhmer-sleokchher text-2xl">Criar</DialogTitle>
                      <Input placeholder="Nome da sala" className="font-konkhmer-sleokchher rounded-md" onChange={(e) => setRoomName(e.target.value)}/>
                      <div className="flex items-center justify-end gap-2 font-konkhmer-sleokchher">
                        <Button className="w-25 h-10 mt-2 bg-transparent hover:bg-border text-accent-foreground rounded-md text-base sm:text-lg" onClick={() => setOpen(!open)}>Cancelar</Button>
                        <Button className="w-20 h-10 mt-2 bg-amber-600 hover:bg-amber-700 text-accent-foreground rounded-md text-base sm:text-lg" onClick={() => {
                          createRoom()
                          return setOpen(!open)
                        }}>Ok</Button>
                      </div>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
                <Button className="w-20 h-10 bg-amber-600 hover:bg-amber-700 text-accent-foreground rounded-md text-base sm:text-lg" onClick={logout}>Sair</Button>
              </div>
              <div className="flex flex-1 flex-col w-full items-start justify-start ml-8! shadow-accent-foreground font-konkhmer-sleokchher font-400 font-normal p-0">
                {gottenRooms.map(r => (
                  <div className="flex flex-1 flex-row w-full items-center justify-center shadow-accent-foreground font-konkhmer-sleokchher font-400 font-normal p-0" key={r._id || r.id}>
                    <div className="w-4xl items-start justify-center font-konkhmer-sleokchher font-400 font-normal p-0">
                      <h2 className="text-start text-xl">{r.name}</h2>
                    </div>
                    <Dialog>
                      <DialogTrigger className="text-center text-xl rounded-md hover:bg-border width-lg! p-1">Código: {r.code}</DialogTrigger>
                      <DialogContent className="rounded-md">
                        <DialogHeader className="flex flex-col">
                          <DialogTitle className="font-konkhmer-sleokchher text-2xl">Informações da sala</DialogTitle>
                          <h2 className="font-konkhmer-sleokchher text-start text-xl">Código: {r.code}</h2>
                          <h2 className="font-konkhmer-sleokchher text-start text-xl">Grupos pendentes:</h2>
                          {pendingGroups.filter(g => String(g.roomId) === String(r._id)).map(g => (
                            <div className="flex flex-col items-center justify-start w-full max-w-2.5xl p-2 sm:p-3 m-0 font-konkhmer-sleokchher">
                              <div className="flex flex-row items-center justify-start w-full max-w-2.5xl p-2 sm:p-3 m-0 font-konkhmer-sleokchher">
                                <h2 className="text-center text-lg whitespace-nowrap">{g.name}</h2>
                                <div className="flex w-full items-center justify-end place-content-start gap-2">
                                  <Button className="w-8 h-8 bg-transparent hover:bg-border text-accent-foreground rounded-md text-base sm:text-lg" onClick={() => handleAutorizar(r._id, g._id, 'autorizado')}><CheckIcon /></Button>
                                  <Button className="w-8 h-8 bg-transparent hover:bg-border text-accent-foreground rounded-md text-base sm:text-lg" onClick={() => handleAutorizar(r._id, g._id, 'recusado')}><XIcon /></Button>
                                </div>
                              </div>
                            </div>
                          ))}
                          <h2 className="font-konkhmer-sleokchher text-start text-xl">Grupos membros:</h2>
                          {allGroups
                            .filter(g => String(g.roomId) === String(r._id))
                            .map(g => (
                              <div key={g._id} className="mb-2 ml-4">
                                <h3 className="text-base">
                                  {g.name} — {g.status}
                                </h3>
                                <ul className="ml-4 list-disc text-base">
                                  {g.members?.map((m: string, i: number) => (
                                    <li key={i}>{m}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}

                          {allGroups.filter(g => String(g.roomId) === String(r._id)).length === 0 && (
                            <p className="ml-4 text-base opacity-70 font-konkhmer-sleokchher font-400 font-normal">Nenhum grupo nesta sala ainda.</p>
                          )}
                          <div className="items-center justify-end gap-2">
                            <Button className="w-25 h-10 mt-2 bg-amber-600 hover:bg-amber-700 text-accent-foreground rounded-md text-base sm:text-lg font-konkhmer-sleokchher" onClick={() => setOpeni(!openi)}>Ok</Button>
                          </div>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div> 
            </Card>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

export default Home
