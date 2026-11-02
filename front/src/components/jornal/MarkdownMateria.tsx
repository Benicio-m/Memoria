import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

import { unified } from "unified";
import { visit } from "unist-util-visit";
import { toString } from "mdast-util-to-string";
import type { Root } from "mdast";

export const TAMANHOS_FONTE = [
  12, 14, 16, 18, 20, 24, 28, 32,
];

function remarkFonte() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (
        node.type !== "textDirective" ||
        node.name !== "fonte"
      ) {
        return;
      }

      const tamanho = Number(node.attributes?.tamanho);
      const data = node.data || (node.data = {});

      data.hName = "span";

      data.hProperties = TAMANHOS_FONTE.includes(tamanho)
        ? {
            className: [`materia-fonte-${tamanho}`],
            "data-font-size": String(tamanho),
          }
        : {};
    });
  };
}

const parserResumo = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDirective);

const conversorHtml = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDirective)
  .use(remarkFonte)
  .use(remarkRehype)
  .use(rehypeStringify);

export function markdownParaHtml(content = "") {
  return String(conversorHtml.processSync(content));
}

export function resumoMateria(content = "") {
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
    // Remove imagens
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    // Remove links, mantendo apenas o texto
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Remove formatação de negrito, itálico, tachado e código
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    // Remove diretivas de fonte, como :fonte{tamanho=3}
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

export default function MarkdownMateria({
  content,
}: {
  content: string;
}) {
  return (
    <div className="materia-markdown wrap-break-word font-sans text-base leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          remarkDirective,
          remarkFonte,
        ]}
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
              className="text-blue-700 underline wrap-break-word"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 pl-4 italic my-4">
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
          table: ({ children }) => (
            <table className="w-full border-collapse my-4">
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th className="border p-2 text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border p-2">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}