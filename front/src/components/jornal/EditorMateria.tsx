import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  EditorContent,
  useEditor,
} from "@tiptap/react";
import { Mark, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TurndownService from "turndown";

import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Minus,
  Plus,
  Undo2,
  Redo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  markdownParaHtml,
  TAMANHOS_FONTE,
} from "./MarkdownMateria";

type EditorMateriaProps = {
  initialContent: string;
  disabled?: boolean;
  onChange: (markdown: string, vazio: boolean) => void;
};

const Fonte = Mark.create({
  name: "fonte",

  addAttributes() {
    return {
      tamanho: {
        default: 16,

        parseHTML: (element) => {
          const tamanho = Number(
            element.getAttribute("data-font-size")
          );

          return TAMANHOS_FONTE.includes(tamanho)
            ? tamanho
            : 16;
        },

        renderHTML: (attributes) => {
          const valor = Number(attributes.tamanho);
          const tamanho = TAMANHOS_FONTE.includes(valor)
            ? valor
            : 16;

          return {
            "data-font-size": String(tamanho),
            style: `font-size: ${tamanho}px`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-font-size]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes),
      0,
    ];
  },
});

function criarConversorMarkdown() {
  const conversor = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    strongDelimiter: "**",
    emDelimiter: "*",
    codeBlockStyle: "fenced",
  });

  conversor.addRule("fonte", {
    filter: (node) =>
      node.nodeName === "SPAN" &&
      node.hasAttribute("data-font-size"),

    replacement: (content, node) => {
      const elemento = node as HTMLElement;
      const tamanho = Number(
        elemento.getAttribute("data-font-size")
      );

      if (
        !content ||
        !TAMANHOS_FONTE.includes(tamanho)
      ) {
        return content;
      }

      return `:fonte[${content}]{tamanho="${tamanho}"}`;
    },
  });

  // Preserva o tachado de conteúdos anteriores, se houver.
  conversor.addRule("tachado", {
    filter: ["s", "del"],
    replacement: (content) => `~~${content}~~`,
  });

  return conversor;
}

type BotaoFerramentaProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

function BotaoFerramenta({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: BotaoFerramentaProps) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="h-9 w-9 shrink-0"
    >
      {children}
    </Button>
  );
}

function EditorMateria({
  initialContent,
  disabled = false,
  onChange,
}: EditorMateriaProps) {
  const conversor = useMemo(
    () => criarConversorMarkdown(),
    []
  );

  const htmlInicial = useMemo(
    () => markdownParaHtml(initialContent),
    [initialContent]
  );

  const [abrirLink, setAbrirLink] = useState(false);
  const [urlLink, setUrlLink] = useState("");
  const [erroLink, setErroLink] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: false,
          HTMLAttributes: {
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
      }),
      Fonte,
    ],

    content: htmlInicial,

    editable: !disabled,

    immediatelyRender: false,
    shouldRerenderOnTransaction: true,

    editorProps: {
      attributes: {
        class: "editor-materia-conteudo",
        "aria-label": "Corpo da matéria",
        "aria-multiline": "true",
        role: "textbox",
      },
    },

    onUpdate: ({ editor: atual }) => {
      const markdown = conversor.turndown(
        atual.getHTML()
      );

      onChange(markdown, atual.isEmpty);
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) {
    return (
      <div className="rounded-md border p-4">
        Carregando editor...
      </div>
    );
  }

  const tamanhoAtual = Number(
    editor.getAttributes("fonte").tamanho || 16
  );

  function aplicarFonte(tamanho: number) {
    editor
      ?.chain()
      .focus()
      .setMark("fonte", { tamanho })
      .run();
  }

  function mudarFonte(direcao: -1 | 1) {
    const indice = TAMANHOS_FONTE.indexOf(
      tamanhoAtual
    );

    const proximo = Math.max(
      0,
      Math.min(
        TAMANHOS_FONTE.length - 1,
        (indice < 0 ? 2 : indice) + direcao
      )
    );

    aplicarFonte(TAMANHOS_FONTE[proximo]);
  }

  function prepararLink() {
    if (!editor) return;

    setUrlLink(
      String(editor.getAttributes("link").href || "")
    );
    setErroLink("");
    setAbrirLink(true);
  }

  function aplicarLink() {
    if (!editor) return;

    try {
      const url = new URL(urlLink.trim());

      if (
        !["https:", "http:"].includes(url.protocol)
      ) {
        throw new Error();
      }

      if (editor.state.selection.empty) {
        if (editor.isActive("link")) {
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url.href })
            .run();
        } else {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "text",
              text: url.href,
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: url.href,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  },
                },
              ],
            })
            .run();
        }
      } else {
        editor
          .chain()
          .focus()
          .setLink({ href: url.href })
          .run();
      }

      setAbrirLink(false);
      setErroLink("");
    } catch {
      setErroLink(
        "Digite um endereço válido com https:// ou http://."
      );
    }
  }

  const bloqueado = disabled || abrirLink;

  return (
    <div className="overflow-hidden rounded-md border bg-background">
      <div
        role="group"
        aria-label="Ferramentas do editor"
        className="flex flex-wrap items-center gap-1 border-b bg-muted/50 p-2"
      >
        <BotaoFerramenta
          label="Diminuir tamanho da fonte"
          disabled={bloqueado}
          onClick={() => mudarFonte(-1)}
        >
          <Minus className="h-4 w-4" />
        </BotaoFerramenta>

        <select
          aria-label="Tamanho da fonte"
          value={
            TAMANHOS_FONTE.includes(tamanhoAtual)
              ? tamanhoAtual
              : 16
          }
          disabled={bloqueado}
          onChange={(event) =>
            aplicarFonte(Number(event.target.value))
          }
          className="h-9 rounded-md border bg-background px-2 text-sm text-foreground"
        >
          {TAMANHOS_FONTE.map((tamanho) => (
            <option
              key={tamanho}
              value={tamanho}
            >
              {tamanho} px
            </option>
          ))}
        </select>

        <BotaoFerramenta
          label="Aumentar tamanho da fonte"
          disabled={bloqueado}
          onClick={() => mudarFonte(1)}
        >
          <Plus className="h-4 w-4" />
        </BotaoFerramenta>

        <span
          aria-hidden="true"
          className="mx-1 h-6 border-l"
        />

        <BotaoFerramenta
          label="Negrito"
          active={editor.isActive("bold")}
          disabled={bloqueado}
          onClick={() =>
            editor.chain().focus().toggleBold().run()
          }
        >
          <Bold className="h-4 w-4" />
        </BotaoFerramenta>

        <BotaoFerramenta
          label="Itálico"
          active={editor.isActive("italic")}
          disabled={bloqueado}
          onClick={() =>
            editor.chain().focus().toggleItalic().run()
          }
        >
          <Italic className="h-4 w-4" />
        </BotaoFerramenta>

        <BotaoFerramenta
          label="Lista com marcadores"
          active={editor.isActive("bulletList")}
          disabled={bloqueado}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBulletList()
              .run()
          }
        >
          <List className="h-4 w-4" />
        </BotaoFerramenta>

        <BotaoFerramenta
          label="Lista numerada"
          active={editor.isActive("orderedList")}
          disabled={bloqueado}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
        >
          <ListOrdered className="h-4 w-4" />
        </BotaoFerramenta>

        <BotaoFerramenta
          label="Inserir ou editar hiperlink"
          active={editor.isActive("link")}
          disabled={disabled}
          onClick={prepararLink}
        >
          <LinkIcon className="h-4 w-4" />
        </BotaoFerramenta>

        <BotaoFerramenta
          label="Remover hiperlink"
          disabled={
            bloqueado || !editor.isActive("link")
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .unsetLink()
              .run()
          }
        >
          <Unlink className="h-4 w-4" />
        </BotaoFerramenta>

        <span
          aria-hidden="true"
          className="mx-1 h-6 border-l"
        />

        <BotaoFerramenta
          label="Desfazer"
          disabled={
            bloqueado || !editor.can().undo()
          }
          onClick={() =>
            editor.chain().focus().undo().run()
          }
        >
          <Undo2 className="h-4 w-4" />
        </BotaoFerramenta>

        <BotaoFerramenta
          label="Refazer"
          disabled={
            bloqueado || !editor.can().redo()
          }
          onClick={() =>
            editor.chain().focus().redo().run()
          }
        >
          <Redo2 className="h-4 w-4" />
        </BotaoFerramenta>
      </div>

      {abrirLink && (
        <div className="space-y-2 border-b bg-muted/20 p-3">
          <label
            htmlFor="editor-url"
            className="text-sm"
          >
            Endereço do hiperlink
          </label>

          <div className="flex flex-wrap gap-2">
            <Input
              id="editor-url"
              value={urlLink}
              placeholder="https://..."
              disabled={disabled}
              onChange={(event) =>
                setUrlLink(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  aplicarLink();
                }

                if (event.key === "Escape") {
                  setAbrirLink(false);
                  editor.chain().focus().run();
                }
              }}
              className="min-w-0 flex-1"
            />

            <Button
              type="button"
              disabled={disabled}
              onClick={aplicarLink}
            >
              Aplicar
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAbrirLink(false);
                editor.chain().focus().run();
              }}
            >
              Cancelar
            </Button>
          </div>

          {erroLink && (
            <p
              className="text-sm text-red-600"
              role="alert"
            >
              {erroLink}
            </p>
          )}
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

export default EditorMateria;