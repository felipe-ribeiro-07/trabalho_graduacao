import { memo, useMemo } from 'react';
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatarInteiro, formatarPorcentagem } from '../../lib/formatadores.ts';

const COR_DESTAQUE = '#0071E3';
const ALTURA_LINHA = 34;

interface Municipio {
  municipio: string;
  total: number;
}
interface Props {
  dados: Municipio[];
  uf: string;
  rotuloPlural: string;
  topN?: number;
  isAnimationActive?: boolean;
}

function preparar(dados: Municipio[], topN: number) {
  const ordenados = [...dados].sort((a, b) => b.total - a.total);
  const somaTotal = ordenados.reduce((s, i) => s + i.total, 0);
  const linhas = ordenados.slice(0, topN).map((i) => ({
    nome: i.municipio,
    total: i.total,
    pct: somaTotal ? (i.total / somaTotal) * 100 : 0,
  }));
  const restantes = ordenados.slice(topN);
  const somaRestante = restantes.reduce((s, i) => s + i.total, 0);
  return {
    linhas,
    qtdRestantes: restantes.length,
    somaRestante,
    pctRestante: somaTotal ? (somaRestante / somaTotal) * 100 : 0,
  };
}

function Dica({ active, payload, rotulo }: { active?: boolean; payload?: any[]; rotulo: string }) {
  if (!active || !payload?.length) return null;
  const l = payload[0].payload;
  return (
    <div className="rounded-xl border border-black/5 bg-white/95 px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-neutral-900">{l.nome}</p>
      <p className="text-neutral-600">
        {formatarInteiro(l.total)} {rotulo} ({formatarPorcentagem(l.pct)} do estado)
      </p>
    </div>
  );
}

/** Barras horizontais com os maiores municípios; o restante vira uma linha de resumo. */
export const GraficoTopMunicipios = memo(function GraficoTopMunicipios({
  dados,
  uf,
  rotuloPlural,
  topN = 10,
  isAnimationActive = true,
}: Props) {
  const { linhas, qtdRestantes, somaRestante, pctRestante } = useMemo(() => preparar(dados, topN), [dados, topN]);

  if (linhas.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-neutral-600">
        Sem dados de municípios para {uf}.
      </div>
    );
  }

  const resumo = linhas
    .slice(0, 3)
    .map((l) => `${l.nome} (${formatarInteiro(l.total)})`)
    .join(', ');

  return (
    <figure className="m-0">
      <figcaption className="sr-only">
        Os {linhas.length} municípios com mais {rotuloPlural} em {uf}. Maiores: {resumo}. A lista completa está na tabela ao
        lado.
      </figcaption>

      {/* O gráfico é decorativo para leitores de tela; os dados estão na tabela. */}
      <div aria-hidden="true" style={{ height: linhas.length * ALTURA_LINHA + 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={linhas} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 0 }}>
            <XAxis type="number" hide domain={[0, 'dataMax']} />
            <YAxis
              type="category"
              dataKey="nome"
              width={128}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#525252' }}
              tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
            />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<Dica rotulo={rotuloPlural} />} />
            <Bar
              dataKey="total"
              fill={COR_DESTAQUE}
              radius={[0, 6, 6, 0]}
              barSize={14}
              isAnimationActive={isAnimationActive}
            >
              <LabelList
                dataKey="total"
                position="right"
                fontSize={12}
                fill="#171717"
                formatter={(v: unknown) => formatarInteiro(Number(v))}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {qtdRestantes > 0 && (
        <p className="mt-3 text-sm text-neutral-600">
          Outros {formatarInteiro(qtdRestantes)} municípios somam {formatarInteiro(somaRestante)} (
          {formatarPorcentagem(pctRestante)}).
        </p>
      )}
    </figure>
  );
});