import { useState } from 'react';

interface TableMunicipiosRankingProps {
    uf: string;
    municipio: string;
    total: number;
}

interface TabelaProps {
    uf: string | null;
    dados: TableMunicipiosRankingProps[]; 
}

export function TableMunicipiosRanking({ uf, dados }: TabelaProps) {
    // Estado que controla o limite de linhas exibidas na tabela (começa com 20)
    const [itensVisiveis, setItensVisiveis] = useState(20);

    // Cria um novo array apenas com a quantidade de itens permitida pelo estado
    const dadosVisiveis = dados.slice(0, itensVisiveis);

    // Função para carregar mais 20 municípios por clique
    const handleCarregarMais = () => {
        setItensVisiveis((prev) => prev + 15);
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold mb-4 text-gray-800">
                Ranking de Municípios - {uf || 'Geral'}
            </h3>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-blue-950 uppercase bg-blue-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Município</th>
                            <th className="px-6 py-4 font-semibold text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dadosVisiveis.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">{item.municipio}</td>
                                <td className="px-6 py-4 font-bold text-right">{item.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Renderização Condicional: O botão só aparece se ainda houver dados escondidos */}
            {itensVisiveis < dados.length && (
                <div className="mt-6 flex justify-center">
                    <button 
                        type="button"
                        onClick={handleCarregarMais}
                        className="px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Carregar mais municípios
                    </button>
                </div>
            )}
        </div>
    );
}