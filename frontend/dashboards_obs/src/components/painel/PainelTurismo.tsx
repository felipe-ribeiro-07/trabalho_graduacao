import { lazy, Suspense, useCallback, useId, useMemo, useState, type FormEvent } from 'react';
import { GraficoBarrasEvolucao } from '../barChart/index.tsx';
import { GraficoRegioesEstados } from '../pieChartEstadoRegiao/index.tsx';
import { GraficoEvolucaoAnual } from '../lineChart/index.tsx';
import { Pill } from '../pills/index.tsx';
import { TableMunicipiosRanking } from '../tableRankingMunicipal/index.tsx';
import { StateSelect } from '../select/index.tsx';
import { TextInput } from '../TextInput/index.tsx';
import GraficoRegioesRanking from '../pieChartRegioes/index.tsx';
import { CardsResumo } from './cardResumo.tsx';
import { AlertaErro, Card, Esqueleto, OverlayCarregando } from './UI.tsx';
import {
  evolucaoUltimoAno,
  calcularDiferencaMaiorMenor,
  calcularDiferencaPrimeiroSegundo,
} from '../../utils/evolucao.ts';
import { LISTA_UFS, regiaoDaUF, type UF } from '../../constants/regioes.ts';
import { usePainelGeral } from '../../hooks/usePainelGeral.ts';
import { useDadosUF } from '../../hooks/useDadosUF.ts';
import { useComparativoEstados } from '../../hooks/useComparativoUF.ts';
import { useBuscaMunicipios } from '../../hooks/useBuscaMunicipios.ts';
import type { ServicoPainel } from '../../types/servicoPainel.ts';

// Code-splitting: blocos abaixo da dobra só são baixados quando necessários.
const GraficoComparativoEstados = lazy(() =>
  import('../lineChartComparacaoEstados/index.tsx').then((m) => ({ default: m.GraficoComparativoEstados })),
);
const ListaCategorias = lazy(() =>
  import('../listRodaPe/index.tsx').then((m) => ({ default: m.ListaCategorias })),
);

const ANO_ATUAL = new Date().getFullYear();
const FOCO = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800';

export interface TextosPainel {
  /** Título da página, ex.: "Panorama de agências de turismo". */
  titulo: string;
  /** Plural em minúsculas usado nas frases, ex.: "agências de turismo". */
  plural: string;
  /** Prefixo único do cache em localStorage, ex.: "agencias". */
  prefixoCache: string;
}

interface Props {
  /** Objeto ESTÁVEL: defina fora do componente (senão os efeitos re-executam a cada render). */
  servico: ServicoPainel;
  textos: TextosPainel;
  /** Ano do ranking por UF. Padrão: ano atual. Use quando os dados terminam em um ano anterior. */
  anoRanking?: number;
}

export function PainelTurismo({ servico, textos, anoRanking = ANO_ATUAL }: Props) {
  const ids = { uf: useId(), comparativo: useId(), municipio: useId(), erroMunicipio: useId() };

  const painel = usePainelGeral(servico, anoRanking, textos.prefixoCache);
  const [ufAtiva, setUfAtiva] = useState<UF>('SP');
  const dadosUF = useDadosUF(servico, ufAtiva);

  const [estado1, setEstado1] = useState('');
  const [estado2, setEstado2] = useState('');
  const comparativo = useComparativoEstados(servico, estado1, estado2);

  const busca = useBuscaMunicipios(servico);

  const selecionarUF = useCallback((uf: UF) => setUfAtiva(uf), []);

  const regiaoAtiva = regiaoDaUF(ufAtiva);
  const dadosRegiaoComparativo = useMemo(
    () =>
      painel.dadosRegioes
        .filter((item) => item.regiao === regiaoAtiva)
        .sort((a, b) => b.total - a.total),
    [painel.dadosRegioes, regiaoAtiva],
  );

  const crescimento = useMemo(() => evolucaoUltimoAno(painel.evolucao), [painel.evolucao]);
  const maiorMenor = useMemo(() => calcularDiferencaMaiorMenor(painel.rankingTop14, 'uf'), [painel.rankingTop14]);
  const primeiroSegundo = useMemo(() => calcularDiferencaPrimeiroSegundo(painel.rankingTop14, 'uf'), [painel.rankingTop14]);

  const aoBuscarMunicipio = (e: FormEvent) => {
    e.preventDefault();
    void busca.buscar();
  };

  const r = busca.resultado;
  const municipioSemDados = r && r.dados1.length === 0;
  const comparadoSemDados = r && r.nome2 && r.dados2.length === 0;

  return (
    <main className="p-4 sm:p-6" aria-busy={painel.carregando}>
      <header>
        <h1 className="mb-4 text-2xl font-bold text-gray-900">{textos.titulo}</h1>
        <hr className="border-green-950" />
      </header>

      {painel.erro && (
        <div className="mt-4">
          <AlertaErro mensagem={painel.erro} onTentarNovamente={painel.recarregar} />
        </div>
      )}

      {painel.carregando ? (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2" role="status" aria-label="Carregando painel de análise">
          <Esqueleto />
          <Esqueleto />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-center font-medium text-gray-800">Evolução histórica (geral)</h2>
              <GraficoEvolucaoAnual dados={painel.evolucao} />
            </Card>
            <Card>
              <h2 className="mb-4 text-center font-medium text-gray-800">Ranking por UF ({anoRanking})</h2>
              <GraficoBarrasEvolucao dados={painel.rankingTop14} />
            </Card>
          </div>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row">
            <CardsResumo
              crescimento={crescimento}
              maiorMenor={maiorMenor}
              primeiroSegundo={primeiroSegundo}
              rotuloPlural={textos.plural}
            />
            <Card className="flex min-h-[120px] w-full items-center justify-center rounded-2xl lg:w-1/2">
              <GraficoRegioesRanking dadosRanking={painel.rankingCompleto} />
            </Card>
          </div>
        </>
      )}

      {/* Dados por estado */}
      <section className="mt-8" aria-labelledby={ids.uf}>
        <h2 id={ids.uf} className="pb-3 font-medium text-gray-800">Veja os dados por estado</h2>
        <div role="group" aria-labelledby={ids.uf} className="flex flex-wrap gap-2">
          {LISTA_UFS.map((uf) => (
            <Pill key={uf} label={uf} isActive={ufAtiva === uf} onClick={() => selecionarUF(uf)} />
          ))}
        </div>

        {dadosUF.erro && (
          <div className="mt-4">
            <AlertaErro mensagem={dadosUF.erro} />
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="flex min-h-[450px] flex-col">
            <OverlayCarregando visivel={dadosUF.carregando} texto={`Carregando dados de ${ufAtiva}...`} />
            <GraficoRegioesEstados ufAtiva={ufAtiva} dadosEstados={painel.dadosRegioes} dadosCidades={dadosUF.cidades} />
            <div className="mt-4 border-t border-gray-200 pt-4">
              <h3 className="mb-2 font-medium text-gray-800">Comparativo entre estados — região {regiaoAtiva}</h3>
              <GraficoBarrasEvolucao dados={dadosRegiaoComparativo} />
            </div>
            <div className="mt-4 border-t border-gray-200 pt-4">
              <h3 className="mb-2 font-medium text-gray-800">Evolução dos últimos cinco anos — {ufAtiva}</h3>
              <GraficoEvolucaoAnual dados={dadosUF.ultimosCincoAnos} />
            </div>
          </Card>

          <Card className="flex min-h-[450px] flex-col">
            <OverlayCarregando visivel={dadosUF.carregando} texto={`Carregando dados de ${ufAtiva}...`} />
            <TableMunicipiosRanking dados={dadosUF.cidades} uf={ufAtiva} />
          </Card>
        </div>
      </section>

      {/* Comparativo entre estados */}
      <section className="mt-8" aria-labelledby={ids.comparativo}>
        <Card className="p-6">
          <h2 id={ids.comparativo} className="pb-4 text-center font-medium text-gray-800">
            Comparativo histórico entre estados
          </h2>
          <OverlayCarregando visivel={comparativo.carregando} texto="Buscando dados comparativos..." />

          <div className="mb-6 flex flex-col gap-6 sm:flex-row">
            <div className="flex-1">
              <StateSelect label="Localidade principal" value={estado1} onChange={setEstado1} />
            </div>
            <div className="hidden items-center justify-center pt-6 font-medium text-gray-600 sm:flex" aria-hidden="true">
              VS
            </div>
            <div className="flex-1">
              <StateSelect label="Comparar com (opcional)" value={estado2} onChange={setEstado2} disabled={!estado1} />
            </div>
          </div>

          {comparativo.erro && <AlertaErro mensagem={comparativo.erro} />}

          {estado1 ? (
            <Suspense fallback={<Esqueleto altura="h-48" />}>
              <GraficoComparativoEstados
                dadosEstado1={comparativo.dadosE1}
                dadosEstado2={comparativo.dadosE2}
                nomeEstado1={estado1}
                nomeEstado2={estado2}
              />
            </Suspense>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 text-center text-gray-700">
              Selecione uma localidade principal para iniciar a comparação.
            </div>
          )}
        </Card>
      </section>

      {/* Busca por município */}
      <section className="mt-8" aria-labelledby={ids.municipio}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="flex min-h-[450px] flex-col lg:col-span-2">
            <h2 id={ids.municipio} className="pb-4 text-center font-medium text-gray-800">
              Evolução histórica por município
            </h2>

            <form onSubmit={aoBuscarMunicipio} noValidate className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              <div className="w-full flex-1">
                <TextInput
                  label="Município principal"
                  placeholder="Ex: Ibiúna"
                  value={busca.municipio1}
                  onChange={(e) => busca.setMunicipio1(e.target.value)}
                  maxLength={80}
                  autoComplete="off"
                  aria-describedby={busca.erro ? ids.erroMunicipio : undefined}
                />
              </div>
              <div className="w-full flex-1">
                <TextInput
                  label="Comparar com (opcional)"
                  placeholder="Ex: São Roque"
                  value={busca.municipio2}
                  onChange={(e) => busca.setMunicipio2(e.target.value)}
                  maxLength={80}
                  autoComplete="off"
                  disabled={!busca.municipio1}
                />
              </div>
              <button
                type="submit"
                disabled={busca.carregando || !busca.municipio1.trim()}
                className={`rounded-lg bg-blue-700 px-4 py-2 text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 ${FOCO}`}
              >
                {busca.carregando ? 'Buscando…' : 'Buscar'}
              </button>
            </form>

            <div className="mt-3 min-h-6" role="status" aria-live="polite">
              {busca.carregando && <p className="text-sm text-gray-700">Buscando dados…</p>}
              {!busca.carregando && municipioSemDados && (
                <p className="text-sm text-gray-700">Nenhum dado encontrado para “{r.nome1}”. Verifique a grafia.</p>
              )}
              {!busca.carregando && !municipioSemDados && comparadoSemDados && (
                <p className="text-sm text-gray-700">Nenhum dado encontrado para “{r.nome2}”. Exibindo só “{r.nome1}”.</p>
              )}
            </div>
            {busca.erro && (
              <div id={ids.erroMunicipio}>
                <AlertaErro mensagem={busca.erro} />
              </div>
            )}

            <div className="mt-4 flex-1">
              {r && !municipioSemDados && (
                <Suspense fallback={<Esqueleto />}>
                  {r.nome2 && r.dados2.length > 0 ? (
                    <GraficoComparativoEstados
                      dadosEstado1={r.dados1}
                      dadosEstado2={r.dados2}
                      nomeEstado1={r.nome1}
                      nomeEstado2={r.nome2}
                    />
                  ) : (
                    <GraficoEvolucaoAnual dados={r.dados1} />
                  )}
                </Suspense>
              )}
            </div>
          </Card>

          <div className="h-full">
            <Suspense fallback={<Esqueleto altura="h-full min-h-48" />}>
              <ListaCategorias />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}