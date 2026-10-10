# -*- coding: utf-8 -*-
"""Mapeamento automático das colunas das tabelas de origem."""

from utils import normalizar_chave, valor_limpo, normalizar_data

# campo destino -> (rótulo para log, nomes possíveis na origem)
# A comparação ignora maiúscula, acento, espaço e underscore:
# "razaoSocial", "Razão Social" e "razao_social" são o mesmo nome.
CAMPOS = {
    "razao_social": ("razão social", ["razao_social"]),
    "nome_fantasia": ("nome fantasia", ["nome_fantasia"]),
    "cnpj": ("CNPJ", ["cnpj"]),
    "porte": ("porte", ["porte", "porte_empresa"]),
    "situacao": (
        "situação",
        ["situacao", "situacao_atividade", "situacao_cadastral"],
    ),
    "segmento": (
        "segmento",
        [
            "segmento",
            "segmentos_turisticos",
            "segmentos",
            "atividade",
            "atividade_turistica",
        ],
    ),
    "uf": ("UF", ["uf", "estado", "sigla_uf"]),
    "municipio": ("município", ["municipio", "localidade", "cidade"]),
    "data_inicio_operacao": (
        "data início operação",
        [
            "data_inicio_operacao",
            "data_abertura",
            "data_inicio",
            "data_inicio_atividade",
        ],
    ),
}


def descobrir_mapeamento(colunas):
    por_chave = {normalizar_chave(c): c for c in colunas}
    mapeamento = {}
    for campo, (_, aliases) in CAMPOS.items():
        mapeamento[campo] = next(
            (
                por_chave[normalizar_chave(a)]
                for a in aliases
                if normalizar_chave(a) in por_chave
            ),
            None,
        )
    return mapeamento


def montar_registro(linha, mapeamento, ano, tabela_origem):
    def pegar(campo):
        coluna = mapeamento.get(campo)
        return linha.get(coluna) if coluna else None

    registro = {"ano": ano, "origem_tabela": tabela_origem}
    for campo in CAMPOS:
        if campo == "data_inicio_operacao":
            registro[campo] = normalizar_data(pegar(campo))
        else:
            registro[campo] = valor_limpo(pegar(campo))
    return registro
