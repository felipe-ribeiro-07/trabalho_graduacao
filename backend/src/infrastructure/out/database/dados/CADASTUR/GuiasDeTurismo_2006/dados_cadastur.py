import pandas as pd
import glob
import os
import re

def gerar_tabela_exata(diretorio_base="."):
    locais_alvo = [
        "BRASIL", "SÃO PAULO", "ALAMBARI", "ALUMÍNIO", "ANGATUBA",
        "ARAÇARIGUAMA", "ARAÇOIABA DA SERRA", "BOITUVA", "CAPELA DO ALTO",
        "CERQUILHO", "CESÁRIO LANGE", "GUAREÍ", "IBIÚNA", "IPERÓ",
        "ITAPETININGA", "ITU", "JUMIRIM", "MAIRINQUE", "PIEDADE",
        "PILAR DO SUL", "PORTO FELIZ", "SALTO", "SALTO DE PIRAPORA",
        "SÃO MIGUEL ARCANJO", "SÃO ROQUE", "SARAPUÍ", "SOROCABA",
        "TAPIRAÍ", "TATUÍ", "TIETÊ", "VOTORANTIM"
    ]

    cidades_gabarito = set(locais_alvo) - {"BRASIL", "SÃO PAULO"}

    padrao_pesquisa = os.path.join(diretorio_base, "cadastur_guiasturisticos_*")
    todos_arquivos = glob.glob(padrao_pesquisa + ".xlsx") + glob.glob(padrao_pesquisa + ".csv")

    if not todos_arquivos:
        print("Nenhum arquivo encontrado.")
        return None

    arquivos_por_ano = {}
    for arquivo in todos_arquivos:
        nome_arquivo = os.path.basename(arquivo)
        match = re.search(r'cadastur_guiasturisticos_(.*?)\.(csv|xlsx)', nome_arquivo)
        if not match:
            continue
        ano = match.group(1)
        ext = match.group(2)

        # Se ainda não tem esse ano, adiciona. Se já tem, só substitui se o novo for .xlsx
        if ano not in arquivos_por_ano or ext == 'xlsx':
            arquivos_por_ano[ano] = arquivo

    # Ordena por ano (crescente) antes de processar
    arquivos_ordenados = sorted(arquivos_por_ano.items(), key=lambda x: x[0])

    print("Calculando totais e moldando a tabela...\n")
    dados_agregados = []

    for ano, arquivo in arquivos_ordenados:
        nome_arquivo = os.path.basename(arquivo)
        print(f"Processando: {nome_arquivo}  (ano={ano})")

        try:
            if arquivo.endswith('.xlsx'):
                df = pd.read_excel(arquivo)
            else:
                df = pd.read_csv(arquivo, sep=';', encoding='latin1', on_bad_lines='skip', low_memory=False)

            df = df.dropna(how='all')
            df.columns = [str(c).upper().strip() for c in df.columns]

            col_cidade = next((c for c in df.columns if c in ['MUNICÍPIO', 'MUNICIPIO', 'CIDADE','Cidade','Municiopio','Município']), None)
            col_estado = next((c for c in df.columns if c in ['UF', 'ESTADO']), None)

            # BRASIL = total real do arquivo
            dados_agregados.append(pd.DataFrame([{'Localidade': 'BRASIL', 'Ano': ano, 'Total': len(df)}]))

            # SÃO PAULO = todas as linhas com UF == SP
            mask_sp = None
            if col_estado:
                df[col_estado] = df[col_estado].astype(str).str.upper().str.strip()
                mask_sp = df[col_estado].isin(['SP', 'SÃO PAULO', 'SAO PAULO'])
                dados_agregados.append(pd.DataFrame([{'Localidade': 'SÃO PAULO', 'Ano': ano, 'Total': int(mask_sp.sum())}]))

            # Contagem individual por cidade
            if col_cidade:
                df[col_cidade] = df[col_cidade].astype(str).str.upper().str.strip()
                cont_cidades = df.groupby(col_cidade).size().reset_index(name='Total')
                cont_cidades.rename(columns={col_cidade: 'Localidade'}, inplace=True)
                cont_cidades['Ano'] = ano
                dados_agregados.append(cont_cidades)

                # OUTRAS CIDADES SP = SP mas fora do gabarito
                if mask_sp is not None:
                    df_sp = df[mask_sp]
                    outras_sp = df_sp[~df_sp[col_cidade].isin(cidades_gabarito)]
                    dados_agregados.append(pd.DataFrame([{
                        'Localidade': 'OUTRAS CIDADES SP',
                        'Ano': ano,
                        'Total': len(outras_sp)
                    }]))

        except Exception as e:
            print(f"Erro ao processar {nome_arquivo}: {e}")

    if not dados_agregados:
        return None

    df_final = pd.concat(dados_agregados, ignore_index=True)

    tabela_pivot = df_final.pivot_table(
        index='Localidade',
        columns='Ano',
        values='Total',
        aggfunc='sum',
        fill_value=0
    )

    ordem_final = locais_alvo + ["OUTRAS CIDADES SP"]
    tabela_exata = tabela_pivot.reindex(ordem_final).fillna(0).astype(int)
    tabela_exata = tabela_exata.reindex(sorted(tabela_exata.columns), axis=1)

    return tabela_exata

# --- Execução ---
if __name__ == "__main__":
    relatorio = gerar_tabela_exata()

    if relatorio is not None:
        nome_saida = 'tabela_cadastur_final3.xlsx'
        relatorio.to_excel(nome_saida)
        print(f"\nSucesso! Tabela gerada em: '{nome_saida}'.")