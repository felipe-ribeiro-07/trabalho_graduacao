# -*- coding: utf-8 -*-
"""Conexão com o MySQL (com reconexão automática)."""

import time

import mysql.connector
from mysql.connector import Error

import config
from log import log_info, log_ok, log_aviso


def conectar_mysql():
    for tentativa in range(1, config.MAX_TENTATIVAS_CONEXAO + 1):
        try:
            log_info(
                f"Conectando ao MySQL "
                f"(tentativa {tentativa}/{config.MAX_TENTATIVAS_CONEXAO})..."
            )
            conexao = mysql.connector.connect(**config.DB_CONFIG)
            if conexao.is_connected():
                log_ok(
                    f"MySQL conectado: "
                    f"{config.DB_CONFIG['host']}:{config.DB_CONFIG['port']}"
                )
                return conexao
        except Error as erro:
            log_aviso(f"Falha ao conectar ao MySQL: {erro}")
            if tentativa < config.MAX_TENTATIVAS_CONEXAO:
                time.sleep(config.INTERVALO_RECONEXAO)

    raise RuntimeError("Não foi possível conectar ao MySQL.")


def garantir_conexao(conexao):
    try:
        if conexao is not None and conexao.is_connected():
            conexao.ping(reconnect=True, attempts=3, delay=2)
            return conexao
    except Exception:
        pass

    log_aviso("Conexão MySQL perdida. Reconectando...")
    try:
        if conexao is not None:
            conexao.close()
    except Exception:
        pass
    return conectar_mysql()


def listar_nomes_tabelas(conexao):
    cursor = conexao.cursor()
    try:
        cursor.execute(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = %s
            ORDER BY table_name
            """,
            (config.DB_CONFIG["database"],),
        )
        return [linha[0] for linha in cursor.fetchall()]
    finally:
        cursor.close()


def tabela_existe(cursor, tabela):
    cursor.execute(
        """
        SELECT COUNT(*) FROM information_schema.tables
        WHERE table_schema = %s AND table_name = %s
        """,
        (config.DB_CONFIG["database"], tabela),
    )
    return cursor.fetchone()[0] > 0


def buscar_colunas(cursor, tabela):
    cursor.execute(
        """
        SELECT COLUMN_NAME FROM information_schema.columns
        WHERE table_schema = %s AND table_name = %s
        ORDER BY ORDINAL_POSITION
        """,
        (config.DB_CONFIG["database"], tabela),
    )
    return [linha[0] for linha in cursor.fetchall()]


def buscar_linhas(conexao, tabela):
    """Gera lotes de linhas (dict). Cursor buffered evita 'Unread result found'."""
    cursor = conexao.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute(f"SELECT * FROM `{tabela}`")
        while True:
            linhas = cursor.fetchmany(config.BATCH_SIZE)
            if not linhas:
                break
            yield linhas
    finally:
        try:
            cursor.close()
        except Exception:
            pass
