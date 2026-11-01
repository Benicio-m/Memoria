import {
  useEffect,
  useRef,
  useState,
} from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  ArrowLeft,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Minus,
  Plus,
  Save,
  ImagePlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

function AddColumn() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editando = Boolean(id);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selecaoRef = useRef({ inicio: 0, fim: 0 });

  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [iconImage, setIconImage] = useState("");

  const [nomeGrupo, setNomeGrupo] = useState("");
  const [tamanhoFonte, setTamanhoFonte] = useState(16);
  const [mostrarPrevia, setMostrarPrevia] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [processandoImagem, setProcessandoImagem] =
    useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function carregar() {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/escrever", { replace: true });
        return;
      }

      setCarregando(true);
      setErro("");

      try {
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

        setNomeGrupo(data.user.name);

        if (!id) {
          setTitulo("");
          setSubtitulo("");
          setCorpo("");
          setIconImage("");
          return;
        }

        // Usa a listagem do próprio grupo para carregar a edição.
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
              "Não foi possível carregar suas matérias."
          );
        }

        type NoticiaEdicao = {
          _id: string;
          title: string;
          subtitle?: string;
          content: string;
          iconImage?: string;
        };

        const noticias: NoticiaEdicao[] =
          Array.isArray(dataNoticias.news)
            ? dataNoticias.news
            : [];

        const noticia = noticias.find(
          (item) => item._id === id
        );

        if (!noticia) {
          throw new Error(
            "Matéria não encontrada entre as notícias do seu grupo."
          );
        }

        setTitulo(noticia.title);
        setSubtitulo(noticia.subtitle || "");
        setCorpo(noticia.content);
        setIconImage(noticia.iconImage || "");
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Erro ao carregar editor:", error);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o editor."
        );
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    carregar();

    return () => controller.abort();
  }, [id, navigate]);

  function guardarSelecao() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    selecaoRef.current = {
      inicio: textarea.selectionStart,
      fim: textarea.selectionEnd,
    };
  }

  function aplicarTexto(
    inicio: number,
    fim: number,
    texto: string,
    selecaoInicio: number,
    selecaoFim: number
  ) {
    setCorpo(
      corpo.slice(0, inicio) +
        texto +
        corpo.slice(fim)
    );

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.focus();
      textarea.setSelectionRange(
        selecaoInicio,
        selecaoFim
      );

      selecaoRef.current = {
        inicio: selecaoInicio,
        fim: selecaoFim,
      };
    });
  }

  function envolver(
    antes: string,
    depois = antes,
    exemplo = "texto"
  ) {
    const { inicio, fim } = selecaoRef.current;
    const selecionado = corpo.slice(inicio, fim) || exemplo;

    aplicarTexto(
      inicio,
      fim,
      `${antes}${selecionado}${depois}`,
      inicio + antes.length,
      inicio + antes.length + selecionado.length
    );
  }

  function aplicarLista(numerada: boolean) {
    const { inicio, fim } = selecaoRef.current;

    const inicioLinha =
      corpo.lastIndexOf("\n", inicio - 1) + 1;

    const ultimoCaractereSelecionado =
      fim > inicio ? fim - 1 : fim;

    const proximaQuebra = corpo.indexOf(
      "\n",
      ultimoCaractereSelecionado
    );

    const fimLinha =
      proximaQuebra === -1
        ? corpo.length
        : proximaQuebra;

    const trecho = corpo.slice(inicioLinha, fimLinha);

    const linhas = trecho.split("\n");

    const texto = linhas
      .map((linha, indice) => {
        const semMarcador = linha.replace(
          /^\s*(?:[-*+]|\d+\.)\s+/,
          ""
        );

        const prefixo = numerada
          ? `${indice + 1}. `
          : "- ";

        return prefixo + (semMarcador || "Item");
      })
      .join("\n");

    aplicarTexto(
      inicioLinha,
      fimLinha,
      texto,
      inicioLinha,
      inicioLinha + texto.length
    );
  }

  function adicionarLink() {
    const entrada = window.prompt(
      "Digite o endereço do link:",
      "https://"
    );

    if (!entrada) return;

    try {
      const url = new URL(entrada.trim());

      if (!["https:", "http:"].includes(url.protocol)) {
        throw new Error("Protocolo inválido");
      }

      const endereco = url.href
        .replace(/\(/g, "%28")
        .replace(/\)/g, "%29");

      envolver("[", `](${endereco})`, "texto do link");
    } catch {
      setErro(
        "Informe um endereço válido começando com https:// ou http://."
      );
    }
  }

  function alterarFonte(valor: number) {
    setTamanhoFonte(
      Math.min(32, Math.max(12, valor))
    );
  }

  function selecionarImagem(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    setErro("");

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        arquivo.type
      )
    ) {
      setErro("Selecione uma imagem JPG, PNG ou WebP.");
      event.target.value = "";
      return;
    }

    // Limite conservador para o envio atual em JSON/base64.
    if (arquivo.size > 500 * 1024) {
      setErro(
        "Selecione uma imagem de até 500 KB."
      );
      event.target.value = "";
      return;
    }

    setProcessandoImagem(true);

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setIconImage(reader.result);
      }

      setProcessandoImagem(false);
    };

    reader.onerror = () => {
      setErro("Não foi possível ler a imagem.");
      setProcessandoImagem(false);
    };

    reader.readAsDataURL(arquivo);
  }

  async function salvar() {
    setErro("");

    if (!titulo.trim() || !corpo.trim()) {
      setErro("Preencha o título e o corpo da matéria.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/escrever", { replace: true });
      return;
    }

    setSalvando(true);

    try {
      const base = import.meta.env.VITE_API_URL;

      const response = await fetch(
        id
          ? `${base}/rooms/news/${id}`
          : `${base}/rooms/news`,
        {
          method: id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: titulo.trim(),
            subtitle: subtitulo.trim(),
            content: corpo,
            iconImage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error || "Não foi possível salvar a matéria."
        );
      }

      navigate("/aluno");
    } catch (error) {
      console.error("Erro ao salvar matéria:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Erro de conexão ao salvar a matéria."
      );
    } finally {
      setSalvando(false);
    }
  }

  const bloqueado =
    carregando || salvando || !nomeGrupo;

  const tamanhos = [
    ...new Set([
      12, 14, 16, 18, 20, 24, 28, 32, tamanhoFonte,
    ]),
  ].sort((a, b) => a - b);

  return (
    <ScrollArea className="w-full h-dvh bg-border">
      <div className="min-h-dvh w-full font-konkhmer-sleokchher font-normal">
        <header className="w-full mb-4 sm:mb-6">
          <Card className="rounded-md p-5 sm:p-6 text-center">
            <h1 className="text-3xl sm:text-4xl">
              Jornal Memória
            </h1>

            <p className="font-la-belle-aurore text-xl sm:text-2xl">
              Tempo em letras
            </p>
          </Card>
        </header>

        <main className="w-full max-w-5xl mx-auto px-2 sm:px-4 pb-6">
          <Card className="rounded-md p-4 sm:p-6 shadow-md shadow-accent-foreground">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl">
                  {editando
                    ? "Editar matéria"
                    : "Adicionar matéria"}
                </h2>

                {nomeGrupo && (
                  <p className="text-sm opacity-70 mt-2 break-words">
                    Autores: {nomeGrupo}
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={salvando}
                onClick={() => navigate("/aluno")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>

            {carregando ? (
              <p className="py-6 text-sm opacity-70" role="status">
                Carregando editor...
              </p>
            ) : (
              <form
                className="space-y-6 pt-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void salvar();
                }}
              >
                <div className="space-y-2">
                  <label htmlFor="titulo">
                    Título da matéria
                  </label>

                  <Input
                    id="titulo"
                    value={titulo}
                    onChange={(event) =>
                      setTitulo(event.target.value)
                    }
                    placeholder="Digite o título"
                    disabled={bloqueado}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="subtitulo">
                    Subtítulo (opcional)
                  </label>

                  <Input
                    id="subtitulo"
                    value={subtitulo}
                    onChange={(event) =>
                      setSubtitulo(event.target.value)
                    }
                    placeholder="Digite o subtítulo"
                    disabled={bloqueado}
                  />
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="icone"
                    className="flex items-center gap-2"
                  >
                    <ImagePlus className="w-5 h-5" />
                    Imagem de ícone da matéria
                  </label>

                  <Input
                    id="icone"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={selecionarImagem}
                    disabled={bloqueado || processandoImagem}
                  />

                  <p className="text-xs opacity-70">
                    JPG, PNG ou WebP, até 500 KB.
                  </p>

                  {processandoImagem && (
                    <p className="text-sm" role="status">
                      Preparando imagem...
                    </p>
                  )}

                  {iconImage && (
                    <div className="flex items-center gap-4">
                      <img
                        src={iconImage}
                        alt="Prévia do ícone da matéria"
                        className="w-28 h-28 rounded-md border object-cover"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        disabled={bloqueado}
                        onClick={() => setIconImage("")}
                      >
                        Remover imagem
                      </Button>
                    </div>
                  )}
                </div>

                <section className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label htmlFor="corpo">
                      Corpo da matéria
                    </label>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMostrarPrevia((atual) => !atual)
                      }
                    >
                      {mostrarPrevia
                        ? "Ocultar prévia"
                        : "Mostrar prévia"}
                    </Button>
                  </div>

                  <div className="overflow-hidden rounded-md border bg-background">
                    <div
                      role="group"
                      aria-label="Formatação do texto"
                      className="flex flex-wrap items-center gap-1 border-b bg-muted/50 p-2"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Diminuir fonte do editor"
                        aria-label="Diminuir fonte do editor"
                        disabled={tamanhoFonte <= 12}
                        onClick={() =>
                          alterarFonte(tamanhoFonte - 2)
                        }
                      >
                        <Minus className="w-4 h-4" />
                      </Button>

                      <select
                        aria-label="Tamanho da fonte do editor"
                        value={tamanhoFonte}
                        onChange={(event) =>
                          alterarFonte(
                            Number(event.target.value)
                          )
                        }
                        className="h-9 rounded-md border bg-background px-2 text-sm text-foreground"
                      >
                        {tamanhos.map((tamanho) => (
                          <option
                            key={tamanho}
                            value={tamanho}
                          >
                            {tamanho} px
                          </option>
                        ))}
                      </select>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Aumentar fonte do editor"
                        aria-label="Aumentar fonte do editor"
                        disabled={tamanhoFonte >= 32}
                        onClick={() =>
                          alterarFonte(tamanhoFonte + 2)
                        }
                      >
                        <Plus className="w-4 h-4" />
                      </Button>

                      <span
                        aria-hidden="true"
                        className="mx-1 h-6 border-l"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Negrito"
                        aria-label="Negrito"
                        disabled={bloqueado}
                        onMouseDown={(event) =>
                          event.preventDefault()
                        }
                        onClick={() => envolver("**")}
                      >
                        <Bold className="w-4 h-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Itálico"
                        aria-label="Itálico"
                        disabled={bloqueado}
                        onMouseDown={(event) =>
                          event.preventDefault()
                        }
                        onClick={() => envolver("*")}
                      >
                        <Italic className="w-4 h-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Lista com marcadores"
                        aria-label="Lista com marcadores"
                        disabled={bloqueado}
                        onMouseDown={(event) =>
                          event.preventDefault()
                        }
                        onClick={() => aplicarLista(false)}
                      >
                        <List className="w-4 h-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Lista numerada"
                        aria-label="Lista numerada"
                        disabled={bloqueado}
                        onMouseDown={(event) =>
                          event.preventDefault()
                        }
                        onClick={() => aplicarLista(true)}
                      >
                        <ListOrdered className="w-4 h-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Inserir hiperlink"
                        aria-label="Inserir hiperlink"
                        disabled={bloqueado}
                        onMouseDown={(event) =>
                          event.preventDefault()
                        }
                        onClick={adicionarLink}
                      >
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                    </div>

                    <Textarea
                      id="corpo"
                      ref={textareaRef}
                      value={corpo}
                      onChange={(event) => {
                        setCorpo(event.target.value);

                        selecaoRef.current = {
                          inicio: event.target.selectionStart,
                          fim: event.target.selectionEnd,
                        };
                      }}
                      onSelect={guardarSelecao}
                      onBlur={guardarSelecao}
                      placeholder="Escreva sua matéria aqui..."
                      className="min-h-80 rounded-none border-0 p-4 font-sans leading-relaxed shadow-none focus-visible:ring-0"
                      style={{
                        fontSize: `${tamanhoFonte}px`,
                      }}
                      disabled={bloqueado}
                      required
                    />
                  </div>

                  <p className="text-xs opacity-70">
                    Selecione um trecho e clique nos botões.
                    A formatação aparece como Markdown no
                    editor; use a prévia para ver o resultado.
                    O tamanho da fonte altera somente a
                    visualização nesta tela.
                  </p>
                </section>

                {mostrarPrevia && (
                  <section className="rounded-md border p-4 sm:p-6">
                    <h3 className="text-lg mb-4">
                      Prévia do corpo
                    </h3>

                    {corpo.trim() ? (
                      <div
                        className="font-sans leading-relaxed break-words"
                        style={{
                          fontSize: `${tamanhoFonte}px`,
                        }}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => (
                              <p className="mb-4">
                                {children}
                              </p>
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
                                className="text-blue-700 underline"
                              >
                                {children}
                              </a>
                            ),
                            h1: ({ children }) => (
                              <h1 className="text-3xl font-bold my-4">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-2xl font-bold my-4">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-xl font-bold my-4">
                                {children}
                              </h3>
                            ),
                            img: ({ src, alt }) => (
                              <img
                                src={src}
                                alt={alt || ""}
                                className="max-w-full h-auto my-4"
                              />
                            ),
                          }}
                        >
                          {corpo}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm opacity-70">
                        Digite o corpo da matéria para visualizar.
                      </p>
                    )}
                  </section>
                )}

                {erro && (
                  <p
                    className="text-sm text-red-600"
                    role="alert"
                  >
                    {erro}
                  </p>
                )}

                <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={salvando}
                    onClick={() => navigate("/aluno")}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={
                      bloqueado || processandoImagem
                    }
                  >
                    <Save className="w-4 h-4 mr-2" />

                    {salvando
                      ? "Salvando..."
                      : editando
                        ? "Salvar alterações"
                        : "Adicionar matéria"}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </main>
      </div>
    </ScrollArea>
  );
}

export default AddColumn;