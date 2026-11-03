import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FacebookLogoIcon,
  InstagramLogoIcon,
} from "@phosphor-icons/react";

type Noticia = {
  _id: string;
  title: string;
  subtitle?: string;
  iconImage?: string;
  authors: string;
  content?: string;
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
    // Mantém somente o texto da diretiva de fonte
    .replace(/:fonte\[([^\]]*)\](?:\{[^}]*\})?/g, "$1")
    // Remove links, mantendo apenas o texto
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Remove negrito
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    // Remove itálico
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Remove tachado
    .replace(/~~(.*?)~~/g, "$1")
    // Remove código inline
    .replace(/`([^`]*)`/g, "$1")
    // Remove diretivas de fonte
    .replace(/:[a-zA-Z-]+\{[^}]*\}/g, "")
    // Remove citações
    .replace(/^>\s?/gm, "")
    // Remove caracteres Markdown restantes
    .replace(/[*_~`#]/g, "")
    // Normaliza espaços
    .replace(/\s+/g, " ")
    .trim();

  return texto.length > 180
    ? `${texto.slice(0, 180).trimEnd()}…`
    : texto;
}

function normalizarPesquisa(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function ViewerHome() {
  const [highlights, setHighlights] = useState<Noticia[]>([]);
  const [allNews, setAllNews] = useState<Noticia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pesquisa, setPesquisa] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function carregar() {
      const base = import.meta.env.VITE_API_URL;

      setCarregando(true);
      setErro("");

      try {
        const [resH, resN] = await Promise.all([
          fetch(`${base}/rooms/news/highlights`, {
            signal: controller.signal,
          }),
          fetch(`${base}/rooms/news`, {
            signal: controller.signal,
          }),
        ]);

        const [dataH, dataN] = await Promise.all([
          resH.json(),
          resN.json(),
        ]);

        if (!resH.ok || !dataH.ok) {
          throw new Error(
            dataH.error ||
              "Não foi possível carregar os destaques."
          );
        }

        if (!resN.ok || !dataN.ok) {
          throw new Error(
            dataN.error ||
              "Não foi possível carregar as notícias."
          );
        }

        if (controller.signal.aborted) return;

        setHighlights(
          Array.isArray(dataH.highlights)
            ? dataH.highlights.slice(0, 4)
            : []
        );

        const noticias: Noticia[] = Array.isArray(dataN.news)
          ? dataN.news
          : [];

        setAllNews(
          [...noticias].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
        );
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Erro ao carregar o jornal:", error);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o jornal."
        );
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    carregar();

    return () => controller.abort();
  }, []);

  const termoPesquisa = normalizarPesquisa(pesquisa.trim());

  const noticiasFiltradas = allNews.filter((noticia) => {
    const texto = normalizarPesquisa(
      [
        noticia.title,
        noticia.subtitle || "",
        noticia.authors,
      ].join(" ")
    );

    return texto.includes(termoPesquisa);
  });

  const porData = noticiasFiltradas.reduce<
    Record<string, Noticia[]>
  >((grupos, noticia) => {
    const data = new Date(noticia.createdAt).toLocaleDateString(
      "pt-BR",
      { timeZone: "America/Sao_Paulo" }
    );

    if (!grupos[data]) {
      grupos[data] = [];
    }

    grupos[data].push(noticia);

    return grupos;
  }, {});

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
              <Link
                to="/"
                className="text-3xl sm:text-4xl font-normal font-konkhmer-sleokchher"
              >
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

        {/* Destaques e notícias dentro da mesma área branca */}
        <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 pb-6 font-konkhmer-sleokchher font-normal">
          <Card className="w-full flex flex-col gap-8 rounded-md bg-card p-4 sm:p-6 shadow-md shadow-accent-foreground">
            {carregando ? (
              <p className="text-sm opacity-70" role="status">
                Carregando notícias...
              </p>
            ) : erro ? (
              <p className="text-sm text-red-600" role="alert">
                {erro}
              </p>
            ) : (
              <>
                {/* Destaques */}
                <section className="w-full min-w-0">
                  <h2 className="text-xl sm:text-2xl md:text-4xl">
                    Destaques:
                  </h2>

                  {highlights.length > 0 ? (
                    <div className="px-10 mt-4">
                      <Carousel
                        className="w-full"
                        opts={{
                          align: "start",
                          loop: highlights.length > 1,
                        }}
                      >
                        <CarouselContent>
                          {highlights.map((noticia) => (
                            <CarouselItem
                              key={noticia._id}
                              className="md:basis-1/2"
                            >
                              <Link
                                to={`/noticia/${noticia._id}`}
                                className="block h-full"
                              >
                                <Card className="h-full flex flex-col gap-3 p-4">
                                  {noticia.iconImage && (
                                    <img
                                      src={noticia.iconImage}
                                      alt=""
                                      loading="lazy"
                                      className="w-full h-40 sm:h-48 object-cover rounded-md"
                                    />
                                  )}

                                  <h3 className="text-lg sm:text-xl wrap-break-word">
                                    {noticia.title}
                                  </h3>

                                  <p className="text-sm opacity-70">
                                    Por: {noticia.authors}
                                  </p>

                                  <p className="text-sm line-clamp-3 wrap-break-word">
                                    {resumo(noticia.content)}
                                  </p>
                                </Card>
                              </Link>
                            </CarouselItem>
                          ))}
                        </CarouselContent>

                        <CarouselPrevious aria-label="Destaque anterior" />
                        <CarouselNext aria-label="Próximo destaque" />
                      </Carousel>
                    </div>
                  ) : (
                    <p className="text-sm opacity-70 mt-3">
                      Nenhum destaque ainda.
                    </p>
                  )}
                </section>

                {/* Notícias por data */}
                <section className="w-full space-y-6 border-t pt-6">
                  <h2 className="text-xl sm:text-2xl">
                    Notícias:
                  </h2>

                  {/* Pesquisa */}
                  <div className="space-y-2">
                    <label
                      htmlFor="pesquisa-noticias"
                      className="block text-sm"
                    >
                      Pesquisar notícias
                    </label>

                    <Input
                      id="pesquisa-noticias"
                      type="search"
                      value={pesquisa}
                      onChange={(event) =>
                        setPesquisa(event.target.value)
                      }
                      placeholder="Busque por título, subtítulo ou autores..."
                      className="w-full font-sans"
                    />

                    {pesquisa.trim() && (
                      <p
                        className="text-sm opacity-70"
                        role="status"
                        aria-live="polite"
                      >
                        {noticiasFiltradas.length} resultado(s)
                        encontrado(s).
                      </p>
                    )}
                  </div>

                  {Object.entries(porData).map(
                    ([data, noticias]) => (
                      <div key={data}>
                        <h3 className="text-lg mb-3">
                          {data}
                        </h3>

                        <div className="space-y-4">
                          {noticias.map((noticia) => (
                            <Link
                              to={`/noticia/${noticia._id}`}
                              key={noticia._id}
                              className="block"
                            >
                              <div className="flex items-start gap-4 rounded-md border p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                                {noticia.iconImage && (
                                  <img
                                    src={noticia.iconImage}
                                    alt=""
                                    loading="lazy"
                                    className="w-20 h-20 sm:w-28 sm:h-28 shrink-0 object-cover rounded-md"
                                  />
                                )}

                                <div className="min-w-0 flex-1">
                                  <h4 className="text-lg sm:text-xl wrap-break-word">
                                    {noticia.title}
                                  </h4>

                                  <p className="text-sm opacity-70 mt-1">
                                    Por: {noticia.authors}
                                  </p>

                                  <p className="text-sm mt-2 line-clamp-3 wrap-break-word">
                                    {resumo(noticia.content)}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  {noticiasFiltradas.length === 0 && (
                    <p className="text-sm opacity-70">
                      {allNews.length === 0
                        ? "Nenhuma notícia publicada ainda."
                        : "Nenhuma notícia encontrada para essa pesquisa."}
                    </p>
                  )}
                </section>
              </>
            )}
          </Card>
        </main>
      </div>
    </ScrollArea>
  );
}

export default ViewerHome;