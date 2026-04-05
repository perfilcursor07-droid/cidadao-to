import axios from 'axios';
import Politician from '../models/Politician';

const API_URL = 'https://acessoainformacao.palmas.to.leg.br/api';

interface SalaryEvent {
  evento: string;
  tipo: number;
  provento: number;
  desconto: number;
}

interface RawServidor {
  matricula: string;
  nome: string;
  cargo: string;
  lotacao: string;
  vinculo: string;
  situacao_servidor: string;
  data_admissao: string;
  data_desligamento: string;
  carga_horaria_semanal: string;
  ano: string;
  mes: string;
  salario_base: string;
  proventos: string;
  descontos: string;
  liquido: string;
  eventos: string;
}

export interface Servidor {
  matricula: string;
  nome: string;
  cargo: string;
  lotacao: string;
  vinculo: string;
  situacao: string;
  dataAdmissao: string;
  dataDesligamento: string;
  cargaHoraria: number;
  ano: number;
  mes: number;
  salarioBase: number;
  proventos: number;
  descontos: number;
  liquido: number;
  eventos: SalaryEvent[];
}

function parseServidor(s: RawServidor): Servidor {
  return {
    matricula: s.matricula,
    nome: s.nome,
    cargo: s.cargo,
    lotacao: s.lotacao,
    vinculo: s.vinculo,
    situacao: s.situacao_servidor,
    dataAdmissao: s.data_admissao,
    dataDesligamento: s.data_desligamento,
    cargaHoraria: Number(s.carga_horaria_semanal) || 0,
    ano: Number(s.ano),
    mes: Number(s.mes),
    salarioBase: Number(s.salario_base) || 0,
    proventos: Number(s.proventos) || 0,
    descontos: Number(s.descontos) || 0,
    liquido: Number(s.liquido) || 0,
    eventos: JSON.parse(s.eventos || '[]'),
  };
}

export async function buscarServidores(
  busca: string = '',
  ano: number = new Date().getFullYear(),
  mes: number = new Date().getMonth() + 1,
  offset: number = 0,
  limite: number = 50
): Promise<{ total: number; dados: Servidor[]; ultimoMes: any }> {
  const query = {
    req1: {
      ano,
      mes,
      order: {},
      limit: `${offset}, ${limite}`,
      acao: 'sgservidores/listar',
      txtbusca: busca,
    },
  };

  const body = new URLSearchParams({
    multi_request: 'true',
    params: JSON.stringify(query),
  });

  const res = await axios.post(API_URL, body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Origin: 'https://acessoainformacao.palmas.to.leg.br',
      Referer: 'https://acessoainformacao.palmas.to.leg.br/cidadao/servidor/folha',
    },
    timeout: 30000,
  });

  const resultado = res.data?.req1;
  if (!resultado) throw new Error('Resposta inválida da API de transparência');

  return {
    total: Number(resultado.total) || 0,
    dados: (resultado.dados || []).map(parseServidor),
    ultimoMes: resultado.ultimoMes,
  };
}

/**
 * Busca servidores vinculados a um vereador pelo nome.
 * Tenta múltiplas buscas para encontrar o gabinete.
 */
export async function buscarServidoresPorVereador(
  nomeVereador: string,
  ano: number,
  mes: number
): Promise<{ total: number; dados: Servidor[] }> {
  // Tenta buscar pelo nome completo primeiro
  let resultado = await buscarServidores(nomeVereador, ano, mes, 0, 100);
  if (resultado.total > 0) return { total: resultado.total, dados: resultado.dados };

  // Tenta pelo primeiro nome
  const primeiro = nomeVereador.split(' ')[0];
  if (primeiro.length >= 3) {
    resultado = await buscarServidores(primeiro, ano, mes, 0, 100);
    if (resultado.total > 0) return { total: resultado.total, dados: resultado.dados };
  }

  return { total: 0, dados: [] };
}

/**
 * Busca TODOS os servidores da Câmara e agrupa por gabinete de vereador.
 * Vincula com os políticos cadastrados pelo nome.
 */
export async function buscarSalariosVereadores(ano: number, mes: number) {
  const vereadores = await Politician.findAll({
    where: { role: 'vereador', active: true },
    order: [['name', 'ASC']],
  });

  // Busca todos os servidores de uma vez (sem filtro de busca, paginando)
  const todosServidores: Servidor[] = [];
  let offset = 0;
  const limite = 100;
  let total = 0;

  do {
    const res = await buscarServidores('', ano, mes, offset, limite);
    total = res.total;
    todosServidores.push(...res.dados);
    offset += limite;
    if (res.dados.length < limite) break;
    await new Promise(r => setTimeout(r, 300));
  } while (offset < total);

  // Normaliza nome para comparação
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Palavras que não são nomes próprios — ignorar no matching
  const stopWords = new Set([
    'dr', 'dr.', 'dra', 'professor', 'professora', 'prof',
    'da', 'do', 'de', 'dos', 'das', 'del',
    'causa', 'animal', 'coletivo', 'somos', 'povo',
    'agesp',
  ]);

  // Variações comuns de grafia
  const aliases: Record<string, string[]> = {
    marcos: ['marcus'],
    marcus: ['marcos'],
  };

  // Extrai palavras-chave do nome (remove títulos, preposições)
  function getKeyWords(name: string): string[] {
    return normalize(name)
      .split(/\s+/)
      .filter(w => w.length >= 3 && !stopWords.has(w));
  }

  // Verifica se uma keyword está no texto (incluindo aliases)
  function keyInText(key: string, text: string): boolean {
    if (text.includes(key)) return true;
    const alts = aliases[key];
    if (alts) return alts.some(a => text.includes(a));
    return false;
  }

  const gabineteRegex = /^(?:gab(?:inete)?[.\s]*(?:do\s+)?ver[.\s]*(?:eador[a]?\s+)?)/i;

  // Pré-extrai todos os nomes de gabinete únicos
  const allGabNames = new Map<string, string>(); // gabNome normalizado -> lotacao original
  for (const s of todosServidores) {
    if (gabineteRegex.test(s.lotacao)) {
      const gabNome = normalize(s.lotacao.replace(gabineteRegex, '').replace(gabineteRegex, '').trim());
      if (!allGabNames.has(gabNome)) allGabNames.set(gabNome, s.lotacao);
    }
  }

  // Para cada vereador, encontra o MELHOR gabinete (maior score de match)
  function findBestGab(keywords: string[], primeiroKey: string, nomeNorm: string): string | null {
    let bestGab: string | null = null;
    let bestScore = 0;

    for (const [gabNome] of allGabNames) {
      // Match exato
      if (gabNome === nomeNorm) return gabNome;

      // Calcula score: quantas keywords batem
      let score = 0;
      const gabWords = gabNome.split(/\s+/);

      for (const kw of keywords) {
        if (keyInText(kw, gabNome)) score++;
      }

      // Primeiro keyword deve bater
      if (!keyInText(primeiroKey, gabNome)) continue;

      // Para nomes únicos (apelidos), score 1 é suficiente
      if (keywords.length <= 1 && score >= 1 && score > bestScore) {
        bestScore = score;
        bestGab = gabNome;
      }

      // Para nomes compostos, precisa de pelo menos 2 matches OU primeiro keyword como palavra exata
      if (keywords.length >= 2 && score >= 2 && score > bestScore) {
        bestScore = score;
        bestGab = gabNome;
      }

      // Se só tem 1 keyword (após stopwords) e bate como palavra exata
      if (keywords.length === 1 && gabWords.some(w => w === primeiroKey || (aliases[primeiroKey] || []).includes(w))) {
        if (score >= 1 && score > bestScore) {
          bestScore = score;
          bestGab = gabNome;
        }
      }
    }

    return bestGab;
  }

  // Agrupa servidores por vereador
  const resultados = vereadores.map(v => {
    const nomeNorm = normalize(v.name);
    const keywords = getKeyWords(v.name);
    const primeiroKey = keywords[0] || normalize(v.name).split(/\s+/)[0];

    // Encontra o gabinete que melhor corresponde a este vereador
    const matchedGab = findBestGab(keywords, primeiroKey, nomeNorm);

    const servidores = todosServidores.filter(s => {
      const cargoNorm = normalize(s.cargo);
      const nomeServNorm = normalize(s.nome);

      // 1. Match por lotação: só aceita se for o gabinete mapeado
      if (matchedGab && gabineteRegex.test(s.lotacao)) {
        const gabNome = normalize(s.lotacao.replace(gabineteRegex, '').replace(gabineteRegex, '').trim());
        if (gabNome === matchedGab) return true;
      }

      // 2. Match direto: o próprio vereador (cargo = VEREADOR)
      if (cargoNorm === 'vereador') {
        if (!keyInText(primeiroKey, nomeServNorm)) return false;
        if (keywords.length <= 1) return true;
        const otherMatches = keywords.slice(1).filter(k => keyInText(k, nomeServNorm)).length;
        if (otherMatches >= 1) return true;
      }

      return false;
    });

    return {
      politician_id: v.id,
      politician_name: v.name,
      servidores,
      total: servidores.length,
    };
  });

  return resultados;
}
