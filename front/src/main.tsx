import { createRoot } from 'react-dom/client'
import './index.css'
import Write from './routes/Write.tsx'
import { StrictMode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './routes/Home.tsx';
import ViewerHome from "./routes/ViewerHome";     // ajuste o caminho se estiver em outra pasta
import Pupil from "./routes/Pupil";
import AddColumn from "./routes/AddColumn";
import Column from "./routes/Column";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Jornal público */}
        <Route path="/" element={<ViewerHome />} />

        {/* Aluno */}
        <Route path="/aluno" element={<Pupil />} />
        <Route path="/adicionar-coluna" element={<AddColumn />} />
        <Route path="/adicionar-coluna/:id" element={<AddColumn />} />

        {/* Matéria completa */}
        <Route path="/noticia/:id" element={<Column />} />
        {/* Rotas confidenciais */}
        <Route path="/escrever" element={<Write />} />
        <Route path="/professor/home" element={<Home />} />
        <Route path="/aluno" element={<Pupil />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>    
)
