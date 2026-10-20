import { api } from './api.ts'; // ou o caminho que estiver a usar

interface ListarSimeiParams {
  tabela: string;
  limit?: number;
  offset?: number;
}

interface TopCnaesParams {
  tabela: string;
  limit?: number;
}

interface DistribuicaoCnaeParams {
  tabela: string;
  cnae: string;
}

class SimeiCnaeServices {
  static async ListarComDescricao({ tabela, limit, offset }: ListarSimeiParams): Promise<any> {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append('limit', String(limit));
    if (offset !== undefined) params.append('offset', String(offset));

    const queryString = params.toString();
    // Adicionado o /estado/ antes da tabela
    const url = `/simei-cnaes/estado/${tabela}/listar${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  }

  static async TopCnaesEstado({ tabela, limit }: TopCnaesParams): Promise<any> {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append('limit', String(limit));

    const queryString = params.toString();
    // Adicionado o /estado/ antes da tabela
    const url = `/simei-cnaes/estado/${tabela}/top-cnaes${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url);
    return response.data;
  }

  static async TotalPorMunicipio(tabela: string): Promise<any> {
    // Adicionado o /estado/ antes da tabela
    const response = await api.get(`/simei-cnaes/estado/${tabela}/municipios`);
    return response.data;
  }

  static async DistribuicaoCnae({ tabela, cnae }: DistribuicaoCnaeParams): Promise<any> {
    const params = new URLSearchParams();
    if (cnae) params.append('cnae', cnae);

    const queryString = params.toString();
    // Adicionado o /estado/ antes da tabela
    const url = `/simei-cnaes/estado/${tabela}/distribuicao${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url);
    return response.data;
  }


  static async RankingNacional(): Promise<any> {
    const response = await api.get('/simei-cnaes/nacional/ranking');
    
    // Transforma os dados para o formato exato que o seu gráfico espera
    const dadosFormatados = response.data.map((item: any) => ({
      uf: item.estado,
      total: Number(item.total_geral) // Garante que é um número para o Recharts
    }));

    return dadosFormatados;
  }
}

export default SimeiCnaeServices;