import { useMemo } from 'react';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from 'recharts';

export interface AcampamentoEstadoData {
  uf: string;
  regiao: string;
  total: number;
}

export interface AcampamentoCidadeData {
  municipio: string;
  total: number;
}

interface GraficoProps {
  ufAtiva: string | null;
  dadosEstados: AcampamentoEstadoData[];
  dadosCidades: AcampamentoCidadeData[];
}

const MAPA_REGIOES: Record<string, string> = {
  AC: 'Norte',
  AL: 'Nordeste',
  AP: 'Norte',
  AM: 'Norte',
  BA: 'Nordeste',
  CE: 'Nordeste',
  DF: 'Centro-Oeste',
  ES: 'Sudeste',
  GO: 'Centro-Oeste',
  MA: 'Nordeste',
  MT: 'Centro-Oeste',
  MS: 'Centro-Oeste',
  MG: 'Sudeste',
  PA: 'Norte',
  PB: 'Nordeste',
  PR: 'Sul',
  PE: 'Nordeste',
  PI: 'Nordeste',
  RJ: 'Sudeste',
  RN: 'Nordeste',
  RS: 'Sul',
  RO: 'Norte',
  RR: 'Norte',
  SC: 'Sul',
  SP: 'Sudeste',
  SE: 'Nordeste',
  TO: 'Norte',
};

const CORES_REGIOES: Record<string, string> = {
  Norte: '#22c55e',
  Nordeste: '#eab308',
  'Centro-Oeste': '#f97316',
  Sudeste: '#3b82f6',
  Sul: '#a855f7',
};

const CORES_CIDADES = [
  '#60a5fa',
  '#34d399',
  '#fbbf24',
  '#f87171',
  '#a78bfa',
  '#38bdf8',
  '#fb923c',
  '#a3e635',
  '#f472b6',
  '#3b82f6',
  '#2dd4bf',
  '#fb7185',
];

export function GraficoRegioesEstados({ ufAtiva, dadosEstados, dadosCidades }: GraficoProps) {
  const { dadosInner, dadosOuter, regiaoAtual } = useMemo(() => {
    if (!ufAtiva || !dadosEstados || dadosEstados.length === 0) {
      return { dadosInner: [], dadosOuter: [], regiaoAtual: null };
    }

    const regiao = MAPA_REGIOES[ufAtiva];

    // ANEL DE DENTRO: só os estados da região do UF selecionado
    const estadosDaRegiao = dadosEstados.filter(
      (item) => (MAPA_REGIOES[item.uf] || item.regiao) === regiao
    );

    const formatadoInner = estadosDaRegiao.map((item) => ({
      name: item.uf,
      value: item.total,
    }));

    // ANEL DE FORA: todas as cidades do estado ativo, sem limite
    const cidadesOrdenadas = [...(dadosCidades || [])].sort((a, b) => b.total - a.total);

    const formatadoOuter: any[] = cidadesOrdenadas.map((cidade) => ({
      name: cidade.municipio,
      value: cidade.total,
    }));

    return { dadosInner: formatadoInner, dadosOuter: formatadoOuter, regiaoAtual: regiao };
  }, [ufAtiva, dadosEstados, dadosCidades]);

  if (!dadosInner || dadosInner.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center justify-center h-[400px]">
        <p className="text-gray-500 font-medium">Nenhum dado disponível.</p>
      </div>
    );
  }

  const corBase = CORES_REGIOES[regiaoAtual || 'Sudeste'] || '#3b82f6';

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[450px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Distribuição - Região {regiaoAtual}</h3>
      </div>

      <div className="flex-1 w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dadosInner}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius="45%"
              isAnimationActive={true}>
              {dadosInner.map((entry, index) => (
                <Cell
                  key={`inner-${index}`}
                  fill={corBase}
                  opacity={entry.name === ufAtiva ? 1 : 0.3}
                  stroke="#fff"
                />
              ))}
            </Pie>

            <Pie
              data={dadosOuter}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius="47%"
              outerRadius="85%"
              label={false}
              isAnimationActive={true}>
              {dadosOuter.map((_, index) => (
                <Cell
                  key={`outer-${index}`}
                  fill={CORES_CIDADES[index % CORES_CIDADES.length]}
                  opacity={0.9}
                  stroke="#fff"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} acampamentos`, name ?? '']}
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
