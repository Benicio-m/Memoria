import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import "../App.css";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";

import {
  InstagramLogoIcon,
  FacebookLogoIcon,
} from "@phosphor-icons/react";
import { Plus, Pencil } from "lucide-react";

type User = {
  id: string;
  name: string;
  role: "professor" | "aluno";
  roomId?: string;
  status?: string;
};

type Noticia = {
  _id: string;
  title: string;
  subtitle?: string;
  content?: string;
  iconImage?: string;
  authors: string;
  createdAt: string;
};

function resumo(content = "") {
  const primeiroParagrafo = content
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((bloco) => bloco.trim())
    .find(
      (bloco) =>
        bloco.length > 0 &&
        !/^(#{1,6}\s|!\[|```|---\s*$)/.test(bloco)
    );

  if (!primeiroParagrafo) return "";

  const texto = primeiroParagrafo
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`]/g, "")
    .replace(/^>\s?/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  return texto.length > 180
    ? `${texto.slice(0, 180).trimEnd()}…`
    : texto;
}

function Pupil() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [news, setNews] = useState<Noticia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function carregarPagina() {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/escrever", { replace: true });
        return;
      }

      setCarregando(true);
      setErro("");

      try {
        // Primeiro verifica o usuário logado.
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/rooms/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (controller.signal.aborted) return;

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/escrever", { replace: true });
          return;
        }

        if (!response.ok || !data.ok || !data.user) {
          throw new Error(
            data.error || "Não foi possível verificar seu login."
          );
        }

        if (data.user.role !== "aluno") {
          navigate("/home", { replace: true });
          return;
        }

        setUser(data.user);

        // Depois busca somente as matérias do grupo logado.
        const resNoticias = await fetch(
          `${import.meta.env.VITE_API_URL}/rooms/news/mine`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const dataNoticias = await resNoticias.json();

        if (controller.signal.aborted) return;

        if (!resNoticias.ok || !dataNoticias.ok) {
          throw new Error(
            dataNoticias.error ||
              "Não foi possível carregar as matérias do grupo."
          );
        }

        setNews(
          Array.isArray(dataNoticias.news) ? dataNoticias.news : []
        );
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Erro ao carregar a página do aluno:", error);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a página."
        );
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    carregarPagina();

    return () => controller.abort();
  }, [navigate]);

  async function logout() {
    const token = localStorage.getItem("token");

    setSaindo(true);

    try {
      if (token) {
        await fetch(
          `${import.meta.env.VITE_API_URL}/rooms/logout`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Erro ao chamar logout:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setUser(null);
      setNews([]);

      navigate("/", { replace: true });
    }
  }

  return (
    <ScrollArea className="w-full h-dvh bg-border">
      <div className="flex min-h-dvh w-full flex-col">
        {/* Cabeçalho */}
        <header className="w-full mb-2 sm:mb-4 md:mb-6">
          <Card className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 p-4 sm:p-6">
            <div className="flex flex-col items-center justify-start">
              <p className="font-konkhmer-sleokchher text-lg font-normal">
                Um site:
              </p>

              <div className="flex items-center justify-center gap-3 mt-2">
                <img
                  src="https://i.ibb.co/C37cbVFf/image.png"
                  alt="Instituição parceira"
                  className="h-14 sm:h-16 w-auto object-contain"
                />

                <img
                  src="https://bit.ly/partnership-logo-2"
                  alt="Instituição parceira"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <Link to="/" className="text-decoration-no-underline text-3xl sm:text-4xl font-normal font-konkhmer-sleokchher">
                Jornal Memória
              </Link>

              <h2 className="text-xl sm:text-2xl font-normal font-la-belle-aurore">
                Tempo em letras
              </h2>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <p className="font-konkhmer-sleokchher text-lg font-normal">
                Acesse nossas redes sociais:
              </p>

              <div className="flex items-center justify-center gap-3 mt-2">
                <a
                  href="https://www.facebook.com/cpfundamentalemedio/"
                  aria-label="Acessar o Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FacebookLogoIcon className="text-5xl sm:text-6xl" />
                </a>

                <a
                  href="https://www.instagram.com/colegiopresbiterianomackenzie/"
                  aria-label="Acessar o Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InstagramLogoIcon className="text-5xl sm:text-6xl" />
                </a>
              </div>
            </div>
          </Card>
        </header>

        {/* Área branca: ações e matérias do grupo */}
        <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 pb-6 font-konkhmer-sleokchher font-normal">
          <Card className="w-full flex flex-col gap-6 rounded-md p-4 sm:p-6 shadow-md shadow-accent-foreground">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-nowrap">  
                  <h2 className="text-xl sm:text-2xl md:text-3xl whitespace-nowrap">
                    Matérias do grupo formado por: {user && user.name}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Adicionar matéria"
                  title="Adicionar matéria"
                  className="w-10 h-10 rounded-md text-accent-foreground"
                  disabled={!user || saindo}
                  onClick={() => navigate("/adicionar-coluna")}
                >
                  <Plus className="w-5 h-5" />
                </Button>

                <Button
                  type="button"
                  className="h-10 bg-green-600 hover:bg-green-700 text-accent-foreground rounded-md text-base"
                  disabled={saindo}
                  onClick={logout}
                >
                  {saindo ? "Saindo..." : "Sair"}
                </Button>
              </div>
            </div>

            {carregando ? (
              <p className="text-sm opacity-70" role="status">
                Carregando matérias...
              </p>
            ) : erro ? (
              <p className="text-sm text-red-600" role="alert">
                {erro}
              </p>
            ) : (
              <div className="w-full space-y-4">
                {news.map((noticia) => (
                  <div
                    key={noticia._id}
                    className="rounded-md border p-3 sm:p-4"
                  >
                    <Link
                      to={`/noticia/${noticia._id}`}
                      className="flex items-start gap-4"
                    >
                      {noticia.iconImage && (
                        <img
                          src={noticia.iconImage}
                          alt=""
                          loading="lazy"
                          className="w-20 h-20 sm:w-28 sm:h-28 shrink-0 object-cover rounded-md"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl wrap-break-word">
                          {noticia.title}
                        </h3>

                        <p className="text-sm opacity-70 mt-1">
                          Por: {noticia.authors}
                        </p>

                        <p className="text-xs opacity-60 mt-1">
                          {new Date(
                            noticia.createdAt
                          ).toLocaleDateString("pt-BR", {
                            timeZone: "America/Sao_Paulo",
                          })}
                        </p>

                        <p className="text-sm mt-2 line-clamp-3 wrap-break-word">
                          {resumo(noticia.content)}
                        </p>
                      </div>
                    </Link>

                    <div className="flex justify-end mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/adicionar-coluna/${noticia._id}`
                          )
                        }
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}

                {user && news.length === 0 && (
                  <p className="text-sm opacity-70">
                    Nenhuma matéria criada ainda. Clique no + para
                    criar a primeira.
                  </p>
                )}
              </div>
            )}
          </Card>
        </main>
      </div>
    </ScrollArea>
  );
}

export default Pupil;
