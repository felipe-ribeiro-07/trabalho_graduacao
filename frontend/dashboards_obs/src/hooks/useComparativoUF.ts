import { useEffect, useState } from 'react';
import type { Serie, ServicoPainel } from '../types/servicoPainel.ts';

/**
 * Comparativo histórico entre dois estados (selects).
 * Sem debounce: select é ação discreta; o flag `ativo` descarta respostas antigas.
 */
export function useComparativoEstados(servico: ServicoPainel, estado1: string, estado2: string) {
  const [dadosE1, setDadosE1] = useState<Serie[]>([]);
  const [dadosE2, setDadosE2] = useState<Serie[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!estado1) {
      setDadosE1([]);
      setDadosE2([]);
      setErro(null);
      return;
    }

    let ativo = true;
    setCarregando(true);
    setErro(null);

    (async () => {
      try {
        const [r1, r2] = await Promise.all([
          servico.TodosAnosUF({ uf: estado1 }),
          estado2 ? servico.TodosAnosUF({ uf: estado2 }) : Promise.resolve([]),
        ]);
        if (!ativo) return;
        setDadosE1(r1);
        setDadosE2(r2);
      } catch (e) {
        console.error('Erro ao buscar dados do comparativo:', e);
        if (ativo) setErro('Não foi possível carregar o comparativo.');
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [servico, estado1, estado2]);

  return { dadosE1, dadosE2, carregando, erro };
}