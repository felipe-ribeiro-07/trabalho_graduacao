# -*- coding: utf-8 -*-
"""Identificação das tabelas de origem e escolha de uma tabela por ano."""

import re

import config
from log import log_info, log_aviso

# CATEGORIA_FORMATO_ANO[_Tn]  (já sem o prefixo cadastur_)
PADRAO_COM_FORMATO = re.compile(
    r"^(.+?)_(CSV|XLSX|XLS)_(20\d{2})(?:_T([1-4]))?$", re.IGNORECASE
)
# CATEGORIA_ANO[_Tn]
PADRAO_SEM_FORMATO = re.compile(
    r"^(.+?)_(20\d{2})(?:_T([1-4]))?$", re.IGNORECASE
)


def _remover_prefixo(nome):
    for prefixo in config.PREFIXOS_ORIGEM:
        if nome.upper().startswith(prefixo.upper()):
            return nome[len(prefixo):], True
    return nome, False


def identificar_tabela_origem(nome):
    """
    'cadastur_acampamentoturistico_2008' ->
        {categoria: 'ACAMPAMENTOTURISTICO', ano: 2008, trimestre: None, ...}
    Retorna None se o nome não seguir nenhum padrão.
    """
    sem_prefixo, tem_prefixo = _remover_prefixo(nome)

    if config.EXIGIR_PREFIXO and not tem_prefixo:
        return None

    m = PADRAO_COM_FORMATO.match(sem_prefixo)
    if m:
        return {
            "categoria": m.group(1).upper(),
            "tabela": nome,
            "ano": int(m.group(3)),
            "trimestre": int(m.group(4)) if m.group(4) else None,
            "formato": m.group(2).upper(),
        }

    m = PADRAO_SEM_FORMATO.match(sem_prefixo)
    if m:
        return {
            "categoria": m.group(1).upper(),
            "tabela": nome,
            "ano": int(m.group(2)),
            "trimestre": int(m.group(3)) if m.group(3) else None,
            "formato": None,
        }

    return None


def classificar_tabelas(nomes):
    """Separa os nomes em (configs_de_origem, ignoradas)."""
    configs, ignoradas = [], []
    for nome in nomes:
        item = identificar_tabela_origem(nome)
        if item is None:
            ignoradas.append(nome)
        else:
            configs.append(item)
    return configs, ignoradas


def escolher_tabelas_para_processar(tabelas):
    """
    Uma tabela por ano:
      1. formato preferido (XLSX > XLS > CSV)
      2. tabela anual sobre trimestral
      3. sem anual: maior trimestre
    """
    por_ano = {}
    for item in tabelas:
        por_ano.setdefault(item["ano"], []).append(item)

    escolhidas = []

    for ano in sorted(por_ano):
        opcoes = por_ano[ano]

        formatos = {i["formato"] for i in opcoes if i["formato"]}
        if formatos:
            preferido = next(
                (f for f in config.FORMATOS_ORIGEM if f in formatos), None
            )
            if preferido:
                log_info(
                    f"Ano {ano}: formatos ({', '.join(sorted(formatos))}). "
                    f"Prioridade: '{preferido}'."
                )
                opcoes = [i for i in opcoes if i["formato"] == preferido]

        anual = next((i for i in opcoes if i["trimestre"] is None), None)
        if anual:
            escolhidas.append(anual)
            log_info(f"Ano {ano}: usando '{anual['tabela']}' (anual).")
            continue

        trimestrais = [i for i in opcoes if i["trimestre"] is not None]
        if not trimestrais:
            log_aviso(f"Ano {ano}: nenhuma tabela válida encontrada.")
            continue

        maior = max(trimestrais, key=lambda i: i["trimestre"])
        escolhidas.append(maior)
        log_info(
            f"Ano {ano}: sem tabela anual. "
            f"Usando '{maior['tabela']}' (T{maior['trimestre']})."
        )

    return escolhidas
