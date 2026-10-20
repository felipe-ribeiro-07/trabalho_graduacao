import { QueryTypes } from 'sequelize';
const sequelize = require('../../config/supabase'); // Ajuste o caminho do seu arquivo de conexão

export class SimeiCnaeGeralRepositoryImp {
  
  async rankingNacionalEstados() {
    // 1. Busca dinamicamente todas as tabelas que começam com "simei_cnae_" 
    // ignorando a tabela de dicionário "cnaes_simei"
    const queryTabelas = `
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
        AND TABLE_NAME LIKE 'simei_cnae_%' 
        AND TABLE_NAME != 'cnaes_simei'
    `;
    
    const tabelas: any[] = await sequelize.query(queryTabelas, { type: QueryTypes.SELECT });

    if (!tabelas || tabelas.length === 0) {
      return [];
    }

    // 2. Constrói a query de soma para cada tabela encontrada
    const uniaoQueries = tabelas.map(t => {
      // O MySQL pode retornar a chave em maiúsculo ou minúsculo dependendo do S.O.
      const nomeTabela = t.TABLE_NAME || t.table_name; 
      return `SELECT estado, SUM(CAST(total AS UNSIGNED)) as total_estado FROM ${nomeTabela} GROUP BY estado`;
    });

    // 3. Une todas as consultas (UNION ALL) e faz a soma final agrupada por estado
    const queryFinal = `
      SELECT estado, SUM(total_estado) as total_geral 
      FROM (${uniaoQueries.join(' UNION ALL ')}) as uniao_estados
      GROUP BY estado
      ORDER BY total_geral DESC
    `;

    return sequelize.query(queryFinal, { type: QueryTypes.SELECT });
  }
}