import { memo, useMemo } from 'react';
import { formatarPorcentagem } from '../../lib/formatadores.ts';

interface Props {
  /** Estados da região (uf + total). */
  estados: { uf: string; total: number }[];
  ufAtiva: string;
  regiao: string;
}

/** Barra única 100% com a participação de cada estado na região. */
export const ParticipacaoRegiao = memo(function ParticipacaoRegiao({ estados, ufAtiva, regiao }: Props) {
  const { partes, totalRegiao } = useMemo(() => {
    const ordenados = [...estados].sort((a, b) => b.total - a.total);
    const soma = ordenados.reduce((s, i) => s + i.total, 0);
    return {
      totalRegiao: soma,
      partes: ordenados.map((e) => ({ ...e, pct: soma ? (e.total / soma) * 100 : 0 })),
    };
  }, [estados]);

  if (totalRegiao === 0) return null;
  const ativa = partes.find((p) => p.uf === ufAtiva);

  return (
    <div>
      <p className="text-sm text-neutral-700">
        {ativa ? (
          <>
            <strong className="font-semibold text-neutral-900">{ufAtiva}</strong> concentra{' '}
            {formatarPorcentagem(ativa.pct)} do total da região {regiao}.
          </>
        ) : (
          <>Participação dos estados na região {regiao}.</>
        )}
      </p>

      <div aria-hidden="true" className="mt-3 flex h-2 gap-px overflow-hidden rounded-full bg-white">
        {partes.map((p) => (
          <span
            key={p.uf}
            className={`min-w-[2px] ${p.uf === ufAtiva ? 'bg-[#0071E3]' : 'bg-neutral-300'}`}
            style={{ flexGrow: p.total, flexBasis: 0 }}
          />
        ))}
      </div>

      <ul className="mt-3 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-neutral-600">
        {partes.map((p) => (
          <li key={p.uf} className={p.uf === ufAtiva ? 'font-semibold text-[#0062C4]' : ''}>
            {p.uf} {formatarPorcentagem(p.pct)}
          </li>
        ))}
      </ul>
    </div>
  );
});