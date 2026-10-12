# -*- coding: utf-8 -*-
"""Configurações globais do ETL Cadastur."""

import os

DB_CONFIG = {
   "host": os.environ.get("DB_HOST", "127.0.0.1"),
    "port": int(os.environ.get("DB_PORT", "3306")),
    "user": os.environ.get("DB_USER", "dev"),
    "password": os.environ.get("DB_PASSWORD", "dev"),
    "database": os.environ.get("DB_NAME", "obs_fatec"),
    "use_pure": True,   # <- evita a extensão em C
}

# ----------------------------- Origem ---------------------------------------
# Só tabelas que começam com um destes prefixos são consideradas (evita
# misturar com RAIS ou qualquer outra fonte que também termine em _ANO).
PREFIXOS_ORIGEM = ["CADASTUR_"]
EXIGIR_PREFIXO = True

# Prioridade quando o mesmo ano existe em mais de um formato.
FORMATOS_ORIGEM = ["XLSX", "XLS", "CSV"]

# ----------------------------- Carga ----------------------------------------
BATCH_SIZE = 500
LIMPAR_TABELA_ANTES = True
LIMITE_NOME_TABELA_MYSQL = 64
MAX_TENTATIVAS_CONEXAO = 5
INTERVALO_RECONEXAO = 3

# ----------------------------- Agrupamento ----------------------------------
# Categoria que bate com um nome conhecido (nomes.py) acima deste limiar
# é mapeada para o destino amigável dele (pega plural/singular/typo).
LIMIAR_NOME_CONHECIDO = 0.88

# Categorias DESCONHECIDAS parecidas entre si acima deste limiar são mescladas.
LIMIAR_SIMILARIDADE = 0.90

# Chaves (já normalizadas, sem acento/underscore) que nunca devem ser mescladas.
CATEGORIAS_NAO_MESCLAR = set()

# Sufixos de ruído removidos do nome da categoria antes de comparar.
PADROES_RUIDO = [
    r"_SHEET\d+$",
    r"_PLANILHA\d*$",
    r"_COPY$",
    r"_C[OÓ]PIA$",
    r"_BACKUP$",
    r"_BKP$",
    r"_V\d+$",
    r"_OLD$",
    r"_ANTIGO$",
    r"_(XLSX|XLS|CSV)$",
]

# Filtro padrão: vazio = processa tudo. Aceita trechos do nome de destino
# (ex.: ["guias", "agencias"]). Pode ser sobrescrito por --filtro.
FILTRO_DESTINOS = []
