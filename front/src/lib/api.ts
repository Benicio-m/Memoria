const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export type Materia = {
  _id?: string;
  title: string;
  subtitle?: string;
  authors: string;
  iconImage?: string;
  content?: string;
};

export async function criarMateria(dados: Materia) {
  const response = await fetch(`${API_URL}/rooms/news`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(
      error.message || "Não foi possível criar a matéria."
    );
  }

  return response.json();
}

export async function editarMateria(
  id: string,
  dados: Materia
) {
  const response = await fetch(`${API_URL}/rooms/news/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(
      error.message || "Não foi possível editar a matéria."
    );
  }

  return response.json();
}

export async function deletarMateria(id: string) {
  const response = await fetch(`${API_URL}/rooms/news/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(
      error.message || "Não foi possível excluir a matéria."
    );
  }

  return response.json();
}