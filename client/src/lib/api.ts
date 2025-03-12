
// Utilitário para fazer requisições à API de forma consistente
export async function apiRequest<T>(method: string, url: string, data?: any): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    // Garantir que o método HTTP seja válido
    if (!method) {
      throw new Error('Método HTTP não especificado');
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    // Para requisições que não retornam JSON (como DELETE)
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (error: any) {
    console.error('API request error:', error);
    throw error;
  }
}
