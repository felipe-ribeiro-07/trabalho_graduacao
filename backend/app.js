const express = require('express');
const cors = require('cors');
const AcampamentoTuristicoRoutes = require('../backend/src/infrastructure/in/adapters/http/routes/AcampamentoTuristico');
require('dotenv').config();



const app = express();

app.use(cors({
  origin: 'https://vbm6qvk5-5173.brs.devtunnels.ms',
  credentials: true 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/acampamento-turistico', AcampamentoTuristicoRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'API rodando com sucesso' });
});


module.exports = app;