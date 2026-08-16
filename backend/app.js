const express = require('express');
const cors = require('cors');

//Rotas//
const AcampamentoTuristicoRoutes = require('../backend/src/infrastructure/in/adapters/http/routes/AcampamentoTuristico');
const GuiasTuristicosRoutes = require('../backend/src/infrastructure/in/adapters/http/routes/GuiasTuristico');
const LocadoraDeVeiculosRoutes = require('../backend/src/infrastructure/in/adapters/http/routes/LocadoraDeVeiculos');
const AgenciasDeTurismo = require("../backend/src/infrastructure/in/adapters/http/routes/AgenciasDeTurismo")
const CasaDeEspetaculos = require("../backend/src/infrastructure/in/adapters/http/routes/CasaDeEspetaculos")
const CentroDeConvencoes = require("../backend/src/infrastructure/in/adapters/http/routes/CentroDeConvencoes")
const EmpreendimentosDeApoioAoTurismoNauticoOuPesca = require("../backend/src/infrastructure/in/adapters/http/routes/EmpreendimentosDeApoioAoTurismoNauticoOuPesca") 
const EmpreendimentosDeEntreterimentoLazerParquesAquaticos = require("../backend/src/infrastructure/in/adapters/http/routes/EmpreendimentosDeEntretrimentoLazerParquesAquaticos")
const MeiosDeHospedagem = require("../backend/src/infrastructure/in/adapters/http/routes/MeiosDeHospedagem")
const OrganizadoraDeEventos = require("../backend/src/infrastructure/in/adapters/http/routes/OrganizadoraDeEventos")
const ParquesTematicos = require("../backend/src/infrastructure/in/adapters/http/routes/ParquesTematicos")
const PrestadoresEspecializadosSeguimentoTuristico = require("../backend/src/infrastructure/in/adapters/http/routes/PrestadoresDeServicosEspecializados")
const PrestadoresDeServicosDeInfra = require("../backend/src/infrastructure/in/adapters/http/routes/PrestadoresDeServicosDeInfra")
const RestaurantesBaresECafes = require("../backend/src/infrastructure/in/adapters/http/routes/RestaurantesBaresECafes")
const TransportadoraTuristicas = require("../backend/src/infrastructure/in/adapters/http/routes/TransportadoraTuristica")



//necessario pra utilizar as infos do .env//
require('dotenv').config();

//Config express
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Rotas separadas por seguimentos
app.use('/acampamento-turistico', AcampamentoTuristicoRoutes);
app.use('/guias-turisticos', GuiasTuristicosRoutes);
app.use('/locadora-de-veiculos', LocadoraDeVeiculosRoutes);
app.use('/agencias-de-turismo', AgenciasDeTurismo);
app.use('/casa-de-espetaculos', CasaDeEspetaculos);
app.use('/centro-de-convencoes', CentroDeConvencoes);
app.use('/empreendimentos-de-apoio-ao-turismo-nautico-ou-pesca', EmpreendimentosDeApoioAoTurismoNauticoOuPesca);
app.use('/empreendimentos-de-entretenimento-lazer-parques-aquaticos', EmpreendimentosDeEntreterimentoLazerParquesAquaticos);
app.use('/meios-de-hospedagem', MeiosDeHospedagem);
app.use('/organizadora-de-eventos', OrganizadoraDeEventos);
app.use('/parques-tematicos', ParquesTematicos);
app.use('/prestadores-especializados-seguimento-turistico' , PrestadoresEspecializadosSeguimentoTuristico)
app.use('/prestadores-de-servicos-de-infra', PrestadoresDeServicosDeInfra)
app.use('/restaurantes-bares-e-cafes', RestaurantesBaresECafes)
app.use('/transportadora-turisticas', TransportadoraTuristicas)

//


app.get('/', (req, res) => {
  res.json({ message: 'API rodando com sucesso' });
});


module.exports = app;