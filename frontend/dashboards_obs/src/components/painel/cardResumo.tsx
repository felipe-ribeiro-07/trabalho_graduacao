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
    <ul className="grid w-full list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3 md:gap-4 lg:w-1/2" aria-label="Indicadores resumidos">
      {crescimento && (
        <li>
          <GrowthCard
            title="Crescimento anual"
            subtitle={`(${crescimento.anoAtual} x ${crescimento.anoAnterior})`}
            percentage={formatarPercentual(crescimento.evolucao)}
            description={`De ${formatarInteiro(crescimento.totalAnterior)} para ${formatarInteiro(crescimento.totalAtual)} em ${crescimento.anoAtual}.`}
          />
        </li>
      )}
      {maiorMenor && (
        <li>
          <GrowthCard
            title="Maior x menor"
            subtitle={`(${maiorMenor.labelPrimeiro} x ${maiorMenor.labelSegundo})`}
            percentage={formatarPercentual(maiorMenor.percentual)}
            description={`${maiorMenor.labelPrimeiro} tem ${formatarInteiro(maiorMenor.diferenca)} ${rotuloPlural} a mais que ${maiorMenor.labelSegundo}.`}
          />
        </li>
      )}
      {primeiroSegundo && (
        <li>
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