#!/bin/bash
# Executado automaticamente pelo MySQL na PRIMEIRA inicialização (volume vazio).
# Cria um usuário de DESENVOLVIMENTO com acesso total (equivalente ao root).
# NUNCA use este usuário/script em produção.
set -e

mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<EOSQL
CREATE USER IF NOT EXISTS '${DEV_DB_USER}'@'%' IDENTIFIED BY '${DEV_DB_PASSWORD}';

GRANT ALL PRIVILEGES ON *.* TO '${DEV_DB_USER}'@'%' WITH GRANT OPTION;

FLUSH PRIVILEGES;
EOSQL

echo ">> Usuário de desenvolvimento '${DEV_DB_USER}' criado com acesso total."