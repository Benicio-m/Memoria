import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FacebookLogoIcon, InstagramLogoIcon } from "@phosphor-icons/react";

function ViewerHome() {
  const [highlights, setHighlights] = useState<any[]>([]);
  const [allNews, setAllNews] = useState<any[]>([]);

  useEffect(() => {
    async function carregar() {
      const base = import.meta.env.VITE_API_URL;
      try {
        const [resH, resN] = await Promise.all([
          fetch(`${base}/rooms/news/highlights`),
          fetch(`${base}/rooms/news`),
        ]);
        const dataH = await resH.json();
        const dataN = await resN.json();

        if (dataH.ok) setHighlights(dataH.highlights);
        if (dataN.ok) setAllNews(dataN.news);
      } catch (err) {
        console.error("Erro ao carregar notícias:", err);
      }
    }
    carregar();
  }, []);

  // Agrupa as notícias por data
  const porData: Record<string, any[]> = {};
  allNews.forEach((n) => {
    const data = new Date(n.createdAt).toLocaleDateString("pt-BR");
    (porData[data] ||= []).push(n);
  });

  // Resumo = primeiro parágrafo do markdown
  function resumo(content: string) {
    const paragrafo = content
      .split("\n")
      .find((l: string) => l.trim() && !l.startsWith("#"));
    return (
      paragrafo?.replace(/[*_#>[\]()!]/g, "").slice(0, 160) + "..."
    );
  }

  return (
    <ScrollArea className="w-full h-dvh bg-border">
      <div className="flex flex-col h-full min-h-dvh w-full">
        {/* Cabeçalho */}
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

        {/* Destaques (carrossel) */}
        <div className="flex flex-1 w-full items-start justify-start bg-border font-konkhmer-sleokchher font-400 font-normal p-0">
          <div className="flex flex-col flex-1 w-full items-start justify-start bg-border font-konkhmer-sleokchher font-400 font-normal p-0">
            <Card className="flex flex-col items-center justify-center shadow-accent-foreground shadow-md w-full max-w-7xl p-2 sm:p-3 m-0 rounded-md">
              <div className="flex flex-row items-center justify-end w-full max-w-2.5xl p-2 sm:p-3 m-0">
                <div className="flex flex-col flex-1 w-full items-start justify-center ml-8! font-konkhmer-sleokchher font-400 font-normal p-0">
                  <h1 className="text-xl text-left sm:text-2xl md:text-4xl">Destaques:</h1>

                  {highlights.length > 0 ? (
                    <Carousel className="w-full max-w-2.5xl mt-4">
                      <CarouselContent>
                        {highlights.map((n) => (
                          <CarouselItem key={n._id} className="md:basis-1/2">
                            <Link to={`/noticia/${n._id}`}>
                              <Card className="p-4 h-full">
                                {n.iconImage && (
                                  <img src={n.iconImage} alt="" className="w-full h-32 object-cover rounded mb-2" />
                                )}
                                <h3 className="text-lg">{n.title}</h3>
                                <p className="text-sm opacity-70">Por: {n.authors}</p>
                                <p className="text-sm mt-1 line-clamp-2">{resumo(n.content)}</p>
                              </Card>
                            </Link>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  ) : (
                    <p className="text-sm opacity-70 mt-2">Nenhum destaque ainda.</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Notícias por data */}
        <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
          {Object.entries(porData).map(([data, items]) => (
            <div key={data}>
              <h2 className="text-2xl mb-3">{data}</h2>
              <div className="space-y-4">
                {items.map((n) => (
                  <Link to={`/noticia/${n._id}`} key={n._id}>
                    <Card className="p-4 flex gap-4">
                      {n.iconImage && (
                        <img src={n.iconImage} alt="" className="w-20 h-20 object-cover rounded" />
                      )}
                      <div>
                        <h3 className="text-xl">{n.title}</h3>
                        <p className="text-sm opacity-70">Por: {n.authors}</p>
                        <p className="text-sm mt-1 line-clamp-2">{resumo(n.content)}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {allNews.length === 0 && (
            <p className="opacity-70">Nenhuma notícia publicada ainda.</p>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

export default ViewerHome;