import { useCallback, useEffect, useMemo, useState } from 'react';
import { gravarCacheLista, lerCacheLista } from '../lib/cache.ts';
import { regiaoDaUF } from '../constants/regioes.ts';
import type { RankingUF, Serie, ServicoPainel } from '../types/servicoPainel.ts';

export type { RankingUF, Serie };

/**
 * Dados gerais do painel com "stale-while-revalidate":
 * mostra o cache imediatamente e atualiza em segundo plano.
 *
 * @param servico       objeto ESTÁVEL (definido fora do componente)
 * @param ano           ano do ranking
 * @param prefixoCache  separa o cache de cada painel (evita colisão entre páginas)
 */
export function usePainelGeral(servico: ServicoPainel, ano: number, prefixoCache: string) {
  const chaveEvolucao = `${prefixoCache}:evolucao`;
  const chaveRanking = `${prefixoCache}:ranking-${ano}`;
  const chaveEstados = `${prefixoCache}:estados`;

  const [evolucao, setEvolucao] = useState<Serie[]>(() => lerCacheLista<Serie>(chaveEvolucao) ?? []);
  const [rankingCompleto, setRankingCompleto] = useState<RankingUF[]>(
    () => lerCacheLista<RankingUF>(chaveRanking) ?? [],
  );
  const [rankingEstados, setRankingEstados] = useState<RankingUF[]>(
    () => lerCacheLista<RankingUF>(chaveEstados) ?? [],
  );
  // Só bloqueia a tela se não houver NADA em cache.
  const [carregando, setCarregando] = useState(() => evolucao.length === 0 || rankingCompleto.length === 0);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setErro(null);

    (async () => {
      try {
        const [evo, ranking, estados] = await Promise.all([
          servico.EvolucaoAnual(),
          servico.Ranking(String(ano)),
          servico.RankingEstados(),
        ]);
        if (!ativo) return;
        setEvolucao(evo);
        setRankingCompleto(ranking);
        setRankingEstados(estados);
        gravarCacheLista(chaveEvolucao, evo);
        gravarCacheLista(chaveRanking, ranking);
        gravarCacheLista(chaveEstados, estados);
      } catch (e) {
        console.error('Erro ao carregar dados gerais:', e);
        if (ativo) setErro('Não foi possível carregar os dados do painel.');
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [servico, ano, chaveEvolucao, chaveRanking, chaveEstados, tentativa]);

  const rankingTop14 = useMemo(() => rankingCompleto.slice(0, 14), [rankingCompleto]);

  const dadosRegioes = useMemo(
    () => rankingEstados.map((item) => ({ ...item, regiao: regiaoDaUF(item.uf) })),
    [rankingEstados],
  );

  const recarregar = useCallback(() => {
    setCarregando(true);
    setTentativa((n) => n + 1);
  }, []);

  return { evolucao, rankingCompleto, rankingTop14, rankingEstados, dadosRegioes, carregando, erro, recarregar };
}