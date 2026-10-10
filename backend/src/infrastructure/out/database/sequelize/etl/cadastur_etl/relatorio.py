# -*- coding: utf-8 -*-
"""Relatórios de console: grupos encontrados e resumo final."""

from log import log_info, log_ok, log_aviso, log_erro, separador, titulo


def mostrar_grupos(grupos, ignoradas):
    titulo("TABELAS ACUMULADAS QUE SERÃO GERADAS:")

    for n, destino in enumerate(sorted(grupos), start=1):
        g = grupos[destino]
        anos = sorted({t["ano"] for t in g["tabelas"]})
        marcador = "⚠️ nome automático" if g["automatico"] else "✅"
        log_info(
            f"{n}. {destino} {marcador} "
            f"({len(g['tabelas'])} tabela(s), anos {anos[0]}-{anos[-1]})"
        )
        if len(g["variantes"]) > 1:
            log_aviso(
                "   categorias mescladas aqui: "
                + ", ".join(sorted(g["variantes"]))
            )

    automaticos = [d for d, g in grupos.items() if g["automatico"]]
    if automaticos:
        log_aviso(
            f"{len(automaticos)} destino(s) com nome automático. Para dar nome "
            f"amigável, adicione a categoria em nomes.py."
        )
        log_info(
            "Se alguma mesclagem estiver errada, adicione a chave em "
            "CATEGORIAS_NAO_MESCLAR (config.py)."
        )

    if ignoradas:
        log_info(
            f"{len(ignoradas)} tabela(s) do schema não seguem o padrão "
            f"e foram ignoradas."
        )
    separador()


def mostrar_resumo_geral(resumos, tempo):
    titulo("RESUMO GERAL")

    total_geral = 0
    for r in resumos:
        total_geral += r["total_inserido"]
        status = "✅" if not r["tabelas_erro"] else "⚠️"
        log_info(
            f"{status} {r['destino']} | {r['total_inserido']} registro(s) | "
            f"{r['tabelas_ok']} tabela(s) ok, {len(r['tabelas_erro'])} com erro"
        )

    separador()
    log_ok(f"Total geral inserido: {total_geral}")
    log_info(f"Tempo total: {tempo:.2f} segundos")

    com_erro = [r for r in resumos if r["tabelas_erro"]]
    if com_erro:
        separador()
        log_erro("DETALHES DOS ERROS:")
        for r in com_erro:
            log_erro(f"Destino: {r['destino']}")
            for e in r["tabelas_erro"]:
                log_erro(f"   {e['tabela']} (ano={e['ano']}) -> {e['erro']}")

    com_pendencia = [r for r in resumos if r["mapeamentos_incompletos"]]
    if com_pendencia:
        separador()
        log_aviso("TABELAS COM MAPEAMENTO DE COLUNAS INCOMPLETO (gravado NULL):")
        total = 0
        for r in com_pendencia:
            log_aviso(f"Destino: {r['destino']}")
            for p in r["mapeamentos_incompletos"]:
                total += 1
                log_aviso(
                    f"   {p['tabela']} (ano={p['ano']}) -> "
                    + ", ".join(p["campos"])
                )
        log_aviso(
            f"{total} tabela(s) com pendência. Ajuste os aliases em "
            f"mapeamento.py (CAMPOS) se a coluna existir com outro nome."
        )
    separador()
