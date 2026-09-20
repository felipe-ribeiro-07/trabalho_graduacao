#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
main.py

Importador CADASTUR/RAIS -> MySQL.

Percorre PASTA_ARQUIVOS (e subpastas), agrupa arquivos por categoria
(definida pela subpasta, ver config.CATEGORIAS_POR_PASTA) e ano,
mantém sempre o trimestre mais recente carregado em cada tabela, e
reporta no final quais arquivos falharam.

Execução:
    python main.py
"""

import os
import sys
import traceback

from arquivo_info import listar_arquivos, analisar_arquivos
from config import PASTA_ARQUIVOS
from db_conexao import conectar_mysql, testar_mysql
from db_schema import criar_tabela_controle
from logger import log
from processador import processar_arquivo


def main():
    print()
    log("=" * 70, "INFO")
    log("IMPORTADOR CADASTUR/RAIS -> MYSQL", "INFO")
    log("=" * 70, "INFO")

    if not os.path.isdir(PASTA_ARQUIVOS):
        log(f'Pasta não encontrada: "{PASTA_ARQUIVOS}"', "ERRO")
        sys.exit(1)

    arquivos = list(listar_arquivos(PASTA_ARQUIVOS))

    if not arquivos:
        log(f'Nenhum arquivo CSV/Excel encontrado em "{PASTA_ARQUIVOS}".', "AVISO")
        return

    log(f"{len(arquivos)} arquivo(s) encontrado(s).", "INFO")

    info_arquivos, melhor_do_run = analisar_arquivos(arquivos, PASTA_ARQUIVOS)

    try:
        conn = conectar_mysql()
        conn = criar_tabela_controle(conn)
    except Exception as erro:
        log(f"Não foi possível conectar ao MySQL: {erro}", "ERRO")
        sys.exit(1)

    total_ok = 0
    total_pulados = 0
    total_erro = 0
    arquivos_com_erro = []

    grupos_logados = set()

    for indice, info in enumerate(info_arquivos, start=1):
        chave_grupo = (info["categoria"], info["ano"])
        melhor = melhor_do_run.get(chave_grupo)

        if melhor and chave_grupo not in grupos_logados:
            log(
                f'Grupo "{info["categoria"]}" / {info["ano"]}: '
                f"maior trimestre encontrado nesta execução: {melhor}.",
                "INFO",
            )
            grupos_logados.add(chave_grupo)

        periodo = info["trimestre"] or "sem trimestre identificado (ano completo)"

        log(
            f'[{indice}/{len(info_arquivos)}] Processando "{info["nome"]}" '
            f'(categoria={info["categoria"]}, ano={info["ano"] or "?"}, {periodo})',
            "INFO",
        )

        try:
            conn = testar_mysql(conn)
            conn, resultado = processar_arquivo(conn, info, melhor_do_run)

            if resultado is None:
                total_pulados += 1
                continue

            log(
                f'"{info["nome"]}" concluído: {resultado["linhas"]} linha(s) '
                f'inserida(s) em "{resultado["tabela"]}".',
                "OK",
            )
            total_ok += 1

        except Exception as erro:
            total_erro += 1

            try:
                conn.rollback()
            except Exception:
                pass

            arquivos_com_erro.append(
                {"nome": info["nome"], "caminho": info["caminho"], "motivo": str(erro)}
            )

            log(f'Falha ao processar "{info["nome"]}": {erro}', "ERRO")
            traceback.print_exc()

            try:
                if conn is None or not conn.is_connected():
                    log("Conexão com MySQL caiu. Tentando reconectar...", "AVISO")
                    conn = conectar_mysql()
                    log("Reconectado ao MySQL com sucesso.", "OK")
            except Exception as erro_conexao:
                log(f"Não foi possível recuperar a conexão com MySQL: {erro_conexao}", "ERRO")
                try:
                    conn = conectar_mysql()
                except Exception:
                    conn = None

            continue

    try:
        if conn is not None and conn.is_connected():
            conn.close()
    except Exception:
        pass

    print()
    log("=" * 70, "INFO")
    log(
        f"Resumo: {total_ok} arquivo(s) importado(s) | "
        f"{total_pulados} pulado(s) (já atualizados) | "
        f"{total_erro} arquivo(s) com erro.",
        "INFO",
    )
    log("=" * 70, "INFO")

    if arquivos_com_erro:
        print()
        log("ARQUIVOS QUE DERAM ERRO:", "ERRO")
        log("=" * 70, "INFO")

        for numero, erro in enumerate(arquivos_com_erro, start=1):
            log(f"{numero}. {erro['nome']}", "ERRO")
            log(f"   Caminho: {erro['caminho']}", "ERRO")
            log(f"   Motivo: {erro['motivo']}", "ERRO")

        log("=" * 70, "INFO")
    else:
        log("NENHUM ARQUIVO APRESENTOU ERRO.", "OK")

    log("Processamento finalizado.", "OK")
    log("=" * 70, "INFO")


if __name__ == "__main__":
    main()