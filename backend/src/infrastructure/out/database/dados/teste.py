from config import PASTA_ARQUIVOS
from arquivo_info import listar_arquivos, analisar_arquivos

arquivos = list(listar_arquivos(PASTA_ARQUIVOS))
print(f"PASTA_ARQUIVOS = {PASTA_ARQUIVOS}")
print(f"{len(arquivos)} arquivo(s) encontrado(s)\n")

info_arquivos, _ = analisar_arquivos(arquivos, PASTA_ARQUIVOS)

categorias = sorted({info["categoria"] for info in info_arquivos})
print("Categorias identificadas:", categorias)

for info in info_arquivos[:20]:
    print(f"  {info['categoria']:30} | ano={info['ano']} | {info['nome']}")