import { memo, useRef, type KeyboardEvent } from 'react';
import { nomeDaUF, UFS_POR_REGIAO, type UF } from '../../constants/regioes.ts';

const ORDEM_PLANA = UFS_POR_REGIAO.flatMap((g) => g.ufs);

interface Props {
  ufAtiva: UF;
  onSelecionar: (uf: UF) => void;
  /** Prefixo dos ids das abas (o painel referencia `${idBase}-tab-${uf}`). */
  idBase: string;
  /** Id do painel controlado pelas abas. */
  idPainel: string;
}

/**
 * Abas de estado agrupadas por região (padrão WAI-ARIA Tabs):
 * setas, Home e End navegam; só a aba ativa entra na ordem de Tab.
 */
export const SeletorUF = memo(function SeletorUF({ ufAtiva, onSelecionar, idBase, idPainel }: Props) {
  const listaRef = useRef<HTMLDivElement>(null);

  const aoTeclar = (e: KeyboardEvent<HTMLDivElement>) => {
    const atual = ORDEM_PLANA.indexOf(ufAtiva);
    let proximo = atual;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        proximo = (atual + 1) % ORDEM_PLANA.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        proximo = (atual - 1 + ORDEM_PLANA.length) % ORDEM_PLANA.length;
        break;
      case 'Home':
        proximo = 0;
        break;
      case 'End':
        proximo = ORDEM_PLANA.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    const uf = ORDEM_PLANA[proximo];
    onSelecionar(uf);
    listaRef.current?.querySelector<HTMLButtonElement>(`[data-uf="${uf}"]`)?.focus();
  };

  return (
    <div
      ref={listaRef}
      role="tablist"
      aria-label="Estado"
      aria-orientation="horizontal"
      onKeyDown={aoTeclar}
      className="flex flex-wrap gap-x-5 gap-y-3"
    >
      {UFS_POR_REGIAO.map(({ regiao, ufs }) => (
        <div key={regiao} role="presentation" className="flex flex-col gap-1.5">
          <span aria-hidden="true" className="px-1 text-xs font-medium text-neutral-600">
            {regiao}
          </span>
          <div role="presentation" className="inline-flex flex-wrap gap-0.5 rounded-full bg-black/[0.05] p-0.5">
            {ufs.map((uf) => {
              const ativo = uf === ufAtiva;
              return (
                <button
                  key={uf}
                  type="button"
                  role="tab"
                  id={`${idBase}-tab-${uf}`}
                  data-uf={uf}
                  aria-selected={ativo}
                  aria-controls={ativo ? idPainel : undefined}
                  aria-label={`${nomeDaUF(uf)} (${uf})`}
                  title={nomeDaUF(uf)}
                  tabIndex={ativo ? 0 : -1}
                  onClick={() => onSelecionar(uf)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3] ${
                    ativo
                      ? 'bg-[#0071E3] font-semibold text-white'
                      : 'font-medium text-neutral-700 hover:bg-black/[0.06]'
                  }`}
                >
                  {uf}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});