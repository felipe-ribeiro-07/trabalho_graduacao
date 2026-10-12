import { useEffect, useState } from 'react';
import type { Serie, ServicoPainel } from '../types/servicoPainel.ts';

/** Cidades e série dos últimos 5 anos da UF selecionada. */
export function useDadosUF(servico: ServicoPainel, uf: string) {
  const [cidades, setCidades] = useState<Serie[]>([]);
  const [ultimosCincoAnos, setUltimosCincoAnos] = useState<Serie[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!uf) return;
    let ativo = true; // evita race condition ao trocar de UF rapidamente
    setCarregando(true);
    setErro(null);

    (async () => {
      try {
        const [c, u] = await Promise.all([
          servico.RankingMunicipal({ uf }),
          servico.UltimosCincoAnos({ uf }),
        ]);
        if (!ativo) return;
        setCidades(c);
        setUltimosCincoAnos(u);
      } catch (e) {
        console.error('Erro ao carregar dados do estado:', e);
        if (ativo) setErro(`Não foi possível carregar os dados de ${uf}.`);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [servico, uf]);

  return { cidades, ultimosCincoAnos, carregando, erro };
}