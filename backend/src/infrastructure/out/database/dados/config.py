#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
config.py

Configurações centrais do importador CADASTUR/RAIS -> MySQL:
caminhos, credenciais do banco, mapeamento de categorias por pasta
e parâmetros de leitura de arquivos.

É o único arquivo que você normalmente precisa editar para ajustar
o projeto a uma pasta/banco diferente.
"""

import os

# ============================================================================
# CAMINHOS
# ============================================================================

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Pasta raiz onde estão TODAS as fontes de dados. Cada subpasta
# dentro dela (e cada subpasta dessas subpastas, em qualquer nível)
# é descoberta automaticamente — não precisa listar pasta por pasta
# em lugar nenhum.
#
# Ex: se a estrutura for
#   SCRIPT_DIR/CADASTUR/...
#   SCRIPT_DIR/RAIS/...
# então PASTA_ARQUIVOS = SCRIPT_DIR (o padrão abaixo) já pega as duas.
#
# Se seus dados ficam em outro lugar (ex: SCRIPT_DIR/dados/...),
# só troque a linha abaixo.
PASTA_ARQUIVOS = os.environ.get("PASTA_DADOS", SCRIPT_DIR)

# Nomes de pasta que NUNCA são tratados como fonte de dados, mesmo
# que estejam dentro de PASTA_ARQUIVOS (evita o script varrer
# ambiente virtual, cache, controle de versão etc.).
PASTAS_IGNORADAS = {
    "venv", ".venv", "env",
    "__pycache__", ".git", ".idea", ".vscode",
    "node_modules",
}


# ============================================================================
# MYSQL
# ============================================================================

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": int(os.environ.get("DB_PORT", "3306")),
    "user": os.environ.get("DB_USER", "root"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "database": os.environ.get("DB_NAME", "obs_fatec"),

    "connection_timeout": 60,
    "autocommit": False,

    # Força utf8mb4 na conexão para não embaralhar acentos na
    # gravação/leitura, mesmo com o texto já decodificado certo em
    # Python.
    "charset": "utf8mb4",
    "use_unicode": True,

    # IMPORTANTE: usa o conector 100% em Python em vez da extensão C
    # nativa. A extensão C do mysql-connector-python pode crashar
    # silenciosamente (sem nenhuma exceção Python, sem log, o
    # processo simplesmente morre) em versões muito recentes do
    # Python, como a 3.14. use_pure=True evita esse problema.
    "use_pure": True,
}

MAX_TENTATIVAS_MYSQL = 5
SEGUNDOS_ENTRE_TENTATIVAS = 3
TAMANHO_LOTE_INSERT = 100

# Tabela interna que guarda, entre execuções do script, qual foi o
# último trimestre importado para cada (categoria, ano). É ela que
# permite saber quando apagar dados antigos (ex: T1) e substituir
# por um trimestre mais novo (ex: T2, T3, T4...).
TABELA_CONTROLE = "_etl_controle_importacao"


# ============================================================================
# CATEGORIAS POR PASTA (totalmente opcional)
# ============================================================================
# A categoria de cada arquivo é descoberta AUTOMATICAMENTE a partir
# do caminho das subpastas onde ele está — você não precisa cadastrar
# pasta nenhuma aqui. Ex:
#   CADASTUR/arquivo.csv              -> categoria "cadastur"
#   CADASTUR/AGENCIAS/arquivo.csv     -> categoria "cadastur_agencias"
#   RAIS/2024/arquivo.csv             -> categoria "rais" (o "2024" é
#                                         reconhecido como ano, não
#                                         entra no nome da categoria)
#
# Este dicionário só existe para o caso de você querer um nome de
# tabela mais bonito do que o nome literal da pasta de primeiro
# nível. É opcional — deixe vazio ({}) se não precisar.
#   pasta "Cadastur" -> tabela "guias_turisticos_2024"
CATEGORIAS_POR_PASTA = {
    # "cadastur": "guias_turisticos",
    # "rais": "segmento",
}

# Usado quando um arquivo está solto direto em PASTA_ARQUIVOS, sem
# estar dentro de nenhuma subpasta.
CATEGORIA_PADRAO_SEM_PASTA = "geral"


# ============================================================================
# LEITURA DE ARQUIVOS
# ============================================================================

EXTENSOES_CSV = (".csv",)
EXTENSOES_EXCEL = (".xlsx", ".xls", ".xlsm")

GRAVAR_METADADOS_ORIGEM = True

# Ordem de tentativa de encoding do CSV. utf-8/utf-8-sig primeiro
# (mais comuns em exports recentes), depois cp1252/latin1 (comuns em
# exports mais antigos de sistemas Windows brasileiros).
ENCODINGS_CSV = (
    "utf-8",
    "utf-8-sig",
    "cp1252",
    "latin1",
)

# Usado só se nenhum encoding acima decodificar o arquivo inteiro
# sem erros (modo tolerante, com substituição de caracteres
# inválidos e aviso bem visível no log).
ENCODING_FALLBACK_TOLERANTE = "cp1252"

SEPARADORES_CSV = (
    ";",
    ",",
    "\t",
)