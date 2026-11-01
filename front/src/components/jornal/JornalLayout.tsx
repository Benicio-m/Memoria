import type { ReactNode } from "react";
import { Link } from "react-router";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  FacebookLogoIcon,
  InstagramLogoIcon,
} from "@phosphor-icons/react";

import { resumoMateria } from "./MarkdownMateria";

export type Noticia = {
  _id: string;
  title: string;
  subtitle?: string;
  authors: string;
  iconImage?: string;
  content?: string;
  createdAt: string;
};

type JornalLayoutProps = {
  children: ReactNode;
};

type CardNoticiaProps = {
  noticia: Noticia;
};

export function CardNoticia({
  noticia,
}: CardNoticiaProps) {
  return (
    <Link
      to={`/noticia/${noticia._id}`}
      className="block h-full"
    >
      <div className="flex h-full items-start gap-4 rounded-md border p-3 sm:p-4 hover:bg-muted/50 transition-colors">
        {noticia.iconImage && (
          <img
            src={noticia.iconImage}
            alt=""
            loading="lazy"
            className="h-20 w-20 sm:h-28 sm:w-28 shrink-0 rounded-md object-cover"
          />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-lg sm:text-xl wrap-break-word">
            {noticia.title}
          </h3>

          <p className="text-sm opacity-70 mt-1 wrap-break-word">
            Por: {noticia.authors}
          </p>

          <time
            dateTime={noticia.createdAt}
            className="block text-xs opacity-60 mt-1"
          >
            {new Date(
              noticia.createdAt
            ).toLocaleDateString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })}
          </time>

          <p className="font-sans text-sm mt-2 line-clamp-3 wrap-break-word">
            {resumoMateria(noticia.content || "")}
          </p>
        </div>
      </div>
    </Link>
  );
}

function JornalLayout({
  children,
}: JornalLayoutProps) {
  return (
    <ScrollArea className="w-full h-dvh bg-border">
      <div className="flex min-h-dvh w-full flex-col">
        {/* Cabeçalho compartilhado */}
        <header className="w-full mb-2 sm:mb-4 md:mb-6">
          <Card className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 p-4 sm:p-6">
            {/* Instituições */}
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

            {/* Nome do jornal */}
            <div className="flex flex-col items-center justify-center text-center">
              <h1 className="text-3xl sm:text-4xl font-normal font-konkhmer-sleokchher">
                Jornal Memória
              </h1>

              <h2 className="text-xl sm:text-2xl font-normal font-la-belle-aurore">
                Tempo em letras
              </h2>
            </div>

            {/* Redes sociais */}
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

        {/* Conteúdo de cada página */}
        <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 pb-6 font-konkhmer-sleokchher font-normal">
          {children}
        </main>
      </div>
    </ScrollArea>
  );
}

export default JornalLayout;