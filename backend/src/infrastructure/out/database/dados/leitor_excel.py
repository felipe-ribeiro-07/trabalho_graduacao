#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
leitor_excel.py

Leitura de arquivos Excel (.xlsx/.xls/.xlsm) com múltiplas
planilhas, unindo o conjunto de colunas de todas as abas antes de
ler os dados (garante que a tabela tenha todas as colunas antes de
qualquer insert).
"""

import pandas as pd

from texto_utils import sanitizar_nome_coluna, deduplicar_colunas


def descobrir_colunas_excel(caminho):
    """
    Primeira passada: descobre as colunas de cada planilha e a união
    de todas elas.
    """
    xls = pd.ExcelFile(caminho)

    colunas_por_planilha = {}
    colunas_uniao = []

    for sheet in xls.sheet_names:
        cabecalho = pd.read_excel(xls, sheet_name=sheet, nrows=0, dtype=str)

        colunas = deduplicar_colunas(
            [sanitizar_nome_coluna(coluna) for coluna in cabecalho.columns]
        )

        colunas_por_planilha[sheet] = colunas

        for coluna in colunas:
            if coluna not in colunas_uniao:
                colunas_uniao.append(coluna)

    return xls, colunas_por_planilha, colunas_uniao


def ler_planilha(xls, sheet, colunas_por_planilha, colunas_uniao):
    df = pd.read_excel(xls, sheet_name=sheet, dtype=str)
    df.columns = colunas_por_planilha[sheet]
    df = df.reindex(columns=colunas_uniao)
    return df