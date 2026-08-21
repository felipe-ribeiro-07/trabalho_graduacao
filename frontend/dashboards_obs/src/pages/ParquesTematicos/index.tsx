import { useMemo, useState, useEffect } from 'react';
import ParquesTematicosService from '../../services/parques_tematicos.tsx';
import { GraficoBarrasEvolucao } from '../../components/barChart/index.tsx';
import { GraficoRegioesEstados } from '../../components/pieChartEstadoRegiao/index.tsx';
import { GraficoEvolucaoAnual } from '../../components/lineChart/index.tsx';
import { Pill } from '../../components/pills/index.tsx';
import { TableMunicipiosRanking } from '../../components/tableRankingMunicipal/index.tsx';
import { StateSelect } from '../../components/select/index.tsx';
import { GraficoComparativoEstados } from '../../components/lineChartComparacaoEstados/index.tsx';
import { TextInput } from '../../components/TextInput/index.tsx';
import { ListaCategorias } from '../../components/listRodaPe/index.tsx';
import GrowthCard from '../../components/growthCard/index.tsx';
import {
  evolucaoUltimoAno,
  calcularDiferencaMaiorMenor,
  calcularDiferencaPrimeiroSegundo,
} from '../../utils/evolucao.ts';
import GraficoRegioesRanking from '../../components/pieChartRegioes/index.tsx';

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

const pillsEstados = Object.keys(MAPA_REGIOES);

export function ParquesTematicosTuristicos() {
  const [dadosEvolucao, setDadosEvolucao] = useState<any[]>([]);
  const [dadosRanking, setDadosRanking] = useState([]);
  const [dadosRegioes, setDadosRegioes] = useState<any[]>([]);
  const [dadosCidades, setDadosCidades] = useState<any[]>([]);
  const [dadosEstados, setDadosEstados] = useState<any[]>([]);
  const [dadosPieChart, setDadosPieChart] = useState<any[]>([]);
  const [dadosUltimosCincoAnos, setDadosUltimosCincoAnos] = useState<any[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [carregandoRegiao, setCarregandoRegiao] = useState(false);
  const [carregandoComparativo, setCarregandoComparativo] = useState(false);

  const [ufAtiva, setUfAtiva] = useState<string>('SP');
  const [estado1, setEstado1] = useState<string>('');
  const [estado2, setEstado2] = useState<string>('');
  const [dadosE1, setDadosE1] = useState<any[]>([]);
  const [dadosE2, setDadosE2] = useState<any[]>([]);

  // Busca por município (comparativo entre duas cidades)
  const [municipio1, setMunicipio1] = useState<string>('');
  const [municipio2, setMunicipio2] = useState<string>('');
  const [dadosMunicipio1, setDadosMunicipio1] = useState<any[]>([]);
  const [dadosMunicipio2, setDadosMunicipio2] = useState<any[]>([]);
  const [carregandoMunicipio, setCarregandoMunicipio] = useState(false);
  const [erroMunicipio, setErroMunicipio] = useState<string | null>(null);

  const lidarComBusca = () => {
    if (!municipio1) return;

    async function buscarDadosMunicipios() {
      setCarregandoMunicipio(true);
      setErroMunicipio(null);
      try {
        const resultado1 = await ParquesTematicosService.AcumuladoAnualMunicipio(municipio1);
        setDadosMunicipio1(resultado1);

        if (municipio2) {
          const resultado2 = await ParquesTematicosService.AcumuladoAnualMunicipio(municipio2);
          setDadosMunicipio2(resultado2);
        } else {
          setDadosMunicipio2([]);
        }
      } catch (erro) {
        console.error('Erro ao buscar dados dos municípios:', erro);
        setErroMunicipio('Não foi possível buscar os dados desses municípios.');
        setDadosMunicipio1([]);
        setDadosMunicipio2([]);
      } finally {
        setCarregandoMunicipio(false);
      }
    }

    buscarDadosMunicipios();
  };

  // 1. CARREGAMENTO INICIAL DOS DADOS GERAIS
  useEffect(() => {
    async function carregarDadosGerais() {
      try {
        setCarregando(true);

        const evolucaoCache = localStorage.getItem('resultadoEvolucaoParquesTematicos');
        const rankingCache = localStorage.getItem('resultadoRankingParquesTematicos');
        const pieChartCache = localStorage.getItem('resultadoPieChartParquesTematicos');

        if (evolucaoCache && rankingCache && pieChartCache) {
          setDadosEvolucao(JSON.parse(evolucaoCache));
          setDadosRanking(JSON.parse(rankingCache).slice(0, 14));
          setDadosPieChart(JSON.parse(pieChartCache));
        }

        const [resultadoEvolucaoParquesTematicos, resultadoRankingParquesTematicos, resultadoPieChartParquesTematicos] = await Promise.all([
          ParquesTematicosService.EvolucaoAnualAcampamentos(),
          ParquesTematicosService.RankingAcampamentos('2024'),
          ParquesTematicosService.RankingAcampamentos('2024')
        ]);

        localStorage.setItem('resultadoEvolucaoParquesTematicos', JSON.stringify(resultadoEvolucaoParquesTematicos));
        localStorage.setItem('resultadoRankingParquesTematicos', JSON.stringify(resultadoRankingParquesTematicos));
        localStorage.setItem('resultadoPieChartParquesTematicos', JSON.stringify(resultadoPieChartParquesTematicos));

        setDadosPieChart(resultadoPieChartParquesTematicos);
        setDadosEvolucao(resultadoEvolucaoParquesTematicos);
        setDadosRanking(resultadoRankingParquesTematicos.slice(0, 14));

        const [resultadoUF, resultadoCidade, resultadoUltimosCincoAnos] = await Promise.all([
          ParquesTematicosService.RankingEstados(),
          ParquesTematicosService.RankingMunicipal({ uf: ufAtiva }),
          ParquesTematicosService.UltimosCincoAnos({ uf: ufAtiva }),
        ]);

        const dadosComRegiao = resultadoUF.map((item: any) => ({
          ...item,
          regiao: MAPA_REGIOES[item.uf] || 'Desconhecida',
        }));

        setDadosEstados(resultadoUF);
        setDadosRegioes(dadosComRegiao);
        setDadosCidades(resultadoCidade);
        setDadosUltimosCincoAnos(resultadoUltimosCincoAnos);
      } catch (erro) {
        console.error('Erro ao carregar dados gerais:', erro);
      } finally {
        setCarregando(false);
      }
    }

    carregarDadosGerais();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. CARREGAMENTO DOS DADOS DA UF ATIVA (Pills)
  useEffect(() => {
    if (!ufAtiva) return;
    let ativo = true;

    async function carregarCidades() {
      setCarregandoRegiao(true);
      try {
        const resultado = await ParquesTematicosService.RankingMunicipal({ uf: ufAtiva });
        if (ativo) setDadosCidades(resultado);
      } catch (erro) {
        console.error('Erro ao carregar cidades do estado:', erro);
      } finally {
        if (ativo) setCarregandoRegiao(false);
      }
    }

    carregarCidades();
    return () => {
      ativo = false;
    };
  }, [ufAtiva]);

  // 3. CARREGAMENTO DOS DADOS DE COMPARAÇÃO (Selects)
  useEffect(() => {
    let ativo = true;

    async function buscarDadosComparativo() {
      setCarregandoComparativo(true);
      try {
        if (!estado1) {
          if (ativo) {
            setDadosE1([]);
            setDadosE2([]);
          }
          return;
        }

        const resE1 = await ParquesTematicosService.TodosAnosUF({ uf: estado1 });
        if (ativo) setDadosE1(resE1);

        if (estado2) {
          const resE2 = await ParquesTematicosService.TodosAnosUF({ uf: estado2 });
          if (ativo) setDadosE2(resE2);
        } else {
          if (ativo) setDadosE2([]);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do gráfico comparativo:', error);
      } finally {
        if (ativo) setCarregandoComparativo(false);
      }
    }

    const timeoutId = setTimeout(() => {
      buscarDadosComparativo();
    }, 300);

    return () => {
      ativo = false;
      clearTimeout(timeoutId);
    };
  }, [estado1, estado2]);

  const dadosRegiaoComparativo = useMemo(() => {
    if (!ufAtiva || !dadosEstados || dadosEstados.length === 0) return [];
    const regiao = MAPA_REGIOES[ufAtiva];
    return dadosEstados
      .filter((item: any) => (MAPA_REGIOES[item.uf] || item.regiao) === regiao)
      .sort((a: any, b: any) => b.total - a.total);
  }, [ufAtiva, dadosEstados]);

  // Comparativo entre o ano atual e o anterior (ex: 2024 x 2025)
  const comparativoUltimoAno = useMemo(() => evolucaoUltimoAno(dadosEvolucao), [dadosEvolucao]);

  // Comparativo entre a UF com maior e menor total no ranking
  const diferencaMaiorMenor = useMemo(
    () => calcularDiferencaMaiorMenor(dadosRanking, 'uf'),
    [dadosRanking]
  );

  // Comparativo entre a 1ª e a 2ª colocada no ranking
  const diferencaPrimeiroSegundo = useMemo(
    () => calcularDiferencaPrimeiroSegundo(dadosRanking, 'uf'),
    [dadosRanking]
  );

  if (carregando) {
    return <div className="p-6">Carregando painel de análise...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Panorama de Parques tematicos (ultimo ano 2024)</h1>
      <div className="border w-95% border-green-950"></div>

      {/* Grid Superior: Gráfico de Linha e Gráfico de Barras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-center font-medium mb-4 text-gray-700">Evolução Histórica (Geral)</h3>
          <GraficoEvolucaoAnual dados={dadosEvolucao} />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-center font-medium mb-4 text-gray-700">Ranking por UF (2024)</h3>
          <GraficoBarrasEvolucao dados={dadosRanking} />
        </div>
      </div>

      {/* Área de Cards e Gráfico (50% / 50%) */}
      <div className="mt-8 flex flex-col lg:flex-row gap-6">
        {/* Esquerda: 3 cards lado a lado ocupando metade da tela no Desktop */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 w-full lg:w-1/2">
          {/* Card 1 — Crescimento anual (ano atual x anterior) */}
          {comparativoUltimoAno && (
            <GrowthCard
              title="Crescimento Anual"
              subtitle={`(${comparativoUltimoAno.anoAtual} x ${comparativoUltimoAno.anoAnterior})`}
              percentage={`${comparativoUltimoAno.evolucao > 0 ? '+' : ''}${comparativoUltimoAno.evolucao.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
              description={`De ${comparativoUltimoAno.totalAnterior.toLocaleString('pt-BR')} para ${comparativoUltimoAno.totalAtual.toLocaleString('pt-BR')} em ${comparativoUltimoAno.anoAtual}.`}
            />
          )}

          {/* Card 2 — Maior x Menor do ranking */}
          {diferencaMaiorMenor && (
            <GrowthCard
              title="Maior x Menor"
              subtitle={`(${diferencaMaiorMenor.labelPrimeiro} x ${diferencaMaiorMenor.labelSegundo})`}
              percentage={`+${diferencaMaiorMenor.percentual.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
              description={`${diferencaMaiorMenor.labelPrimeiro} tem ${diferencaMaiorMenor.diferenca.toLocaleString('pt-BR')} ParquesTematicos a mais que ${diferencaMaiorMenor.labelSegundo}.`}
            />
          )}

          {/* Card 3 — 1º x 2º colocado do ranking */}
          {diferencaPrimeiroSegundo && (
            <GrowthCard
              title="1º x 2º Colocado"
              subtitle={`(${diferencaPrimeiroSegundo.labelPrimeiro} x ${diferencaPrimeiroSegundo.labelSegundo})`}
              percentage={`+${diferencaPrimeiroSegundo.percentual.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
              description={`${diferencaPrimeiroSegundo.labelPrimeiro} lidera com ${diferencaPrimeiroSegundo.diferenca.toLocaleString('pt-BR')} ParquesTematicos a mais que ${diferencaPrimeiroSegundo.labelSegundo}.`}
            />
          )}
        </div>

        {/* Direita: Gráfico ocupando a outra metade da tela */}
        <div className="w-full lg:w-1/2 bg-white border border-gray-100 rounded-2xl flex items-center justify-center p-4 min-h-[120px] shadow-sm">
          <GraficoRegioesRanking dadosRanking={dadosPieChart} />
        </div>
      </div>

      {/* Pills de Estados */}
      <div className="mt-8 mb-4">
        <h3 className="font-medium text-gray-700 pb-3">Veja os dados por estado</h3>
        <div className="flex flex-wrap gap-2">
          {pillsEstados.map((uf) => (
            <Pill key={uf} label={uf} isActive={ufAtiva === uf} onClick={() => setUfAtiva(uf)} />
          ))}
        </div>
      </div>

      {/* Grid Central: Pizza e Tabela */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[450px] relative">
          {carregandoRegiao && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl">
              <p className="text-sm text-gray-500">Carregando dados de {ufAtiva}...</p>
            </div>
          )}
          <GraficoRegioesEstados
            ufAtiva={ufAtiva}
            dadosEstados={dadosRegioes}
            dadosCidades={dadosCidades}
          />
          <div className="border-t border-gray-100 mt-4 pt-4">
            <h3 className="font-medium text-gray-700 mb-2">
              Comparativo entre estados — Região {MAPA_REGIOES[ufAtiva]}
            </h3>
            <GraficoBarrasEvolucao dados={dadosRegiaoComparativo} />
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4">
            <h3 className="font-medium text-gray-700 mb-2">
              Evolução dos últimos cinco anos — {ufAtiva}
            </h3>
            <GraficoEvolucaoAnual dados={dadosUltimosCincoAnos} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[450px] relative">
          {carregandoRegiao && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl">
              <p className="text-sm text-gray-500">Carregando dados de {ufAtiva}...</p>
            </div>
          )}
          <TableMunicipiosRanking dados={dadosCidades} uf={ufAtiva} />
        </div>
      </div>

      {/* Área de Comparação de Estados com Selects */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
        <h3 className="font-medium text-gray-700 pb-4 text-center">
          Comparativo Histórico entre Estados
        </h3>

        {carregandoComparativo && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl">
            <p className="text-sm text-gray-500">Buscando dados comparativos...</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <div className="flex-1">
            <StateSelect label="Localidade Principal" value={estado1} onChange={setEstado1} />
          </div>
          <div className="hidden sm:flex items-center justify-center pt-6 text-gray-400 font-medium">
            VS
          </div>
          <div className="flex-1">
            <StateSelect
              label="Comparar com (Opcional)"
              value={estado2}
              onChange={setEstado2}
              disabled={!estado1}
            />
          </div>
        </div>

        {estado1 ? (
          <GraficoComparativoEstados
            dadosEstado1={dadosE1}
            dadosEstado2={dadosE2}
            nomeEstado1={estado1}
            nomeEstado2={estado2}
          />
        ) : (
          <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-gray-400">
            Selecione uma localidade principal para iniciar a comparação.
          </div>
        )}
      </div>

      {/* Busca por Município (comparativo entre duas cidades) */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Gráfico ocupa 2/3 do espaço (col-span-2) */}
          <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[450px] relative">
            <h3 className="font-medium text-gray-700 pb-4 text-center">
              Evolução Histórica por Município
            </h3>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 w-full">
                <TextInput
                  label="Município Principal"
                  placeholder="Ex: Ibiúna"
                  value={municipio1}
                  onChange={(e) => setMunicipio1(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') lidarComBusca();
                  }}
                />
              </div>

              <div className="flex-1 w-full">
                <TextInput
                  label="Comparar com (Opcional)"
                  placeholder="Ex: São Roque"
                  value={municipio2}
                  onChange={(e) => setMunicipio2(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') lidarComBusca();
                  }}
                  disabled={!municipio1}
                />
              </div>

              <button
                onClick={lidarComBusca}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Buscar
              </button>
            </div>

            {carregandoMunicipio && <p className="text-sm text-gray-500 mt-3">Buscando...</p>}

            {erroMunicipio && <p className="text-sm text-red-600 mt-3">{erroMunicipio}</p>}

            {!carregandoMunicipio && !erroMunicipio && dadosMunicipio1.length === 0 && municipio1 && (
              <p className="text-sm text-gray-400 mt-3">
                Nenhum dado encontrado para "{municipio1}".
              </p>
            )}

            <div className="mt-4 flex-1">
              {municipio2 && dadosMunicipio2.length > 0 ? (
                <GraficoComparativoEstados
                  dadosEstado1={dadosMunicipio1}
                  dadosEstado2={dadosMunicipio2}
                  nomeEstado1={municipio1}
                  nomeEstado2={municipio2}
                />
              ) : (
                <GraficoEvolucaoAnual dados={dadosMunicipio1} />
              )}
            </div>
          </div>

          {/* Lista ocupa 1/3 do espaço restante */}
          <div className="h-full">
            <ListaCategorias />
          </div>
        </div>
      </div>
    </div>
  );
}