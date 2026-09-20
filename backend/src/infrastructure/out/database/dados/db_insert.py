#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
db_insert.py

Inserção em lote de DataFrames no MySQL, com reconexão automática em
caso de queda de conexão no meio de um lote.
"""

import time

import pandas as pd

from config import MAX_TENTATIVAS_MYSQL, SEGUNDOS_ENTRE_TENTATIVAS, TAMANHO_LOTE_INSERT
from db_conexao import garantir_conexao, conectar_mysql
from logger import log


def limpar_valor(valor):
    if valor is None:
        return None

    try:
        if pd.isna(valor):
            return None
    except (TypeError, ValueError):
        pass

    if isinstance(valor, str):
        valor = valor.strip()
        if valor == "":
            return None

    return valor


def inserir_dataframe(conn, tabela, df):
    if df.empty:
        return conn, 0

    colunas = list(df.columns)
    placeholders = ", ".join(["%s"] * len(colunas))
    colunas_sql = ", ".join(f"`{coluna}`" for coluna in colunas)

    sql = f"INSERT INTO `{tabela}` ({colunas_sql}) VALUES ({placeholders})"

    linhas = [
        tuple(limpar_valor(valor) for valor in linha)
        for linha in df.itertuples(index=False, name=None)
    ]

    if not linhas:
        return conn, 0

    total = 0

    for inicio in range(0, len(linhas), TAMANHO_LOTE_INSERT):
        lote = linhas[inicio: inicio + TAMANHO_LOTE_INSERT]
        sucesso = False

        for tentativa in range(1, MAX_TENTATIVAS_MYSQL + 1):
            cursor = None
            try:
                conn = garantir_conexao(conn)
                cursor = conn.cursor()
                cursor.executemany(sql, lote)
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
                    f"Erro no INSERT do lote {inicio + 1}-{inicio + len(lote)} "
                    f"da tabela `{tabela}`: {erro}",
                    "AVISO",
                )

                if tentativa < MAX_TENTATIVAS_MYSQL:
                    log(
                        f"Reconectando e tentando novamente "
                        f"({tentativa + 1}/{MAX_TENTATIVAS_MYSQL})...",
                        "AVISO",
                    )
                    time.sleep(SEGUNDOS_ENTRE_TENTATIVAS)
                    conn = conectar_mysql()
                else:
                    raise

        if not sucesso:
            raise RuntimeError(f"Não foi possível inserir o lote da tabela `{tabela}`.")

    return conn, total