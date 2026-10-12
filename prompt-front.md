Você é um engenheiro frontend sênior (React + TypeScript + Tailwind). Vou enviar páginas de dashboard do meu projeto de graduação (dados do CADASTUR, em português). Refatore cada uma seguindo ESTE padrão, sem mudar o comportamento visível, exceto onde indicado.

## Contexto
- Stack: React + TypeScript + Tailwind. Imports usam extensão (ex.: '../../components/barChart/index.tsx').
- NÃO altere: services/*, utils/evolucao.ts e os componentes de gráfico/UI existentes (barChart, lineChart, pills, select, TextInput, growthCard etc.). Use-os com as mesmas props.
- As páginas são quase idênticas e só mudam o service e os textos. NÃO duplique código: crie um painel reutilizável.

## Arquitetura
src/
├── constants/regioes.ts        # MAPA_REGIOES `as const satisfies`, tipo UF, LISTA_UFS, regiaoDaUF()
├── lib/cache.ts                # cache localStorage versionado (lerCacheLista/gravarCacheLista, try/catch, valida Array.isArray)
├── lib/formatadores.ts         # Intl.NumberFormat criados uma vez (percentual com signDisplay 'exceptZero', inteiro)
├── hooks/                      # recebem o `servico` por parâmetro (não importam um service fixo)
│   ├── usePainelGeral.ts       # evolução + ranking(ano) + ranking estados; stale-while-revalidate; 1 única chamada de ranking
│   ├── useDadosUF.ts           # cidades + últimos 5 anos da UF (Promise.all, flag `ativo`)
│   ├── useComparativoEstados.ts
│   └── useBuscaMunicipios.ts   # validação, normalização, id de requisição, guarda o termo pesquisado
├── components/painel/
│   ├── ui.tsx                  # Card, OverlayCarregando (role="status"), AlertaErro (role="alert" + "Tentar novamente"), Esqueleto
│   ├── CardsResumo.tsx         # memo, <ul>/<li>
│   └── PainelTurismo.tsx       # página genérica, configurada por props
└── pages/<NomeDaPagina>/index.tsx   # só: <PainelTurismo servico={...} textos={...} />

Contrato do service (interface `ServicoPainel`): EvolucaoAnual(), Ranking(ano: string), RankingEstados(), RankingMunicipal({uf}), UltimosCincoAnos({uf}), TodosAnosUF({uf}), AcumuladoAnualMunicipio(nome). Se os métodos do service tiverem nomes diferentes, crie um adaptador fino na página (não renomeie o service).
Props de textos: título da página, nome do plural em minúsculas ("agências de turismo"), prefixo da chave de cache.

## Hooks e estado
- Estado derivado vira useMemo, nunca useState duplicado (ex.: dadosRegioes deriva de rankingEstados).
- Todo efeito assíncrono: flag `ativo` no cleanup; try/catch/finally; estado de erro com mensagem amigável.
- Promise.all para chamadas independentes. Sem chamadas duplicadas.
- Ano do ranking = new Date().getFullYear(), nunca '2026' fixo.
- Recarregar "últimos 5 anos" e cidades sempre que a UF mudar.
- Sem debounce em <select>; debounce só em digitação.
- useCallback/useMemo/memo apenas onde há ganho real (handlers passados a filhos, cálculos derivados, cards).

## Performance
- React.lazy + Suspense para blocos abaixo da dobra (comparativo, ListaCategorias, gráficos de município), com esqueleto como fallback.
- Esqueleto em vez de tela bloqueada "Carregando...". Só bloqueie se não houver cache.
- Sem recriar Intl/objetos/arrays em todo render.

## Segurança
- Nada de dangerouslySetInnerHTML.
- Cache: só dados públicos, chave versionada, parse protegido.
- Entrada de município: normalize (NFC, espaços), limite 80 caracteres, regex Unicode (letras/números/espaço/ponto/apóstrofo/hífen), mensagem de erro clara.
- Lembre-me de usar encodeURIComponent nos parâmetros de URL dentro do service e de validar também no backend.

## Acessibilidade e UX
- Semântica: <main>, <header>, <section aria-labelledby>, hierarquia h1 > h2 > h3.
- Busca em <form onSubmit> com <button type="submit"> (sem onKeyDown de Enter); botão desabilitado se vazio/carregando.
- Carregamentos em role="status"/aria-live="polite"; erros em role="alert".
- Grupo de pills com role="group" + aria-labelledby; foco visível (focus-visible) em todo controle; motion-reduce nos esqueletos.
- Contraste: textos secundários no mínimo text-gray-600/700 sobre branco.
- Estados vazios e de erro dizem o que houve e o que fazer.
- Copy: sentence case, acentuação correta, singular/plural corretos, sem nomes de variável em textos visíveis.

## Bugs conhecidos a verificar em toda página
- Classes Tailwind inexistentes (ex.: w-95%).
- Chamadas duplicadas de ranking e de cidades na carga inicial.
- Dados "últimos 5 anos" não recarregam ao trocar a UF.
- Município 2 sem dados é ignorado sem avisar.
- Texto do gráfico muda enquanto o usuário digita (use o termo pesquisado).
- Nomes copiados de outra página (variáveis, chaves de localStorage, textos, typos como "Tursimo").
- Métodos do service com nome de outro domínio (ex.: EvolucaoAnualAcampamentos usado em agências): sinalize e proponha o nome correto, mas não renomeie sem eu confirmar.

## Entrega
1. Liste, em poucas linhas, os bugs e riscos encontrados naquela página.
2. Entregue os arquivos completos, cada um com o caminho (src/...), prontos para colar.
3. Tipos: evite `any`; onde o formato do service for desconhecido, use um alias `Serie` com TODO.
4. Termine com uma lista curta do que preciso conferir (props que meus componentes precisam repassar, ajustes no service).
5. Não explique conceitos básicos. Seja direto.

Páginas a refatorar: vou enviando uma por vez. Comece pela primeira que eu mandar.