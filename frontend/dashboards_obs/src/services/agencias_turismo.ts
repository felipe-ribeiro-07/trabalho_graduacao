import { api } from './api.ts';

interface RankingMunicipioParams {
  uf?: string;
  ano?: string | number;
}

class AgenciasDeTursimoService {
  static async EvolucaoAnualAcampamentos(): Promise<any> {
    const response = await api.get('/agencias-de-turismo/evolucao-anual');
    return response.data;
  }

  static async RankingAcampamentos(ano?: string | number): Promise<any> {
    const params = new URLSearchParams();
    if (ano !== undefined && ano !== '') params.append('ano', String(ano));

    const response = await api.get(`/agencias-de-turismo/ranking-uf?${params.toString()}`);
    return response.data;
  }

  static async RankingMunicipal({ uf, ano }: RankingMunicipioParams = {}): Promise<any> {
    const params = new URLSearchParams();
    if (uf) params.append('uf', uf);
    if (ano !== undefined && ano !== '') params.append('ano', String(ano));

    const response = await api.get(`/agencias-de-turismo/ranking-municipio?${params.toString()}`);
    return response.data;
  }

  static async CompararAnos(anos: (string | number)[]): Promise<any> {
    const anosParam = anos.join(',');
    const response = await api.get(`/agencias-de-turismo/comparar-anos?anos=${anosParam}`);
    return response.data;
  }

  static async RankingEstados({ uf, ano }: RankingMunicipioParams = {}): Promise<any> {
    const params = new URLSearchParams();
    if (uf) params.append('uf', uf);
    if (ano !== undefined && ano !== '') params.append('ano', String(ano));

    const response = await api.get(`/agencias-de-turismo/ranking-uf?${params.toString()}`);
    return response.data;
  }

  static async UltimosCincoAnos({
    uf,
    anos,
  }: {
    uf?: string;
    anos?: (string | number)[];
  }): Promise<any> {
    const params = new URLSearchParams();
    if (uf) params.append('uf', uf);
    if (anos && anos.length > 0) params.append('anos', anos.join(','));
    const response = await api.get(
      `/agencias-de-turismo/ultimos-cinco-anos?${params.toString()}`
    );
    return response.data;
  }

  static async TodosAnosUF({ uf }: { uf: string }): Promise<any> {
    const response = await api.get(`/agencias-de-turismo/evolucao-anual-uf?uf=${uf}`);
    return response.data;
  }

  static async AcumuladoAnualMunicipio(municipio: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('municipio', municipio);

    const response = await api.get(
      `/agencias-de-turismo/acumulado-anual-municipio?${params.toString()}`
    );
    return response.data;
  }
}

export default AgenciasDeTursimoService;
