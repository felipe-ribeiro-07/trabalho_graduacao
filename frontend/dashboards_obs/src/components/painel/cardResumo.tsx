import { memo } from 'react';
import GrowthCard from '../growthCard/index.tsx';
import { formatarInteiro, formatarPercentual } from '../../lib/formatadores.ts';

interface Comparacao {
  labelPrimeiro: string;
  labelSegundo: string;
  percentual: number;
  diferenca: number;
}

interface Crescimento {
  anoAtual: number | string;
  anoAnterior: number | string;
  evolucao: number;
  totalAtual: number;
  totalAnterior: number;
}

interface Props {
  crescimento: Crescimento | null;
  maiorMenor: Comparacao | null;
  primeiroSegundo: Comparacao | null;
  /** Plural em minúsculas, ex.: "agências de turismo". */
  rotuloPlural: string;
}

/** memo: só re-renderiza quando os resumos mudam (não a cada clique em pill/select). */
export const CardsResumo = memo(function CardsResumo({ crescimento, maiorMenor, primeiroSegundo, rotuloPlural }: Props) {
  return (
    // Transformado em uma coluna flexível que ocupa 100% da largura e altura disponíveis
    <ul className="flex flex-col h-full w-full list-none gap-4 p-0 m-0" aria-label="Indicadores resumidos">
      {crescimento && (
        // flex-1: Faz o item (e o card dentro dele) esticar verticalmente, garantindo alturas iguais
        <li className="flex flex-1 flex-col">
          <GrowthCard
            title="Crescimento anual"
            subtitle={`(${crescimento.anoAtual} x ${crescimento.anoAnterior})`}
            percentage={formatarPercentual(crescimento.evolucao)}
            description={`De ${formatarInteiro(crescimento.totalAnterior)} para ${formatarInteiro(crescimento.totalAtual)} em ${crescimento.anoAtual}.`}
          />
        </li>
      )}
      {maiorMenor && (
        <li className="flex flex-1 flex-col">
          <GrowthCard
            title="Maior x menor"
            subtitle={`(${maiorMenor.labelPrimeiro} x ${maiorMenor.labelSegundo})`}
            percentage={formatarPercentual(maiorMenor.percentual)}
            description={`${maiorMenor.labelPrimeiro} tem ${formatarInteiro(maiorMenor.diferenca)} ${rotuloPlural} a mais que ${maiorMenor.labelSegundo}.`}
          />
        </li>
      )}
      {primeiroSegundo && (
        <li className="flex flex-1 flex-col">
          <GrowthCard
            title="1º x 2º colocado"
            subtitle={`(${primeiroSegundo.labelPrimeiro} x ${primeiroSegundo.labelSegundo})`}
            percentage={formatarPercentual(primeiroSegundo.percentual)}
            description={`${primeiroSegundo.labelPrimeiro} lidera com ${formatarInteiro(primeiroSegundo.diferenca)} ${rotuloPlural} a mais que ${primeiroSegundo.labelSegundo}.`}
          />
        </li>
      )}
    </ul>
  );
});