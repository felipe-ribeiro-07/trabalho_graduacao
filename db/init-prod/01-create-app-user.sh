#!/bin/bash
# Executado automaticamente pelo MySQL na PRIMEIRA inicialização (volume vazio).
# Cria o usuário da aplicação SEM permissão de criar/alterar/apagar tabelas:
# apenas leitura e manipulação de dados (DML) no banco da aplicação.
set -e

mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<EOSQL
CREATE USER IF NOT EXISTS '${APP_DB_USER}'@'%' IDENTIFIED BY '${APP_DB_PASSWORD}';

-- Sem CREATE, ALTER, DROP, INDEX, REFERENCES, GRANT OPTION etc.
GRANT SELECT, INSERT, UPDATE, DELETE ON \`${MYSQL_DATABASE}\`.* TO '${APP_DB_USER}'@'%';

FLUSH PRIVILEGES;
EOSQL

echo ">> Usuário '${APP_DB_USER}' criado com permissões DML em '${MYSQL_DATABASE}'."