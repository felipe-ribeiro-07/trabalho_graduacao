import { useCallback, useEffect, useRef, useState } from 'react';
import type { Serie, ServicoPainel } from '../types/servicoPainel.ts';

const TAMANHO_MAXIMO = 80;
// Letras (com acentos), números, espaço, apóstrofo, ponto e hífen.
const PADRAO_VALIDO = /^[\p{L}\p{M}\d\s'’.-]+$/u;

const normalizar = (v: string) => v.normalize('NFC').replace(/\s+/g, ' ').trim();

/** Validação no cliente (a validação definitiva deve existir também no backend). */
export function validarMunicipio(valor: string): string | null {
  if (valor.length > TAMANHO_MAXIMO) return `Use no máximo ${TAMANHO_MAXIMO} caracteres.`;
  if (!PADRAO_VALIDO.test(valor)) return 'Use apenas letras, números, espaços, ponto, apóstrofo ou hífen.';
  return null;
}

interface Resultado {
  nome1: string;
  nome2: string;
  dados1: Serie[];
  dados2: Serie[];
}

export function useBuscaMunicipios(servico: ServicoPainel) {
  const [municipio1, setMunicipio1] = useState('');
  const [municipio2, setMunicipio2] = useState('');
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const idRequisicao = useRef(0);

  // Invalida requisições em andamento ao desmontar.
  useEffect(() => () => void (idRequisicao.current += 1), []);

  const buscar = useCallback(async () => {
    const nome1 = normalizar(municipio1);
    const nome2 = normalizar(municipio2);

    if (!nome1) {
      setErro('Informe o município principal.');
      return;
    }
    const invalido = validarMunicipio(nome1) ?? (nome2 ? validarMunicipio(nome2) : null);
    if (invalido) {
      setErro(invalido);
      return;
    }

    const id = ++idRequisicao.current;
    setCarregando(true);
    setErro(null);

    try {
      const [dados1, dados2] = await Promise.all([
        servico.AcumuladoAnualMunicipio(nome1),
        nome2 ? servico.AcumuladoAnualMunicipio(nome2) : Promise.resolve([]),
      ]);
      if (id !== idRequisicao.current) return;
      // Guarda o termo pesquisado: o gráfico não muda enquanto o usuário digita.
      setResultado({ nome1, nome2, dados1, dados2 });
    } catch (e) {
      console.error('Erro ao buscar dados dos municípios:', e);
      if (id !== idRequisicao.current) return;
      setResultado(null);
      setErro('Não foi possível buscar os dados desses municípios. Tente novamente.');
    } finally {
      if (id === idRequisicao.current) setCarregando(false);
    }
  }, [servico, municipio1, municipio2]);

  return { municipio1, setMunicipio1, municipio2, setMunicipio2, resultado, carregando, erro, buscar };
}