const express = require('express');
const cors = require('cors');
const AcampamentoTuristicoRoutes = require('../backend/src/infrastructure/in/adapters/http/routes/AcampamentoTuristico');
require('dotenv').config();



const app = express();

app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/acampamento-turistico', AcampamentoTuristicoRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'API rodando com sucesso' });
});


module.exports = app;