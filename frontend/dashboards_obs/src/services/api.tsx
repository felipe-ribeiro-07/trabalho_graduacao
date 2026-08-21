import axios from 'axios';

export const api = axios.create({
  // Substitua pela URL onde seu backend está rodando localmente
  baseURL: `https://vbm6qvk5-3000.brs.devtunnels.ms`, 
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  }
});