import { useId, useMemo } from 'react';
import { GraficoBarrasEvolucao } from '../barChart/index.tsx';
import { GraficoEvolucaoAnual } from '../lineChart/index.tsx';
import { TableMunicipiosRanking } from '../tableRankingMunicipal/index.tsx';
import { AlertaErro, OverlayCarregando } from './UI.tsx';
import { SeletorUF } from './SeletorUF.tsx';
import { GraficoTopMunicipios } from './GraficoTopMunicipios.tsx';
import { ParticipacaoRegiao } from './ParticipacaoRegiao.tsx';
import { nomeDaUF, regiaoDaUF, type UF } from '../../constants/regioes.ts';
import { formatarInteiro, formatarPorcentagem } from '../../lib/formatadores.ts';
import type { RankingUF, Serie } from '../../types/servicoPainel.ts';

const FONTE_APPLE = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", system-ui, sans-serif',
} as const;

const TILE = 'rounded-2xl border border-black/5 bg-white p-5';

interface Props {
  ufAtiva: UF;
  onSelecionarUF: (uf: UF) => void;
  dadosEstados: RankingUF[];
  cidades: Serie[];
  ultimosCincoAnos: Serie[];
  carregando: boolean;
  erro: string | null;
  rotuloPlural: string;
}

export function PainelEstado({
  ufAtiva,
  onSelecionarUF,
  dadosEstados,
  cidades,
  ultimosCincoAnos,
  carregando,
  erro,
  rotuloPlural,
}: Props) {
  const idBase = useId();
  const idTitulo = `${idBase}-titulo`;
  const idPainel = `${idBase}-painel`;

  const regiao = regiaoDaUF(ufAtiva);
  const nome = nomeDaUF(ufAtiva);

  const estadosDaRegiao = useMemo(
    () => dadosEstados.filter((i) => i.regiao === regiao).sort((a, b) => b.total - a.total),
    [dadosEstados, regiao],
  );

  const totalUF = useMemo(
    () => estadosDaRegiao.find((i) => i.uf === ufAtiva)?.total ?? cidades.reduce((s, c) => s + (c.total ?? 0), 0),
    [estadosDaRegiao, ufAtiva, cidades],
  );
  const totalRegiao = useMemo(() => estadosDaRegiao.reduce((s, i) => s + i.total, 0), [estadosDaRegiao]);
  const participacao = totalRegiao ? (totalUF / totalRegiao) * 100 : null;

  const indicadores = [
    { rotulo: 'Total no estado', valor: totalUF ? formatarInteiro(totalUF) : '—' },
    { rotulo: 'Municípios', valor: cidades.length ? formatarInteiro(cidades.length) : '—' },
    { rotulo: `Na região ${regiao}`, valor: participacao != null ? formatarPorcentagem(participacao) : '—' },
  ];

  return (
    <section
      aria-labelledby={idTitulo}
      style={FONTE_APPLE}
      className="mt-8 overflow-hidden rounded-3xl border border-black/5 bg-white antialiased"
    >
      <header className="border-b border-black/5 bg-neutral-50 px-5 py-6 sm:px-8">
        <h2 id={idTitulo} className="text-xl font-semibold tracking-tight text-neutral-900">
          Panorama por estado
        </h2>
        <p className="mt-1 max-w-prose text-sm text-neutral-600">
          Escolha um estado para ver a distribuição por município, o ranking e o histórico.
        </p>
        <div className="mt-5">
          <SeletorUF ufAtiva={ufAtiva} onSelecionar={onSelecionarUF} idBase={idBase} idPainel={idPainel} />
        </div>
      </header>

      <div
        role="tabpanel"
        id={idPainel}
        aria-labelledby={`${idBase}-tab-${ufAtiva}`}
        aria-busy={carregando}
        className="relative px-5 py-6 sm:px-8 sm:py-8"
      >
        <OverlayCarregando visivel={carregando} texto={`Carregando dados de ${nome}…`} />

        {erro && (
          <div className="mb-6">
            <AlertaErro mensagem={erro} />
          </div>
        )}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-3xl font-semibold tracking-tight text-neutral-900">{nome}</h3>
            <p className="text-sm text-neutral-600">Região {regiao}</p>
          </div>
          <dl className="flex gap-8">
            {indicadores.map((i) => (
              <div key={i.rotulo}>
                <dd className="text-2xl font-semibold tabular-nums tracking-tight text-neutral-900">{i.valor}</dd>
                <dt className="text-xs text-neutral-600">{i.rotulo}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className={TILE}>
            <h4 className="text-base font-semibold tracking-tight text-neutral-900">Municípios com mais registros</h4>
            <p className="mb-4 text-sm text-neutral-600">Os 10 maiores de {ufAtiva}</p>
            <GraficoTopMunicipios dados={cidades} uf={ufAtiva} rotuloPlural={rotuloPlural} />
            <div className="mt-6 border-t border-black/5 pt-5">
              <ParticipacaoRegiao estados={estadosDaRegiao} ufAtiva={ufAtiva} regiao={regiao} />
            </div>
          </div>

          <div className={TILE}>
            <TableMunicipiosRanking key={ufAtiva} uf={ufAtiva} dados={cidades} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className={TILE}>
            <h4 className="mb-3 text-base font-semibold tracking-tight text-neutral-900">
              Estados da região {regiao}
            </h4>
            <GraficoBarrasEvolucao dados={estadosDaRegiao} />
          </div>
          <div className={TILE}>
            <h4 className="mb-3 text-base font-semibold tracking-tight text-neutral-900">
              Últimos cinco anos em {ufAtiva}
            </h4>
            <GraficoEvolucaoAnual dados={ultimosCincoAnos} />
          </div>
        </div>
      </div>
    </section>
  );
}