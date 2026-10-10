# -*- coding: utf-8 -*-
"""
Agrupamento das tabelas de origem por proximidade de categoria.

Fluxo:
  1. remove ruído do nome (_SHEET1, _COPY, _XLS...) e normaliza
     (sem acento / underscore);
  2. tenta casar com um nome conhecido (nomes.py) por igualdade ou
     similaridade -> destino amigável (tb_guias_turismo_acumulado);
  3. o que sobrar é agrupado por similaridade entre si e recebe nome
     automático (tb_<categoria>_acumulado);
  4. tudo que cai no mesmo destino vira UM grupo, processado UMA vez
     (a tabela é truncada só uma vez por grupo).
"""

import difflib
import re

import config
from nomes import NOMES_AMIGAVEIS
from utils import normalizar_chave

_SUFIXO = "_acumulado"
_PREFIXO = "tb_"

CHAVES_CONHECIDAS = {
    normalizar_chave(chave): destino
    for chave, destino in NOMES_AMIGAVEIS.items()
}


def limpar_ruido(categoria):
    limpo = categoria
    while True:
        anterior = limpo
        for padrao in config.PADROES_RUIDO:
            limpo = re.sub(padrao, "", limpo, flags=re.IGNORECASE)
        if limpo == anterior:
            return limpo


def _limitar(nome):
    if len(nome) <= config.LIMITE_NOME_TABELA_MYSQL:
        return nome
    corpo = nome[len(_PREFIXO):-len(_SUFIXO)]
    maximo = config.LIMITE_NOME_TABELA_MYSQL - len(_PREFIXO) - len(_SUFIXO)
    return f"{_PREFIXO}{corpo[:maximo]}{_SUFIXO}"


def nome_destino_automatico(chave):
    return _limitar(f"{_PREFIXO}{chave.lower()}{_SUFIXO}")


def _resolver_conhecida(chave):
    if chave in CHAVES_CONHECIDAS:
        return CHAVES_CONHECIDAS[chave]
    if chave in config.CATEGORIAS_NAO_MESCLAR:
        return None
    proximas = difflib.get_close_matches(
        chave,
        list(CHAVES_CONHECIDAS),
        n=1,
        cutoff=config.LIMIAR_NOME_CONHECIDO,
    )
    return CHAVES_CONHECIDAS[proximas[0]] if proximas else None


def agrupar_por_destino(configs):
    """
    Recebe a lista de tabelas de origem e devolve
    {destino: {"destino", "tabelas", "variantes", "automatico"}}.
    """
    por_chave = {}
    for item in configs:
        chave = normalizar_chave(limpar_ruido(item["categoria"]))
        item["chave"] = chave
        por_chave.setdefault(chave, []).append(item)

    destino_da_chave = {}
    desconhecidas = []

    for chave in por_chave:
        destino = _resolver_conhecida(chave)
        if destino:
            destino_da_chave[chave] = _limitar(destino)
        else:
            desconhecidas.append(chave)

    # agrupa por similaridade as categorias sem nome amigável
    automaticos = set()
    visitadas = set()
    desconhecidas.sort()

    for chave in desconhecidas:
        if chave in visitadas:
            continue
        grupo = [chave]
        visitadas.add(chave)

        if chave not in config.CATEGORIAS_NAO_MESCLAR:
            for outra in desconhecidas:
                if outra in visitadas or outra in config.CATEGORIAS_NAO_MESCLAR:
                    continue
                razao = difflib.SequenceMatcher(None, chave, outra).ratio()
                if razao >= config.LIMIAR_SIMILARIDADE:
                    grupo.append(outra)
                    visitadas.add(outra)

        # canônica = a com mais tabelas; empate -> nome mais curto
        canonica = max(grupo, key=lambda k: (len(por_chave[k]), -len(k)))
        destino = nome_destino_automatico(canonica)
        automaticos.add(destino)
        for k in grupo:
            destino_da_chave[k] = destino

    grupos = {}
    for chave, itens in por_chave.items():
        destino = destino_da_chave[chave]
        g = grupos.setdefault(
            destino,
            {
                "destino": destino,
                "tabelas": [],
                "variantes": set(),
                "automatico": destino in automaticos,
            },
        )
        g["tabelas"].extend(itens)
        g["variantes"].update(i["categoria"] for i in itens)

    for g in grupos.values():
        g["tabelas"].sort(
            key=lambda i: (i["ano"], i["trimestre"] or 0)
        )

    return grupos
