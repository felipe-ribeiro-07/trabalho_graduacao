export type Regiao = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';

export const MAPA_REGIOES = {
  AC: 'Norte', AL: 'Nordeste', AP: 'Norte', AM: 'Norte', BA: 'Nordeste',
  CE: 'Nordeste', DF: 'Centro-Oeste', ES: 'Sudeste', GO: 'Centro-Oeste',
  MA: 'Nordeste', MT: 'Centro-Oeste', MS: 'Centro-Oeste', MG: 'Sudeste',
  PA: 'Norte', PB: 'Nordeste', PR: 'Sul', PE: 'Nordeste', PI: 'Nordeste',
  RJ: 'Sudeste', RN: 'Nordeste', RS: 'Sul', RO: 'Norte', RR: 'Norte',
  SC: 'Sul', SP: 'Sudeste', SE: 'Nordeste', TO: 'Norte',
} as const satisfies Record<string, Regiao>;

export type UF = keyof typeof MAPA_REGIOES;

export const LISTA_UFS = Object.keys(MAPA_REGIOES) as UF[];

export function regiaoDaUF(uf: string): Regiao | 'Desconhecida' {
  return (MAPA_REGIOES as Record<string, Regiao>)[uf] ?? 'Desconhecida';
}

export const ORDEM_REGIOES: Regiao[] = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];

/** UFs agrupadas por região, na ordem de exibição do seletor. */
export const UFS_POR_REGIAO = ORDEM_REGIOES.map((regiao) => ({
  regiao,
  ufs: LISTA_UFS.filter((uf) => MAPA_REGIOES[uf] === regiao),
}));

export const NOMES_UF: Record<UF, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
  MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará',
  PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
  SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

export const nomeDaUF = (uf: string) => (NOMES_UF as Record<string, string>)[uf] ?? uf;