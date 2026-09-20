#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
processador.py

Decide, para cada arquivo, se ele deve ser importado ou pulado (com
base no trimestre já carregado no banco) e executa a importação em
si (CSV ou Excel) na tabela de destino.

REGRA DE SUBSTITUIÇÃO POR TRIMESTRE
------------------------------------
- Arquivo sem T1/T2/T3/T4 no nome = "ano completo": sempre substitui
  o conteúdo atual da tabela (apaga e recarrega).
- Arquivo com trimestre só é importado se for MAIOR que o trimestre
  já carregado no banco (isso é lembrado entre execuções na tabela
  `_etl_controle_importacao`).
    Ex.: banco já tem T2 carregado -> um arquivo T1 é ignorado;
         um arquivo T3, quando aparecer, substitui o T2.
- Se dentro da MESMA execução existir mais de um trimestre para o
  mesmo grupo (categoria, ano), só o maior trimestre é considerado —
  os demais são pulados sem nem serem lidos.
- Se mais de um arquivo empatar no maior trimestre do grupo (ex:
  dados divididos por estado), todos são inseridos na mesma tabela.
"""

import os

from arquivo_info import nome_tabela
from config import EXTENSOES_CSV, EXTENSOES_EXCEL, GRAVAR_METADADOS_ORIGEM
from db_schema import (
    criar_tabela,
    garantir_colunas_existentes,
    apagar_dados_tabela,
    obter_estado_controle,
    atualizar_controle,
)
from db_insert import inserir_dataframe
from leitor_csv import ler_csv_com_fallback
from leitor_excel import descobrir_colunas_excel, ler_planilha
from logger import log
from texto_utils import sanitizar_nome_coluna, deduplicar_colunas


def decidir_acao(conn, categoria, ano, trimestre, melhor_do_run):
    """
    Retorna (deve_importar: bool, deve_apagar_antes: bool).
    """
    ano_chave = ano or "ano_desconhecido"

    if trimestre is None:
        # Arquivo "ano completo": sempre recarrega do zero.
        return True, True

    melhor_da_execucao = melhor_do_run.get((categoria, ano))

    if melhor_da_execucao is not None and trimestre != melhor_da_execucao:
        log(
            f"Pulando trimestre {trimestre} de {categoria}/{ano_chave}: "
            f"{melhor_da_execucao} é mais recente nesta execução.",
            "INFO",
        )
        return False, False

    trimestre_atual_bd = obter_estado_controle(conn, categoria, ano_chave)

    if trimestre_atual_bd is None:
        return True, False

    numero_novo = int(trimestre[1])
    numero_atual = int(trimestre_atual_bd[1]) if trimestre_atual_bd else 0

    if numero_novo <= numero_atual:
        log(
            f"Pulando {trimestre} de {categoria}/{ano_chave}: "
            f"banco já tem {trimestre_atual_bd} carregado.",
            "INFO",
        )
        return False, False

    log(
        f"{categoria}/{ano_chave}: substituindo {trimestre_atual_bd} "
        f"por {trimestre} (dado mais recente).",
        "INFO",
    )
    return True, True


def processar_csv(conn, caminho, tabela, apagar_antes):
    df, encoding, separador = ler_csv_com_fallback(caminho)

    colunas = deduplicar_colunas(
        [sanitizar_nome_coluna(coluna) for coluna in df.columns]
    )
    df.columns = colunas

    if GRAVAR_METADADOS_ORIGEM:
        df["_arquivo_origem"] = os.path.basename(caminho)
        df["_planilha_origem"] = None

    log(
        f'CSV "{os.path.basename(caminho)}": encoding={encoding}, '
        f"separador='{separador}', colunas={df.shape[1]}, linhas={len(df)}",
        "INFO",
    )

    conn = criar_tabela(conn, tabela, list(df.columns))
    conn = garantir_colunas_existentes(conn, tabela, list(df.columns))

    if apagar_antes:
        conn = apagar_dados_tabela(conn, tabela)

    conn, total = inserir_dataframe(conn, tabela, df)
    return conn, total


def processar_excel(conn, caminho, tabela, apagar_antes):
    xls, colunas_por_planilha, colunas_uniao = descobrir_colunas_excel(caminho)

    colunas_tabela = list(colunas_uniao)

    if GRAVAR_METADADOS_ORIGEM:
        colunas_tabela.extend(["_arquivo_origem", "_planilha_origem"])

    conn = criar_tabela(conn, tabela, colunas_tabela)
    conn = garantir_colunas_existentes(conn, tabela, colunas_tabela)

    if apagar_antes:
        conn = apagar_dados_tabela(conn, tabela)

    total_linhas = 0

    for sheet in xls.sheet_names:
        try:
            log(
                f'Processando planilha "{sheet}" do arquivo '
                f'"{os.path.basename(caminho)}"...',
                "INFO",
            )

            df = ler_planilha(xls, sheet, colunas_por_planilha, colunas_uniao)

            if GRAVAR_METADADOS_ORIGEM:
                df["_arquivo_origem"] = os.path.basename(caminho)
                df["_planilha_origem"] = sheet

            conn, linhas = inserir_dataframe(conn, tabela, df)
            total_linhas += linhas

            log(
                f'Planilha "{sheet}" de {os.path.basename(caminho)}: '
                f"{linhas} linha(s) inserida(s).",
                "OK",
            )

        except Exception as erro:
            log(f'Erro na planilha "{sheet}" de {os.path.basename(caminho)}: {erro}', "ERRO")
            continue

    return conn, total_linhas


def processar_arquivo(conn, info, melhor_do_run):
    """
    Ponto de entrada único: recebe o dicionário de metadados de um
    arquivo (vindo de arquivo_info.analisar_arquivos) e devolve
    (conn, resultado). resultado é None quando o arquivo foi pulado,
    ou {"tabela": ..., "linhas": ...} quando foi importado.
    """
    caminho = info["caminho"]
    nome_arquivo = info["nome"]
    categoria = info["categoria"]
    ano = info["ano"]
    trimestre = info["trimestre"]

    ano_chave = ano or "ano_desconhecido"

    deve_importar, apagar_antes = decidir_acao(conn, categoria, ano, trimestre, melhor_do_run)

    if not deve_importar:
        return conn, None

    tabela = nome_tabela(categoria, ano)
    extensao = os.path.splitext(nome_arquivo)[1].lower()

    if extensao in EXTENSOES_CSV:
        conn, linhas = processar_csv(conn, caminho, tabela, apagar_antes)
    elif extensao in EXTENSOES_EXCEL:
        conn, linhas = processar_excel(conn, caminho, tabela, apagar_antes)
    else:
        raise ValueError(f"Extensão não suportada: {extensao}")

    conn = atualizar_controle(conn, categoria, ano_chave, trimestre, tabela, nome_arquivo)

    return conn, {"tabela": tabela, "linhas": linhas}