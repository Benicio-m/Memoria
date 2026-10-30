import { createRoot } from 'react-dom/client'
import './index.css'
import Write from './routes/Write.tsx'
import { StrictMode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './routes/Home.tsx';
import Pupil from './routes/Pupil.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* <Route path="*" element={<News />} /> */}
        <Route path="/escrever" element={<Write />} />
        <Route path="/professor/home" element={<Home />} />
        <Route path="/aluno" element={<Pupil />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>    
)
