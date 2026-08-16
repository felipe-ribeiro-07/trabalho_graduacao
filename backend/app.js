const express = require('express');
const cors = require('cors');
const AcampamentoTuristicoRoutes = require('../backend/src/infrastructure/in/adapters/http/routes/AcampamentoTuristico');
const GuiasTuristicosRoutes = require('../backend/src/infrastructure/in/adapters/http/routes/GuiasTuristico');
const LocadoraDeVeiculosRoutes = require('../backend/src/infrastructure/in/adapters/http/routes/LocadoraDeVeiculos');
const AgenciasDeTurismo = require("../backend/src/infrastructure/in/adapters/http/routes/AgenciasDeTurismo")
const CasaDeEspetaculos = require("../backend/src/infrastructure/in/adapters/http/routes/CasaDeEspetaculos")


require('dotenv').config();



const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/acampamento-turistico', AcampamentoTuristicoRoutes);
app.use('/guias-turisticos', GuiasTuristicosRoutes);
app.use('/locadora-de-veiculos', LocadoraDeVeiculosRoutes);
app.use('/agencias-de-turismo', AgenciasDeTurismo);
app.use('/casa-de-espetaculos', CasaDeEspetaculos);



app.get('/', (req, res) => {
  res.json({ message: 'API rodando com sucesso' });
});


module.exports = app;