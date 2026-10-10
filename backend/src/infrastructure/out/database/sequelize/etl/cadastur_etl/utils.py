# -*- coding: utf-8 -*-
"""Funções utilitárias de texto e data."""

import re
import unicodedata
from datetime import datetime, date


def normalizar_chave(texto):
    """'Guia_de Turismo' / 'GUIADETURISMO' / 'guiaDeTurismo' -> 'GUIADETURISMO'."""
    sem_acento = (
        unicodedata.normalize("NFKD", str(texto))
        .encode("ascii", "ignore")
        .decode()
    )
    return re.sub(r"[^A-Z0-9]", "", sem_acento.upper())


def valor_limpo(valor):
    if valor is None:
        return None
    if isinstance(valor, str):
        valor = re.sub(r"\s+", " ", valor.strip())
        return valor or None
    return valor


FORMATOS_DATA = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%Y/%m/%d",
    "%Y-%m-%d %H:%M:%S",
    "%d/%m/%Y %H:%M:%S",
    "%Y-%m-%d %H:%M:%S.%f",
]


def normalizar_data(valor):
    if valor is None:
        return None
    if isinstance(valor, (datetime, date)):
        return valor.strftime("%Y-%m-%d")

    texto = str(valor).strip()
    if not texto:
        return None

    for formato in FORMATOS_DATA:
        try:
            return datetime.strptime(texto, formato).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None
