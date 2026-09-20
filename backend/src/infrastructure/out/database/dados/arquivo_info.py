#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
arquivo_info.py

Descoberta de arquivos e extração de metadados a partir do caminho
e do NOME do arquivo:
- categoria "de pasta" (definida pela subpasta onde o arquivo está,
  ex: CADASTUR/ ou RAIS/);
- segmento (quando vários segmentos de uma mesma fonte estão soltos
  na MESMA pasta, distintos só pelo nome do arquivo — ex:
  "cadastur_acampamentoturistico_2008.csv.csv",
  "cadastur_agenciadeturismo_2006.csv.csv" — nesse caso o segmento é
  extraído do nome e incorporado à categoria final);
- ano e trimestre (extraídos do NOME do arquivo);
- nome final da tabela no MySQL (categoria final + ano).

CORREÇÃO (2026): antes, quando os arquivos de vários segmentos
ficavam soltos na mesma pasta, todos caíam na mesma categoria (a da
pasta), e portanto na mesma tabela — cada segmento processado no
mesmo ano sobrescrevia o anterior. Agora, se for possível extrair um
segmento do nome do arquivo, ele é incorporado à categoria
(ex: "cadastur" + "acampamentoturistico" -> "cadastur_acampamentoturistico"),
gerando uma tabela por segmento (ex: cadastur_acampamentoturistico_2008).
"""

import os
import re

from config import (
    PASTA_ARQUIVOS,
    CATEGORIAS_POR_PASTA,
    CATEGORIA_PADRAO_SEM_PASTA,
    EXTENSOES_CSV,
    EXTENSOES_EXCEL,
)
from texto_utils import sanitizar_nome_categoria

PADRAO_ANO = re.compile(r"(20\d{2})")
PADRAO_TRIMESTRE = re.compile(r"T([1-4])", re.IGNORECASE)


def listar_arquivos(pasta=PASTA_ARQUIVOS):
    extensoes = EXTENSOES_CSV + EXTENSOES_EXCEL

    for raiz, diretorios, arquivos in os.walk(pasta):
        diretorios.sort()

        for nome in sorted(arquivos):
            if nome.startswith("~$"):
                continue

            if nome.lower().endswith(extensoes):
                yield os.path.join(raiz, nome)


def extrair_categoria(caminho, pasta_raiz=PASTA_ARQUIVOS):
    """
    A categoria "de pasta" é definida pela primeira subpasta do
    arquivo dentro de PASTA_ARQUIVOS.

    Ex: PASTA_ARQUIVOS/Cadastur/arquivo.csv
        -> pasta bruta "Cadastur"
        -> mapeada via CATEGORIAS_POR_PASTA para "cadastur"

    Arquivos soltos direto em PASTA_ARQUIVOS (sem subpasta) caem em
    CATEGORIA_PADRAO_SEM_PASTA.
    """
    caminho_absoluto = os.path.abspath(caminho)
    raiz_absoluta = os.path.abspath(pasta_raiz)

    relativo = os.path.relpath(caminho_absoluto, raiz_absoluta)
    partes = relativo.split(os.sep)

    if len(partes) <= 1:
        return CATEGORIA_PADRAO_SEM_PASTA

    pasta_bruta = partes[0]
    amigavel = CATEGORIAS_POR_PASTA.get(pasta_bruta.lower())

    if amigavel:
        return sanitizar_nome_categoria(amigavel)

    return sanitizar_nome_categoria(pasta_bruta)


def remover_extensoes(nome_arquivo):
    """
    Remove TODAS as extensões finais conhecidas de uma vez — cobre
    nomes com extensão duplicada por engano na hora do download/
    exportação (ex: "arquivo.csv.csv", "arquivo.xlsx.xlsx").
    """
    extensoes = EXTENSOES_CSV + EXTENSOES_EXCEL
    nome = nome_arquivo

    while True:
        raiz, ext = os.path.splitext(nome)

        if ext.lower() in extensoes:
            nome = raiz
        else:
            break

    return nome


def extrair_segmento_do_nome(nome_arquivo, categoria_pasta):
    """
    Extrai o segmento a partir do NOME do arquivo, para o caso em
    que vários segmentos de uma mesma fonte estão soltos na mesma
    pasta (distintos só pelo nome do arquivo), no formato:

        <prefixo_opcional>_<segmento>_<ano>[_T<trimestre>].<ext>

    Ex: "cadastur_acampamentoturistico_2008.csv.csv"
        -> segmento = "acampamentoturistico"

        "cadastur_agenciadeturismo_2016_T4.csv"
        -> segmento = "agenciadeturismo"

    Retorna None se não for possível identificar um segmento válido
    (nesse caso o chamador deve usar só a categoria da pasta, como
    antes — preserva o comportamento para fontes cujos arquivos já
    ficam corretamente organizados em uma subpasta por segmento, ou
    que não têm subdivisão por segmento).
    """
    base = remover_extensoes(nome_arquivo)

    match_ano = PADRAO_ANO.search(base)

    if not match_ano:
        return None

    antes_do_ano = base[:match_ano.start()].rstrip("_")

    if not antes_do_ano:
        return None

    # Remove o prefixo repetido do nome da categoria/pasta, se
    # existir (ex: "cadastur_" em "cadastur_acampamentoturistico").
    prefixo = f"{categoria_pasta}_"

    if antes_do_ano.lower().startswith(prefixo.lower()):
        antes_do_ano = antes_do_ano[len(prefixo):]

    segmento = antes_do_ano.strip("_")

    return segmento or None


def montar_categoria_final(categoria_pasta, segmento):
    if not segmento:
        return categoria_pasta

    return sanitizar_nome_categoria(f"{categoria_pasta}_{segmento}")


def extrair_ano_trimestre(nome_arquivo: str):
    match_ano = PADRAO_ANO.search(nome_arquivo)
    match_trimestre = PADRAO_TRIMESTRE.search(nome_arquivo)

    ano = match_ano.group(1) if match_ano else None
    trimestre = f"T{match_trimestre.group(1)}" if match_trimestre else None

    return ano, trimestre


def nome_tabela(categoria, ano):
    """
    A tabela agora depende só de categoria + ano — não existe mais
    uma tabela por trimestre. A tabela sempre guarda os dados do
    trimestre mais recente já importado (ver db_schema/processador).

    Como `categoria` já vem combinada com o segmento quando aplicável
    (ver montar_categoria_final), o nome final naturalmente separa
    os segmentos em tabelas distintas (ex: cadastur_acampamentoturistico_2008).
    """
    ano_seguro = ano or "ano_desconhecido"
    return f"{categoria}_{ano_seguro}"[:64]


def analisar_arquivos(arquivos, pasta_raiz=PASTA_ARQUIVOS):
    """
    Monta a lista de metadados de cada arquivo e descobre, por
    (categoria, ano), qual é o MAIOR trimestre presente NESTA
    EXECUÇÃO (melhor_do_run).

    A categoria aqui já é a "final": categoria da pasta combinada
    com o segmento extraído do nome do arquivo, quando aplicável —
    então o agrupamento por (categoria, ano) já separa
    automaticamente cada segmento em seu próprio grupo/tabela.

    Arquivos sem trimestre no nome não entram no cálculo de
    melhor_do_run — são tratados como "arquivo completo do ano" e
    sempre substituem o conteúdo da tabela (ver
    processador.decidir_acao).
    """
    info_arquivos = []
    trimestres_por_grupo = {}

    for caminho in arquivos:
        nome_arquivo = os.path.basename(caminho)

        categoria_pasta = extrair_categoria(caminho, pasta_raiz)
        segmento = extrair_segmento_do_nome(nome_arquivo, categoria_pasta)
        categoria = montar_categoria_final(categoria_pasta, segmento)

        ano, trimestre = extrair_ano_trimestre(nome_arquivo)

        info = {
            "caminho": caminho,
            "nome": nome_arquivo,
            "categoria": categoria,
            "categoria_pasta": categoria_pasta,
            "segmento": segmento,
            "ano": ano,
            "trimestre": trimestre,
        }

        info_arquivos.append(info)

        if trimestre is not None:
            chave = (categoria, ano)
            trimestres_por_grupo.setdefault(chave, set())
            trimestres_por_grupo[chave].add(int(trimestre[1]))

    melhor_do_run = {
        chave: f"T{max(numeros)}"
        for chave, numeros in trimestres_por_grupo.items()
    }

    return info_arquivos, melhor_do_run