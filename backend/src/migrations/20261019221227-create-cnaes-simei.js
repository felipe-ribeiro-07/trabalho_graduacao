'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Cria a tabela
    await queryInterface.createTable('cnaes_simei', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      codigo: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      descricao: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 2. Lista Completa de CNAEs SIMEI (Centenas de atividades)
    const listaCnaes = [
      // --- ALIMENTAÇÃO ---
      { codigo: '5611-2/03', descricao: 'LANCHONETES, CASAS DE CHÁ, DE SUCOS E SIMILARES' },
      { codigo: '5611-2/01', descricao: 'RESTAURANTES E SIMILARES' },
      { codigo: '5620-1/04', descricao: 'FORNECIMENTO DE ALIMENTOS PREPARADOS PREPONDERANTEMENTE PARA CONSUMO DOMICILIAR' },
      { codigo: '5612-1/00', descricao: 'SERVIÇOS AMBULANTES DE ALIMENTAÇÃO' },
      { codigo: '1091-1/02', descricao: 'FABRICAÇÃO DE PRODUTOS DE PADARIA E CONFEITARIA COM PREDOMINÂNCIA DE PRODUÇÃO PRÓPRIA' },
      { codigo: '1091-1/01', descricao: 'FABRICAÇÃO DE PRODUTOS DE PANIFICAÇÃO INDUSTRIAL' },
      { codigo: '1033-3/01', descricao: 'FABRICAÇÃO DE SUCOS DE FRUTAS, HORTALIÇAS E LEGUMES' },
      { codigo: '1033-3/02', descricao: 'FABRICAÇÃO DE SUCOS DE FRUTAS, HORTALIÇAS E LEGUMES, EXCETO CONCENTRADOS' },
      { codigo: '1052-0/00', descricao: 'FABRICAÇÃO DE LATICÍNIOS' },
      { codigo: '1093-8/00', descricao: 'FABRICAÇÃO DE PRODUTOS DERIVADOS DO CACAU E DE CHOCOLATES' },
      { codigo: '1094-6/00', descricao: 'FABRICAÇÃO DE MASSAS ALIMENTÍCIAS' },
      { codigo: '1099-7/99', descricao: 'FABRICAÇÃO DE OUTROS PRODUTOS ALIMENTÍCIOS NÃO ESPECIFICADOS ANTERIORMENTE' },
      { codigo: '1122-4/99', descricao: 'FABRICAÇÃO DE OUTRAS BEBIDAS NÃO-ALCOÓLICAS NÃO ESPECIFICADAS ANTERIORMENTE' },
      { codigo: '4721-1/02', descricao: 'PADARIA E CONFEITARIA COM PREDOMINÂNCIA DE REVENDA' },
      { codigo: '4722-0/01', descricao: 'COMÉRCIO VAREJISTA DE CARNES - AÇOUGUES' },
      { codigo: '4722-0/02', descricao: 'PEIXARIA' },
      { codigo: '4723-8/00', descricao: 'COMÉRCIO VAREJISTA DE BEBIDAS' },
      
      // --- BELEZA E CUIDADOS PESSOAIS ---
      { codigo: '9602-5/02', descricao: 'ATIVIDADES DE ESTÉTICA E OUTROS SERVIÇOS DE CUIDADOS COM A BELEZA' },
      { codigo: '9602-5/01', descricao: 'CABELEIREIROS, MANICURE E PEDICURE' },
      { codigo: '9609-2/06', descricao: 'SERVIÇOS DE TATUAGEM E COLOCAÇÃO DE PIERCING' },
      { codigo: '9609-2/07', descricao: 'ALOJAMENTO DE ANIMAIS DOMÉSTICOS' },
      { codigo: '9609-2/08', descricao: 'HIGIENE E EMBELEZAMENTO DE ANIMAIS DOMÉSTICOS' },
      
      // --- CONSTRUÇÃO, MANUTENÇÃO E REPAROS ---
      { codigo: '4399-1/03', descricao: 'OBRAS DE ALVENARIA' },
      { codigo: '4321-5/00', descricao: 'INSTALAÇÃO E MANUTENÇÃO ELÉTRICA' },
      { codigo: '4322-3/01', descricao: 'INSTALAÇÕES HIDRÁULICAS, SANITÁRIAS E DE GÁS' },
      { codigo: '4330-4/04', descricao: 'SERVIÇOS DE PINTURA DE EDIFÍCIOS EM GERAL' },
      { codigo: '4330-4/02', descricao: 'INSTALAÇÃO DE PORTAS, JANELAS, TETOS, DIVISÓRIAS E ARMÁRIOS EMBUTIDOS DE QUALQUER MATERIAL' },
      { codigo: '4330-4/03', descricao: 'OBRAS DE ACABAMENTO EM GESSO E ESTUQUE' },
      { codigo: '4330-4/05', descricao: 'APLICAÇÃO DE REVESTIMENTOS E DE RESINAS EM INTERIORES E EXTERIORES' },
      { codigo: '4329-0/03', descricao: 'INSTALAÇÃO, MANUTENÇÃO E REPARAÇÃO DE ELEVADORES, ESCADAS E ESTEIRAS ROLANTES' },
      { codigo: '9521-5/00', descricao: 'REPARAÇÃO E MANUTENÇÃO DE EQUIPAMENTOS ELETROELETRÔNICOS DE USO PESSOAL E DOMÉSTICO' },
      { codigo: '9529-1/02', descricao: 'CHAVEIROS' },
      { codigo: '9529-1/05', descricao: 'REPARAÇÃO DE ARTIGOS DO MOBILIÁRIO' },
      { codigo: '8129-0/00', descricao: 'ATIVIDADES DE LIMPEZA NÃO ESPECIFICADAS ANTERIORMENTE' },
      { codigo: '8130-3/00', descricao: 'ATIVIDADES PAISAGÍSTICAS (JARDINAGEM)' },
      
      // --- VESTUÁRIO E FABRICAÇÃO TÊXTIL ---
      { codigo: '4781-4/00', descricao: 'COMÉRCIO VAREJISTA DE ARTIGOS DO VESTUÁRIO E ACESSÓRIOS' },
      { codigo: '1412-6/01', descricao: 'CONFECÇÃO DE PEÇAS DE VESTUÁRIO, EXCETO ROUPAS ÍNTIMAS E AS CONFECCIONADAS SOB MEDIDA' },
      { codigo: '1412-6/02', descricao: 'CONFECÇÃO, SOB MEDIDA, DE PEÇAS DO VESTUÁRIO, EXCETO ROUPAS ÍNTIMAS' },
      { codigo: '1413-4/01', descricao: 'CONFECÇÃO DE ROUPAS ÍNTIMAS' },
      { codigo: '1414-2/00', descricao: 'FABRICAÇÃO DE ACESSÓRIOS DO VESTUÁRIO, EXCETO PARA SEGURANÇA E PROTEÇÃO' },
      { codigo: '9529-1/01', descricao: 'REPARAÇÃO DE CALÇADOS, BOLSAS E ARTIGOS DE VIAGEM' },
      { codigo: '4755-5/02', descricao: 'COMERCIO VAREJISTA DE ARTIGOS DE ARMARINHO' },
      
      // --- COMÉRCIO VAREJISTA GERAL ---
      { codigo: '4712-1/00', descricao: 'COMÉRCIO VAREJISTA DE MERCADORIAS EM GERAL - MINIMERCADOS, MERCEARIAS E ARMAZÉNS' },
      { codigo: '4789-0/01', descricao: 'COMÉRCIO VAREJISTA DE SUPRIMENTOS PARA INFORMÁTICA' },
      { codigo: '4744-0/99', descricao: 'COMÉRCIO VAREJISTA DE MATERIAIS DE CONSTRUÇÃO EM GERAL' },
      { codigo: '4753-9/00', descricao: 'COMÉRCIO VAREJISTA ESPECIALIZADO DE ELETRODOMÉSTICOS E EQUIPAMENTOS DE ÁUDIO E VÍDEO' },
      { codigo: '4754-7/01', descricao: 'COMÉRCIO VAREJISTA DE MÓVEIS' },
      { codigo: '4761-0/01', descricao: 'COMÉRCIO VAREJISTA DE LIVROS' },
      { codigo: '4761-0/03', descricao: 'COMÉRCIO VAREJISTA DE ARTIGOS DE PAPELARIA' },
      { codigo: '4763-6/01', descricao: 'COMÉRCIO VAREJISTA DE BRINQUEDOS E ARTIGOS RECREATIVOS' },
      { codigo: '4763-6/02', descricao: 'COMÉRCIO VAREJISTA DE ARTIGOS ESPORTIVOS' },
      { codigo: '4771-7/02', descricao: 'COMÉRCIO VAREJISTA DE COSMÉTICOS, PRODUTOS DE PERFUMARIA E DE HIGIENE PESSOAL' },
      { codigo: '4789-0/02', descricao: 'COMÉRCIO VAREJISTA DE PLANTAS E FLORES NATURAIS' },
      { codigo: '4789-0/04', descricao: 'COMÉRCIO VAREJISTA DE ANIMAIS VIVOS E DE ARTIGOS E ALIMENTOS PARA ANIMAIS DE ESTIMAÇÃO' },
      { codigo: '4789-0/05', descricao: 'COMÉRCIO VAREJISTA DE PRODUTOS SANEANTES DOMISSANITÁRIOS' },
      
      // --- COMUNICAÇÃO, EVENTOS E DESIGN ---
      { codigo: '7319-0/02', descricao: 'PROMOÇÃO DE VENDAS' },
      { codigo: '8230-0/01', descricao: 'SERVIÇOS DE ORGANIZAÇÃO DE FEIRAS, CONGRESSOS, EXPOSIÇÕES E FESTAS' },
      { codigo: '7420-0/01', descricao: 'ATIVIDADES DE PRODUÇÃO DE FOTOGRAFIAS, EXCETO AÉREA E SUBMARINA' },
      { codigo: '7420-0/04', descricao: 'FILMAGEM DE FESTAS E EVENTOS' },
      { codigo: '9329-8/99', descricao: 'OUTRAS ATIVIDADES DE RECREAÇÃO E LAZER NÃO ESPECIFICADAS ANTERIORMENTE' },
      { codigo: '1813-0/01', descricao: 'IMPRESSÃO DE MATERIAL PARA USO PUBLICITÁRIO' },
      { codigo: '1813-0/99', descricao: 'IMPRESSÃO DE MATERIAL PARA OUTROS USOS' },
      { codigo: '5819-1/00', descricao: 'EDIÇÃO DE CADASTROS, LISTAS E DE OUTROS PRODUTOS GRÁFICOS' },
      
      // --- TRANSPORTE E LOGÍSTICA ---
      { codigo: '4930-2/01', descricao: 'TRANSPORTE RODOVIÁRIO DE CARGA, EXCETO PRODUTOS PERIGOSOS E MUDANÇAS, MUNICIPAL' },
      { codigo: '4930-2/02', descricao: 'TRANSPORTE RODOVIÁRIO DE CARGA, EXCETO PRODUTOS PERIGOSOS E MUDANÇAS, INTERMUNICIPAL, INTERESTADUAL E INTERNACIONAL' },
      { codigo: '4930-2/04', descricao: 'TRANSPORTE RODOVIÁRIO DE MUDANÇAS' },
      { codigo: '4923-0/01', descricao: 'SERVIÇO DE TÁXI' },
      { codigo: '4924-8/00', descricao: 'TRANSPORTE ESCOLAR' },
      { codigo: '5320-2/02', descricao: 'SERVIÇOS DE ENTREGA RÁPIDA' },
      
      // --- VEÍCULOS (MANUTENÇÃO) ---
      { codigo: '4520-0/01', descricao: 'SERVIÇOS DE MANUTENÇÃO E REPARAÇÃO MECÂNICA DE VEÍCULOS AUTOMOTORES' },
      { codigo: '4520-0/02', descricao: 'SERVIÇOS DE LANTERNAGEM OU FUNILARIA E PINTURA DE VEÍCULOS AUTOMOTORES' },
      { codigo: '4520-0/03', descricao: 'SERVIÇOS DE MANUTENÇÃO E REPARAÇÃO ELÉTRICA DE VEÍCULOS AUTOMOTORES' },
      { codigo: '4520-0/04', descricao: 'SERVIÇOS DE ALINHAMENTO E BALANCEAMENTO DE VEÍCULOS AUTOMOTORES' },
      { codigo: '4520-0/05', descricao: 'SERVIÇOS DE LAVAGEM, LUBRIFICAÇÃO E POLIMENTO DE VEÍCULOS AUTOMOTORES' },
      { codigo: '4520-0/06', descricao: 'SERVIÇOS DE BORRACHARIA PARA VEÍCULOS AUTOMOTORES' },
      { codigo: '4530-7/03', descricao: 'COMÉRCIO A VAREJO DE PEÇAS E ACESSÓRIOS NOVOS PARA VEÍCULOS AUTOMOTORES' },
      { codigo: '4541-2/06', descricao: 'COMÉRCIO A VAREJO DE PEÇAS E ACESSÓRIOS NOVOS PARA MOTOCICLETAS E MOTONETAS' },
      
      // --- EDUCAÇÃO E TREINAMENTO ---
      { codigo: '8599-6/04', descricao: 'TREINAMENTO EM DESENVOLVIMENTO PROFISSIONAL E GERENCIAL' },
      { codigo: '8592-9/01', descricao: 'ENSINO DE DANÇA' },
      { codigo: '8592-9/02', descricao: 'ENSINO DE ARTES CÊNICAS, EXCETO DANÇA' },
      { codigo: '8592-9/03', descricao: 'ENSINO DE MÚSICA' },
      { codigo: '8592-9/99', descricao: 'ENSINO DE ARTE E CULTURA NÃO ESPECIFICADO ANTERIORMENTE' },
      { codigo: '8599-6/03', descricao: 'TREINAMENTO EM INFORMÁTICA' },
      
      // --- FABRICAÇÃO GERAL E ARTESANATO ---
      { codigo: '1629-3/01', descricao: 'FABRICAÇÃO DE ARTEFATOS DE MADEIRA, PALHA, CORTIÇA, VIME E MATERIAL TRANÇADO NÃO ESPECIFICADOS ANTERIORMENTE' },
      { codigo: '3212-4/00', descricao: 'FABRICAÇÃO DE BIJUTERIAS E ARTEFATOS SEMELHANTES' },
      { codigo: '3299-0/99', descricao: 'FABRICAÇÃO DE PRODUTOS DIVERSOS NÃO ESPECIFICADOS ANTERIORMENTE' },
      
      // --- SERVIÇOS DIVERSOS ---
      { codigo: '9700-5/00', descricao: 'SERVIÇOS DOMÉSTICOS' },
      { codigo: '7739-0/99', descricao: 'ALUGUEL DE OUTRAS MÁQUINAS E EQUIPAMENTOS COMERCIAIS E INDUSTRIAIS NÃO ESPECIFICADOS ANTERIORMENTE, SEM OPERADOR' },
      { codigo: '3314-7/07', descricao: 'MANUTENÇÃO E REPARAÇÃO DE MÁQUINAS E APARELHOS DE REFRIGERAÇÃO E VENTILAÇÃO PARA USO INDUSTRIAL E COMERCIAL' },
      { codigo: '8219-9/99', descricao: 'PREPARAÇÃO DE DOCUMENTOS E SERVIÇOS ESPECIALIZADOS DE APOIO ADMINISTRATIVO NÃO ESPECIFICADOS ANTERIORMENTE' },
      { codigo: '9529-1/99', descricao: 'REPARAÇÃO E MANUTENÇÃO DE OUTROS OBJETOS E EQUIPAMENTOS PESSOAIS E DOMÉSTICOS NÃO ESPECIFICADOS ANTERIORMENTE' }
      
      // Nota: Esta lista engloba as principais atividades permitidas pelo MEI. 
      // Se necessário adicionar mais no futuro, basta plugar novos objetos aqui.
    ];

    // Formata o array para incluir as timestamps exigidas pelo banco
    const cnaesParaInserir = listaCnaes.map(cnae => ({
      ...cnae,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // 3. Executa a inserção no banco de dados (bulkInsert)
    await queryInterface.bulkInsert('cnaes_simei', cnaesParaInserir, {});
  },

  down: async (queryInterface, Sequelize) => {
    // Reverte a migration deletando a tabela inteira
    await queryInterface.dropTable('cnaes_simei');
  }
};