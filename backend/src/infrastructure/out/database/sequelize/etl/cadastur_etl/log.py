# -*- coding: utf-8 -*-
"""Funções de log."""

from datetime import datetime


def _agora():
    return datetime.now().strftime("%H:%M:%S")


def log_info(m):
    print(f"[{_agora()}] ℹ️ INFO  | {m}")


def log_ok(m):
    print(f"[{_agora()}] ✅ OK    | {m}")


def log_aviso(m):
    print(f"[{_agora()}] ⚠️ AVISO | {m}")


def log_erro(m):
    print(f"[{_agora()}] ❌ ERRO  | {m}")


def separador():
    log_info("=" * 78)


def titulo(texto):
    separador()
    log_info(texto)
    separador()
