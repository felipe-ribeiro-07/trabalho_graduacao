#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
insert_dados.py

Importador de arquivos CSV / Excel para MySQL.

REGRAS:
1. Procura arquivos CSV, XLS, XLSX e XLSM dentro da pasta CADASTUR.
2. Procura também dentro das subpastas.
3. Detecta automaticamente ano e trimestre pelo nome do arquivo.
4. O trimestre mais recente vira o consolidado do ano.
5. CSVs com linhas quebradas/inconsistentes são normalizados.
6. Linhas vazias são ignoradas.
7. Campos ausentes recebem NULL.
8. Campos extras são preservados na última coluna.
9. O MySQL é reconectado automaticamente quando a conexão cai.
10. Arquivos com erro não interrompem os demais.
11. Ao final são mostrados todos os arquivos que deram erro.
"""

import os
import re
import sys
import csv
import time
import traceback
import unicodedata
from datetime import datetime

import pandas as pd
import mysql.connector
from mysql.connector import Error as MySQLError


# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

PASTA_ARQUIVOS = os.path.join(
    SCRIPT_DIR,
    "CADASTUR"
)


# ============================================================================
# MYSQL
# ============================================================================

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": int(os.environ.get("DB_PORT", "3306")),
    "user": os.environ.get("DB_USER", "root"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "database": os.environ.get("DB_NAME", "CADASTUR"),

    # Tempo máximo para estabelecer conexão
    "connection_timeout": 60,

    # Aumenta tolerância para arquivos grandes
    "autocommit": False,
}


# ============================================================================
# CONFIGURAÇÕES DE IMPORTAÇÃO
# ============================================================================

PADRAO_ANO = re.compile(r"(20\d{2})")

PADRAO_TRIMESTRE = re.compile(
    r"T([1-4])",
    re.IGNORECASE
)

PALAVRAS_IGNORAR_NO_NOME = {
    "cadastur"
}

EXTENSOES_CSV = (
    ".csv",
)

EXTENSOES_EXCEL = (
    ".xlsx",
    ".xls",
    ".xlsm",
)

GRAVAR_METADADOS_ORIGEM = True

ENCODINGS_CSV = (
    "utf-8",
    "utf-8-sig",
    "cp1252",
    "latin1",
)

SEPARADORES_CSV = (
    ";",
    ",",
    "\t",
)

TAMANHO_LOTE_INSERT = 100

MAX_TENTATIVAS_MYSQL = 5

SEGUNDOS_ENTRE_TENTATIVAS = 3


# ============================================================================
# LOG
# ============================================================================

def log(msg: str, nivel: str = "INFO") -> None:

    icones = {
        "INFO": "ℹ️ ",
        "OK": "✅",
        "ERRO": "❌",
        "AVISO": "⚠️ ",
    }

    icone = icones.get(nivel, "")

    agora = datetime.now().strftime("%H:%M:%S")

    print(
        f"[{agora}] {icone}{nivel:<5} | {msg}",
        flush=True
    )


# ============================================================================
# LIMPEZA DE NOMES
# ============================================================================

def sanitizar_nome_coluna(nome) -> str:

    nome = str(nome).strip()

    if nome == "":
        nome = "coluna_sem_nome"

    if nome.lower().startswith("unnamed"):
        nome = "coluna_sem_nome"

    nome = (
        unicodedata
        .normalize("NFKD", nome)
        .encode("ascii", "ignore")
        .decode("ascii")
    )

    nome = nome.lower()

    nome = re.sub(
        r"[^a-z0-9_]+",
        "_",
        nome
    )

    nome = re.sub(
        r"_+",
        "_",
        nome
    )

    nome = nome.strip("_")

    if not nome:
        nome = "coluna_sem_nome"

    if nome[0].isdigit():
        nome = f"col_{nome}"

    return nome[:64]


def deduplicar_colunas(colunas):

    vistos = {}

    resultado = []

    for coluna in colunas:

        if coluna not in vistos:

            vistos[coluna] = 0

            resultado.append(coluna)

        else:

            vistos[coluna] += 1

            novo_nome = (
                f"{coluna}_{vistos[coluna]}"
            )

            resultado.append(
                novo_nome[:64]
            )

    return resultado


# ============================================================================
# NOME DO ARQUIVO
# ============================================================================

def extrair_ano_trimestre(nome_arquivo: str):

    match_ano = PADRAO_ANO.search(
        nome_arquivo
    )

    match_trimestre = PADRAO_TRIMESTRE.search(
        nome_arquivo
    )

    ano = (
        match_ano.group(1)
        if match_ano
        else None
    )

    trimestre = (
        f"T{match_trimestre.group(1)}"
        if match_trimestre
        else None
    )

    return ano, trimestre


def extrair_nome_base(nome_arquivo: str):

    nome_sem_extensao = os.path.splitext(
        nome_arquivo
    )[0]

    tokens = re.split(
        r"[^a-zA-Z0-9]+",
        nome_sem_extensao
    )

    tokens_validos = []

    for token in tokens:

        if not token:
            continue

        if PADRAO_ANO.fullmatch(token):
            continue

        if PADRAO_TRIMESTRE.fullmatch(token):
            continue

        if token.lower() in PALAVRAS_IGNORAR_NO_NOME:
            continue

        tokens_validos.append(
            token.upper()
        )

    if tokens_validos:
        base = "_".join(tokens_validos)
    else:
        base = "DADOS"

    return base[:48]


# ============================================================================
# ANÁLISE DOS ARQUIVOS
# ============================================================================

def analisar_arquivos(arquivos):

    info_arquivos = []

    trimestres_por_grupo = {}

    for caminho in arquivos:

        nome_arquivo = os.path.basename(
            caminho
        )

        ano, trimestre = extrair_ano_trimestre(
            nome_arquivo
        )

        base = extrair_nome_base(
            nome_arquivo
        )

        info = {
            "caminho": caminho,
            "nome": nome_arquivo,
            "base": base,
            "ano": ano,
            "trimestre": trimestre,
        }

        info_arquivos.append(info)

        if trimestre is not None:

            chave = (
                base,
                ano
            )

            if chave not in trimestres_por_grupo:
                trimestres_por_grupo[chave] = set()

            trimestres_por_grupo[chave].add(
                int(trimestre[1])
            )

    melhores = {}

    for chave, numeros in trimestres_por_grupo.items():

        melhores[chave] = (
            f"T{max(numeros)}"
        )

    return (
        info_arquivos,
        melhores
    )


def nome_tabela(
    base,
    ano,
    trimestre,
    melhores
):

    if ano is None:
        ano = "ANO_DESCONHECIDO"

    melhor = melhores.get(
        (base, ano)
    )

    if (
        trimestre is None
        or trimestre == melhor
    ):
        return f"{base}_{ano}"[:64]

    return (
        f"{base}_{ano}_{trimestre}"
    )[:64]


# ============================================================================
# VALORES
# ============================================================================

def limpar_valor(valor):

    if valor is None:
        return None

    try:

        if pd.isna(valor):
            return None

    except (
        TypeError,
        ValueError
    ):
        pass

    if isinstance(valor, str):

        valor = valor.strip()

        if valor == "":
            return None

    return valor


# ============================================================================
# MYSQL - CONEXÃO
# ============================================================================

def conectar_mysql():

    ultimo_erro = None

    for tentativa in range(
        1,
        MAX_TENTATIVAS_MYSQL + 1
    ):

        try:

            log(
                f"Tentando conectar ao MySQL "
                f"(tentativa {tentativa}/{MAX_TENTATIVAS_MYSQL})...",
                "INFO"
            )

            conn = mysql.connector.connect(
                **DB_CONFIG
            )

            if conn.is_connected():

                log(
                    "Conexão com MySQL estabelecida.",
                    "OK"
                )

                return conn

        except Exception as erro:

            ultimo_erro = erro

            log(
                f"Falha na conexão MySQL: {erro}",
                "AVISO"
            )

            if tentativa < MAX_TENTATIVAS_MYSQL:

                time.sleep(
                    SEGUNDOS_ENTRE_TENTATIVAS
                )

    raise ultimo_erro


def garantir_conexao(conn):

    try:

        if conn is None:
            return conectar_mysql()

        if conn.is_connected():

            try:

                conn.ping(
                    reconnect=True,
                    attempts=3,
                    delay=2
                )

                return conn

            except Exception:
                pass

        log(
            "Conexão com o MySQL perdida. Reconectando...",
            "AVISO"
        )

    except Exception:
        pass

    return conectar_mysql()


# ============================================================================
# MYSQL - CRIAÇÃO DE TABELA
# ============================================================================

def criar_tabela(
    conn,
    tabela,
    colunas
):

    conn = garantir_conexao(conn)

    colunas_sql = []

    for coluna in colunas:

        colunas_sql.append(
            f"`{coluna}` LONGTEXT"
        )

    sql = (
        f"CREATE TABLE IF NOT EXISTS "
        f"`{tabela}` "
        f"({', '.join(colunas_sql)}) "
        f"ENGINE=InnoDB "
        f"DEFAULT CHARSET=utf8mb4"
    )

    for tentativa in range(
        1,
        MAX_TENTATIVAS_MYSQL + 1
    ):

        try:

            conn = garantir_conexao(
                conn
            )

            cursor = conn.cursor()

            cursor.execute(sql)

            conn.commit()

            cursor.close()

            return conn

        except Exception as erro:

            try:
                cursor.close()
            except Exception:
                pass

            if tentativa >= MAX_TENTATIVAS_MYSQL:
                raise erro

            log(
                f"Erro criando tabela "
                f"`{tabela}`: {erro}. "
                f"Tentando novamente...",
                "AVISO"
            )

            time.sleep(
                SEGUNDOS_ENTRE_TENTATIVAS
            )

            conn = conectar_mysql()

    return conn


# ============================================================================
# MYSQL - GARANTIR COLUNAS
# ============================================================================

def garantir_colunas_existentes(
    conn,
    tabela,
    colunas
):

    conn = garantir_conexao(conn)

    for tentativa in range(
        1,
        MAX_TENTATIVAS_MYSQL + 1
    ):

        cursor = None

        try:

            conn = garantir_conexao(
                conn
            )

            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = %s
                  AND TABLE_NAME = %s
                """,
                (
                    DB_CONFIG["database"],
                    tabela,
                )
            )

            existentes = {
                linha[0]
                for linha in cursor.fetchall()
            }

            for coluna in colunas:

                if coluna not in existentes:

                    cursor.execute(
                        f"ALTER TABLE `{tabela}` "
                        f"ADD COLUMN `{coluna}` LONGTEXT"
                    )

            conn.commit()

            cursor.close()

            return conn

        except Exception as erro:

            if cursor is not None:

                try:
                    cursor.close()
                except Exception:
                    pass

            if tentativa >= MAX_TENTATIVAS_MYSQL:
                raise erro

            log(
                f"Erro verificando colunas de "
                f"`{tabela}`: {erro}. "
                f"Reconectando...",
                "AVISO"
            )

            time.sleep(
                SEGUNDOS_ENTRE_TENTATIVAS
            )

            conn = conectar_mysql()

    return conn


# ============================================================================
# MYSQL - INSERT
# ============================================================================

def inserir_dataframe(
    conn,
    tabela,
    df
):

    if df.empty:
        return conn, 0

    colunas = list(
        df.columns
    )

    placeholders = ", ".join(
        ["%s"] * len(colunas)
    )

    colunas_sql = ", ".join(
        f"`{coluna}`"
        for coluna in colunas
    )

    sql = (
        f"INSERT INTO `{tabela}` "
        f"({colunas_sql}) "
        f"VALUES ({placeholders})"
    )

    linhas = []

    for linha in df.itertuples(
        index=False,
        name=None
    ):

        valores = tuple(
            limpar_valor(valor)
            for valor in linha
        )

        linhas.append(
            valores
        )

    if not linhas:
        return conn, 0

    total = 0

    for inicio in range(
        0,
        len(linhas),
        TAMANHO_LOTE_INSERT
    ):

        lote = linhas[
            inicio:
            inicio + TAMANHO_LOTE_INSERT
        ]

        sucesso = False

        for tentativa in range(
            1,
            MAX_TENTATIVAS_MYSQL + 1
        ):

            cursor = None

            try:

                conn = garantir_conexao(
                    conn
                )

                cursor = conn.cursor()

                cursor.executemany(
                    sql,
                    lote
                )

                conn.commit()

                cursor.close()

                total += len(lote)

                sucesso = True

                break

            except Exception as erro:

                try:

                    if cursor is not None:
                        cursor.close()

                except Exception:
                    pass

                try:
                    conn.rollback()
                except Exception:
                    pass

                log(
                    f"Erro no INSERT do lote "
                    f"{inicio + 1}-"
                    f"{inicio + len(lote)} "
                    f"da tabela `{tabela}`: "
                    f"{erro}",
                    "AVISO"
                )

                if tentativa < MAX_TENTATIVAS_MYSQL:

                    log(
                        f"Reconectando e tentando "
                        f"novamente "
                        f"({tentativa + 1}/"
                        f"{MAX_TENTATIVAS_MYSQL})...",
                        "AVISO"
                    )

                    time.sleep(
                        SEGUNDOS_ENTRE_TENTATIVAS
                    )

                    conn = conectar_mysql()

                else:

                    raise

        if not sucesso:

            raise RuntimeError(
                f"Não foi possível inserir "
                f"o lote da tabela `{tabela}`."
            )

    return conn, total


# ============================================================================
# CSV - DETECÇÃO DO SEPARADOR
# ============================================================================

def detectar_separador(caminho, encoding):

    amostra = ""

    with open(
        caminho,
        "r",
        encoding=encoding,
        errors="replace",
        newline=""
    ) as arquivo:

        for _ in range(50):

            linha = arquivo.readline()

            if not linha:
                break

            amostra += linha

    contagens = {
        ";": amostra.count(";"),
        ",": amostra.count(","),
        "\t": amostra.count("\t"),
    }

    separador = max(
        contagens,
        key=contagens.get
    )

    if contagens[separador] == 0:
        return ";"

    return separador


# ============================================================================
# CSV - LEITURA ROBUSTA
# ============================================================================

def ler_csv_bruto(
    caminho,
    encoding,
    separador
):

    linhas = []

    with open(
        caminho,
        "r",
        encoding=encoding,
        errors="replace",
        newline=""
    ) as arquivo:

        leitor = csv.reader(
            arquivo,
            delimiter=separador,
            quotechar='"',
            doublequote=True,
            skipinitialspace=False,
        )

        for numero_linha, campos in enumerate(
            leitor,
            start=1
        ):

            if not campos:
                continue

            # Remove linha completamente vazia
            if all(
                str(campo).strip() == ""
                for campo in campos
            ):
                continue

            linhas.append(
                (
                    numero_linha,
                    campos
                )
            )

    if not linhas:

        raise ValueError(
            "CSV vazio ou sem dados."
        )

    return linhas


def normalizar_linhas_csv(
    linhas,
    numero_colunas
):

    resultado = []

    problemas = []

    for numero_linha, campos in linhas:

        quantidade = len(
            campos
        )

        if quantidade == numero_colunas:

            resultado.append(
                campos
            )

            continue

        if quantidade < numero_colunas:

            faltantes = (
                numero_colunas - quantidade
            )

            campos = (
                campos
                + [""] * faltantes
            )

            resultado.append(
                campos
            )

            problemas.append(
                f"linha {numero_linha}: "
                f"{quantidade} campos "
                f"(preenchida com "
                f"{faltantes} NULL)"
            )

            continue

        # Mais campos do que o cabeçalho.
        #
        # Preservamos todos os dados juntando
        # os campos extras dentro do último
        # campo.
        extras = (
            quantidade
            - numero_colunas
        )

        inicio_ultimo_campo = (
            numero_colunas - 1
        )

        campos_corrigidos = (
            campos[:inicio_ultimo_campo]
            + [
                ";".join(
                    campos[inicio_ultimo_campo:]
                )
            ]
        )

        resultado.append(
            campos_corrigidos
        )

        problemas.append(
            f"linha {numero_linha}: "
            f"{quantidade} campos "
            f"(extras unidos na última coluna)"
        )

    return (
        resultado,
        problemas
    )


def ler_csv_com_fallback(
    caminho
):

    ultimo_erro = None

    for encoding in ENCODINGS_CSV:

        try:

            separador = detectar_separador(
                caminho,
                encoding
            )

            linhas = ler_csv_bruto(
                caminho,
                encoding,
                separador
            )

            if len(linhas) < 1:

                raise ValueError(
                    "CSV não possui cabeçalho."
                )

            cabecalho = linhas[0][1]

            if not cabecalho:

                raise ValueError(
                    "Cabeçalho do CSV vazio."
                )

            numero_colunas = len(
                cabecalho
            )

            dados = linhas[1:]

            dados_normalizados, problemas = (
                normalizar_linhas_csv(
                    dados,
                    numero_colunas
                )
            )

            if problemas:

                quantidade_mostrar = 20

                problemas_exibidos = (
                    problemas[
                        :quantidade_mostrar
                    ]
                )

                texto_problemas = (
                    ", ".join(
                        problemas_exibidos
                    )
                )

                if len(problemas) > quantidade_mostrar:

                    texto_problemas += (
                        f" ... e mais "
                        f"{len(problemas) - quantidade_mostrar}"
                        f" problema(s)"
                    )

                log(
                    f'CSV "{os.path.basename(caminho)}": '
                    f'{len(problemas)} linha(s) '
                    f'com quantidade diferente '
                    f'do cabeçalho. '
                    f'Corrigidas automaticamente. '
                    f'Detalhes: {texto_problemas}',
                    "AVISO"
                )

            df = pd.DataFrame(
                dados_normalizados,
                columns=cabecalho
            )

            return (
                df,
                encoding,
                separador
            )

        except Exception as erro:

            ultimo_erro = erro

            continue

    if ultimo_erro is not None:
        raise ultimo_erro

    raise ValueError(
        "Não foi possível ler o CSV."
    )


# ============================================================================
# PROCESSAR CSV
# ============================================================================

def processar_csv(
    conn,
    caminho,
    tabela
):

    (
        df,
        encoding,
        separador
    ) = ler_csv_com_fallback(
        caminho
    )

    colunas = deduplicar_colunas(
        [
            sanitizar_nome_coluna(
                coluna
            )
            for coluna in df.columns
        ]
    )

    df.columns = colunas

    if GRAVAR_METADADOS_ORIGEM:

        df["_arquivo_origem"] = (
            os.path.basename(caminho)
        )

        df["_planilha_origem"] = None

    log(
        f'CSV "{os.path.basename(caminho)}": '
        f'encoding={encoding}, '
        f"separador='{separador}', "
        f"colunas={df.shape[1]}, "
        f"linhas={len(df)}",
        "INFO"
    )

    conn = criar_tabela(
        conn,
        tabela,
        list(df.columns)
    )

    conn = garantir_colunas_existentes(
        conn,
        tabela,
        list(df.columns)
    )

    conn, total = inserir_dataframe(
        conn,
        tabela,
        df
    )

    return conn, total


# ============================================================================
# EXCEL
# ============================================================================

def processar_excel(
    conn,
    caminho,
    tabela
):

    xls = pd.ExcelFile(
        caminho
    )

    total_linhas = 0

    colunas_por_planilha = {}

    colunas_uniao = []

    # --------------------------------------------------------
    # PRIMEIRA PASSADA
    # Descobre todas as colunas
    # --------------------------------------------------------

    for sheet in xls.sheet_names:

        cabecalho = pd.read_excel(
            xls,
            sheet_name=sheet,
            nrows=0,
            dtype=str
        )

        colunas = deduplicar_colunas(
            [
                sanitizar_nome_coluna(
                    coluna
                )
                for coluna in cabecalho.columns
            ]
        )

        colunas_por_planilha[sheet] = (
            colunas
        )

        for coluna in colunas:

            if coluna not in colunas_uniao:

                colunas_uniao.append(
                    coluna
                )

    colunas_tabela = list(
        colunas_uniao
    )

    if GRAVAR_METADADOS_ORIGEM:

        colunas_tabela.extend(
            [
                "_arquivo_origem",
                "_planilha_origem",
            ]
        )

    conn = criar_tabela(
        conn,
        tabela,
        colunas_tabela
    )

    conn = garantir_colunas_existentes(
        conn,
        tabela,
        colunas_tabela
    )

    # --------------------------------------------------------
    # SEGUNDA PASSADA
    # Lê os dados
    # --------------------------------------------------------

    for sheet in xls.sheet_names:

        try:

            log(
                f'Processando planilha '
                f'"{sheet}" '
                f'do arquivo '
                f'"{os.path.basename(caminho)}"...',
                "INFO"
            )

            df = pd.read_excel(
                xls,
                sheet_name=sheet,
                dtype=str
            )

            df.columns = (
                colunas_por_planilha[
                    sheet
                ]
            )

            df = df.reindex(
                columns=colunas_uniao
            )

            if GRAVAR_METADADOS_ORIGEM:

                df["_arquivo_origem"] = (
                    os.path.basename(caminho)
                )

                df["_planilha_origem"] = (
                    sheet
                )

            conn, linhas = inserir_dataframe(
                conn,
                tabela,
                df
            )

            total_linhas += linhas

            log(
                f'Planilha "{sheet}" '
                f'de {os.path.basename(caminho)}: '
                f"{linhas} linha(s) inserida(s).",
                "OK"
            )

        except Exception as erro:

            log(
                f'Erro na planilha "{sheet}" '
                f'de {os.path.basename(caminho)}: '
                f"{erro}",
                "ERRO"
            )

            traceback.print_exc()

            # Continua para a próxima planilha
            continue

    return conn, total_linhas


# ============================================================================
# LISTAR ARQUIVOS
# ============================================================================

def listar_arquivos(pasta):

    extensoes = (
        EXTENSOES_CSV
        + EXTENSOES_EXCEL
    )

    for raiz, diretorios, arquivos in os.walk(
        pasta
    ):

        diretorios.sort()

        for nome in sorted(arquivos):

            if nome.startswith("~$"):
                continue

            if nome.lower().endswith(
                extensoes
            ):

                yield os.path.join(
                    raiz,
                    nome
                )


# ============================================================================
# TESTAR MYSQL
# ============================================================================

def testar_mysql(conn):

    conn = garantir_conexao(
        conn
    )

    cursor = None

    try:

        cursor = conn.cursor()

        cursor.execute(
            "SELECT 1"
        )

        cursor.fetchone()

        return conn

    finally:

        if cursor is not None:

            try:
                cursor.close()
            except Exception:
                pass


# ============================================================================
# MAIN
# ============================================================================

def main():

    print()
    log("=" * 70, "INFO")
    log(
        "IMPORTADOR CADASTUR -> MYSQL",
        "INFO"
    )
    log("=" * 70, "INFO")

    # --------------------------------------------------------
    # Verifica pasta
    # --------------------------------------------------------

    if not os.path.isdir(
        PASTA_ARQUIVOS
    ):

        log(
            f'Pasta não encontrada: '
            f'"{PASTA_ARQUIVOS}"',
            "ERRO"
        )

        sys.exit(1)

    # --------------------------------------------------------
    # Lista arquivos
    # --------------------------------------------------------

    arquivos = list(
        listar_arquivos(
            PASTA_ARQUIVOS
        )
    )

    if not arquivos:

        log(
            f'Nenhum arquivo CSV/Excel '
            f'encontrado em '
            f'"{PASTA_ARQUIVOS}".',
            "AVISO"
        )

        return

    log(
        f"{len(arquivos)} arquivo(s) encontrado(s).",
        "INFO"
    )

    # --------------------------------------------------------
    # Analisa nomes
    # --------------------------------------------------------

    (
        info_arquivos,
        melhores
    ) = analisar_arquivos(
        arquivos
    )

    # --------------------------------------------------------
    # Conecta MySQL
    # --------------------------------------------------------

    try:

        conn = conectar_mysql()

    except Exception as erro:

        log(
            f"Não foi possível conectar ao MySQL: "
            f"{erro}",
            "ERRO"
        )

        sys.exit(1)

    # --------------------------------------------------------
    # Contadores
    # --------------------------------------------------------

    total_ok = 0
    total_erro = 0

    arquivos_com_erro = []

    grupos_logados = set()

    # --------------------------------------------------------
    # Processa arquivos
    # --------------------------------------------------------

    for indice, info in enumerate(
        info_arquivos,
        start=1
    ):

        caminho = info["caminho"]

        nome_arquivo = info["nome"]

        base = info["base"]

        ano = info["ano"]

        trimestre = info["trimestre"]

        chave_grupo = (
            base,
            ano
        )

        melhor = melhores.get(
            chave_grupo
        )

        # ----------------------------------------------------
        # Mostra consolidado
        # ----------------------------------------------------

        if (
            melhor
            and chave_grupo not in grupos_logados
        ):

            log(
                f'Grupo "{base}" / {ano}: '
                f'usando {melhor} '
                f'como consolidado do ano.',
                "INFO"
            )

            grupos_logados.add(
                chave_grupo
            )

        # ----------------------------------------------------
        # Nome da tabela
        # ----------------------------------------------------

        tabela = nome_tabela(
            base,
            ano,
            trimestre,
            melhores
        )

        periodo = (
            trimestre
            if trimestre
            else
            "sem trimestre identificado"
        )

        log(
            f'[{indice}/{len(info_arquivos)}] '
            f'Processando "{nome_arquivo}" '
            f'(base={base}, '
            f'ano={ano or "?"}, '
            f'{periodo}) '
            f'-> tabela "{tabela}"',
            "INFO"
        )

        # ----------------------------------------------------
        # Processa arquivo
        # ----------------------------------------------------

        try:

            conn = testar_mysql(
                conn
            )

            extensao = os.path.splitext(
                nome_arquivo
            )[1].lower()

            if extensao in EXTENSOES_CSV:

                conn, linhas = processar_csv(
                    conn,
                    caminho,
                    tabela
                )

            elif extensao in EXTENSOES_EXCEL:

                conn, linhas = processar_excel(
                    conn,
                    caminho,
                    tabela
                )

            else:

                raise ValueError(
                    f"Extensão não suportada: "
                    f"{extensao}"
                )

            log(
                f'"{nome_arquivo}" concluído: '
                f"{linhas} linha(s) inserida(s) "
                f'em "{tabela}".',
                "OK"
            )

            total_ok += 1

        except Exception as erro:

            total_erro += 1

            try:

                conn.rollback()

            except Exception:
                pass

            # ------------------------------------------------
            # Guarda erro
            # ------------------------------------------------

            arquivos_com_erro.append(
                {
                    "nome": nome_arquivo,
                    "caminho": caminho,
                    "motivo": str(erro),
                }
            )

            log(
                f'Falha ao processar '
                f'"{nome_arquivo}": '
                f"{erro}",
                "ERRO"
            )

            # ------------------------------------------------
            # Mostra traceback
            # ------------------------------------------------

            traceback.print_exc()

            # ------------------------------------------------
            # Tenta recuperar conexão
            # ------------------------------------------------

            try:

                if (
                    conn is None
                    or not conn.is_connected()
                ):

                    log(
                        "Conexão com MySQL caiu. "
                        "Tentando reconectar...",
                        "AVISO"
                    )

                    conn = conectar_mysql()

                    log(
                        "Reconectado ao MySQL "
                        "com sucesso.",
                        "OK"
                    )

                else:

                    # Mesmo conectada, faz ping
                    try:

                        conn.ping(
                            reconnect=True,
                            attempts=3,
                            delay=2
                        )

                    except Exception:

                        log(
                            "Problema no ping do MySQL. "
                            "Reconectando...",
                            "AVISO"
                        )

                        conn = conectar_mysql()

            except Exception as erro_conexao:

                log(
                    f"Não foi possível recuperar "
                    f"a conexão com MySQL: "
                    f"{erro_conexao}",
                    "ERRO"
                )

                # Não encerra imediatamente.
                # Tenta conectar novamente no
                # próximo arquivo.
                try:

                    conn = conectar_mysql()

                except Exception:

                    conn = None

            continue

    # --------------------------------------------------------
    # Fecha conexão
    # --------------------------------------------------------

    try:

        if conn is not None and conn.is_connected():

            conn.close()

    except Exception:
        pass

    # ========================================================
    # RESUMO
    # ========================================================

    print()

    log("=" * 70, "INFO")

    log(
        f"Resumo: "
        f"{total_ok} arquivo(s) OK | "
        f"{total_erro} arquivo(s) com erro.",
        "INFO"
    )

    log("=" * 70, "INFO")

    # ========================================================
    # ARQUIVOS COM ERRO
    # ========================================================

    if arquivos_com_erro:

        print()

        log(
            "ARQUIVOS QUE DERAM ERRO:",
            "ERRO"
        )

        log(
            "=" * 70,
            "INFO"
        )

        for numero, erro in enumerate(
            arquivos_com_erro,
            start=1
        ):

            log(
                f"{numero}. {erro['nome']}",
                "ERRO"
            )

            log(
                f"   Caminho: "
                f"{erro['caminho']}",
                "ERRO"
            )

            log(
                f"   Motivo: "
                f"{erro['motivo']}",
                "ERRO"
            )

        log(
            "=" * 70,
            "INFO"
        )

    else:

        log(
            "NENHUM ARQUIVO APRESENTOU ERRO.",
            "OK"
        )

    # --------------------------------------------------------
    # Final
    # --------------------------------------------------------

    log(
        "Processamento finalizado.",
        "OK"
    )

    log(
        "=" * 70,
        "INFO"
    )


# ============================================================================
# EXECUÇÃO
# ============================================================================

if __name__ == "__main__":
    main()