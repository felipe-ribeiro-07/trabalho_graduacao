# -*- coding: utf-8 -*-
"""Mapeamento automático das colunas das tabelas de origem."""

from utils import normalizar_chave, valor_limpo, normalizar_data

# campo destino -> (rótulo para log, nomes possíveis na origem)
# A comparação ignora maiúscula, acento, espaço e underscore:
# "razaoSocial", "Razão Social" e "razao_social" são o mesmo nome.
CAMPOS = {
    "razao_social": (
        "razão social",
        [
            "razao_social",
            "nome_da_pessoa_juridica",
            "nome_pessoa_juridica",
            "pessoa_juridica",
            "nome_empresarial",
            "razao_social_nome_empresarial",
            "denominacao_social",
            "denominacao",
            "razao",
            "nome_da_empresa",
            "nome_empresa",
            "razao_social_empresa",
            "empresa",
        ],
    ),
    "nome_fantasia": (
        "nome fantasia",
        [
            "nome_fantasia",
            "nome_de_fantasia",
            "fantasia",
            "nome_comercial",
            "nome_do_estabelecimento",
            "nome_estabelecimento",
            "estabelecimento",
            "nome_do_empreendimento",
            "nome_empreendimento",
            "empreendimento",
            "marca",
        ],
    ),
    "cnpj": (
        "CNPJ",
        [
            "cnpj",
            "numero_cnpj",
            "numero_do_cnpj",
            "nr_cnpj",
            "num_cnpj",
            "cnpj_empresa",
            "cnpj_do_prestador",
            "cnpj_do_estabelecimento",
            "cnpj_completo",
        ],
    ),
    "porte": (
        "porte",
        [
            "porte",
            "porte_empresa",
            "porte_da_empresa",
            "porte_estabelecimento",
            "porte_do_estabelecimento",
            "porte_prestador",
            "porte_do_prestador",
            "classificacao_porte",
            "classificacao_do_porte",
            "enquadramento",
            "tamanho_da_empresa",
            "tamanho_empresa",
        ],
    ),
    "situacao": (
        "situação",
        [
            "situacao",
            "situacao_atividade",
            "situacao_da_atividade",
            "situacao_cadastral",
            "situacao_cadastro",
            "situacao_do_cadastro",
            "situacao_registro",
            "situacao_do_registro",
            "situacao_prestador",
            "situacao_do_prestador",
            "situacao_empresa",
            "situacao_da_empresa",
            "situacao_cadastur",
            "status",
            "status_cadastro",
            "status_do_cadastro",
            "status_cadastral",
            "status_atividade",
            "status_da_atividade",
            "status_prestador",
        ],
    ),
    "segmento": (
        "segmento",
        [
            "segmento",
            "segmentos",
            "segmento_turistico",
            "segmentos_turisticos",
            "segmento_de_atuacao",
            "atividade",
            "atividades",
            "atividade_turistica",
            "atividades_turisticas",
            "descricao_da_atividade",
            "descricao_atividade",
            "tipo_atividade",
            "tipo_de_atividade",
            "tipo_prestador",
            "tipo_de_prestador",
            "ramo_de_atividade",
            "ramo_atividade",
            "ramo",
            "categoria_atividade",
            "categoria",
        ],
    ),
    "uf": (
        "UF",
        [
            "uf",
            "sigla_uf",
            "uf_sigla",
            "sg_uf",
            "sigla_da_uf",
            "sigla_estado",
            "estado_sigla",
            "uf_estabelecimento",
            "estado_uf",
            "uf_estado",
            "unidade_federativa",
            "unidade_da_federacao",
            "estado",
        ],
    ),
    "municipio": (
        "município",
        [
            "municipio",
            "nome_municipio",
            "nome_do_municipio",
            "nm_municipio",
            "desc_municipio",
            "descricao_municipio",
            "municipio_nome",
            "municipio_estabelecimento",
            "municipio_do_estabelecimento",
            "municipio_cidade",
            "cidade_municipio",
            "localidade",
            "cidade",
            "mun",
        ],
    ),
    "data_inicio_operacao": (
        "data início operação",
        [
            "data_inicio_operacao",
            "data_inicio_da_operacao",
            "data_inicio_de_operacao",
            "data_de_inicio_da_operacao",
            "data_de_inicio_de_operacao",
            "dt_inicio_operacao",
            "inicio_operacao",
            "inicio_da_operacao",
            "data_abertura",
            "data_de_abertura",
            "data_abertura_empresa",
            "data_de_abertura_da_empresa",
            "data_inicio_atividade",
            "data_inicio_atividades",
            "data_inicio_das_atividades",
            "data_de_inicio_da_atividade",
            "data_de_inicio_das_atividades",
            "inicio_atividade",
            "inicio_das_atividades",
            "data_inicio_funcionamento",
            "data_de_inicio_de_funcionamento",
            "data_fundacao",
            "data_de_fundacao",
            "data_constituicao",
            "data_de_constituicao",
            "data_inicio",
            "data_de_inicio",
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
