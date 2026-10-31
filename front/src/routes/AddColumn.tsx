import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

function AddColumn() {
    const [titulo, setTitulo] = useState("")
    return (
    <ScrollArea className="w-full h-dvh bg-border">
      <div className="flex flex-col h-full min-h-dvh w-full">
        <Input onChange={(e) => setTitulo(e.target.value)}/>
      </div>
    </ScrollArea>
  )
}