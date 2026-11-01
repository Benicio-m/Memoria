import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import JornalLayout from "@/components/jornal/JornalLayout";
import type { Noticia } from "@/components/jornal/JornalLayout";

import EditorMateria from "@/components/jornal/EditorMateria";
import MarkdownMateria, {
  markdownParaHtml,
} from "@/components/jornal/MarkdownMateria";

function AddColumn() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [conteudoInicial, setConteudoInicial] = useState("");
  const [corpoVazio, setCorpoVazio] = useState(true);
  const [imagem, setImagem] = useState("");
  const [grupo, setGrupo] = useState("");

  const [mostrarPrevia, setMostrarPrevia] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [lendoImagem, setLendoImagem] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function carregar() {
      setCarregando(true);
      setErro("");
      setGrupo("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/escrever", { replace: true });
        return;
      }

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

        if (
          response.status === 401 ||
          response.status === 403
        ) {
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

        let noticia: Noticia | undefined;

        if (id) {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/rooms/news/mine`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              signal: controller.signal,
            }
          );

          const resultado = await res.json();

          if (!res.ok || !resultado.ok) {
            throw new Error(
              resultado.error ||
                "Não foi possível carregar a matéria."
            );
          }

          const noticias: Noticia[] =
            Array.isArray(resultado.news)
              ? resultado.news
              : [];

          noticia = noticias.find(
            (item) => item._id === id
          );

          if (!noticia) {
            throw new Error(
              "Essa matéria não foi encontrada no seu grupo."
            );
          }
        }

        if (controller.signal.aborted) return;

        const conteudo = noticia?.content || "";

        const documento = new DOMParser().parseFromString(
          markdownParaHtml(conteudo),
          "text/html"
        );

        setTitulo(noticia?.title || "");
        setSubtitulo(noticia?.subtitle || "");
        setImagem(noticia?.iconImage || "");

        setCorpo(conteudo);
        setConteudoInicial(conteudo);

        setCorpoVazio(
          !documento.body.textContent?.trim()
        );

        setGrupo(data.user.name);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Erro ao carregar editor:", error);

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar editor."
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

  function selecionarImagem(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    setErro("");

    const tipos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !tipos.includes(arquivo.type) ||
      arquivo.size > 500 * 1024
    ) {
      setErro(
        "Use uma imagem JPG, PNG ou WebP de até 500 KB."
      );
      event.target.value = "";
      return;
    }

    setLendoImagem(true);

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagem(reader.result);
      }

      setLendoImagem(false);
    };

    reader.onerror = () => {
      setErro("Não foi possível ler a imagem.");
      setLendoImagem(false);
    };

    reader.readAsDataURL(arquivo);
  }

  async function salvar() {
    if (salvando || lendoImagem) return;

    setErro("");

    if (!titulo.trim() || corpoVazio) {
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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/rooms/news${
          id ? `/${id}` : ""
        }`,
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
            iconImage: imagem,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error || "Erro ao salvar a matéria."
        );
      }

      navigate("/aluno");
    } catch (error) {
      console.error("Erro ao salvar matéria:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Erro de conexão ao salvar."
      );
    } finally {
      setSalvando(false);
    }
  }

  const bloqueado = carregando || salvando || !grupo;

  return (
    <JornalLayout>
      <Card className="rounded-md p-4 sm:p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl">
              {id ? "Editar matéria" : "Adicionar matéria"}
            </h2>

            {grupo && (
              <p className="text-sm opacity-70 mt-2 wrap-break-word">
                Autores: {grupo}
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={salvando}
            onClick={() => navigate("/aluno")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {carregando ? (
          <p className="py-6" role="status">
            Carregando editor...
          </p>
        ) : (
          <form
            className="space-y-6 pt-5"
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
                disabled={bloqueado}
                placeholder="Digite o título"
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
                disabled={bloqueado}
                placeholder="Digite o subtítulo"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="icone">
                Imagem de ícone da matéria
              </label>

              <Input
                id="icone"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={selecionarImagem}
                disabled={bloqueado || lendoImagem}
              />

              <p className="text-xs opacity-70">
                JPG, PNG ou WebP de até 500 KB.
              </p>

              {lendoImagem && (
                <p className="text-sm" role="status">
                  Preparando imagem...
                </p>
              )}

              {imagem && (
                <div className="flex items-center gap-3">
                  <img
                    src={imagem}
                    alt="Prévia do ícone da matéria"
                    className="h-24 w-24 rounded-md border object-cover"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    disabled={bloqueado}
                    onClick={() => setImagem("")}
                  >
                    Remover imagem
                  </Button>
                </div>
              )}
            </div>

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3>Corpo da matéria</h3>

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
                    : "Prévia da publicação"}
                </Button>
              </div>

              {grupo && (
                <EditorMateria
                  key={id || "nova-materia"}
                  initialContent={conteudoInicial}
                  disabled={bloqueado}
                  onChange={(markdown, vazio) => {
                    setCorpo(markdown);
                    setCorpoVazio(vazio);
                  }}
                />
              )}

              <p className="text-xs opacity-70">
                Selecione um trecho para formatá-lo.
                Sem seleção, a formatação vale para o
                próximo texto digitado.
              </p>
            </section>

            {mostrarPrevia && (
              <section className="rounded-md border p-4 sm:p-6">
                <h3 className="text-lg mb-4">
                  Prévia da publicação
                </h3>

                {corpoVazio ? (
                  <p className="text-sm opacity-70">
                    Escreva a matéria para visualizar.
                  </p>
                ) : (
                  <MarkdownMateria content={corpo} />
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
                disabled={bloqueado || lendoImagem}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />

                {salvando
                  ? "Salvando..."
                  : id
                    ? "Salvar alterações"
                    : "Adicionar matéria"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </JornalLayout>
  );
}

export default AddColumn;