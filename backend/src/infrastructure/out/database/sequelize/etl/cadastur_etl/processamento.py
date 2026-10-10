# -*- coding: utf-8 -*-
"""Processamento de uma tabela de origem e de um grupo (tabela acumulada)."""

import config
from carga import garantir_tabela, limpar_tabela_acumulada, inserir_lote
from database import (
    garantir_conexao,
    conectar_mysql,
    buscar_colunas,
    buscar_linhas,
)
from log import log_info, log_ok, log_aviso, log_erro, titulo
from mapeamento import CAMPOS, descobrir_mapeamento, montar_registro
from origem import escolher_tabelas_para_processar


def processar_tabela(conexao, cfg, destino):
    """Lê uma tabela de origem e insere no destino. Retorna (resultado, conexao)."""
    tabela = cfg["tabela"]
    ano = cfg["ano"]

    log_info(f"Processando '{tabela}' (ano={ano})...")

    cursor = conexao.cursor()
    try:
        colunas = buscar_colunas(cursor, tabela)
    finally:
        cursor.close()

    if not colunas:
        raise RuntimeError(f"A tabela '{tabela}' não possui colunas.")

    log_info(f"'{tabela}': {len(colunas)} coluna(s).")

    mapeamento = descobrir_mapeamento(colunas)

    faltando = []
    for campo, (rotulo, _) in CAMPOS.items():
        coluna = mapeamento[campo]
        log_info(f"Mapeamento de {rotulo}: {coluna or 'NÃO ENCONTRADO'}")
        if not coluna:
            faltando.append(rotulo)

    if faltando:
        log_aviso(
            f"'{tabela}': campo(s) sem mapeamento (gravados como NULL): "
            + ", ".join(faltando)
        )

    total_linhas = 0
    total_inseridas = 0
    lote = []

    for linhas in buscar_linhas(conexao, tabela):
        for linha in linhas:
            total_linhas += 1
            try:
                lote.append(montar_registro(linha, mapeamento, ano, tabela))
            except Exception as erro:
                log_erro(f"Linha {total_linhas} de '{tabela}': {erro}")
                continue

            if len(lote) >= config.BATCH_SIZE:
                qtd, conexao = inserir_lote(conexao, destino, lote)
                total_inseridas += qtd
                lote = []

    if lote:
        qtd, conexao = inserir_lote(conexao, destino, lote)
        total_inseridas += qtd

    log_ok(
        f"'{tabela}' concluído: {total_linhas} lida(s), "
        f"{total_inseridas} inserida(s)."
    )

    resultado = {
        "tabela": tabela,
        "ano": ano,
        "linhas": total_linhas,
        "inseridas": total_inseridas,
        "campos_nao_encontrados": faltando,
    }
    return resultado, conexao


def mostrar_resumo_destino(conexao, destino):
    conexao = garantir_conexao(conexao)
    cursor = conexao.cursor()
    try:
        cursor.execute(f"SELECT COUNT(*) FROM `{destino}`")
        log_ok(f"{destino} -> {cursor.fetchone()[0]} registro(s) no total")

        cursor.execute(
            f"SELECT ano, COUNT(*) FROM `{destino}` GROUP BY ano ORDER BY ano"
        )
        for ano, quantidade in cursor.fetchall():
            log_info(f"   Ano {ano}: {quantidade} registro(s)")
    finally:
        cursor.close()


def processar_grupo(conexao, grupo):
    """Processa todas as tabelas de um destino acumulado."""
    destino = grupo["destino"]

    titulo(f"DESTINO: {destino}  ({len(grupo['variantes'])} variante(s) de nome)")

    escolhidas = escolher_tabelas_para_processar(grupo["tabelas"])
    if not escolhidas:
        raise RuntimeError(f"Nenhuma tabela de origem válida para '{destino}'.")

    log_info("TABELAS QUE SERÃO PROCESSADAS:")
    for n, item in enumerate(escolhidas, start=1):
        detalhes = f"ano={item['ano']}"
        if item["formato"]:
            detalhes += f", formato={item['formato']}"
        if item["trimestre"]:
            detalhes += f", T{item['trimestre']}"
        log_ok(f"   {n}. {item['tabela']} ({detalhes})")

    conexao = garantir_tabela(conexao, destino)

    if config.LIMPAR_TABELA_ANTES:
        conexao = limpar_tabela_acumulada(conexao, destino)

    ok, erros, incompletos = 0, [], []
    total = 0

    for n, cfg in enumerate(escolhidas, start=1):
        log_info(f"[{n}/{len(escolhidas)}] {destino}: {cfg['tabela']}")
        try:
            conexao = garantir_conexao(conexao)
            resultado, conexao = processar_tabela(conexao, cfg, destino)
            ok += 1
            total += resultado["inseridas"]
            if resultado["campos_nao_encontrados"]:
                incompletos.append(
                    {
                        "tabela": resultado["tabela"],
                        "ano": resultado["ano"],
                        "campos": resultado["campos_nao_encontrados"],
                    }
                )
        except Exception as erro:
            erros.append(
                {"tabela": cfg["tabela"], "ano": cfg["ano"], "erro": str(erro)}
            )
            log_erro(f"[{cfg['tabela']}] ERRO: {erro}")
            try:
                conexao = garantir_conexao(conexao)
            except Exception:
                conexao = conectar_mysql()

    try:
        mostrar_resumo_destino(conexao, destino)
    except Exception as erro:
        log_aviso(f"Não foi possível gerar resumo de '{destino}': {erro}")

    resumo = {
        "destino": destino,
        "total_inserido": total,
        "tabelas_ok": ok,
        "tabelas_erro": erros,
        "mapeamentos_incompletos": incompletos,
    }
    return resumo, conexao
