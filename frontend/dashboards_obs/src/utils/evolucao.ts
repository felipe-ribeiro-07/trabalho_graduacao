// utils/evolucao.ts

export interface DadoAnual {
  ano: number;
  total: number;
  [key: string]: any;
}

export interface DadoComEvolucao extends DadoAnual {
  evolucao: number | null;
}

/**
 * Retorna o array original com um campo `evolucao` (%) calculado
 * em relação ao item anterior (ano a ano).
 */
export function calcularEvolucao(dados: DadoAnual[]): DadoComEvolucao[] {
  return dados.map((item, index) => {
    if (index === 0) {
      return { ...item, evolucao: null };
    }
    const anterior = dados[index - 1].total;
    const atual = item.total;

    if (!anterior) {
      return { ...item, evolucao: null };
    }

    const evolucao = ((atual - anterior) / anterior) * 100;
    return { ...item, evolucao: Number(evolucao.toFixed(2)) };
  });
}

/**
 * Retorna só o comparativo entre o último ano e o penúltimo.
 * Útil para exibir um badge tipo "+3,90% em relação a 2025".
 */
export function evolucaoUltimoAno(dados: DadoAnual[]) {
  if (!dados || dados.length < 2) return null;

  const ordenado = [...dados].sort((a, b) => a.ano - b.ano);
  const ultimo = ordenado[ordenado.length - 1];
  const penultimo = ordenado[ordenado.length - 2];

  if (!penultimo.total) return null;

  const evolucao = ((ultimo.total - penultimo.total) / penultimo.total) * 100;

  return {
    anoAtual: ultimo.ano,
    anoAnterior: penultimo.ano,
    totalAtual: ultimo.total,
    totalAnterior: penultimo.total,
    evolucao: Number(evolucao.toFixed(2)),
  };
}

// ---------------------------------------------------------------------
// Comparativos de RANKING (ex: resultadoRankingGuias, RankingEstados etc.)
// Espera um array de itens com um campo `total` numérico e algum campo
// de identificação (uf, municipio, nome...). O parâmetro `chaveLabel`
// diz qual campo usar como "nome" no resultado.
// ---------------------------------------------------------------------

export interface ItemRanking {
  total: number;
  [key: string]: any;
}

export interface ComparativoRanking {
  labelPrimeiro: string;
  totalPrimeiro: number;
  labelSegundo: string;
  totalSegundo: number;
  diferenca: number; // diferença absoluta (totalPrimeiro - totalSegundo)
  percentual: number; // % que o primeiro está acima do segundo
}

/**
 * Compara o maior e o menor item de um ranking.
 * Ex: qual UF teve mais guias vs qual teve menos, e a diferença percentual entre elas.
 */
export function calcularDiferencaMaiorMenor(
  dados: ItemRanking[],
  chaveLabel: string = 'uf'
): ComparativoRanking | null {
  if (!dados || dados.length < 2) return null;

  const ordenado = [...dados].sort((a, b) => b.total - a.total);
  const maior = ordenado[0];
  const menor = ordenado[ordenado.length - 1];

  if (!menor.total) return null;

  const diferenca = maior.total - menor.total;
  const percentual = (diferenca / menor.total) * 100;

  return {
    labelPrimeiro: maior[chaveLabel],
    totalPrimeiro: maior.total,
    labelSegundo: menor[chaveLabel],
    totalSegundo: menor.total,
    diferenca,
    percentual: Number(percentual.toFixed(2)),
  };
}

/**
 * Compara o 1º colocado com o 2º colocado de um ranking.
 * Ex: quão à frente está o líder em relação ao vice-líder.
 */
export function calcularDiferencaPrimeiroSegundo(
  dados: ItemRanking[],
  chaveLabel: string = 'uf'
): ComparativoRanking | null {
  if (!dados || dados.length < 2) return null;

  const ordenado = [...dados].sort((a, b) => b.total - a.total);
  const primeiro = ordenado[0];
  const segundo = ordenado[1];

  if (!segundo.total) return null;

  const diferenca = primeiro.total - segundo.total;
  const percentual = (diferenca / segundo.total) * 100;

  return {
    labelPrimeiro: primeiro[chaveLabel],
    totalPrimeiro: primeiro.total,
    labelSegundo: segundo[chaveLabel],
    totalSegundo: segundo.total,
    diferenca,
    percentual: Number(percentual.toFixed(2)),
  };
}