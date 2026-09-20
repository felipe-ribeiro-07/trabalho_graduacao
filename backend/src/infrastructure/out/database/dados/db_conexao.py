#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
db_conexao.py

Abertura, verificação e reconexão automática da conexão com o
MySQL.
"""

import time

import mysql.connector

from config import DB_CONFIG, MAX_TENTATIVAS_MYSQL, SEGUNDOS_ENTRE_TENTATIVAS
from logger import log


def conectar_mysql():
    ultimo_erro = None

    for tentativa in range(1, MAX_TENTATIVAS_MYSQL + 1):
        try:
            log(
                f"Tentando conectar ao MySQL "
                f"(tentativa {tentativa}/{MAX_TENTATIVAS_MYSQL})...",
                "INFO",
            )

            conn = mysql.connector.connect(**DB_CONFIG)

            if conn.is_connected():
                log("Conexão com MySQL estabelecida.", "OK")
                return conn

        except Exception as erro:
            ultimo_erro = erro
            log(f"Falha na conexão MySQL: {erro}", "AVISO")

            if tentativa < MAX_TENTATIVAS_MYSQL:
                time.sleep(SEGUNDOS_ENTRE_TENTATIVAS)

    raise ultimo_erro


def garantir_conexao(conn):
    try:
        if conn is None:
            return conectar_mysql()

        if conn.is_connected():
            try:
                conn.ping(reconnect=True, attempts=3, delay=2)
                return conn
            except Exception:
                pass

        log("Conexão com o MySQL perdida. Reconectando...", "AVISO")

    except Exception:
        pass

    return conectar_mysql()


def testar_mysql(conn):
    conn = garantir_conexao(conn)
    cursor = None

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        return conn
    finally:
        if cursor is not None:
            try:
                cursor.close()
            except Exception:
                pass