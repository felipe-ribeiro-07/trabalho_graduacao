# Dashboard de Dados de Turismo / Tourism Data Dashboard

## 🇵🇹 Português

### Sobre o Projeto

Este repositório é um *dashboard* de dados de turismo: os utilizadores podem navegar por segmentos turísticos e visualizar tendências anuais, classificações de estados (UF) e municípios, e comparações entre anos. O *frontend* gere o encaminhamento das páginas e oferece *hooks* de dados para o *dashboard*; o *backend* expõe rotas de segmentos e um controlador de *dashboard* que invoca casos de uso de análise estatística. Programas separados de importação e ETL em Python processam os dados do CADASTUR para as tabelas da base de dados.

*(Nota: Várias implementações de rotas, serviços, casos de uso e ETL não foram extraídas neste escopo, pelo que as ligações e integrações estão limitadas às importações documentadas e às chamadas apresentadas na estrutura subjacente.)*

---

## 🇬🇧 English

### About the Project

This repository is a tourism-data dashboard: users browse tourism segments and view annual trends, state and municipality rankings, and year comparisons. The frontend routes pages and offers dashboard data hooks; the backend exposes segment routes and a dashboard controller that invokes analytics use cases. Separate Python import and ETL programs process CADASTUR data into database tables.

*(Note: Several route, service, use-case, and ETL implementations were not excerpted, so system connections are limited to documented imports and shown calls.)*

---

## Arquitetura / Architecture

---

## Estrutura de Diretórios / Directory Structure

```text
└── felipe-ribeiro-07-trabalho_graduacao/
    ├── docker-compose.dev.yml
    ├── docker-compose.yml
    ├── estrutura.md
    ├── package.json
    ├── pnpm-lock.yaml
    ├── prompt-front.md
    ├── tables.sql
    ├── backend/
    │   ├── app.js
    │   ├── Dockerfile
    │   ├── Dockerfile.dev
    │   ├── package.json
    │   ├── pnpm-workspace.yaml
    │   ├── server.js
    │   ├── skills-lock.json
    │   ├── tsconfig.json
    │   ├── .dockerignore
    │   ├── .env.save
    │   ├── src/
    │   │   ├── application/
    │   │   │   ├── ports/
    │   │   │   │   └── IAcampamentosTuristicosRepository.ts
    │   │   │   └── use-cases/
    │   │   │       ├── AcumuladoMunicipalUSeCase.ts
    │   │   │       ├── ComparaPorAnoUseCase.ts
    │   │   │       ├── CompararAnosPorUFUseCase.ts
    │   │   │       ├── EvolucaoAnualUFUseCase.ts
    │   │   │       ├── EvolucaoAnualUseCase.ts
    │   │   │       ├── RankingPorMunicipioUseCase.ts
    │   │   │       └── RankingPorUFUseCase.ts
    │   │   ├── domain/
    │   │   │   └── entities/
    │   │   │       └── AcampamentoTuristicos.ts
    │   │   └── infrastructure/
    │   │       └── in/
    │   │           └── adapters/
    │   │               └── http/
    │   │                   ├── controllers/
    │   │                   │   └── DashboardController.ts
    │   │                   └── routes/
    │   │                       ├── AcampamentoTuristico.js
    │   │                       ├── AgenciasDeTurismo.js
    │   │                       ├── CasaDeEspetaculos.js
    │   │                       ├── CentroDeConvencoes.js
    │   │                       ├── EmpreendimentosDeApoioAoTurismoNauticoOuPesca.js
    │   │                       ├── EmpreendimentosDeEntretrimentoLazerParquesAquaticos.js
    │   │                       ├── GuiasTuristico.js
    │   │                       ├── LocadoraDeVeiculos.js
    │   │                       ├── MeiosDeHospedagem.js
    │   │                       ├── OrganizadoraDeEventos.js
    │   │                       ├── ParquesTematicos.js
    │   │                       ├── PrestadoresDeServicosDeInfra.js
    │   │                       ├── PrestadoresDeServicosEspecializados.js
    │   │                       ├── RestaurantesBaresECafes.js
    │   │                       └── TransportadoraTuristica.js
    │   └── .agents/
    │       └── skills/
    │           └── supabase-server/
    │               └── SKILL.md
    ├── db/
    │   ├── init-dev/
    │   │   └── 01-create-dev-user.sh
    │   └── init-prod/
    │       └── 01-create-app-user.sh
    └── frontend/
        └── dashboards_obs/
            ├── README.md
            ├── Dockerfile
            ├── Dockerfile.dev
            ├── index.html
            ├── nginx.conf
            ├── package.json
            ├── tsconfig.app.json
            ├── tsconfig.json
            ├── tsconfig.node.json
            ├── vite.config.ts
            ├── .dockerignore
            ├── .oxlintrc.json
            └── src/
                ├── index.css
                ├── main.tsx
                ├── router.tsx
                ├── components/
                │   ├── barChart/
                │   │   └── index.tsx
                │   ├── barChartMunicipio/
                │   │   └── index.tsx
                │   ├── growthCard/
                │   │   └── index.tsx
                │   ├── lineChart/
                │   │   └── index.tsx
                │   ├── lineChartComparacaoEstados/
                │   │   └── index.tsx
                │   ├── lineChartMunicipio/
                │   │   └── index.tsx
                │   ├── listRodaPe/
                │   │   └── index.tsx
                │   ├── painel/
                │   │   ├── cardResumo.tsx
                │   │   ├── GraficoTopMunicipios.tsx
                │   │   ├── PainelEstado.tsx
                │   │   ├── PainelTurismo.tsx
                │   │   ├── ParticipacaoRegiao.tsx
                │   │   ├── SeletorUF.tsx
                │   │   └── UI.tsx
                │   ├── pieChartEstadoRegiao/
                │   │   └── index.tsx
                │   ├── pieChartRegioes/
                │   │   └── index.tsx
                │   ├── pillNave/
                │   │   └── index.tsx
                │   ├── pills/
                │   │   └── index.tsx
                │   ├── select/
                │   │   └── index.tsx
                │   ├── tableRankingMunicipal/
                │   │   └── index.tsx
                │   ├── TextInput/
                │   │   └── index.tsx
                │   └── topBarGraficos/
                │       └── index.tsx
                ├── constants/
                │   └── regioes.ts
                ├── hooks/
                │   ├── useBuscaMunicipios.ts
                │   ├── useComparativoUF.ts
                │   ├── useDadosUF.ts
                │   └── usePainelGeral.ts
                ├── layouts/
                │   └── header.tsx
                ├── lib/
                │   ├── adaptarServicoLegado.ts
                │   ├── cache.ts
                │   └── formatadores.ts
                ├── pages/
                │   ├── AcampamentosTuristicos/
                │   │   └── index.tsx
                │   ├── AgenciasDeTurismo/
                │   │   └── index.tsx
                │   ├── CasaDeEspetaculos/
                │   │   └── index.tsx
                │   ├── CentroDeConvencoes/
                │   │   └── index.tsx
                │   ├── EmpApoioNauticoPesca/
                │   │   └── index.tsx
                │   ├── EmpEntreterimentoLazerParques/
                │   │   └── index.tsx
                │   ├── GuiasTuristicos/
                │   │   └── index.tsx
                │   ├── home/
                │   │   ├── home.css
                │   │   └── index.tsx
                │   ├── LocadoraDeVeiculos/
                │   │   └── index.tsx
                │   ├── MeiosDeHospedagem/
                │   │   └── index.tsx
                │   ├── OrganizadoraDeEventos/
                │   │   └── index.tsx
                │   ├── ParquesTematicos/
                │   │   └── index.tsx
                │   ├── PrestadoresServcEspTurismo/
                │   │   └── index.tsx
                │   ├── PrestadoresServicoInfra/
                │   │   └── index.tsx
                │   └── TransportadorasTuristicas/
                │       └── index.tsx
                ├── services/
                │   ├── acampamentos_turisticos.ts
                │   ├── agencias_turismo.ts
                │   ├── api.ts
                │   ├── casa_espetaculos.ts
                │   ├── centro_convencoes.ts
                │   ├── emp_apoio_nautico_pesca.ts
                │   ├── emp_entreterimento_lazer_parques_aquaticos.ts
                │   ├── guias_turisticos.ts
                │   ├── locadora_de_veiculos.ts
                │   ├── meios_hospedagem.ts
                │   ├── organizadora_eventos.ts
                │   ├── parques_tematicos.ts
                │   ├── pres_especializados_turismo.ts
                │   ├── pres_infra.ts
                │   └── transportadora_turistica.ts
                ├── types/
                │   ├── evolucao_anual.ts
                │   ├── ranking_uf.ts
                │   └── servicoPainel.ts
                └── utils/
                    └── evolucao.ts

```
