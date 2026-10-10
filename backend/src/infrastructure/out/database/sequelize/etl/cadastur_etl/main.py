#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ETL CADASTUR - uma tabela acumulada por segmento.

Uso:
    python main.py                      # processa todos os segmentos
    python main.py --listar             # só mostra o agrupamento, não grava nada
    python main.py --filtro guias agencias   # só destinos cujo nome contenha o trecho
"""

import argparse
import sys
import time

import config
from categorias import agrupar_por_destino
from database import conectar_mysql, garantir_conexao, listar_nomes_tabelas
from log import log_info, log_ok, log_aviso, log_erro, titulo, separador
from origem import classificar_tabelas
from processamento import processar_grupo
from relatorio import mostrar_grupos, mostrar_resumo_geral


def parse_args():
    p = argparse.ArgumentParser(description="ETL Cadastur multi-segmento")
    p.add_argument("--listar", action="store_true",
                   help="mostra o agrupamento e sai, sem gravar nada")
    p.add_argument("--filtro", nargs="*", default=None,
                   help="trechos do nome de destino a processar")
    return p.parse_args()


def main():
    args = parse_args()
    inicio = time.time()
    conexao = None
    resumos = []

    try:
        titulo("ETL CADASTUR - TABELA ACUMULADA POR SEGMENTO")
        log_info(f"Banco: {config.DB_CONFIG['database']} "
                 f"({config.DB_CONFIG['host']}:{config.DB_CONFIG['port']})")
        log_info(f"Prefixos de origem: {', '.join(config.PREFIXOS_ORIGEM)}")
        log_info(f"Batch: {config.BATCH_SIZE}")
        separador()

        conexao = conectar_mysql()

        nomes = listar_nomes_tabelas(conexao)
        configs, ignoradas = classificar_tabelas(nomes)
        if not configs:
            raise RuntimeError("Nenhuma tabela de origem encontrada.")

        grupos = agrupar_por_destino(configs)
        mostrar_grupos(grupos, ignoradas)

        if args.listar:
            log_ok("Modo --listar: nada foi gravado.")
            return

        filtros = args.filtro if args.filtro is not None else config.FILTRO_DESTINOS
        destinos = sorted(grupos)
        if filtros:
            destinos = [
                d for d in destinos
                if any(f.lower() in d.lower() for f in filtros)
            ]
            if not destinos:
                raise RuntimeError(f"Nenhum destino bate com o filtro: {filtros}")

        for destino in destinos:
            try:
                conexao = garantir_conexao(conexao)
                resumo, conexao = processar_grupo(conexao, grupos[destino])
                resumos.append(resumo)
            except Exception as erro:
                log_erro(f"Falha ao processar '{destino}': {erro}")
                resumos.append({
                    "destino": destino,
                    "total_inserido": 0,
                    "tabelas_ok": 0,
                    "tabelas_erro": [{"tabela": "-", "ano": "-", "erro": str(erro)}],
                    "mapeamentos_incompletos": [],
                })

        mostrar_resumo_geral(resumos, time.time() - inicio)
        log_ok("ETL FINALIZADO.")

    except KeyboardInterrupt:
        log_aviso("Execução interrompida pelo usuário.")
        sys.exit(1)
    except Exception as erro:
        log_erro(f"Falha geral no ETL: {erro}")
        sys.exit(1)
    finally:
        if conexao is not None:
            try:
                conexao.close()
                log_info("Conexão MySQL encerrada.")
            except Exception:
                pass


if __name__ == "__main__":
    main()
