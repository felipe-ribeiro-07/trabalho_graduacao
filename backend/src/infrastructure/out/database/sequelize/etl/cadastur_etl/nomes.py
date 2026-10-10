# -*- coding: utf-8 -*-
"""
Nomes amigáveis das tabelas acumuladas.

Chave  : nome da categoria na tabela de origem (sem o prefixo cadastur_,
         sem ano/formato). Acento, maiúscula e underscore não importam.
Valor  : nome da tabela destino (padrão tb_<segmento_plural>_acumulado).

Variantes (plural, singular, typo leve) NÃO precisam ser listadas: a
categoria é comparada por similaridade com estas chaves (config.LIMIAR_NOME_CONHECIDO).
Várias chaves podem apontar para o mesmo destino.

Categorias que não baterem com nada aqui recebem nome automático
(tb_<categoria>_acumulado) e aparecem com ⚠️ no relatório. Rode
`python main.py --listar` para ver quais são e complete este dicionário.
"""

NOMES_AMIGAVEIS = {
    "ACAMPAMENTOTURISTICO":
        "tb_acampamentos_turisticos_acumulado",

    "AGENCIADETURISMO":
        "tb_agencias_turismo_acumulado",

    "ALOJAMENTOTURISTICO":
        "tb_alojamentos_turisticos_acumulado",

    "CASADEESPETACULOSEEQUIPAMENTODEANIMACAOTURISTICA":
        "tb_casas_espetaculos_animacao_acumulado",

    "CENTRODECONVENCOES":
        "tb_centros_convencoes_acumulado",

    "EMPREENDIMENTODEAPOIOAOTURISMONAUTICOOUAPESCADESPORTIVA":
        "tb_apoio_turismo_nautico_pesca_acumulado",

    "GUIADETURISMO":
        "tb_guias_turismo_acumulado",

    "LOCADORADEVEICULOS":
        "tb_locadoras_veiculos_acumulado",

    "MEIODEHOSPEDAGEM":
        "tb_meios_hospedagem_acumulado",

    "ORGANIZADORADEEVENTOS":
        "tb_organizadoras_eventos_acumulado",

    "PARQUEAQUATICOEEMPREENDIMENTODELAZER":
        "tb_parques_aquaticos_acumulado",

    "PARQUETEMATICO":
        "tb_parques_tematicos_acumulado",

    "PRESTADORESDESERVICODEINFRAESTRUTURA":
        "tb_prestadores_infraestrutura_acumulado",

    "PRESTADORESESPECIALIZADOSEMSEGMENTOSTURISTICOS":
        "tb_prestadores_especializados_acumulado",

    "RESTAURANTESBARESCAFESESIMILAR":
        "tb_restaurantes_bares_cafes_acumulado",

    "TRANSPORTADORATURISTICA":
        "tb_transportadoras_turisticas_acumulado",
}
