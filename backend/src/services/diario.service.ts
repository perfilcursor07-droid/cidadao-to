import axios from 'axios';
import DiarioAnalysis from '../models/DiarioAnalysis';
import { analyzeText } from './anthropic.service';

export async function fetchAndAnalyzeDiario() {
  const today = new Date().toISOString().split('T')[0];

  const existing = await DiarioAnalysis.findOne({ where: { edition_date: today } });
  if (existing) {
    console.log(`Diário de ${today} já foi analisado.`);
    return;
  }

  try {
    // Placeholder: replace with actual D.O. API endpoint
    console.log(`Buscando Diário Oficial de ${today}...`);
    // const response = await axios.get(`https://diariooficial.to.gov.br/api/edicao/${today}`);
    // const text = response.data.content;

    // For now, log that the job ran
    console.log('Job do Diário Oficial executado (endpoint real precisa ser configurado).');
  } catch (error) {
    console.error('Erro ao buscar Diário Oficial:', error);
  }
}
