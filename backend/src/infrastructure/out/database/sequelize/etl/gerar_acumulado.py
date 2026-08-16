#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
===============================================================================
ETL - CONSOLIDAÇÃO DE TODAS AS CATEGORIAS CADASTUR
===============================================================================

Lê automaticamente todas as tabelas do schema que seguem os padrões:

    {CATEGORIA}_{FORMATO}_{ANO}
    {CATEGORIA}_{FORMATO}_{ANO}_T{trimestre}

ou:

    {CATEGORIA}_{ANO}
    {CATEGORIA}_{ANO}_T{trimestre}

Exemplos:

    ACAMPAMENTOTURISTICO_CSV_2017_T4
    ACAMPAMENTOTURISTICO_XLSX_2025
    AGENCIADETURISMO_CSV_2006
    AGENCIADETURISMO_2024
    PRESTADORESDESERVICODEINFRAESTRUTURA_2011

Para cada categoria encontrada, cria uma única tabela acumulada:

    tb_{categoria}_acumulado

Nomes podem ser personalizados em NOMES_AMIGAVEIS.

O ETL:

- Descobre automaticamente as categorias.
- Aceita tabelas com CSV/XLS/XLSX.
- Aceita tabelas que possuem somente o ano.
- Aceita tabelas trimestrais.
- Escolhe uma tabela por ano.
- Prioriza XLSX > XLS > CSV.
- Prioriza tabela anual sobre trimestral.
- Quando só existem tabelas trimestrais, usa o maior trimestre.
- Detecta automaticamente colunas comuns do CADASTUR.
- Normaliza datas.
- NORMALIZA E MESCLA AUTOMATICAMENTE categorias com nomes similares
  (erros de digitação, plural/singular, sufixos de sheet/cópia/backup),
  evitando criar tabelas destino duplicadas para a mesma categoria.
- Usa processamento em lotes.
- Usa cursor buffered para evitar "Unread result found".
- Reconecta automaticamente ao MySQL.
- A coluna CNPJ possui VARCHAR(255), evitando erro 1406
  causado por dados antigos/inconsistentes.
- Caso um lote apresente erro, tenta inserir registro por registro,
  evitando perder os demais registros do lote.
===============================================================================
"""

import os
import re
import sys
import time
import difflib
from datetime import datetime, date

import mysql.connector
from mysql.connector import Error


# =============================================================================
# 1. CONFIGURAÇÃO DO MYSQL
# =============================================================================

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "CADASTUR"),
    "charset": "utf8mb4",
    "use_unicode": True,
    "autocommit": False,
}


# =============================================================================
# 2. CONFIGURAÇÃO DO ETL
# =============================================================================

BATCH_SIZE = 500

FORMATOS_ORIGEM = [
    "XLSX",
    "XLS",
    "CSV",
]

LIMITE_NOME_TABELA_MYSQL = 64


NOMES_AMIGAVEIS = {

    "ACAMPAMENTOTURISTICO":
        "tb_acampamentos_turisticos_acumulado",

    "AGENCIADETURISMO":
        "tb_agencias_turismo_acumulado",

    "RESTAURANTESBARESCAFESESIMILAR":
        "tb_restaurantes_bares_cafes_acumulado",

    # Adicione outras categorias aqui quando desejar.
}


LIMPAR_TABELA_ANTES = True


PROCESSAR_TODAS_CATEGORIAS = True


CATEGORIAS_FILTRO = []


MAX_TENTATIVAS_CONEXAO = 5


INTERVALO_RECONEXAO = 3


# =============================================================================
# 2.1 NORMALIZAÇÃO AUTOMÁTICA DE CATEGORIAS
# =============================================================================

"""
Algumas tabelas de origem do CADASTUR são nomeadas de forma inconsistente
entre anos diferentes (erro de digitação, plural/singular, sufixos de
sheet/cópia/backup gerados na importação de Excel/CSV). Sem tratamento,
o ETL trataria essas variantes como categorias diferentes, criando
tabelas destino duplicadas.

Esta seção:

1. Remove sufixos de ruído conhecidos do nome da categoria.
2. Agrupa (mescla) categorias remanescentes que são muito similares
   entre si usando comparação de texto (difflib).
3. Loga claramente quais categorias foram mescladas, para conferência.

IMPORTANTE: a mesclagem acontece ANTES do processamento de cada
categoria, para que a tabela destino seja truncada e recriada apenas
UMA vez por grupo (evitando que uma variante apague os dados que a
outra variante acabou de inserir).
"""

# Sufixos de ruído conhecidos, comuns em exports de Excel/CSV mal nomeados.
# Removidos ANTES da comparação de similaridade.
PADROES_RUIDO = [
    r"_SHEET\d+$",
    r"_PLANILHA\d*$",
    r"_COPY$",
    r"_C[OÓ]PIA$",
    r"_BACKUP$",
    r"_BKP$",
    r"_V\d+$",
    r"_OLD$",
    r"_ANTIGO$",
    # Indicadores de formato que vazaram para dentro do nome da
    # categoria (regex de origem não bateu com _FORMATO_ANO exato,
    # então o formato acabou capturado como parte da categoria).
    # Removidos por último, podendo deixar mais de um resíduo em
    # sequência (ex: "_XLS_SHEET1" -> remove SHEET1, depois XLS).
    r"_(XLSX|XLS|CSV)$",
]

# Aplica os padrões de ruído em loop até não sobrar mais nada para
# remover (cobre casos como "_XLS_SHEET1", onde múltiplos sufixos
# de ruído aparecem colados um no outro).
APLICAR_RUIDO_REPETIDAMENTE = True

# Categorias que NUNCA devem ser mescladas automaticamente,
# mesmo que pareçam similares (proteção contra falso positivo).
# Preencha com nomes de categoria (já sem ruído) caso o clustering
# junte algo que na verdade deveria continuar separado.
CATEGORIAS_NAO_MESCLAR = set()

# Limiar de similaridade (0 a 1). 0.90 é conservador o suficiente
# para pegar erros de digitação/plural sem juntar categorias diferentes.
LIMIAR_SIMILARIDADE = 0.90


def limpar_ruido_categoria(categoria):

    limpo = categoria

    if APLICAR_RUIDO_REPETIDAMENTE:

        # Repete a limpeza até estabilizar (nenhum padrão mais
        # remove nada), cobrindo sufixos de ruído colados em
        # sequência (ex: "_XLS_SHEET1").
        while True:

            anterior = limpo

            for padrao in PADROES_RUIDO:

                limpo = re.sub(
                    padrao,
                    "",
                    limpo,
                    flags=re.IGNORECASE
                )

            if limpo == anterior:
                break

    else:

        for padrao in PADROES_RUIDO:

            limpo = re.sub(
                padrao,
                "",
                limpo,
                flags=re.IGNORECASE
            )

    return limpo


def agrupar_categorias_similares(categorias_brutas):
    """
    Recebe {categoria: [tabelas]} com nomes ainda "sujos" e devolve
    (categorias_finais, relatorio_mesclagens), onde categorias_finais
    é {categoria_canonica: [tabelas]} já mesclado.

    A categoria canônica escolhida em cada grupo é a que possui MAIS
    tabelas de origem associadas (maior histórico), o que tende a ser
    o nome "correto" mais usado ao longo dos anos.
    """

    # 1) Remove ruído conhecido primeiro
    limpas = {}

    for categoria, tabelas in categorias_brutas.items():

        categoria_limpa = limpar_ruido_categoria(categoria)

        limpas.setdefault(
            categoria_limpa,
            []
        ).extend(tabelas)

    # 2) Clusteriza por similaridade de texto
    nomes = sorted(limpas.keys())

    visitados = set()

    grupos = []

    for nome in nomes:

        if nome in visitados:
            continue

        grupo = [nome]

        visitados.add(nome)

        for outro in nomes:

            if outro in visitados:
                continue

            if (
                nome in CATEGORIAS_NAO_MESCLAR
                or outro in CATEGORIAS_NAO_MESCLAR
            ):
                continue

            similaridade = difflib.SequenceMatcher(
                None,
                nome,
                outro
            ).ratio()

            if similaridade >= LIMIAR_SIMILARIDADE:

                grupo.append(outro)

                visitados.add(outro)

        grupos.append(grupo)

    # 3) Monta resultado final, escolhendo nome canônico por grupo
    resultado = {}

    relatorio_mesclagens = []

    for grupo in grupos:

        # Categoria canônica = a com mais tabelas de origem associadas.
        # Em empate, prevalece a de nome mais curto (tende a ser a mais
        # "limpa", sem sufixos residuais que o PADROES_RUIDO não pegou).
        canonica = max(
            grupo,
            key=lambda nome: (
                len(limpas[nome]),
                -len(nome),
            )
        )

        tabelas_unificadas = []

        for nome in grupo:

            tabelas_unificadas.extend(
                limpas[nome]
            )

            # Garante que cada configuração de tabela carregue
            # a categoria já normalizada/canônica.
            for configuracao in limpas[nome]:
                configuracao["categoria"] = canonica

        resultado[canonica] = tabelas_unificadas

        if len(grupo) > 1:

            relatorio_mesclagens.append(
                (canonica, grupo)
            )

    return resultado, relatorio_mesclagens


# =============================================================================
# 3. LOG
# =============================================================================

def agora():
    return datetime.now().strftime("%H:%M:%S")


def log_info(mensagem):
    print(f"[{agora()}] ℹ️ INFO  | {mensagem}")


def log_ok(mensagem):
    print(f"[{agora()}] ✅ OK    | {mensagem}")


def log_aviso(mensagem):
    print(f"[{agora()}] ⚠️ AVISO | {mensagem}")


def log_erro(mensagem):
    print(f"[{agora()}] ❌ ERRO  | {mensagem}")


def separador():
    print(
        f"[{agora()}] ℹ️ INFO  | "
        + "=" * 78
    )


def titulo(texto):
    separador()
    log_info(texto)
    separador()


# =============================================================================
# 4. CONEXÃO MYSQL
# =============================================================================

def conectar_mysql():

    for tentativa in range(
        1,
        MAX_TENTATIVAS_CONEXAO + 1
    ):

        try:

            log_info(
                f"Conectando ao MySQL "
                f"(tentativa {tentativa}/{MAX_TENTATIVAS_CONEXAO})..."
            )

            conexao = mysql.connector.connect(
                **DB_CONFIG
            )

            if conexao.is_connected():

                log_ok(
                    f"MySQL conectado: "
                    f"{DB_CONFIG['host']}:{DB_CONFIG['port']}"
                )

                return conexao

        except Error as erro:

            log_aviso(
                f"Falha ao conectar ao MySQL: {erro}"
            )

            if tentativa < MAX_TENTATIVAS_CONEXAO:

                time.sleep(
                    INTERVALO_RECONEXAO
                )

    raise RuntimeError(
        "Não foi possível conectar ao MySQL."
    )


def garantir_conexao(conexao):

    try:

        if (
            conexao is not None
            and conexao.is_connected()
        ):

            conexao.ping(
                reconnect=True,
                attempts=3,
                delay=2
            )

            return conexao

    except Exception:
        pass

    log_aviso(
        "Conexão MySQL perdida. Reconectando..."
    )

    try:

        if conexao is not None:
            conexao.close()

    except Exception:
        pass

    return conectar_mysql()


# =============================================================================
# 5. IDENTIFICAÇÃO DAS TABELAS DE ORIGEM
# =============================================================================

"""
Aceita:

CATEGORIA_CSV_2015
CATEGORIA_XLS_2015
CATEGORIA_XLSX_2015

CATEGORIA_CSV_2015_T1
CATEGORIA_XLS_2015_T2
CATEGORIA_XLSX_2015_T3

CATEGORIA_2015

CATEGORIA_2015_T1

Importante:
a categoria pode conter números, letras e vários segmentos.
"""

PADRAO_TABELA_COM_FORMATO = re.compile(
    r"^(.+?)_(CSV|XLSX|XLS)_(20\d{2})(?:_T([1-4]))?$",
    re.IGNORECASE
)


PADRAO_TABELA_SEM_FORMATO = re.compile(
    r"^(.+?)_(20\d{2})(?:_T([1-4]))?$",
    re.IGNORECASE
)


def identificar_tabela_origem(nome):

    match = PADRAO_TABELA_COM_FORMATO.match(
        nome
    )

    if match:

        categoria = match.group(1).upper()

        formato = match.group(2).upper()

        ano = int(
            match.group(3)
        )

        trimestre = (
            int(match.group(4))
            if match.group(4)
            else None
        )

        return {
            "categoria": categoria,
            "tabela": nome,
            "ano": ano,
            "trimestre": trimestre,
            "formato": formato,
        }

    match = PADRAO_TABELA_SEM_FORMATO.match(
        nome
    )

    if match:

        categoria = match.group(1).upper()

        ano = int(
            match.group(2)
        )

        trimestre = (
            int(match.group(3))
            if match.group(3)
            else None
        )

        return {
            "categoria": categoria,
            "tabela": nome,
            "ano": ano,
            "trimestre": trimestre,
            "formato": None,
        }

    return None


# =============================================================================
# 6. DESCOBRIR TODAS AS CATEGORIAS
# =============================================================================

def descobrir_todas_categorias(conexao):

    cursor = conexao.cursor()

    try:

        cursor.execute(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = %s
            ORDER BY table_name
            """,
            (
                DB_CONFIG["database"],
            )
        )

        nomes = [
            linha[0]
            for linha in cursor.fetchall()
        ]

    finally:

        cursor.close()

    categorias = {}

    ignoradas = []

    for nome in nomes:

        configuracao = identificar_tabela_origem(
            nome
        )

        if configuracao is None:

            ignoradas.append(nome)

            continue

        categoria = configuracao["categoria"]

        categorias.setdefault(
            categoria,
            []
        ).append(
            configuracao
        )

    # -------------------------------------------------------------------
    # NORMALIZA E MESCLA AUTOMATICAMENTE categorias com nomes similares
    # (typos, plural/singular, sufixos de sheet/cópia/backup).
    # -------------------------------------------------------------------

    categorias, mesclagens = agrupar_categorias_similares(
        categorias
    )

    if mesclagens:

        titulo(
            "CATEGORIAS MESCLADAS AUTOMATICAMENTE "
            "(confira se está correto):"
        )

        for canonica, variantes in mesclagens:

            outras = [
                v for v in variantes
                if v != canonica
            ]

            log_aviso(
                f"'{canonica}' <- mesclou com: "
                + ", ".join(outras)
            )

        log_info(
            "Se alguma mesclagem acima estiver errada, adicione "
            "o(s) nome(s) em CATEGORIAS_NAO_MESCLAR e rode novamente."
        )

        separador()

    for lista in categorias.values():

        lista.sort(
            key=lambda item: (
                item["ano"],
                (
                    item["trimestre"]
                    if item["trimestre"] is not None
                    else 0
                ),
                (
                    FORMATOS_ORIGEM.index(
                        item["formato"]
                    )
                    if item["formato"] in FORMATOS_ORIGEM
                    else 999
                ),
            )
        )

    return categorias, ignoradas


# =============================================================================
# 7. NOME DA TABELA ACUMULADA
# =============================================================================

def nome_tabela_acumulada_padrao(categoria):

    return (
        f"tb_{categoria.lower()}_acumulado"
    )


def obter_nome_tabela_acumulada(categoria):

    nome = NOMES_AMIGAVEIS.get(
        categoria.upper(),
        nome_tabela_acumulada_padrao(
            categoria
        )
    )

    if len(nome) <= LIMITE_NOME_TABELA_MYSQL:

        return nome

    log_aviso(
        f"O nome '{nome}' possui mais de "
        f"{LIMITE_NOME_TABELA_MYSQL} caracteres. "
        f"Será truncado."
    )

    return nome[
        :LIMITE_NOME_TABELA_MYSQL
    ]


# =============================================================================
# 8. MOSTRAR CATEGORIAS ENCONTRADAS
# =============================================================================

def mostrar_categorias_encontradas(
    categorias,
    ignoradas
):

    titulo(
        "CATEGORIAS ENCONTRADAS NO BANCO:"
    )

    if not categorias:

        log_aviso(
            "Nenhuma tabela seguindo os padrões "
            "CATEGORIA_FORMATO_ANO ou "
            "CATEGORIA_ANO foi encontrada."
        )

    else:

        for numero, categoria in enumerate(
            sorted(categorias),
            start=1
        ):

            quantidade_tabelas = len(
                categorias[categoria]
            )

            anos = sorted({
                item["ano"]
                for item in categorias[categoria]
            })

            nome_destino = (
                obter_nome_tabela_acumulada(
                    categoria
                )
            )

            tem_nome_amigavel = (
                categoria in NOMES_AMIGAVEIS
            )

            marcador = (
                "✅"
                if tem_nome_amigavel
                else "⚠️"
            )

            log_info(
                f"{numero}. {categoria} "
                f"({quantidade_tabelas} tabela(s), "
                f"anos {min(anos)}-{max(anos)}) "
                f"-> destino: {nome_destino} "
                f"{marcador}"
            )

        categorias_sem_nome_amigavel = [
            categoria
            for categoria in categorias
            if categoria not in NOMES_AMIGAVEIS
        ]

        if categorias_sem_nome_amigavel:

            log_aviso(
                "Categorias sem nome amigável configurado "
                "em NOMES_AMIGAVEIS "
                "(usando nome automático): "
                + ", ".join(
                    sorted(
                        categorias_sem_nome_amigavel
                    )
                )
            )

    if ignoradas:

        log_info(
            f"{len(ignoradas)} tabela(s) do schema "
            f"não seguem nenhum dos padrões esperados "
            f"e foram ignoradas."
        )

    separador()


# =============================================================================
# 9. ESCOLHER TABELAS PARA PROCESSAR
# =============================================================================

def escolher_tabelas_para_processar(
    tabelas
):

    grupos = {}

    for item in tabelas:

        grupos.setdefault(
            item["ano"],
            []
        ).append(item)

    escolhidas = []

    for ano in sorted(grupos):

        opcoes = grupos[ano]

        # ---------------------------------------------------------------
        # PRIMEIRO: se houver formato, escolhe o formato preferido.
        # Tabelas sem formato continuam sendo consideradas.
        # ---------------------------------------------------------------

        formatos_presentes = {
            item["formato"]
            for item in opcoes
            if item["formato"] is not None
        }

        formato_escolhido = None

        if formatos_presentes:

            for formato_preferido in FORMATOS_ORIGEM:

                if formato_preferido in formatos_presentes:

                    formato_escolhido = (
                        formato_preferido
                    )

                    break

            if formato_escolhido:

                opcoes_com_formato = [
                    item
                    for item in opcoes
                    if item["formato"]
                    == formato_escolhido
                ]

                log_info(
                    f"Ano {ano}: formatos encontrados "
                    f"({', '.join(sorted(formatos_presentes))}). "
                    f"Prioridade: '{formato_escolhido}'."
                )

                opcoes = opcoes_com_formato

        # ---------------------------------------------------------------
        # SEGUNDO: prioriza tabela anual sem trimestre.
        # ---------------------------------------------------------------

        anual = next(
            (
                item
                for item in opcoes
                if item["trimestre"] is None
            ),
            None
        )

        if anual is not None:

            escolhidas.append(
                anual
            )

            log_info(
                f"Ano {ano}: usando "
                f"'{anual['tabela']}' "
                f"como tabela anual."
            )

            continue

        # ---------------------------------------------------------------
        # TERCEIRO: se não existe anual, usa maior trimestre.
        # ---------------------------------------------------------------

        com_trimestre = [
            item
            for item in opcoes
            if item["trimestre"] is not None
        ]

        if not com_trimestre:

            log_aviso(
                f"Ano {ano}: nenhuma tabela válida encontrada."
            )

            continue

        escolhida = max(
            com_trimestre,
            key=lambda item: item["trimestre"]
        )

        escolhidas.append(
            escolhida
        )

        log_info(
            f"Ano {ano}: não existe tabela anual. "
            f"Usando '{escolhida['tabela']}' "
            f"(T{escolhida['trimestre']})."
        )

    return escolhidas


# =============================================================================
# 10. NORMALIZAÇÃO DE TEXTO
# =============================================================================

def valor_limpo(valor):

    if valor is None:

        return None

    if isinstance(valor, str):

        valor = re.sub(
            r"\s+",
            " ",
            valor.strip()
        )

        if not valor:

            return None

        return valor

    return valor


# =============================================================================
# 11. NORMALIZAÇÃO DE DATA
# =============================================================================

def normalizar_data(valor):

    if valor is None:

        return None

    if isinstance(
        valor,
        datetime
    ):

        return valor.strftime(
            "%Y-%m-%d"
        )

    if isinstance(
        valor,
        date
    ):

        return valor.strftime(
            "%Y-%m-%d"
        )

    texto = str(valor).strip()

    if not texto:

        return None

    formatos = [

        "%Y-%m-%d",

        "%d/%m/%Y",

        "%d-%m-%Y",

        "%Y/%m/%d",

        "%Y-%m-%d %H:%M:%S",

        "%d/%m/%Y %H:%M:%S",

        "%Y-%m-%d %H:%M:%S.%f",

    ]

    for formato in formatos:

        try:

            data = datetime.strptime(
                texto,
                formato
            )

            return data.strftime(
                "%Y-%m-%d"
            )

        except ValueError:

            continue

    return None


# =============================================================================
# 12. VERIFICAR TABELA
# =============================================================================

def tabela_existe(
    cursor,
    tabela
):

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = %s
          AND table_name = %s
        """,
        (
            DB_CONFIG["database"],
            tabela,
        )
    )

    resultado = cursor.fetchone()

    return resultado[0] > 0


# =============================================================================
# 13. BUSCAR COLUNAS
# =============================================================================

def buscar_colunas(
    cursor,
    tabela
):

    cursor.execute(
        """
        SELECT COLUMN_NAME
        FROM information_schema.columns
        WHERE table_schema = %s
          AND table_name = %s
        ORDER BY ORDINAL_POSITION
        """,
        (
            DB_CONFIG["database"],
            tabela,
        )
    )

    return [
        linha[0]
        for linha in cursor.fetchall()
    ]


# =============================================================================
# 14. ENCONTRAR COLUNA
# =============================================================================

def encontrar_coluna(
    colunas,
    possibilidades
):

    mapa = {
        coluna.lower(): coluna
        for coluna in colunas
    }

    for possibilidade in possibilidades:

        encontrada = mapa.get(
            possibilidade.lower()
        )

        if encontrada:

            return encontrada

    return None


# =============================================================================
# 15. MAPEAMENTO AUTOMÁTICO
# =============================================================================

def descobrir_mapeamento(
    colunas
):

    return {

        "razao_social": encontrar_coluna(
            colunas,
            [
                "razao_social",
                "razao social",
                "razaoSocial",
            ]
        ),

        "nome_fantasia": encontrar_coluna(
            colunas,
            [
                "nome_fantasia",
                "nome fantasia",
                "nomeFantasia",
            ]
        ),

        "cnpj": encontrar_coluna(
            colunas,
            [
                "cnpj",
                "CNPJ",
            ]
        ),

        "porte": encontrar_coluna(
            colunas,
            [
                "porte",
                "porte_empresa",
            ]
        ),

        "situacao": encontrar_coluna(
            colunas,
            [
                "situacao",
                "situação",
                "situacao_atividade",
                "situacao_cadastral",
            ]
        ),

        "segmento": encontrar_coluna(
            colunas,
            [
                "segmento",
                "segmentos_turisticos",
                "segmentos",
                "atividade",
                "atividade_turistica",
            ]
        ),

        "uf": encontrar_coluna(
            colunas,
            [
                "uf",
                "estado",
                "sigla_uf",
            ]
        ),

        "municipio": encontrar_coluna(
            colunas,
            [
                "municipio",
                "município",
                "localidade",
                "cidade",
            ]
        ),

        "data_inicio_operacao": encontrar_coluna(
            colunas,
            [
                "data_inicio_operacao",
                "data_abertura",
                "data_inicio",
                "data_inicio_atividade",
            ]
        ),
    }


# =============================================================================
# 16. PEGAR VALOR
# =============================================================================

def pegar_valor(
    linha,
    coluna
):

    if not coluna:

        return None

    return linha.get(
        coluna
    )


# =============================================================================
# 17. CRIAR TABELA ACUMULADA
# =============================================================================

def criar_tabela_acumulada(
    cursor,
    nome_tabela
):

    sql = f"""
        CREATE TABLE IF NOT EXISTS
        `{nome_tabela}` (

            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

            `ano` SMALLINT NOT NULL,

            `origem_tabela` VARCHAR(500) NULL,

            `razao_social` TEXT NULL,

            `nome_fantasia` TEXT NULL,

            `cnpj` VARCHAR(500) NULL,

            `porte` VARCHAR(500) NULL,

            `situacao` VARCHAR(500) NULL,

            `segmento` TEXT NULL,

            `uf` VARCHAR(100) NULL,

            `municipio` VARCHAR(500) NULL,

            `data_inicio_operacao` DATE NULL,

            `created_at`
                TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

            PRIMARY KEY (`id`),

            INDEX `idx_ano` (`ano`),

            INDEX `idx_cnpj` (`cnpj`),

            INDEX `idx_uf` (`uf`),

            INDEX `idx_municipio` (`municipio`)

        )
        ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
    """

    cursor.execute(
        sql
    )

    # -----------------------------------------------------------------
    # CORRIGE TABELAS JÁ EXISTENTES
    # -----------------------------------------------------------------

    cursor.execute(
        """
        SELECT CHARACTER_MAXIMUM_LENGTH
        FROM information_schema.columns
        WHERE table_schema = %s
          AND table_name = %s
          AND column_name = 'cnpj'
        """,
        (
            DB_CONFIG["database"],
            nome_tabela,
        )
    )

    resultado = cursor.fetchone()

    if (
        resultado
        and resultado[0] is not None
        and resultado[0] < 255
    ):

        log_aviso(
            f"Tabela '{nome_tabela}': "
            f"coluna cnpj possui apenas "
            f"{resultado[0]} caracteres. "
            f"Alterando para VARCHAR(255)..."
        )

        cursor.execute(
            f"""
            ALTER TABLE `{nome_tabela}`
            MODIFY COLUMN `cnpj`
            VARCHAR(255) NULL
            """
        )

        log_ok(
            f"Tabela '{nome_tabela}': "
            f"coluna cnpj alterada para VARCHAR(255)."
        )


# =============================================================================
# 18. LIMPAR TABELA
# =============================================================================

def limpar_tabela_acumulada(
    conexao,
    nome_tabela
):

    cursor = conexao.cursor()

    try:

        if not tabela_existe(
            cursor,
            nome_tabela
        ):

            log_info(
                f"Tabela '{nome_tabela}' "
                f"ainda não existe. Nada para limpar."
            )

            return

        cursor.execute(
            f"TRUNCATE TABLE `{nome_tabela}`"
        )

        conexao.commit()

        log_info(
            f"Tabela '{nome_tabela}' limpa."
        )

    except Error as erro:

        try:
            conexao.rollback()
        except Exception:
            pass

        raise RuntimeError(
            f"Não foi possível limpar "
            f"'{nome_tabela}': {erro}"
        )

    finally:

        cursor.close()


# =============================================================================
# 19. BUSCAR LINHAS
# =============================================================================

def buscar_linhas(
    conexao,
    tabela
):

    cursor = conexao.cursor(
        dictionary=True,
        buffered=True
    )

    try:

        cursor.execute(
            f"SELECT * FROM `{tabela}`"
        )

        while True:

            linhas = cursor.fetchmany(
                BATCH_SIZE
            )

            if not linhas:

                break

            yield linhas

    finally:

        cursor.close()


# =============================================================================
# 20. INSERIR LOTE
# =============================================================================

def inserir_lote(
    conexao,
    nome_tabela_destino,
    registros
):

    if not registros:

        return 0

    sql = f"""
        INSERT INTO `{nome_tabela_destino}` (

            `ano`,
            `origem_tabela`,
            `razao_social`,
            `nome_fantasia`,
            `cnpj`,
            `porte`,
            `situacao`,
            `segmento`,
            `uf`,
            `municipio`,
            `data_inicio_operacao`

        )
        VALUES (
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s
        )
    """

    valores = []

    for registro in registros:

        cnpj = registro.get(
            "cnpj"
        )

        if cnpj is not None:

            cnpj = str(
                cnpj
            ).strip()

            if not cnpj:

                cnpj = None

        valores.append(
            (
                registro["ano"],
                registro["origem_tabela"],
                registro["razao_social"],
                registro["nome_fantasia"],
                cnpj,
                registro["porte"],
                registro["situacao"],
                registro["segmento"],
                registro["uf"],
                registro["municipio"],
                registro["data_inicio_operacao"],
            )
        )

    for tentativa in range(
        1,
        MAX_TENTATIVAS_CONEXAO + 1
    ):

        cursor = None

        try:

            conexao = garantir_conexao(
                conexao
            )

            cursor = conexao.cursor()

            cursor.executemany(
                sql,
                valores
            )

            conexao.commit()

            return len(
                valores
            )

        except Error as erro:

            try:

                conexao.rollback()

            except Exception:

                pass

            log_aviso(
                f"Erro inserindo lote na tabela "
                f"'{nome_tabela_destino}' "
                f"(tentativa "
                f"{tentativa}/"
                f"{MAX_TENTATIVAS_CONEXAO}): "
                f"{erro}"
            )

            # ---------------------------------------------------------
            # ÚLTIMA TENTATIVA:
            # INSERE INDIVIDUALMENTE
            # ---------------------------------------------------------

            if tentativa >= MAX_TENTATIVAS_CONEXAO:

                log_aviso(
                    f"Lote com {len(valores)} registros "
                    f"apresentou erro. "
                    f"Tentando inserção individual."
                )

                inseridos = 0

                for indice, valor in enumerate(
                    valores,
                    start=1
                ):

                    cursor_individual = None

                    try:

                        conexao = garantir_conexao(
                            conexao
                        )

                        cursor_individual = (
                            conexao.cursor()
                        )

                        # IMPORTANTE:
                        # aqui é valor, e NÃO (valor,)

                        cursor_individual.execute(
                            sql,
                            valor
                        )

                        conexao.commit()

                        inseridos += 1

                    except Error as erro_individual:

                        try:

                            conexao.rollback()

                        except Exception:

                            pass

                        cnpj_problematico = (
                            valor[4]
                        )

                        log_erro(
                            f"Registro rejeitado "
                            f"na posição {indice} "
                            f"do lote: "
                            f"CNPJ="
                            f"{repr(cnpj_problematico)} "
                            f"| erro="
                            f"{erro_individual}"
                        )

                    finally:

                        if cursor_individual is not None:

                            try:

                                cursor_individual.close()

                            except Exception:

                                pass

                log_aviso(
                    f"Lote processado individualmente: "
                    f"{inseridos}/{len(valores)} "
                    f"registros inseridos."
                )

                return inseridos

            try:

                if conexao:

                    conexao.close()

            except Exception:

                pass

            time.sleep(
                INTERVALO_RECONEXAO
            )

            conexao = conectar_mysql()

        finally:

            if cursor is not None:

                try:

                    cursor.close()

                except Exception:

                    pass

    return 0


# =============================================================================
# 21. PROCESSAR TABELA DE ORIGEM
# =============================================================================

def processar_tabela(
    conexao,
    configuracao,
    nome_tabela_destino
):

    tabela_origem = (
        configuracao["tabela"]
    )

    ano = configuracao["ano"]

    log_info(
        f"Processando '{tabela_origem}' "
        f"(ano={ano})..."
    )

    cursor = conexao.cursor()

    try:

        colunas = buscar_colunas(
            cursor,
            tabela_origem
        )

    finally:

        cursor.close()

    if not colunas:

        raise RuntimeError(
            f"A tabela '{tabela_origem}' "
            f"não possui colunas."
        )

    log_info(
        f"'{tabela_origem}': "
        f"{len(colunas)} coluna(s) encontrada(s)."
    )

    mapeamento = descobrir_mapeamento(
        colunas
    )

    # Rótulo amigável para cada campo do mapeamento, usado tanto no
    # log linha-a-linha quanto no relatório final de mapeamentos
    # faltantes.
    ROTULOS_CAMPOS = {
        "razao_social": "razão social",
        "nome_fantasia": "nome fantasia",
        "cnpj": "CNPJ",
        "porte": "porte",
        "situacao": "situação",
        "segmento": "segmento",
        "uf": "UF",
        "municipio": "município",
        "data_inicio_operacao": "data início operação",
    }

    campos_nao_encontrados = []

    for campo, rotulo in ROTULOS_CAMPOS.items():

        valor = mapeamento.get(campo)

        log_info(
            f"Mapeamento de {rotulo}: "
            f"{valor or 'NÃO ENCONTRADO'}"
        )

        if not valor:

            campos_nao_encontrados.append(
                rotulo
            )

    if campos_nao_encontrados:

        log_aviso(
            f"'{tabela_origem}': campo(s) sem mapeamento "
            f"(gravados como NULL): "
            + ", ".join(campos_nao_encontrados)
        )

    total_linhas = 0

    total_inseridas = 0

    lote = []

    for linhas in buscar_linhas(
        conexao,
        tabela_origem
    ):

        for linha in linhas:

            total_linhas += 1

            try:

                registro = {

                    "ano": ano,

                    "origem_tabela":
                        tabela_origem,

                    "razao_social":
                        valor_limpo(
                            pegar_valor(
                                linha,
                                mapeamento[
                                    "razao_social"
                                ]
                            )
                        ),

                    "nome_fantasia":
                        valor_limpo(
                            pegar_valor(
                                linha,
                                mapeamento[
                                    "nome_fantasia"
                                ]
                            )
                        ),

                    "cnpj":
                        valor_limpo(
                            pegar_valor(
                                linha,
                                mapeamento[
                                    "cnpj"
                                ]
                            )
                        ),

                    "porte":
                        valor_limpo(
                            pegar_valor(
                                linha,
                                mapeamento[
                                    "porte"
                                ]
                            )
                        ),

                    "situacao":
                        valor_limpo(
                            pegar_valor(
                                linha,
                                mapeamento[
                                    "situacao"
                                ]
                            )
                        ),

                    "segmento":
                        valor_limpo(
                            pegar_valor(
                                linha,
                                mapeamento[
                                    "segmento"
                                ]
                            )
                        ),

                    "uf":
                        valor_limpo(
                            pegar_valor(
                                linha,
                                mapeamento[
                                    "uf"
                                ]
                            )
                        ),

                    "municipio":
                        valor_limpo(
                            pegar_valor(
                                linha,
                                mapeamento[
                                    "municipio"
                                ]
                            )
                        ),

                    "data_inicio_operacao":
                        normalizar_data(
                            pegar_valor(
                                linha,
                                mapeamento[
                                    "data_inicio_operacao"
                                ]
                            )
                        ),
                }

                lote.append(
                    registro
                )

                if len(lote) >= BATCH_SIZE:

                    quantidade = inserir_lote(
                        conexao,
                        nome_tabela_destino,
                        lote
                    )

                    total_inseridas += (
                        quantidade
                    )

                    lote = []

            except Exception as erro:

                log_erro(
                    f"Erro na linha "
                    f"{total_linhas} da tabela "
                    f"'{tabela_origem}': "
                    f"{erro}"
                )

    if lote:

        quantidade = inserir_lote(
            conexao,
            nome_tabela_destino,
            lote
        )

        total_inseridas += quantidade

    log_ok(
        f"'{tabela_origem}' concluído: "
        f"{total_linhas} linha(s) lida(s), "
        f"{total_inseridas} inserida(s)."
    )

    return {

        "tabela":
            tabela_origem,

        "ano":
            ano,

        "linhas":
            total_linhas,

        "inseridas":
            total_inseridas,

        "campos_nao_encontrados":
            campos_nao_encontrados,

    }


# =============================================================================
# 22. RESUMO DA CATEGORIA
# =============================================================================

def mostrar_resumo_categoria(
    conexao,
    nome_tabela
):

    conexao = garantir_conexao(
        conexao
    )

    cursor = conexao.cursor()

    try:

        cursor.execute(
            f"""
            SELECT COUNT(*)
            FROM `{nome_tabela}`
            """
        )

        total = cursor.fetchone()[0]

        log_ok(
            f"{nome_tabela} -> "
            f"{total} registro(s) no total"
        )

        cursor.execute(
            f"""
            SELECT
                ano,
                COUNT(*)
            FROM `{nome_tabela}`
            GROUP BY ano
            ORDER BY ano
            """
        )

        resultados = cursor.fetchall()

        for ano, quantidade in resultados:

            log_info(
                f"   Ano {ano}: "
                f"{quantidade} registro(s)"
            )

    except Error as erro:

        log_aviso(
            f"Erro ao gerar resumo "
            f"de '{nome_tabela}': {erro}"
        )

    finally:

        cursor.close()


# =============================================================================
# 23. PROCESSAR CATEGORIA
# =============================================================================

def processar_categoria(
    conexao,
    categoria,
    tabelas_categoria
):

    nome_tabela_destino = (
        obter_nome_tabela_acumulada(
            categoria
        )
    )

    titulo(
        f"CATEGORIA: {categoria}  "
        f"->  DESTINO: {nome_tabela_destino}"
    )

    tabelas_processar = (
        escolher_tabelas_para_processar(
            tabelas_categoria
        )
    )

    if not tabelas_processar:

        raise RuntimeError(
            f"Nenhuma tabela de origem válida "
            f"para a categoria '{categoria}'."
        )

    log_info(
        "TABELAS QUE SERÃO PROCESSADAS "
        "NESTA CATEGORIA:"
    )

    for numero, item in enumerate(
        tabelas_processar,
        start=1
    ):

        trimestre = item["trimestre"]

        formato = item["formato"]

        detalhes = f"ano={item['ano']}"

        if formato:

            detalhes += (
                f", formato={formato}"
            )

        if trimestre:

            detalhes += (
                f", T{trimestre}"
            )

        log_ok(
            f"   {numero}. "
            f"{item['tabela']} "
            f"({detalhes})"
        )

    # -----------------------------------------------------------------
    # CRIAR / CORRIGIR TABELA
    # -----------------------------------------------------------------

    conexao = garantir_conexao(
        conexao
    )

    cursor = conexao.cursor()

    try:

        criar_tabela_acumulada(
            cursor,
            nome_tabela_destino
        )

        conexao.commit()

        log_ok(
            f"Tabela '{nome_tabela_destino}' "
            f"garantida."
        )

    except Exception:

        try:

            conexao.rollback()

        except Exception:

            pass

        raise

    finally:

        cursor.close()

    # -----------------------------------------------------------------
    # LIMPAR
    # -----------------------------------------------------------------

    if LIMPAR_TABELA_ANTES:

        conexao = garantir_conexao(
            conexao
        )

        limpar_tabela_acumulada(
            conexao,
            nome_tabela_destino
        )

    resultados_ok = []

    resultados_erro = []

    mapeamentos_incompletos = []

    total_categoria = 0

    # -----------------------------------------------------------------
    # PROCESSAR CADA TABELA
    # -----------------------------------------------------------------

    for numero, configuracao in enumerate(
        tabelas_processar,
        start=1
    ):

        log_info(
            f"[{numero}/"
            f"{len(tabelas_processar)}] "
            f"{categoria}: "
            f"processando "
            f"{configuracao['tabela']}"
        )

        try:

            conexao = garantir_conexao(
                conexao
            )

            resultado = processar_tabela(
                conexao,
                configuracao,
                nome_tabela_destino
            )

            resultados_ok.append(
                resultado
            )

            total_categoria += (
                resultado["inseridas"]
            )

            if resultado.get("campos_nao_encontrados"):

                mapeamentos_incompletos.append(
                    {
                        "tabela":
                            resultado["tabela"],

                        "ano":
                            resultado["ano"],

                        "campos":
                            resultado["campos_nao_encontrados"],
                    }
                )

        except Exception as erro:

            resultados_erro.append(
                {
                    "tabela":
                        configuracao["tabela"],

                    "ano":
                        configuracao["ano"],

                    "erro":
                        str(erro),
                }
            )

            log_erro(
                f"[{configuracao['tabela']}] "
                f"ERRO: {erro}"
            )

            try:

                conexao = garantir_conexao(
                    conexao
                )

            except Exception:

                try:

                    conexao = conectar_mysql()

                except Exception as erro_conexao:

                    log_erro(
                        f"Não foi possível "
                        f"recuperar a conexão: "
                        f"{erro_conexao}"
                    )

    # -----------------------------------------------------------------
    # RESUMO
    # -----------------------------------------------------------------

    try:

        conexao = garantir_conexao(
            conexao
        )

        mostrar_resumo_categoria(
            conexao,
            nome_tabela_destino
        )

    except Exception as erro:

        log_aviso(
            f"Não foi possível gerar "
            f"resumo da categoria "
            f"'{categoria}': {erro}"
        )

    return {

        "categoria":
            categoria,

        "tabela_destino":
            nome_tabela_destino,

        "total_inserido":
            total_categoria,

        "tabelas_ok":
            len(resultados_ok),

        "tabelas_erro":
            resultados_erro,

        "mapeamentos_incompletos":
            mapeamentos_incompletos,

    }


# =============================================================================
# 24. MAIN
# =============================================================================

def main():

    inicio = time.time()

    conexao = None

    resumo_categorias = []

    try:

        titulo(
            "ETL CADASTUR - "
            "MULTI-CATEGORIA "
            "(TABELA ACUMULADA POR CATEGORIA)"
        )

        log_info(
            f"Banco: "
            f"{DB_CONFIG['database']}"
        )

        log_info(
            f"Servidor: "
            f"{DB_CONFIG['host']}:"
            f"{DB_CONFIG['port']}"
        )

        log_info(
            "Formatos considerados: "
            + ", ".join(
                FORMATOS_ORIGEM
            )
        )

        log_info(
            f"Tabelas sem formato "
            f"(somente ano): ACEITAS"
        )

        log_info(
            f"Tabelas trimestrais: ACEITAS"
        )

        log_info(
            f"Batch: {BATCH_SIZE}"
        )

        log_info(
            f"Processar todas as categorias: "
            f"{PROCESSAR_TODAS_CATEGORIAS}"
        )

        log_info(
            "CNPJ destino: VARCHAR(255)"
        )

        log_info(
            f"Mesclagem automática de categorias similares: "
            f"ATIVA (limiar={LIMIAR_SIMILARIDADE})"
        )

        if not PROCESSAR_TODAS_CATEGORIAS:

            log_info(
                f"Filtro de categorias: "
                f"{CATEGORIAS_FILTRO}"
            )

        separador()

        # -------------------------------------------------------------
        # CONEXÃO
        # -------------------------------------------------------------

        conexao = conectar_mysql()

        # -------------------------------------------------------------
        # DESCOBRIR CATEGORIAS
        # -------------------------------------------------------------

        categorias, ignoradas = (
            descobrir_todas_categorias(
                conexao
            )
        )

        mostrar_categorias_encontradas(
            categorias,
            ignoradas
        )

        if not categorias:

            raise RuntimeError(
                "Nenhuma categoria nos padrões "
                "CATEGORIA_FORMATO_ANO ou "
                "CATEGORIA_ANO foi encontrada."
            )

        # -------------------------------------------------------------
        # DEFINIR CATEGORIAS
        # -------------------------------------------------------------

        if PROCESSAR_TODAS_CATEGORIAS:

            categorias_a_processar = sorted(
                categorias.keys()
            )

        else:

            filtros = {
                categoria.upper()
                for categoria
                in CATEGORIAS_FILTRO
            }

            categorias_a_processar = [
                categoria
                for categoria
                in sorted(categorias.keys())
                if categoria in filtros
            ]

            if not categorias_a_processar:

                raise RuntimeError(
                    "Nenhuma das categorias em "
                    "CATEGORIAS_FILTRO foi "
                    "encontrada no banco."
                )

        # -------------------------------------------------------------
        # PROCESSAR TODAS
        # -------------------------------------------------------------

        for categoria in categorias_a_processar:

            try:

                conexao = (
                    garantir_conexao(
                        conexao
                    )
                )

                resultado_categoria = (
                    processar_categoria(
                        conexao,
                        categoria,
                        categorias[categoria]
                    )
                )

                resumo_categorias.append(
                    resultado_categoria
                )

            except Exception as erro:

                log_erro(
                    f"Falha ao processar "
                    f"categoria "
                    f"'{categoria}': "
                    f"{erro}"
                )

                resumo_categorias.append(
                    {
                        "categoria":
                            categoria,

                        "tabela_destino":
                            obter_nome_tabela_acumulada(
                                categoria
                            ),

                        "total_inserido":
                            0,

                        "tabelas_ok":
                            0,

                        "tabelas_erro":
                            [
                                {
                                    "tabela": "-",
                                    "ano": "-",
                                    "erro": str(erro),
                                }
                            ],

                        "mapeamentos_incompletos":
                            [],
                    }
                )

        # -------------------------------------------------------------
        # RESUMO GERAL
        # -------------------------------------------------------------

        tempo = (
            time.time()
            - inicio
        )

        titulo(
            "RESUMO GERAL DE TODAS AS CATEGORIAS"
        )

        total_geral = 0

        for item in resumo_categorias:

            total_geral += (
                item["total_inserido"]
            )

            status = (
                "✅"
                if not item["tabelas_erro"]
                else "⚠️"
            )

            log_info(
                f"{status} "
                f"{item['categoria']} "
                f"-> "
                f"{item['tabela_destino']} "
                f"| "
                f"{item['total_inserido']} "
                f"registro(s) inserido(s) "
                f"| "
                f"{item['tabelas_ok']} "
                f"tabela(s) ok, "
                f"{len(item['tabelas_erro'])} "
                f"com erro"
            )

        separador()

        log_ok(
            f"Total geral inserido em "
            f"todas as categorias: "
            f"{total_geral}"
        )

        log_info(
            f"Tempo total: "
            f"{tempo:.2f} segundos"
        )

        # -------------------------------------------------------------
        # DETALHES DOS ERROS
        # -------------------------------------------------------------

        categorias_com_erro = [
            item
            for item
            in resumo_categorias
            if item["tabelas_erro"]
        ]

        if categorias_com_erro:

            separador()

            log_erro(
                "DETALHES DOS ERROS:"
            )

            separador()

            for item in categorias_com_erro:

                log_erro(
                    f"Categoria: "
                    f"{item['categoria']}"
                )

                for erro_item in (
                    item["tabelas_erro"]
                ):

                    log_erro(
                        f"   Tabela: "
                        f"{erro_item['tabela']} "
                        f"(ano="
                        f"{erro_item['ano']}) "
                        f"-> "
                        f"{erro_item['erro']}"
                    )

        # -------------------------------------------------------------
        # TABELAS COM MAPEAMENTO DE COLUNAS INCOMPLETO
        # -------------------------------------------------------------
        #
        # Mostrado junto do resumo final (mesmo em execuções sem
        # nenhum erro), para facilitar encontrar tabelas de origem
        # cuja coluna de município/UF/CNPJ/etc não foi reconhecida
        # automaticamente e por isso foi gravada como NULL.

        categorias_com_mapeamento_incompleto = [
            item
            for item
            in resumo_categorias
            if item.get("mapeamentos_incompletos")
        ]

        if categorias_com_mapeamento_incompleto:

            separador()

            log_aviso(
                "TABELAS COM MAPEAMENTO DE COLUNAS INCOMPLETO "
                "(campos abaixo foram gravados como NULL):"
            )

            separador()

            total_tabelas_com_pendencia = 0

            for item in categorias_com_mapeamento_incompleto:

                log_aviso(
                    f"Categoria: {item['categoria']} "
                    f"-> {item['tabela_destino']}"
                )

                for pendencia in item["mapeamentos_incompletos"]:

                    total_tabelas_com_pendencia += 1

                    log_aviso(
                        f"   Tabela: {pendencia['tabela']} "
                        f"(ano={pendencia['ano']}) "
                        f"-> campo(s) não encontrado(s): "
                        + ", ".join(pendencia["campos"])
                    )

            separador()

            log_aviso(
                f"Total de tabelas de origem com mapeamento "
                f"incompleto: {total_tabelas_com_pendencia}. "
                f"Ajuste as possibilidades de nome de coluna em "
                f"'descobrir_mapeamento' (seção 15) se algum desses "
                f"campos existir na tabela com um nome diferente "
                f"do esperado."
            )

        separador()

        log_ok(
            "ETL FINALIZADO."
        )

        separador()

    except KeyboardInterrupt:

        log_aviso(
            "Execução interrompida pelo usuário."
        )

        sys.exit(1)

    except Exception as erro:

        log_erro(
            f"Falha geral no ETL: {erro}"
        )

        sys.exit(1)

    finally:

        if conexao is not None:

            try:

                conexao.close()

                log_info(
                    "Conexão MySQL encerrada."
                )

            except Exception:

                pass


# =============================================================================
# 25. EXECUÇÃO
# =============================================================================

if __name__ == "__main__":

    main()