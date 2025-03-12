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

    console.log(`Fazendo requisição ${method} para ${url}`, data ? { data } : '');
    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMessage = `Erro HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Resposta de erro do servidor:', errorData);
        errorMessage = errorData.message || errorMessage;

        // Se tiver detalhes de validação, incluir no erro
        if (errorData.errors) {
          errorMessage += ': ' + JSON.stringify(errorData.errors);
        }
      } catch (e) {
        console.error('Não foi possível extrair dados de erro da resposta');
      }

      throw new Error(errorMessage);
    }

    // Para requisições que não retornam JSON (como DELETE)
    if (response.status === 204) {
      return {} as T;
    }

    const responseData = await response.json();
    console.log(`Resposta recebida de ${url}:`, responseData);
    return responseData;
  } catch (error: any) {
    console.error('API request error:', error);
    throw error;
  }
}