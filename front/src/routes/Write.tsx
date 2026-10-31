import '../App.css'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { ScrollArea } from '../components/ui/scroll-area'
import { InstagramLogoIcon, FacebookLogoIcon } from '@phosphor-icons/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/ui/spinner';
function Write() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [tipoLogin, setTipoLogin] = useState<"professor" | "aluno">("professor")
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  async function handleAlunoLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if(!code || !name || !code && !name) {
        alert("Preencha todos os campos")
        return
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          name: name, // ex.: "João, Maria, Pedro"
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok || !data.ok) {
        setError(data.error || "Erro ao entrar na sala");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.group.id,
          name: data.group.name,
          role: "aluno",
          members: data.group.members,
        })
      );

      if (data.group.status === "autorizado") {
        navigate("/aluno");
      } else {
        setLoading(true);
      }
    } catch (err) {
      console.error("Erro no login do aluno:", err);
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }
  async function handleProfessorLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/rooms/write`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password: senha }),
        }
      );

      const text = await response.text();

      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Resposta não é JSON:", text);
        setError(
          `Erro no servidor (${response.status}). Verifique a rota /rooms/write.`
        );
        return;
      }

      if (!response.ok || !data.ok) {
        setError(data.error || `Erro ao fazer login (${response.status})`);
        return;
      }
      console.log(data.user)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/professor/home");
    } catch (err) {
      console.error("Erro no login:", err);
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function verificarSeJaEstaLogado() {
      const token = localStorage.getItem("token");

      if (!token) return;

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

        if (response.ok && data.ok) {
          if (data.user.role === "professor") {
            navigate("/professor/home");
          } else if (data.user.role === "aluno") {
            navigate("/aluno");
          }
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } catch (err) {
        console.error("Erro ao verificar login:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    verificarSeJaEstaLogado();
  }, [navigate]);
  return loading ? (
    <ScrollArea className="w-full h-dvh bg-border">
      <div className="flex flex-col h-full min-h-dvh w-full">
        <div className="w-full bg-border mt-0 mb-2 sm:mb-4 md:mb-6">
          <Card className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 p-4 sm:p-6">
            <div className="flex flex-col items-center justify-start h-full">
              <p className="font-konkhmer-sleokchher font-400 text-lg font-normal whitespace-nowrap">Um site:</p>
              <div className="flex flex-row items-center justify-center md:justify-start h-full gap-3 mt-2">
                <img src="https://bit.ly/partnership-logo" className="h-10 sm:h-12 w-auto object-contain" />
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
        <div className="flex flex-1 w-full items-center justify-center bg-border font-konkhmer-sleokchher font-400 font-normal p-0"><Spinner /></div>
      </div>
    </ScrollArea>
  ) : (
    <ScrollArea className="w-full h-dvh bg-border">
      <div className="flex flex-col h-full min-h-dvh w-full">
        <div className="w-full bg-border mt-0 mb-2 sm:mb-4 md:mb-6">
          <Card className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 p-4 sm:p-6">
            <div className="flex flex-col items-center justify-start h-full">
              <p className="font-konkhmer-sleokchher font-400 text-lg font-normal whitespace-nowrap">Um site:</p>
              <div className="flex flex-row items-center justify-center md:justify-start h-full gap-3 mt-2">
                <img src="https://i.ibb.co/C37cbVFf/image.png" className="h-10 sm:h-12 w-auto object-contain" />
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
        <div className="flex flex-1 w-full items-center justify-center bg-border font-konkhmer-sleokchher font-400 font-normal p-0">
          <Card className="flex flex-col items-center justify-center shadow-accent-foreground shadow-md w-full max-w-2xl p-2 sm:p-3 m-0 rounded-md">
            <Tabs className="flex flex-col-reverse w-full" defaultValue="p" aria-label="Professores e Alunos" onValueChange={(v) => setTipoLogin(v as "professor" | "aluno")}>
              <TabsList className="flex w-full h-12! bg-border rounded-md p-2 sm:p-3">
                <TabsTrigger value="prof" className="w-1/2 h-10 text-base sm:text-lg rounded-md">Professor</TabsTrigger>
                <TabsTrigger value="sala" className="w-1/2 h-10 text-base sm:text-lg rounded-md">Sala</TabsTrigger>
              </TabsList>
              <TabsContent value="prof" className="flex flex-col flex-1 w-full h-full"> 
                <h1 className="text-lg sm:text-xl md:text-2xl text-center">Logue com seu e-mail para poder escrever</h1>
                <Input className="w-full h-9 mt-2" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input type="password" className="w-full h-9 mt-2" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)}/>
                <Button className="w-full h-10 mt-2 bg-green-600 hover:bg-green-700 text-accent-foreground rounded-md text-base sm:text-lg" onClick={handleProfessorLogin}> Entrar</Button>
              </TabsContent>
              <TabsContent value="sala" className="flex flex-col w-full h-full">
                <h1 className="text-lg sm:text-xl md:text-2xl text-center">Logue com o código da sala para poder escrever</h1>
                <Input className="w-full h-9 mt-2" placeholder="Código da sala" onChange={(e) => setCode(e.target.value)}/>
                <Input className="w-full h-9 mt-2" placeholder="Seu nome completo" onChange={(e) => setName(e.target.value)}/>
                <Button className="w-full h-10 mt-2 bg-green-600 hover:bg-green-700 text-accent-foreground rounded-md text-base sm:text-lg" onClick={handleAlunoLogin}>Entrar</Button>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </ScrollArea>
  )
}

export default Write
