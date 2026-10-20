import { useState, useMemo } from 'react';
import { Card, AlertaErro, Esqueleto, OverlayCarregando } from './UI.tsx'
import { SeletorUF } from './SeletorUF.tsx';
// Gráficos
import { GraficoBarrasEvolucao } from '../barChart/index.tsx'; // Ajuste o caminho para o seu gráfico de barras padrão
import { GraficoTopCnaes } from '../graficoTopCnaes/index.tsx';
import { GraficoTotalMunicipios } from '../graficoTopMunicipios/index.tsx';
import { GraficoDistribuicaoCnae } from '../graficoDestribuicaoCnaes/index.tsx';
// Utilitários e Hooks
import { nomeDaUF, type UF } from '../../constants/regioes.ts';
import { formatarInteiro } from '../../lib/formatadores.ts';
import { 
  useRankingNacionalSimei, 
  useTopCnaesEstado, 
  useTotalPorMunicipioSimei, 
  useDistribuicaoCnaeSimei 
} from '../../hooks/useSimeiCnae.ts';

const FONTE_APPLE = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", system-ui, sans-serif',
} as const;

export function PainelSimeiCnae() {
  // =======================================================================
  // 1. ESTADOS GERAIS
  // =======================================================================
  const [ufAtiva, setUfAtiva] = useState<UF>('SP');
  const [cnaeBusca, setCnaeBusca] = useState('');
  const [cnaeAtivo, setCnaeAtivo] = useState(''); 

  const tabelaAtiva = useMemo(() => {
    const nomeLimpo = nomeDaUF(ufAtiva).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
    return `simei_cnae_${nomeLimpo}_2026`;
  }, [ufAtiva]);

  // =======================================================================
  // 2. CONSUMO DE DADOS (HOOKS)
  // =======================================================================
  // Panorama Nacional (NOVO)
  const { data: dadosNacionais, loading: loadingNac, error: errNac, refetch: refetchNac } = useRankingNacionalSimei();
  
  // Panorama Estadual
  const { data: dadosTopCnaes, loading: loadingCnaes, error: errCnaes, refetch: refetchCnaes } = useTopCnaesEstado(tabelaAtiva, 10);
  const { data: dadosMunicipios, loading: loadingMuni, error: errMuni, refetch: refetchMuni } = useTotalPorMunicipioSimei(tabelaAtiva);
  
  // Distribuição Específica
  const { data: dadosDistribuicao, loading: loadingDist, error: errDist } = useDistribuicaoCnaeSimei(tabelaAtiva, cnaeAtivo);

  const carregandoEstado = loadingCnaes || loadingMuni;
  const erroEstado = errCnaes || errMuni;

  // Calcula o total do estado ativo somando os municípios
  const totalMEIsEstado = useMemo(() => {
    if (!dadosMunicipios) return 0;
    return dadosMunicipios.reduce((acc: number, item: any) => acc + Number(item.total_geral), 0);
  }, [dadosMunicipios]);

  return (
    <main className="p-4 sm:p-6" style={FONTE_APPLE}>
      <header>
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Panorama do Microempreendedor Individual (SIMEI)</h1>
        <hr className="border-green-950" />
      </header>

      {/* ================================================================== */}
      {/* SEÇÃO 1: PANORAMA NACIONAL (Visão Macro)                             */}
      {/* ================================================================== */}
      <section className="mt-8 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm antialiased">
        <header className="border-b border-black/5 bg-neutral-50 px-5 py-6 sm:px-8">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">Ranking Nacional</h2>
          <p className="mt-1 max-w-prose text-sm text-neutral-600">
            Comparativo do volume total de Microempreendedores Individuais ativos em cada estado do Brasil.
          </p>
        </header>

        <div className="relative px-5 py-6 sm:px-8">
          <OverlayCarregando visivel={loadingNac} texto="A carregar panorama nacional..." />
          
          {errNac && (
            <div className="mb-4">
              <AlertaErro mensagem={errNac} onTentarNovamente={refetchNac} />
            </div>
          )}

          {/* Wrapper com scroll vertical para não quebrar o layout se os 27 estados ficarem muito altos */}
          <div className="max-h-[450px] w-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
            {!loadingNac && dadosNacionais ? (
               <GraficoBarrasEvolucao dados={dadosNacionais} />
            ) : (
               <Esqueleto altura="h-[400px]" />
            )}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SEÇÃO 2: ANÁLISE POR ESTADO (Visão Micro)                            */}
      {/* ================================================================== */}
      <section className="mt-8 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm antialiased">
        <header className="border-b border-black/5 bg-neutral-50 px-5 py-6 sm:px-8">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Análise por Estado</h2>
          <p className="mt-1 max-w-prose text-sm text-neutral-600">
            Selecione uma Unidade Federativa para explorar os principais setores e a distribuição municipal dos MEIs.
          </p>
          <div className="mt-5">
            <SeletorUF 
              ufAtiva={ufAtiva} 
              onSelecionar={setUfAtiva} 
              idBase="simei-uf" 
              idPainel="simei-painel-uf" 
            />
          </div>
        </header>

        <div className="relative px-5 py-6 sm:px-8 sm:py-8" id="simei-painel-uf" role="tabpanel">
          <OverlayCarregando visivel={carregandoEstado} texto={`A recolher dados do SIMEI de ${nomeDaUF(ufAtiva)}…`} />

          {erroEstado && (
            <div className="mb-6">
              <AlertaErro mensagem={erroEstado} onTentarNovamente={() => { refetchCnaes(); refetchMuni(); }} />
            </div>
          )}

          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-3xl font-semibold tracking-tight text-neutral-900">{nomeDaUF(ufAtiva)}</h3>
              <p className="text-sm text-neutral-600">Ano de Referência: 2026</p>
            </div>
            <dl className="flex gap-8">
              <div>
                <dd className="text-2xl font-semibold tabular-nums tracking-tight text-neutral-900">
                  {totalMEIsEstado > 0 ? formatarInteiro(totalMEIsEstado) : '—'}
                </dd>
                <dt className="text-xs text-neutral-600">MEIs Ativos no Estado</dt>
              </div>
              <div>
                <dd className="text-2xl font-semibold tabular-nums tracking-tight text-neutral-900">
                  {dadosMunicipios?.length ? formatarInteiro(dadosMunicipios.length) : '—'}
                </dd>
                <dt className="text-xs text-neutral-600">Municípios com MEIs</dt>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h4 className="mb-1 text-base font-semibold tracking-tight text-neutral-900">Top 10 Setores de Atividade</h4>
              <p className="mb-5 text-sm text-neutral-600">As áreas com mais empreendedores em {ufAtiva}</p>
              
              {!carregandoEstado ? (
                <GraficoTopCnaes dados={dadosTopCnaes} />
              ) : (
                <Esqueleto altura="h-72" />
              )}
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h4 className="mb-1 text-base font-semibold tracking-tight text-neutral-900">Concentração por Município</h4>
              <p className="mb-5 text-sm text-neutral-600">As 10 cidades de {ufAtiva} com maior volume geral de MEIs</p>
              
              {!carregandoEstado ? (
                <GraficoTotalMunicipios dados={dadosMunicipios ? dadosMunicipios.slice(0, 10) : []} />
              ) : (
                <Esqueleto altura="h-72" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SEÇÃO 3: PESQUISA DE ATIVIDADE (Visão Específica)                    */}
      {/* ================================================================== */}
      <section className="mt-8">
        <Card className="flex min-h-[400px] flex-col p-6">
          <h2 className="pb-2 text-center text-lg font-medium tracking-tight text-gray-900">
            Força Ocupacional por Atividade
          </h2>
          <p className="pb-6 text-center text-sm text-gray-600">
            Procure pelo código do CNAE (ex: 5611203) para visualizar em que cidades do estado ({ufAtiva}) esta atividade é mais forte.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); setCnaeAtivo(cnaeBusca); }}
            className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 sm:flex-row"
          >
            <div className="w-full flex-1">
              <input
                type="text"
                placeholder="Introduza o código CNAE (apenas números)"
                value={cnaeBusca}
                onChange={(e) => setCnaeBusca(e.target.value)}
                maxLength={7}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <button
              type="submit"
              disabled={loadingDist || !cnaeBusca.trim()}
              className="w-full rounded-lg bg-[#0071E3] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
            >
              {loadingDist ? 'A procurar...' : 'Analisar Ocupação'}
            </button>
          </form>

          {errDist && (
            <div className="mt-4 mx-auto w-full max-w-2xl">
              <AlertaErro mensagem={errDist} />
            </div>
          )}

          <div className="mt-8 flex-1">
            {loadingDist && <OverlayCarregando visivel={true} texto="A analisar mapeamento do CNAE..." />}
            
            {!loadingDist && cnaeAtivo && (
               <GraficoDistribuicaoCnae 
                 dados={dadosDistribuicao ? dadosDistribuicao.slice(0, 10) : []} 
                 cnaeSelecionado={cnaeAtivo} 
               />
            )}
            
            {!loadingDist && !cnaeAtivo && (
              <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 text-center text-gray-500 text-sm">
                Aguardando pesquisa de atividade.
              </div>
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}