#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
texto_utils.py

Funções de limpeza/normalização de texto: nomes de colunas, nomes de
categoria (derivados de pasta) e deduplicação de nomes repetidos.
"""

import re
import unicodedata


def _normalizar_para_snake(nome: str) -> str:
    nome = (
        unicodedata.normalize("NFKD", nome)
        .encode("ascii", "ignore")
        .decode("ascii")
    )
    nome = nome.lower()
    nome = re.sub(r"[^a-z0-9_]+", "_", nome)
    nome = re.sub(r"_+", "_", nome)
    return nome.strip("_")


def sanitizar_nome_coluna(nome) -> str:
    nome = str(nome).strip()

    if nome == "":
        nome = "coluna_sem_nome"

    if nome.lower().startswith("unnamed"):
        nome = "coluna_sem_nome"

    nome = _normalizar_para_snake(nome)

    if not nome:
        nome = "coluna_sem_nome"

    if nome[0].isdigit():
        nome = f"col_{nome}"

    return nome[:64]


def sanitizar_nome_categoria(nome) -> str:
    """
    Mesmo princípio de sanitizar_nome_coluna, usado para nomes de
    pasta que viram categoria / prefixo de tabela.
    """
    nome = _normalizar_para_snake(str(nome).strip())
    return (nome or "geral")[:48]


def deduplicar_colunas(colunas):
    vistos = {}
    resultado = []

    for coluna in colunas:
        if coluna not in vistos:
            vistos[coluna] = 0
            resultado.append(coluna)
        else:
            vistos[coluna] += 1
            novo_nome = f"{coluna}_{vistos[coluna]}"
            resultado.append(novo_nome[:64])

    return resultado