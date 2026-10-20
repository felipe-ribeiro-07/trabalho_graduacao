// src/domain/entities/SimeiCnaeEstado.ts

// 1. Interface e Classe Principal (Para o listarComDescricao)
export interface SimeiCnaeEstadoProps {
  estado: string;
  municipio: string;
  ano: string | number;
  cnae: string;
  descricao: string | null;
  total: number;
}

export class SimeiCnaeEstado {
  public readonly estado: string;
  public readonly municipio: string;
  public readonly ano: string;
  public readonly cnae: string;
  public readonly descricao: string | null;
  public readonly total: number;

  constructor(props: SimeiCnaeEstadoProps) {
    this.estado = props.estado;
    this.municipio = props.municipio;
    this.ano = String(props.ano);
    this.cnae = String(props.cnae);
    this.descricao = props.descricao;
    this.total = Number(props.total); // Garante que a string do DB vire número
  }
}

// 2. Interfaces (DTOs) para os agrupamentos (Selects específicos)

// Retorno do método topCnaesEstado()
export interface TopCnaeEstadoDTO {
  cnae: string;
  descricao: string | null;
  total_estado: number;
}

// Retorno do método totalPorMunicipio()
export interface TotalPorMunicipioDTO {
  municipio: string;
  total_geral: number;
}

// Retorno do método distribuicaoCnaePorMunicipio()
export interface DistribuicaoCnaeMunicipioDTO {
  municipio: string;
  descricao: string | null;
  total: number;
}