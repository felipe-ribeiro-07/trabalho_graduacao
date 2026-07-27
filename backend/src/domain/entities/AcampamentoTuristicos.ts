// src/domain/entities/AcampamentoTuristicos.ts

export interface AcampamentoConsolidadoProps {
  ano: number;
  uf: string;
  municipio: string;
  porte: string | null;
  situacao: string | null;
  segmento: string | null;
  origemTabela: string;
}

export class AcampamentoConsolidado {
  public readonly ano: number;
  public readonly uf: string;
  public readonly municipio: string;
  public readonly porte: string | null;
  public readonly situacao: string | null;
  public readonly segmento: string | null;
  public readonly origemTabela: string;

  constructor(props: AcampamentoConsolidadoProps) {
    this.ano = props.ano;
    this.uf = props.uf;
    this.municipio = props.municipio;
    this.porte = props.porte;
    this.situacao = props.situacao;
    this.segmento = props.segmento;
    this.origemTabela = props.origemTabela;
  }
}