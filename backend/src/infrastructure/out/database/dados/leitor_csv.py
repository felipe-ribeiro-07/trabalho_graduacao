#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
leitor_csv.py

Leitura robusta de CSV:
- detecção de separador (";", "," ou tab);
- detecção de encoding por tentativa ESTRITA (evita trocar acentos
  por "�" silenciosamente — um encoding errado agora falha de
  verdade e o próximo candidato da lista é tentado);
- normalização de linhas com número de campos inconsistente
  (faltando -> NULL, sobrando -> unidos na última coluna).
"""

import csv
import os

import pandas as pd

from config import ENCODINGS_CSV, ENCODING_FALLBACK_TOLERANTE
from logger import log


def detectar_separador(caminho, encoding, modo_estrito=True):
    amostra = ""

    with open(
        caminho, "r", encoding=encoding,
        errors="strict" if modo_estrito else "replace", newline="",
    ) as arquivo:
        for _ in range(50):
            linha = arquivo.readline()
            if not linha:
                break
            amostra += linha

    contagens = {";": amostra.count(";"), ",": amostra.count(","), "\t": amostra.count("\t")}
    separador = max(contagens, key=contagens.get)

    if contagens[separador] == 0:
        return ";"

    return separador


def ler_csv_bruto(caminho, encoding, separador, modo_estrito=True):
    linhas = []

    with open(
        caminho, "r", encoding=encoding,
        errors="strict" if modo_estrito else "replace", newline="",
    ) as arquivo:
        leitor = csv.reader(
            arquivo, delimiter=separador, quotechar='"',
            doublequote=True, skipinitialspace=False,
        )

        for numero_linha, campos in enumerate(leitor, start=1):
            if not campos:
                continue
            if all(str(campo).strip() == "" for campo in campos):
                continue
            linhas.append((numero_linha, campos))

    if not linhas:
        raise ValueError("CSV vazio ou sem dados.")

    return linhas


def normalizar_linhas_csv(linhas, numero_colunas):
    resultado = []
    problemas = []

    for numero_linha, campos in linhas:
        quantidade = len(campos)

        if quantidade == numero_colunas:
            resultado.append(campos)
            continue

        if quantidade < numero_colunas:
            faltantes = numero_colunas - quantidade
            campos = campos + [""] * faltantes
            resultado.append(campos)
            problemas.append(
                f"linha {numero_linha}: {quantidade} campos (preenchida com {faltantes} NULL)"
            )
            continue

        extras = quantidade - numero_colunas
        inicio_ultimo_campo = numero_colunas - 1
        campos_corrigidos = campos[:inicio_ultimo_campo] + [
            ";".join(campos[inicio_ultimo_campo:])
        ]
        resultado.append(campos_corrigidos)
        problemas.append(
            f"linha {numero_linha}: {quantidade} campos (extras unidos na última coluna)"
        )

    return resultado, problemas


def _processar_linhas_csv(linhas, caminho):
    cabecalho = linhas[0][1]

    if not cabecalho:
        raise ValueError("Cabeçalho do CSV vazio.")

    numero_colunas = len(cabecalho)
    dados = linhas[1:]

    dados_normalizados, problemas = normalizar_linhas_csv(dados, numero_colunas)

    if problemas:
        quantidade_mostrar = 20
        texto_problemas = ", ".join(problemas[:quantidade_mostrar])

        if len(problemas) > quantidade_mostrar:
            texto_problemas += f" ... e mais {len(problemas) - quantidade_mostrar} problema(s)"

        log(
            f'CSV "{os.path.basename(caminho)}": {len(problemas)} linha(s) com quantidade '
            f'diferente do cabeçalho. Corrigidas automaticamente. Detalhes: {texto_problemas}',
            "AVISO",
        )

    return pd.DataFrame(dados_normalizados, columns=cabecalho)


def ler_csv_com_fallback(caminho):
    """
    Tenta decodificar o CSV com cada encoding de ENCODINGS_CSV, em
    modo ESTRITO. O primeiro que decodifica o arquivo inteiro sem
    erros é o escolhido. Se nenhum bater, cai num modo tolerante
    como último recurso, deixando um AVISO no log.
    """
    ultimo_erro = None

    for encoding in ENCODINGS_CSV:
        try:
            separador = detectar_separador(caminho, encoding, modo_estrito=True)
            linhas = ler_csv_bruto(caminho, encoding, separador, modo_estrito=True)
            df = _processar_linhas_csv(linhas, caminho)
            return df, encoding, separador

        except Exception as erro:
            ultimo_erro = erro
            continue

    log(
        f'Nenhum dos encodings ({", ".join(ENCODINGS_CSV)}) decodificou '
        f'"{os.path.basename(caminho)}" sem erros. Último erro: {ultimo_erro}. '
        f'Tentando modo TOLERANTE com "{ENCODING_FALLBACK_TOLERANTE}" — bytes inválidos '
        f'serão substituídos por "�" no texto. Revise este arquivo manualmente se possível.',
        "AVISO",
    )

    try:
        separador = detectar_separador(caminho, ENCODING_FALLBACK_TOLERANTE, modo_estrito=False)
        linhas = ler_csv_bruto(caminho, ENCODING_FALLBACK_TOLERANTE, separador, modo_estrito=False)
        df = _processar_linhas_csv(linhas, caminho)
        return df, f"{ENCODING_FALLBACK_TOLERANTE} (tolerante)", separador

    except Exception as erro_final:
        if ultimo_erro is not None:
            raise ultimo_erro
        raise erro_final