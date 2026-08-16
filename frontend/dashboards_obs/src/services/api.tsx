import axios from 'axios';

export const api = axios.create({
  // Substitua pela URL onde seu backend está rodando localmente
  baseURL: `http://localhost:3000`, 
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  }
});