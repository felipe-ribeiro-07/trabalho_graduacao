/**
 * Cache em localStorage com tratamento de erros.
 * - Chaves versionadas (troque VERSAO para invalidar tudo).
 * - Nunca lança exceção (modo privado, quota cheia, JSON corrompido).
 * - Valida que o conteúdo é um array antes de usar.
 * Guarde apenas dados públicos aqui (nunca tokens ou dados pessoais).
 */
const VERSAO = 'v1';
const PREFIXO = `acampamentos:${VERSAO}:`;

export function lerCacheLista<T>(chave: string): T[] | null {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    if (!bruto) return null;
    const dados: unknown = JSON.parse(bruto);
    return Array.isArray(dados) ? (dados as T[]) : null;
  } catch {
    return null;
  }
}

export function gravarCacheLista<T>(chave: string, dados: T[]): void {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(dados));
  } catch {
    /* quota cheia ou storage indisponível: o cache é opcional */
  }
}