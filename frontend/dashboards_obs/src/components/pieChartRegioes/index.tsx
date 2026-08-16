import { useMemo } from 'react';
import {
  Pie,
  PieChart,
  type PieLabelRenderProps,
  type PieSectorShapeProps,
  Sector,
  Tooltip,
  Legend,
  useActiveTooltipDataPoints,
  useIsTooltipActive,
} from 'recharts';

// Mesmo mapa de UF -> Região usado no restante do projeto
const MAPA_REGIOES: Record<string, string> = {
  AC: 'Norte', AL: 'Nordeste', AP: 'Norte', AM: 'Norte', BA: 'Nordeste', CE: 'Nordeste',
  DF: 'Centro-Oeste', ES: 'Sudeste', GO: 'Centro-Oeste', MA: 'Nordeste', MT: 'Centro-Oeste',
  MS: 'Centro-Oeste', MG: 'Sudeste', PA: 'Norte', PB: 'Nordeste', PR: 'Sul', PE: 'Nordeste',
  PI: 'Nordeste', RJ: 'Sudeste', RN: 'Nordeste', RS: 'Sul', RO: 'Norte', RR: 'Norte',
  SC: 'Sul', SP: 'Sudeste', SE: 'Nordeste', TO: 'Norte',
};

const RADIAN = Math.PI / 180;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface ItemRankingUF {
  uf: string;
  total: number;
  [key: string]: any;
}

interface GraficoRegioesRankingProps {
  dadosRanking: ItemRankingUF[];
  chaveUf?: string; // nome do campo que identifica a UF, padrão 'uf'
  isAnimationActive?: boolean;
}

/**
 * Agrupa o ranking (por UF) em totais por região e calcula
 * o percentual que cada região representa do total geral.
 *
 * IMPORTANTE: passe a lista COMPLETA de UFs (ex: dadosEstados,
 * vindo de RankingEstados() sem slice), não uma lista truncada
 * (ex: dadosRanking.slice(0, 14)) — senão regiões cujas UFs não
 * estejam entre as primeiras posições somem do gráfico.
 */
function agruparPorRegiao(dados: ItemRankingUF[], chaveUf: string) {
  if (!dados || dados.length === 0) return [];

  const totaisPorRegiao: Record<string, number> = {};

  dados.forEach((item) => {
    const uf = item[chaveUf];
    const regiao = MAPA_REGIOES[uf] || 'Desconhecida';
    totaisPorRegiao[regiao] = (totaisPorRegiao[regiao] || 0) + (item.total || 0);
  });

  const totalGeral = Object.values(totaisPorRegiao).reduce((soma, v) => soma + v, 0);

  return Object.entries(totaisPorRegiao)
    .map(([regiao, total]) => ({
      name: regiao,
      value: total,
      percentual: totalGeral ? Number(((total / totalGeral) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: PieLabelRenderProps) => {
  if (cx == null || cy == null || innerRadius == null || outerRadius == null) {
    return null;
  }
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const ncx = Number(cx);
  const x = ncx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
  const ncy = Number(cy);
  const y = ncy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > ncx ? 'start' : 'end'} dominantBaseline="central">
      {`${((percent ?? 1) * 100).toFixed(0)}%`}
    </text>
  );
};

const FatiaRegiao = (props: PieSectorShapeProps) => {
  const pontoAtivo = useActiveTooltipDataPoints();
  const algumaFatiaAtiva = useIsTooltipActive();
  const estaFatiaAtiva = algumaFatiaAtiva && props.payload === pontoAtivo?.[0];

  let fillOpacity: number;
  if (algumaFatiaAtiva && !estaFatiaAtiva) {
    fillOpacity = 0.5;
  } else {
    fillOpacity = 1;
  }

  return (
    <Sector
      {...props}
      fill={COLORS[props.index % COLORS.length]}
      fillOpacity={fillOpacity}
      style={{ transition: 'fill-opacity 0.3s ease' }}
    />
  );
};

export function GraficoRegioesRanking({
  dadosRanking,
  chaveUf = 'uf',
  isAnimationActive = true,
}: GraficoRegioesRankingProps) {
  const dadosPorRegiao = useMemo(
    () => agruparPorRegiao(dadosRanking, chaveUf),
    [dadosRanking, chaveUf]
  );

  if (!dadosPorRegiao || dadosPorRegiao.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Sem dados suficientes para agrupar por região.
      </div>
    );
  }

  return (
    <PieChart style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', aspectRatio: 1 }} responsive>
      <Pie
        data={dadosPorRegiao}
        labelLine={false}
        label={renderCustomizedLabel}
        fill="#8884d8"
        dataKey="value"
        nameKey="name"
        isAnimationActive={isAnimationActive}
        shape={FatiaRegiao}
      />
      <Tooltip
        formatter={(value, _name, item: any) => {
          const numero = Number(value);
          return [
            `${numero.toLocaleString('pt-BR')} guias (${item?.payload?.percentual}%)`,
            item?.payload?.name,
          ];
        }}
      />
      <Legend />
    </PieChart>
  );
}

export default GraficoRegioesRanking;