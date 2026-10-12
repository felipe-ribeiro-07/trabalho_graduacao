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