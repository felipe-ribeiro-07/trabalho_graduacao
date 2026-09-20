#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
logger.py

Log simples e com ícones para acompanhar a execução do importador
no terminal.
"""

from datetime import datetime

_ICONES = {
    "INFO": "ℹ️ ",
    "OK": "✅",
    "ERRO": "❌",
    "AVISO": "⚠️ ",
}


def log(msg: str, nivel: str = "INFO") -> None:
    icone = _ICONES.get(nivel, "")
    agora = datetime.now().strftime("%H:%M:%S")
    print(f"[{agora}] {icone}{nivel:<5} | {msg}", flush=True)