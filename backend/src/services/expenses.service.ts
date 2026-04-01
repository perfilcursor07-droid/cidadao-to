import axios from 'axios';
import Politician from '../models/Politician';
import Expense from '../models/Expense';
import { Op } from 'sequelize';

const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2';
const SENADO_API = 'https://legis.senado.leg.br/dadosabertos';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

/**
 * Remove acentos e normaliza string para comparação.
 */
function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/**
 * Busca o ID do deputado na API da Câmara pelo nome.
 * Primeiro tenta buscar todos os deputados do TO, depois faz match por nome.
 */
async function findDeputadoId(name: string): Promise<number | null> {
  try {
    // Busca todos os deputados do TO (são poucos, ~8)
    const res = await axios.get(`${CAMARA_API}/deputados`, {
      params: { siglaUf: 'TO', itens: 50 },
      headers: { Accept: 'application/json' },
      timeout: 10000,
    });
    const dados = res.data.dados || [];
    const nameNorm = normalize(name);
    const nameParts = nameNorm.split(/\s+/);

    // Match exato normalizado
    let match = dados.find((d: any) => normalize(d.nome || '') === nameNorm);

    // Match por inclusão (nome do banco contém nome da API ou vice-versa)
    if (!match) {
      match = dados.find((d: any) => {
        const n = normalize(d.nome || '');
        return n.includes(nameNorm) || nameNorm.includes(n);
      });
    }

    // Match por primeiro e último nome
    if (!match && nameParts.length >= 2) {
      match = dados.find((d: any) => {
        const n = normalize(d.nome || '');
        return n.includes(nameParts[0]) && n.includes(nameParts[nameParts.length - 1]);
      });
    }

    // Match por primeiro nome apenas
    if (!match) {
      match = dados.find((d: any) => {
        const n = normalize(d.nome || '');
        return n.split(/\s+/)[0] === nameParts[0];
      });
    }

    if (match) {
      console.log(`[Expenses] Match: "${name}" → "${match.nome}" (ID: ${match.id})`);
    }
    return match?.id || null;
  } catch (err: any) {
    console.error(`[Expenses] Erro ao buscar deputado ${name}: ${err.message}`);
    return null;
  }
}

/**
 * Busca despesas de um deputado federal na API da Câmara.
 */
async function fetchCamaraDespesas(deputadoId: number, year: number): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  while (true) {
    try {
      const res = await axios.get(`${CAMARA_API}/deputados/${deputadoId}/despesas`, {
        params: { ano: year, itens: 100, pagina: page, ordem: 'DESC', ordenarPor: 'dataDocumento' },
        headers: { Accept: 'application/json' },
        timeout: 15000,
      });
      const items = res.data.dados || [];
      if (items.length === 0) break;
      all.push(...items);
      if (items.length < 100) break;
      page++;
    } catch { break; }
  }
  return all;
}

/**
 * Busca o código do senador na API do Senado.
 */
async function findSenadorCodigo(name: string): Promise<string | null> {
  try {
    const res = await axios.get(`${SENADO_API}/senador/lista/atual`, {
      headers: { Accept: 'application/json' },
      timeout: 10000,
    });
    const parlamentares = res.data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
    const nameNorm = normalize(name);
    const nameParts = nameNorm.split(/\s+/);

    // Match exato normalizado
    let match = parlamentares.find((s: any) => {
      const n = normalize(s.IdentificacaoParlamentar?.NomeParlamentar || '');
      return n === nameNorm;
    });

    // Match por inclusão
    if (!match) {
      match = parlamentares.find((s: any) => {
        const n = normalize(s.IdentificacaoParlamentar?.NomeParlamentar || '');
        const nComplete = normalize(s.IdentificacaoParlamentar?.NomeCompletoParlamentar || '');
        return n.includes(nameNorm) || nameNorm.includes(n) ||
               nComplete.includes(nameNorm) || nameNorm.includes(nComplete);
      });
    }

    // Match por primeiro e último nome
    if (!match && nameParts.length >= 2) {
      match = parlamentares.find((s: any) => {
        const n = normalize(s.IdentificacaoParlamentar?.NomeParlamentar || '');
        const nComplete = normalize(s.IdentificacaoParlamentar?.NomeCompletoParlamentar || '');
        const combined = n + ' ' + nComplete;
        return combined.includes(nameParts[0]) && combined.includes(nameParts[nameParts.length - 1]);
      });
    }

    // Match por UF (Tocantins) + primeiro nome
    if (!match) {
      match = parlamentares.find((s: any) => {
        const uf = s.IdentificacaoParlamentar?.SiglaPartidoParlamentar ? 
          s.IdentificacaoParlamentar?.UfParlamentar : null;
        const n = normalize(s.IdentificacaoParlamentar?.NomeParlamentar || '');
        return uf === 'TO' && n.split(/\s+/)[0] === nameParts[0];
      });
    }

    if (match) {
      console.log(`[Expenses] Match Senado: "${name}" → "${match.IdentificacaoParlamentar?.NomeParlamentar}" (Cod: ${match.IdentificacaoParlamentar?.CodigoParlamentar})`);
    }
    return match?.IdentificacaoParlamentar?.CodigoParlamentar || null;
  } catch (err: any) {
    console.error(`[Expenses] Erro ao buscar senador ${name}: ${err.message}`);
    return null;
  }
}

/**
 * Busca despesas de um senador (CEAPS).
 */
async function fetchSenadoDespesas(codigo: string, year: number): Promise<any[]> {
  try {
    const res = await axios.get(`${SENADO_API}/senador/${codigo}/despesas`, {
      params: { ano: year },
      headers: { Accept: 'application/json', 'User-Agent': UA },
      timeout: 15000,
    });
    // A estrutura do Senado é diferente
    const despesas = res.data?.DespesasParlamentar?.Parlamentar?.Despesas?.Despesa || [];
    return Array.isArray(despesas) ? despesas : [despesas];
  } catch { return []; }
}

/**
 * Sincroniza gastos de UM deputado federal.
 */
async function syncDeputadoExpenses(politician: Politician, year: number): Promise<number> {
  const depId = await findDeputadoId(politician.name);
  if (!depId) {
    console.log(`[Expenses] Deputado não encontrado na API: ${politician.name}`);
    return 0;
  }

  const despesas = await fetchCamaraDespesas(depId, year);
  console.log(`[Expenses] ${despesas.length} despesas de ${politician.name} (${year})`);

  let created = 0;
  for (const d of despesas) {
    const extId = `camara-${depId}-${d.codDocumento || d.numDocumento}-${d.dataDocumento}`;
    const [, wasCreated] = await Expense.findOrCreate({
      where: { external_id: extId },
      defaults: {
        politician_id: politician.id,
        year,
        month: d.mes || new Date(d.dataDocumento).getMonth() + 1,
        category: d.tipoDespesa || 'Outros',
        description: d.tipoDespesa || '',
        supplier: d.nomeFornecedor || null,
        document_number: d.numDocumento || null,
        amount: parseFloat(d.valorLiquido || d.valorDocumento || 0),
        source: 'camara',
        external_id: extId,
      },
    });
    if (wasCreated) created++;
  }
  return created;
}

/**
 * Sincroniza gastos de UM senador.
 */
async function syncSenadorExpenses(politician: Politician, year: number): Promise<number> {
  const codigo = await findSenadorCodigo(politician.name);
  if (!codigo) {
    console.log(`[Expenses] Senador não encontrado na API: ${politician.name}`);
    return 0;
  }

  const despesas = await fetchSenadoDespesas(codigo, year);
  console.log(`[Expenses] ${despesas.length} meses de despesas de ${politician.name} (${year})`);

  let created = 0;
  for (const d of despesas) {
    // Senado agrupa por mês e tipo
    const items = d.Valores?.ValoresDetalhados?.ValorDetalhe;
    if (!items) continue;
    const list = Array.isArray(items) ? items : [items];
    for (const item of list) {
      const extId = `senado-${codigo}-${year}-${d.Mes}-${item.TipoDocumento || 'x'}-${item.DataDocumento || Math.random()}`;
      const [, wasCreated] = await Expense.findOrCreate({
        where: { external_id: extId },
        defaults: {
          politician_id: politician.id,
          year,
          month: parseInt(d.Mes) || 1,
          category: d.TipoDespesa || 'Cota parlamentar',
          description: item.Detalhamento || d.TipoDespesa || '',
          supplier: item.Fornecedor || null,
          document_number: item.Documento || null,
          amount: parseFloat(item.ValorReembolsado || item.Valor || 0),
          source: 'senado',
          external_id: extId,
        },
      });
      if (wasCreated) created++;
    }
  }
  return created;
}

const ALETO_URL = 'https://www.al.to.leg.br/transparencia/verbaIndenizatoria';

/**
 * Busca a lista de deputados estaduais disponíveis na Assembleia do TO para um dado ano.
 */
async function fetchAletoDeputados(year: number): Promise<string[]> {
  try {
    const res = await axios.get(ALETO_URL, {
      headers: { 'User-Agent': UA },
      timeout: 15000,
    });
    const html = res.data as string;
    const regex = /<option value="([^"]+)"\s*(?:selected="selected")?\s*>([^<]+)<\/option>/g;
    const names: string[] = [];
    // Pega as options do select de parlamentar (depois de transparencia_parlamentar)
    const selectStart = html.indexOf('transparencia_parlamentar');
    if (selectStart === -1) return [];
    const selectHtml = html.substring(selectStart, html.indexOf('</select>', selectStart));
    let m;
    while ((m = regex.exec(selectHtml)) !== null) {
      if (m[1] && m[1] !== '') names.push(m[1]);
    }
    return names;
  } catch (err: any) {
    console.error(`[Expenses] Erro ao buscar deputados ALETO: ${err.message}`);
    return [];
  }
}

/**
 * Busca verba indenizatória de um deputado estadual na Assembleia do TO.
 */
async function fetchAletoDespesas(deputadoName: string, year: number, month: number): Promise<{ month: number; pdfUrl: string }[]> {
  try {
    const params = new URLSearchParams();
    params.append('transparencia.tipoTransparencia.codigo', '14');
    params.append('transparencia.ano', String(year));
    params.append('transparencia.mes', String(month));
    params.append('transparencia.parlamentar', deputadoName);

    const res = await axios.post(ALETO_URL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
      },
      timeout: 15000,
    });
    const html = res.data as string;
    const results: { month: number; pdfUrl: string }[] = [];

    // Extrai links de PDFs da tabela de resultados
    const pdfRegex = /href='([^']*transparencia\/baixar[^']*)'/g;
    let m;
    while ((m = pdfRegex.exec(html)) !== null) {
      results.push({
        month,
        pdfUrl: `https://www.al.to.leg.br${m[1]}`,
      });
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Sincroniza verba indenizatória de UM deputado estadual.
 */
async function syncDepEstadualExpenses(politician: Politician, year: number, aletoNames: string[]): Promise<number> {
  // Encontra o nome correspondente na lista da ALETO
  const nameNorm = normalize(politician.name);
  const nameParts = nameNorm.split(/\s+/);

  const aletoName = aletoNames.find(n => {
    const nn = normalize(n);
    return nn === nameNorm || nn.includes(nameNorm) || nameNorm.includes(nn) ||
      (nameParts.length >= 2 && nn.includes(nameParts[0]) && nn.includes(nameParts[nameParts.length - 1]));
  });

  if (!aletoName) {
    console.log(`[Expenses] Dep. Estadual não encontrado na ALETO: ${politician.name}`);
    return 0;
  }

  console.log(`[Expenses] Match ALETO: "${politician.name}" → "${aletoName}"`);
  let created = 0;

  // Busca mês a mês (1-12)
  const currentMonth = year === new Date().getFullYear() ? new Date().getMonth() + 1 : 12;
  for (let month = 1; month <= currentMonth; month++) {
    const docs = await fetchAletoDespesas(aletoName, year, month);
    for (const doc of docs) {
      const extId = `aleto-${normalize(aletoName)}-${year}-${month}-${doc.pdfUrl.split('/').pop()}`;
      const [, wasCreated] = await Expense.findOrCreate({
        where: { external_id: extId },
        defaults: {
          politician_id: politician.id,
          year,
          month: doc.month,
          category: 'Verba Indenizatória',
          description: `Verba Indenizatória - ${aletoName} - PDF disponível`,
          supplier: 'Assembleia Legislativa do Tocantins',
          document_number: doc.pdfUrl,
          amount: 0,
          source: 'aleto',
          external_id: extId,
        },
      });
      if (wasCreated) created++;
    }
    // Delay entre requests para não sobrecarregar
    await new Promise(r => setTimeout(r, 200));
  }
  return created;
}

/**
 * Sincroniza gastos de TODOS os deputados federais, senadores e deputados estaduais do TO.
 */
export async function syncAllExpenses(year?: number): Promise<{ total: number; politicians: number; details: string[] }> {
  const targetYear = year || new Date().getFullYear();
  const politicians = await Politician.findAll({
    where: { active: true, role: { [Op.in]: ['dep_federal', 'senador', 'dep_estadual'] } },
    order: [['role', 'ASC'], ['name', 'ASC']],
  });

  console.log(`[Expenses] Sincronizando gastos de ${politicians.length} parlamentares (${targetYear})...`);
  const details: string[] = [];
  let total = 0;

  // Pré-carrega lista de deputados da ALETO (para dep_estadual)
  let aletoNames: string[] = [];
  const hasDepEstadual = politicians.some(p => p.role === 'dep_estadual');
  if (hasDepEstadual) {
    aletoNames = await fetchAletoDeputados(targetYear);
    console.log(`[Expenses] ALETO: ${aletoNames.length} deputados encontrados para ${targetYear}`);
  }

  for (const pol of politicians) {
    try {
      let created = 0;
      if (pol.role === 'dep_federal') {
        created = await syncDeputadoExpenses(pol, targetYear);
        if (created === 0 && !year) {
          const prevYear = targetYear - 1;
          const prevCreated = await syncDeputadoExpenses(pol, prevYear);
          if (prevCreated > 0) {
            details.push(`${pol.name}: ${prevCreated} novas despesas (${prevYear})`);
            total += prevCreated;
            continue;
          }
        }
      } else if (pol.role === 'senador') {
        created = await syncSenadorExpenses(pol, targetYear);
        if (created === 0 && !year) {
          const prevYear = targetYear - 1;
          const prevCreated = await syncSenadorExpenses(pol, prevYear);
          if (prevCreated > 0) {
            details.push(`${pol.name}: ${prevCreated} novas despesas (${prevYear})`);
            total += prevCreated;
            continue;
          }
        }
      } else if (pol.role === 'dep_estadual') {
        created = await syncDepEstadualExpenses(pol, targetYear, aletoNames);
      }
      details.push(`${pol.name}: ${created} novas despesas`);
      total += created;
      console.log(`[Expenses] ${pol.name}: ${created} novas`);
    } catch (err: any) {
      details.push(`${pol.name}: Erro - ${err.message}`);
      console.error(`[Expenses] Erro ${pol.name}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  return { total, politicians: politicians.length, details };
}

/**
 * Busca gastos de um político específico agrupados por mês.
 */
export async function getExpensesByPolitician(politicianId: number, year?: number) {
  const targetYear = year || new Date().getFullYear();
  const expenses = await Expense.findAll({
    where: { politician_id: politicianId, year: targetYear },
    order: [['month', 'ASC'], ['amount', 'DESC']],
  });

  // Agrupar por mês
  const byMonth: Record<number, { total: number; items: typeof expenses }> = {};
  let grandTotal = 0;
  for (const e of expenses) {
    if (!byMonth[e.month]) byMonth[e.month] = { total: 0, items: [] };
    byMonth[e.month].total += Number(e.amount);
    byMonth[e.month].items.push(e);
    grandTotal += Number(e.amount);
  }

  // Agrupar por categoria
  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
  }

  return { year: targetYear, total: grandTotal, count: expenses.length, byMonth, byCategory, expenses };
}
