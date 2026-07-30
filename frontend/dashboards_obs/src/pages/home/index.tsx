import { useState, useEffect } from 'react';
import AcampamentosTuristicosServices from '../../services/acampamentos_turisticos.tsx';
import { GraficoEvolucaoAnual } from '../../components/lineChart/index.tsx';
import { GraficoBarrasEvolucao } from '../../components/barChart/index.tsx';
import { GraficoBarrasEvolucaoMunicipio } from '../../components/barChartMunicipio/index.tsx';
import { TopBarGrafico } from '../../components/topBarGraficos/index.tsx';

export function Home() {
  const [dadosEvolucao, setDadosEvolucao] = useState([]);
  const [dadosRanking, setDadosRanking] = useState([]);
  const [dadosRankingMunicipio, setDadosRankingMunicipio] = useState([]);
  const [dadosComparativo, setDadosComparativo] = useState([]);
  const [carregando, setCarregando] = useState(true);

 
  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);

        const [
          resultadoEvolucao,
          resultadoRanking,
          resultadoRankingMunicipio,
          resultadoComparativo,
        ] = await Promise.all([
          AcampamentosTuristicosServices.EvolucaoAnualAcampamentos(),
          AcampamentosTuristicosServices.RankingAcampamentos('2026'),
          AcampamentosTuristicosServices.RankingMunicipal({ uf: 'SP', ano: '' }),
          AcampamentosTuristicosServices.CompararAnos([2026, 2025, 2024, 2023, 2022, 2021, 2020]),
        ]);

        const topRanking = resultadoRanking.slice(0, 14);
        const topRankingMunicipio = resultadoRankingMunicipio.slice(0, 14);

        console.log('Dados Evolução:', resultadoEvolucao);
        console.log('Dados Ranking:', resultadoRanking);
        console.log('Dados Ranking Município:', resultadoRankingMunicipio);
        console.log('Dados Comparativo:', resultadoComparativo);

        setDadosComparativo(resultadoComparativo);
        setDadosRanking(topRanking);
        setDadosRankingMunicipio(topRankingMunicipio);
        setDadosEvolucao(resultadoEvolucao);
      } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  if (carregando) {
    return <div className="p-6">Carregando painel de análise...</div>;
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Panorama de Acampamentos Turísticos</h1>
      <hr />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="">
          <TopBarGrafico titulo="Evolução Histórica (Geral)" link="/evolucao-anual" />
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-700">Evolução Histórica (Geral)</h3>
            <GraficoEvolucaoAnual dados={dadosEvolucao} />
          </div>
        </div>

        {/* Gráfico 2 */}
        <div className="">
          <TopBarGrafico titulo="Ranking por UF (2026)" link="/ranking-uf" />
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-700">Ranking por UF (2026)</h3>

            <GraficoBarrasEvolucao dados={dadosRanking} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Gráfico 3 */}

        <div className="">
          <TopBarGrafico titulo="Ranking por município (SP) (2026)" link="/ranking-municipio" />
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-700">Ranking por município (SP) (2026)</h3>

            <GraficoBarrasEvolucaoMunicipio dados={dadosRankingMunicipio} />
          </div>
        </div>

        {/* Gráfico 4 */}
        <div className="">
          <TopBarGrafico titulo="Evolução últimos 5 anos (Geral)" link="/evolucao-anual" />
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-700">Evolução últimos 5 anos (Geral)</h3>

            <GraficoEvolucaoAnual dados={dadosComparativo} />
          </div>
        </div>
      </section>
    </main>
  );
}
