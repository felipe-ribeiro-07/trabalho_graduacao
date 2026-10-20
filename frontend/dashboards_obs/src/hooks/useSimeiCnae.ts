import { useState, useEffect, useCallback } from 'react';
import SimeiCnaeServices from '../services/cnaes_simei'; // Ajuste o caminho para o seu ficheiro de serviços

// --- Interfaces de Retorno (Pode ajustar para as suas tipagens reais) ---
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// 1. Hook para Listar CNAEs com Descrição
export const useListarCnaesSimei = (tabela: string, limit?: number, offset?: number): FetchState<any> => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tabela) return;
    try {
      setLoading(true);
      setError(null);
      const result = await SimeiCnaeServices.ListarComDescricao({ tabela, limit, offset });
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar a lista de CNAEs');
    } finally {
      setLoading(false);
    }
  }, [tabela, limit, offset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// 2. Hook para o Ranking (Top CNAEs)
export const useTopCnaesEstado = (tabela: string, limit?: number): FetchState<any> => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tabela) return;
    try {
      setLoading(true);
      setError(null);
      const result = await SimeiCnaeServices.TopCnaesEstado({ tabela, limit });
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar o ranking de CNAEs');
    } finally {
      setLoading(false);
    }
  }, [tabela, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// 3. Hook para Totais por Município
export const useTotalPorMunicipioSimei = (tabela: string): FetchState<any> => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tabela) return;
    try {
      setLoading(true);
      setError(null);
      const result = await SimeiCnaeServices.TotalPorMunicipio(tabela);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar totais por município');
    } finally {
      setLoading(false);
    }
  }, [tabela]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// 4. Hook para Distribuição de um CNAE Específico
export const useDistribuicaoCnaeSimei = (tabela: string, cnae: string): FetchState<any> => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Inicia falso, pois o CNAE pode estar vazio no início
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tabela || !cnae) return; // Só procura se o CNAE for informado
    try {
      setLoading(true);
      setError(null);
      const result = await SimeiCnaeServices.DistribuicaoCnae({ tabela, cnae });
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar distribuição deste CNAE');
    } finally {
      setLoading(false);
    }
  }, [tabela, cnae]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// =========================================================================
// 5. Hook para o Ranking Nacional (Soma de todos os estados)
// =========================================================================
export const useRankingNacionalSimei = (): FetchState<any> => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Certifique-se de que o método RankingNacional() foi adicionado no SimeiCnaeServices
      const result = await SimeiCnaeServices.RankingNacional();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar o panorama nacional do SIMEI');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};