#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
db_schema.py

DDL (criação/alteração de tabelas de dados) e controle de qual
trimestre está carregado em cada tabela (categoria, ano) através da
tabela auxiliar TABELA_CONTROLE.

É essa tabela de controle que permite, entre execuções diferentes do
script, saber que já existe T2 carregado e que um T3 encontrado
depois deve substituir o T2 (apagar + recarregar).
"""

import time
from datetime import datetime

from config import (
    MAX_TENTATIVAS_MYSQL,
    SEGUNDOS_ENTRE_TENTATIVAS,
    TABELA_CONTROLE,
    DB_CONFIG,
)
from db_conexao import garantir_conexao, conectar_mysql
from logger import log


# ============================================================================
# TABELAS DE DADOS
# ============================================================================

def criar_tabela(conn, tabela, colunas):
    conn = garantir_conexao(conn)

    colunas_sql = [f"`{coluna}` LONGTEXT" for coluna in colunas]

    sql = (
        f"CREATE TABLE IF NOT EXISTS `{tabela}` "
        f"({', '.join(colunas_sql)}) "
        f"ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    )

    for tentativa in range(1, MAX_TENTATIVAS_MYSQL + 1):
        cursor = None
        try:
            conn = garantir_conexao(conn)
            cursor = conn.cursor()
            cursor.execute(sql)
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

            log(f"Erro criando tabela `{tabela}`: {erro}. Tentando novamente...", "AVISO")
            time.sleep(SEGUNDOS_ENTRE_TENTATIVAS)
            conn = conectar_mysql()

    return conn


def garantir_colunas_existentes(conn, tabela, colunas):
    conn = garantir_conexao(conn)

    for tentativa in range(1, MAX_TENTATIVAS_MYSQL + 1):
        cursor = None
        try:
            conn = garantir_conexao(conn)
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
                """,
                (DB_CONFIG["database"], tabela),
            )

            existentes = {linha[0] for linha in cursor.fetchall()}

            for coluna in colunas:
                if coluna not in existentes:
                    cursor.execute(
                        f"ALTER TABLE `{tabela}` ADD COLUMN `{coluna}` LONGTEXT"
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

            log(f"Erro verificando colunas de `{tabela}`: {erro}. Reconectando...", "AVISO")
            time.sleep(SEGUNDOS_ENTRE_TENTATIVAS)
            conn = conectar_mysql()

    return conn


def apagar_dados_tabela(conn, tabela):
    """
    Apaga todas as linhas da tabela (mantendo colunas/estrutura).
    Usado quando um trimestre mais novo substitui o anterior, ou
    quando um "arquivo completo do ano" é reprocessado.
    """
    conn = garantir_conexao(conn)
    cursor = None

    try:
        cursor = conn.cursor()
        cursor.execute(f"TRUNCATE TABLE `{tabela}`")
        conn.commit()
    finally:
        if cursor is not None:
            try:
                cursor.close()
            except Exception:
                pass

    return conn


# ============================================================================
# TABELA DE CONTROLE: (categoria, ano) -> trimestre atualmente carregado
# ============================================================================

def criar_tabela_controle(conn):
    conn = garantir_conexao(conn)
    cursor = None

    sql = (
        f"CREATE TABLE IF NOT EXISTS `{TABELA_CONTROLE}` ("
        f"`categoria` VARCHAR(128) NOT NULL, "
        f"`ano` VARCHAR(16) NOT NULL, "
        f"`trimestre_atual` VARCHAR(4) NULL, "
        f"`tabela` VARCHAR(64) NOT NULL, "
        f"`arquivo_origem` VARCHAR(255) NULL, "
        f"`atualizado_em` DATETIME NULL, "
        f"PRIMARY KEY (`categoria`, `ano`)"
        f") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    )

    try:
        cursor = conn.cursor()
        cursor.execute(sql)
        conn.commit()
    finally:
        if cursor is not None:
            try:
                cursor.close()
            except Exception:
                pass

    return conn


def obter_estado_controle(conn, categoria, ano):
    """
    Retorna o trimestre (ex: "T2") atualmente carregado para
    (categoria, ano), ou None se ainda não há nada registrado.
    """
    conn = garantir_conexao(conn)
    cursor = None

    try:
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT trimestre_atual FROM `{TABELA_CONTROLE}` "
            f"WHERE categoria = %s AND ano = %s",
            (categoria, ano),
        )
        linha = cursor.fetchone()
        return linha[0] if linha else None
    finally:
        if cursor is not None:
            try:
                cursor.close()
            except Exception:
                pass


def atualizar_controle(conn, categoria, ano, trimestre, tabela, arquivo_origem):
    conn = garantir_conexao(conn)
    cursor = None

    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""
            INSERT INTO `{TABELA_CONTROLE}`
                (categoria, ano, trimestre_atual, tabela, arquivo_origem, atualizado_em)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                trimestre_atual = VALUES(trimestre_atual),
                tabela = VALUES(tabela),
                arquivo_origem = VALUES(arquivo_origem),
                atualizado_em = VALUES(atualizado_em)
            """,
            (categoria, ano, trimestre, tabela, arquivo_origem, datetime.now()),
        )
        conn.commit()
    finally:
        if cursor is not None:
            try:
                cursor.close()
            except Exception:
                pass

    return conn