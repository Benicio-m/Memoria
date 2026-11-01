import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

type Comentario = {
  _id: string;
  author: string;
  text: string;
  createdAt: string;
};

type Noticia = {
  _id: string;
  title: string;
  subtitle?: string;
  authors: string;
  iconImage?: string;
  content: string;
  createdAt: string;
  comments?: Comentario[];
};

function Column() {
  const { id } = useParams<{ id: string }>();

  const [news, setNews] = useState<Noticia | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroComentario, setErroComentario] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function carregar() {
      setCarregando(true);
      setErro("");
      setNews(null);
      setErroComentario("");
      setComentario("");

      if (!id) {
        setErro("Matéria não informada.");
        setCarregando(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/rooms/news/${id}`,
          {
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (controller.signal.aborted) return;

        if (!response.ok || !data.ok || !data.news) {
          throw new Error(
            data.error || "Não foi possível carregar a matéria."
          );
        }

        setNews(data.news);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Erro ao carregar matéria:", error);

        setErro(
          error instanceof Error
            ? error.message
            : "Erro de conexão ao carregar a matéria."
        );
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    carregar();

    return () => controller.abort();
  }, [id]);

  async function comentar() {
    const texto = comentario.trim();

    if (!id || !texto || enviando) return;

    setEnviando(true);
    setErroComentario("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/rooms/news/${id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            author: nome.trim() || "Anônimo",
            text: texto,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok || !data.news) {
        throw new Error(
          data.error || "Não foi possível enviar o comentário."
        );
      }

      setNews(data.news);
      setComentario("");
    } catch (error) {
      console.error("Erro ao comentar:", error);

      setErroComentario(
        error instanceof Error
          ? error.message
          : "Erro de conexão ao enviar o comentário."
      );
    } finally {
      setEnviando(false);
    }
  }

  const urlPublica = news
    ? new URL(
        `/noticia/${news._id}`,
        window.location.origin
      ).href
    : "";

  const comentarios = news?.comments || [];

  return (
    <ScrollArea className="column-scroll w-full h-dvh bg-border">
      <main className="column-page min-h-dvh px-3 py-6 sm:px-6">
        <div className="column-container w-full max-w-3xl mx-auto">
          {/* Navegação: somente no site */}
          <nav className="column-screen-only flex items-center justify-between gap-3 mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao jornal
            </Link>

            {news && !carregando && !erro && (
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            )}
          </nav>

          {carregando ? (
            <Card className="p-6">
              <p className="text-sm opacity-70" role="status">
                Carregando matéria...
              </p>
            </Card>
          ) : erro || !news ? (
            <Card className="p-6">
              <p className="text-red-600" role="alert">
                {erro || "Matéria não encontrada."}
              </p>
            </Card>
          ) : (
            <>
              {/* Matéria: aparece no site e na impressão */}
              <Card className="column-document p-5 sm:p-8">
                <article>
                  <header className="mb-6">
                    <p className="text-sm opacity-70 mb-4 font-konkhmer-sleokchher">
                      Jornal Memória — Tempo em letras
                    </p>

                    <h1 className="text-3xl sm:text-4xl leading-tight break-words font-konkhmer-sleokchher">
                      {news.title}
                    </h1>

                    {news.subtitle && (
                      <p className="text-lg opacity-75 mt-3 break-words">
                        {news.subtitle}
                      </p>
                    )}

                    <p className="text-sm mt-4 break-words">
                      Por: {news.authors}
                    </p>

                    <time
                      dateTime={news.createdAt}
                      className="block text-sm opacity-70 mt-1"
                    >
                      {new Date(news.createdAt).toLocaleDateString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          timeZone: "America/Sao_Paulo",
                        }
                      )}
                    </time>
                  </header>

                  {news.iconImage && (
                    <img
                      src={news.iconImage}
                      alt={`Imagem da matéria: ${news.title}`}
                      className="w-full max-h-96 object-contain rounded-md mb-6"
                    />
                  )}

                  <div className="column-content break-words leading-relaxed text-base sm:text-lg">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => (
                          <h2 className="text-3xl font-bold mt-8 mb-4">
                            {children}
                          </h2>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-2xl font-bold mt-7 mb-3">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xl font-bold mt-6 mb-3">
                            {children}
                          </h3>
                        ),
                        h4: ({ children }) => (
                          <h4 className="text-lg font-bold mt-5 mb-2">
                            {children}
                          </h4>
                        ),
                        p: ({ children }) => (
                          <p className="mb-4">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-6 mb-4 space-y-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-6 mb-4 space-y-1">
                            {children}
                          </ol>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 underline break-words"
                          >
                            {children}
                          </a>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 pl-4 italic opacity-80 my-4">
                            {children}
                          </blockquote>
                        ),
                        img: ({ src, alt }) => (
                          <img
                            src={src}
                            alt={alt || ""}
                            className="max-w-full h-auto rounded-md my-4"
                          />
                        ),
                        pre: ({ children }) => (
                          <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted p-4 mb-4 text-sm">
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {news.content}
                    </ReactMarkdown>
                  </div>

                  {/* QR code: somente na impressão */}
                  <footer className="column-print-only column-qrcode">
                    <div className="column-qrcode-layout">
                      <div className="column-qrcode-image">
                        <QRCodeSVG
                          value={urlPublica}
                          size={112}
                          level="M"
                          bgColor="#ffffff"
                          fgColor="#000000"
                        />
                      </div>

                      <div className="column-qrcode-text">
                        <h2>Leia esta matéria online</h2>

                        <p>
                          Escaneie o QR code para acessar esta
                          matéria no Jornal Memória.
                        </p>

                        <a href={urlPublica}>
                          {urlPublica}
                        </a>
                      </div>
                    </div>
                  </footer>
                </article>
              </Card>

              {/* Comentários: somente no site */}
              <section className="column-screen-only mt-6">
                <Card className="p-5 sm:p-6 space-y-5">
                  <h2 className="text-xl font-konkhmer-sleokchher">
                    Comentários ({comentarios.length})
                  </h2>

                  {comentarios.length === 0 ? (
                    <p className="text-sm opacity-70">
                      Ainda não há comentários nesta matéria.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {comentarios.map((item) => (
                        <div
                          key={item._id}
                          className="border-b pb-4"
                        >
                          <p className="font-semibold break-words">
                            {item.author}
                          </p>

                          <p className="text-sm whitespace-pre-wrap break-words mt-2">
                            {item.text}
                          </p>

                          <time
                            dateTime={item.createdAt}
                            className="block text-xs opacity-60 mt-2"
                          >
                            {new Date(
                              item.createdAt
                            ).toLocaleString("pt-BR", {
                              timeZone: "America/Sao_Paulo",
                            })}
                          </time>
                        </div>
                      ))}
                    </div>
                  )}

                  <form
                    className="space-y-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void comentar();
                    }}
                  >
                    <div className="space-y-2">
                      <label
                        htmlFor="nome-comentario"
                        className="text-sm"
                      >
                        Seu nome (opcional)
                      </label>

                      <Input
                        id="nome-comentario"
                        value={nome}
                        onChange={(event) =>
                          setNome(event.target.value)
                        }
                        placeholder="Anônimo"
                        maxLength={80}
                        disabled={enviando}
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="texto-comentario"
                        className="text-sm"
                      >
                        Comentário
                      </label>

                      <Textarea
                        id="texto-comentario"
                        value={comentario}
                        onChange={(event) =>
                          setComentario(event.target.value)
                        }
                        placeholder="Escreva seu comentário..."
                        className="min-h-28"
                        maxLength={2000}
                        required
                        disabled={enviando}
                      />
                    </div>

                    {erroComentario && (
                      <p
                        className="text-sm text-red-600"
                        role="alert"
                      >
                        {erroComentario}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={enviando || !comentario.trim()}
                    >
                      {enviando ? "Enviando..." : "Comentar"}
                    </Button>
                  </form>
                </Card>
              </section>
            </>
          )}
        </div>
      </main>
    </ScrollArea>
  );
}

export default Column;