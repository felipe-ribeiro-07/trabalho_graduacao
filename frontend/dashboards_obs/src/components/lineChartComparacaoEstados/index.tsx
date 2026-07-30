import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SerieDados {
  ano: number;
  total: number;
}

interface GraficoComparativoProps {
  dadosEstado1: SerieDados[];
  dadosEstado2?: SerieDados[];
  nomeEstado1: string;
  nomeEstado2?: string;
}

export function GraficoComparativoEstados({ 
  dadosEstado1 = [], 
  dadosEstado2 = [], 
  nomeEstado1, 
  nomeEstado2 
}: GraficoComparativoProps) {
  
  // Mescla os dados dos dois estados por ano para o Recharts ler na mesma linha do tempo
  const mapaAnos = new Map<number, any>();

  // Adiciona o primeiro estado
  dadosEstado1.forEach(item => {
    mapaAnos.set(item.ano, { ano: item.ano, [nomeEstado1]: item.total });
  });

  // Se houver segundo estado, injeta no mesmo ano correspondente
  if (dadosEstado2 && dadosEstado2.length > 0 && nomeEstado2) {
    dadosEstado2.forEach(item => {
      const existente = mapaAnos.get(item.ano) || { ano: item.ano };
      mapaAnos.set(item.ano, { ...existente, [nomeEstado2]: item.total });
    });
  }

  // Transforma o Map em array ordenado cronologicamente (do mais antigo pro mais recente)
  const dadosUnificados = Array.from(mapaAnos.values()).sort((a, b) => a.ano - b.ano);

  if (dadosUnificados.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-center h-[400px]">
        <p className="text-gray-500 font-medium">Selecione um estado para visualizar o gráfico.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[450px]">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Evolução Histórica Comparativa {nomeEstado2 ? `(${nomeEstado1} vs ${nomeEstado2})` : `(${nomeEstado1})`}
      </h3>

      <div className="flex-1 w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dadosUnificados}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="ano" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend />
            
            {/* Linha do Estado 1 (Azul) */}
            <Line 
              type="monotone" 
              dataKey={nomeEstado1} 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />

            {/* Linha do Estado 2 (Verde) - Só aparece se existir */}
            {nomeEstado2 && dadosEstado2.length > 0 && (
              <Line 
                type="monotone" 
                dataKey={nomeEstado2} 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}