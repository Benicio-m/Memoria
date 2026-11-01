import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

function AddColumn() {
    const [titulo, setTitulo] = useState("")
    const [subtitulo, setSubtitulo] = useState("")
    const [corpo, setCorpo] = useState("")
    const [imagem, setImagem] = useState<File | null>(null)
    return (
    <ScrollArea className="w-full h-dvh bg-border">
      <div className="flex flex-col h-full min-h-dvh w-full font-konkhmer-sleokchher font-normal font-400">
        <Input placeholder="Título da matéria" onChange={(e) => setTitulo(e.target.value)}/>
        <Input placeholder="Subtítulo da matéria (opcional)" onChange={(e) => setSubtitulo(e.target.value)}/>
        <Input type="file" accept="image/*" placeholder="Selecione uma imagem para servir de ícone para a notícia" />
        <Textarea placeholder="Corpo da matéria" onChange={(e) => setCorpo(e.target.value)}/>
        <Input type="file" accept="image/*" placeholder="Selecione uma imagem para servir de ícone para a notícia" />
        <Button className="w-full">Adicionar matéria</Button>
      </div>
    </ScrollArea>
  )
}

export default AddColumn