import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

import MarkdownMateria from "@/components/jornal/MarkdownMateria";
import { FacebookLogoIcon, InstagramLogoIcon } from "@phosphor-icons/react";

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
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroComentario, setErroComentario] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function carregar() {
      setCarregando(true);
      setErro("");
      setNews(null);
      setTexto("");
      setErroComentario("");

      try {
        if (!id) {
          throw new Error("Matéria não informada.");
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/rooms/news/${id}`,
          {
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.ok || !data.news) {
          throw new Error(
            data.error || "Matéria não encontrada."
          );
        }

        if (!controller.signal.aborted) {
          setNews(data.news);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar a matéria."
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
    if (!texto.trim() || enviando || !id) return;

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
            text: texto.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok || !data.news) {
        throw new Error(
          data.error || "Erro ao enviar comentário."
        );
      }

      setNews(data.news);
      setTexto("");
    } catch (error) {
      setErroComentario(
        error instanceof Error
          ? error.message
          : "Erro de conexão."
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
      <header className="hid-printable w-full mb-2 sm:mb-4 md:mb-6">
        <Card className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 p-4 sm:p-6">
          <div className="flex flex-col items-center justify-start">
            <p className="font-konkhmer-sleokchher text-lg font-normal">
              Um site:
            </p>

            <div className="flex flex-row items-center justify-center gap-3 mt-2">
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
            <h1 className="text-3xl sm:text-4xl font-normal font-konkhmer-sleokchher">
              Jornal Memória
            </h1>

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
      <main className="column-page min-h-dvh px-3 pt-1 pb-6 sm:px-6">
        <div className="column-container w-full max-w-3xl mx-auto">
          <nav className="column-screen-only flex items-center justify-between gap-3 mb-1">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao jornal
            </Link>

            {news && !carregando && !erro && (
              <Button
                variant="outline"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            )}
          </nav>

          {carregando ? (
            <Card className="p-6">
              <p role="status">
                Carregando matéria...
              </p>
            </Card>
          ) : erro || !news ? (
            <Card className="p-6">
              <p
                role="alert"
                className="text-red-600"
              >
                {erro || "Matéria não encontrada."}
              </p>
            </Card>
          ) : (
            <>
              <Card className="column-document p-5 sm:p-8">
                <article>
                  <header className="mb-6">
                    <p className="text-sm opacity-70 mb-4 font-konkhmer-sleokchher">
                      Jornal Memória — Tempo em letras
                    </p>

                    <h1 className="text-3xl sm:text-4xl leading-tight wrap-break-word font-konkhmer-sleokchher">
                      {news.title}
                    </h1>

                    {news.subtitle && (
                      <p className="text-lg opacity-75 mt-3 wrap-break-word">
                        {news.subtitle}
                      </p>
                    )}

                    <p className="text-sm mt-4 wrap-break-word">
                      Por: {news.authors}
                    </p>

                    <time
                      dateTime={news.createdAt}
                      className="block text-sm opacity-70 mt-1"
                    >
                      {new Date(
                        news.createdAt
                      ).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        timeZone: "America/Sao_Paulo",
                      })}
                    </time>
                  </header>

                  {news.iconImage && (
                    <img
                      src={news.iconImage}
                      alt={`Imagem da matéria: ${news.title}`}
                      className="w-full max-h-96 object-contain rounded-md mb-6"
                    />
                  )}

                  <MarkdownMateria
                    content={news.content}
                  />

                  {/* Somente na impressão */}
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
                        <h2>
                          Leia esta matéria online
                        </h2>

                        <p>
                          Escaneie o QR code para acessar
                          esta matéria no Jornal Memória.
                        </p>

                        <a href={urlPublica}>
                          {urlPublica}
                        </a>
                      </div>
                    </div>
                  </footer>
                </article>
              </Card>

              {/* Somente no site */}
              <section className="column-screen-only mt-6">
                <Card className="p-5 sm:p-6 space-y-5 font-konkhmer-sleokchher font-normal">
                  <h2 className="text-xl">
                    Comentários ({comentarios.length})
                  </h2>

                  {comentarios.length === 0 && (
                    <p className="text-sm opacity-70">
                      Ainda não há comentários.
                    </p>
                  )}

                  {comentarios.map((comentario) => (
                    <div
                      key={comentario._id}
                      className="border-b pb-4"
                    >
                      <p className="font-semibold wrap-break-word">
                        {comentario.author}
                      </p>

                      <p className="whitespace-pre-wrap wrap-break-word mt-2">
                        {comentario.text}
                      </p>

                      <time
                        dateTime={comentario.createdAt}
                        className="block text-xs opacity-60 mt-2"
                      >
                        {new Date(
                          comentario.createdAt
                        ).toLocaleString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                        })}
                      </time>
                    </div>
                  ))}

                  <form
                    className="space-y-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void comentar();
                    }}
                  >
                    <label
                      htmlFor="nome-comentario"
                      className="block text-sm"
                    >
                      Seu nome (opcional)
                    </label>

                    <Input
                      id="nome-comentario"
                      value={nome}
                      onChange={(event) =>
                        setNome(event.target.value)
                      }
                      maxLength={80}
                      disabled={enviando}
                      placeholder="Anônimo"
                    />

                    <label
                      htmlFor="comentario"
                      className="block text-sm"
                    >
                      Comentário
                    </label>

                    <Textarea
                      id="comentario"
                      value={texto}
                      onChange={(event) =>
                        setTexto(event.target.value)
                      }
                      maxLength={2000}
                      required
                      disabled={enviando}
                      placeholder="Escreva seu comentário..."
                    />

                    {erroComentario && (
                      <p
                        role="alert"
                        className="text-sm text-red-600"
                      >
                        {erroComentario}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={
                        enviando || !texto.trim()
                      }
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {enviando
                        ? "Enviando..."
                        : "Comentar"}
                    </Button>
                  </form>
                </Card>
              </section>
            </>
          )}
        </div>
      </main>
      <footer className="hid-printable w-full mt-6 mb-0 font-konkhmer-sleokchher">
        <Card className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 p-4 sm:p-6">
          <div className="flex flex-col items-center justify-start">
            <p className="font-konkhmer-sleokchher text-lg font-normal">
              Créditos:
            </p>
            <ul className="list-disc list-inside text-left font-light font-sans font-100">
              <li>Proposta: Professora Vânia e Professor Cláudio</li>
              <li>Visuais: Professora Larissa Rocha Scaleti Lopes</li>
              <li>Matérias: Alunos escritores e redatores das turmas</li>
              <li>Difusão: Nicole Campos de Carvalho, Pedro Henrique Boscolo Padua, </li>
              <li>Design e estrutura: Benício Motta Ramires</li>
              <li>Escrita: Alunos redatores das salas participantes</li>
            </ul>
          </div>
        </Card>
      </footer>
    </ScrollArea>
  );
}

export default Column;