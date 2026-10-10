# -*- coding: utf-8 -*-
"""Criação, limpeza e inserção nas tabelas acumuladas."""

import time

from mysql.connector import Error

import config
from database import garantir_conexao, tabela_existe
from log import log_info, log_ok, log_aviso, log_erro

# Erros de conexão (vale reconectar e tentar de novo). Qualquer outro erro
# (dado inválido, coluna curta etc.) vai direto para inserção registro a registro.
ERROS_CONEXAO = {2003, 2006, 2013, 2055, 1053}

CAMPOS_INSERT = [
    "ano",
    "origem_tabela",
    "razao_social",
    "nome_fantasia",
    "cnpj",
    "porte",
    "situacao",
    "segmento",
    "uf",
    "municipio",
    "data_inicio_operacao",
]


def criar_tabela_acumulada(cursor, tabela):
    cursor.execute(
        f"""
        CREATE TABLE IF NOT EXISTS `{tabela}` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `ano` SMALLINT NOT NULL,
            `origem_tabela` VARCHAR(500) NULL,
            `razao_social` TEXT NULL,
            `nome_fantasia` TEXT NULL,
            `cnpj` VARCHAR(255) NULL,
            `porte` VARCHAR(500) NULL,
            `situacao` VARCHAR(500) NULL,
            `segmento` TEXT NULL,
            `uf` VARCHAR(100) NULL,
            `municipio` VARCHAR(500) NULL,
            `data_inicio_operacao` DATE NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            INDEX `idx_ano` (`ano`),
            INDEX `idx_cnpj` (`cnpj`),
            INDEX `idx_uf` (`uf`),
            INDEX `idx_municipio` (`municipio`)
        )
        ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    )

    # corrige tabelas antigas com cnpj curto
    cursor.execute(
        """
        SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.columns
        WHERE table_schema = %s AND table_name = %s AND column_name = 'cnpj'
        """,
        (config.DB_CONFIG["database"], tabela),
    )
    resultado = cursor.fetchone()
    if resultado and resultado[0] is not None and resultado[0] < 255:
        log_aviso(f"'{tabela}': cnpj com {resultado[0]} caracteres. Ajustando...")
        cursor.execute(
            f"ALTER TABLE `{tabela}` MODIFY COLUMN `cnpj` VARCHAR(255) NULL"
        )
        log_ok(f"'{tabela}': cnpj alterado para VARCHAR(255).")


def garantir_tabela(conexao, tabela):
    conexao = garantir_conexao(conexao)
    cursor = conexao.cursor()
    try:
        criar_tabela_acumulada(cursor, tabela)
        conexao.commit()
        log_ok(f"Tabela '{tabela}' garantida.")
    except Exception:
        _rollback(conexao)
        raise
    finally:
        cursor.close()
    return conexao


def limpar_tabela_acumulada(conexao, tabela):
    conexao = garantir_conexao(conexao)
    cursor = conexao.cursor()
    try:
        if not tabela_existe(cursor, tabela):
            log_info(f"Tabela '{tabela}' ainda não existe. Nada para limpar.")
            return conexao
        cursor.execute(f"TRUNCATE TABLE `{tabela}`")
        conexao.commit()
        log_info(f"Tabela '{tabela}' limpa.")
    except Error as erro:
        _rollback(conexao)
        raise RuntimeError(f"Não foi possível limpar '{tabela}': {erro}")
    finally:
        cursor.close()
    return conexao


def _rollback(conexao):
    try:
        conexao.rollback()
    except Exception:
        pass


def _fechar(cursor):
    if cursor is not None:
        try:
            cursor.close()
        except Exception:
            pass


def _para_tupla(registro):
    valores = []
    for campo in CAMPOS_INSERT:
        valor = registro.get(campo)
        if campo == "cnpj" and valor is not None:
            valor = str(valor).strip() or None
        valores.append(valor)
    return tuple(valores)


def _sql_insert(tabela):
    colunas = ", ".join(f"`{c}`" for c in CAMPOS_INSERT)
    marcadores = ", ".join(["%s"] * len(CAMPOS_INSERT))
    return f"INSERT INTO `{tabela}` ({colunas}) VALUES ({marcadores})"


def _inserir_individual(conexao, sql, valores):
    inseridos = 0
    indice_cnpj = CAMPOS_INSERT.index("cnpj")

    for indice, valor in enumerate(valores, start=1):
        cursor = None
        try:
            conexao = garantir_conexao(conexao)
            cursor = conexao.cursor()
            cursor.execute(sql, valor)  # valor (tupla), não (valor,)
            conexao.commit()
            inseridos += 1
        except Error as erro:
            _rollback(conexao)
            log_erro(
                f"Registro {indice} rejeitado: "
                f"CNPJ={valor[indice_cnpj]!r} | erro={erro}"
            )
        finally:
            _fechar(cursor)

    log_aviso(f"Lote individual: {inseridos}/{len(valores)} inseridos.")
    return inseridos, conexao


def inserir_lote(conexao, tabela, registros):
    """Insere um lote. Retorna (inseridos, conexao_atual)."""
    if not registros:
        return 0, conexao

    sql = _sql_insert(tabela)
    valores = [_para_tupla(r) for r in registros]

    for tentativa in range(1, config.MAX_TENTATIVAS_CONEXAO + 1):
        cursor = None
        try:
            conexao = garantir_conexao(conexao)
            cursor = conexao.cursor()
            cursor.executemany(sql, valores)
            conexao.commit()
            return len(valores), conexao

        except Error as erro:
            _rollback(conexao)

            if (
                erro.errno in ERROS_CONEXAO
                and tentativa < config.MAX_TENTATIVAS_CONEXAO
            ):
                log_aviso(
                    f"Conexão caiu inserindo em '{tabela}' "
                    f"(tentativa {tentativa}/{config.MAX_TENTATIVAS_CONEXAO}): "
                    f"{erro}"
                )
                time.sleep(config.INTERVALO_RECONEXAO)
                continue

            log_aviso(
                f"Erro no lote de {len(valores)} registros em '{tabela}': "
                f"{erro}. Inserindo registro por registro."
            )
            return _inserir_individual(conexao, sql, valores)

        finally:
            _fechar(cursor)

    return 0, conexao
