import axios from 'axios';
import Politician from '../models/Politician';

const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2';
const SENADO_API = 'https://legis.senado.leg.br/dadosabertos';
const WIKI_API = 'https://pt.wikipedia.org/w/api.php';
const UA = 'CidadaoTocantins/1.0 (contato@cidadaotocantins.online)';

/** Normaliza nome para comparação: remove acentos, lowercase */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Verifica se dois nomes têm sobreposição suficiente (pelo menos 2 palavras em comum) */
function namesMatch(a: string, b: string): boolean {
  const wordsA = normalizeName(a).split(/\s+/).filter(w => w.length > 2);
  const wordsB = normalizeName(b).split(/\s+/).filter(w => w.length > 2);
  const common = wordsA.filter(w => wordsB.includes(w));
  return common.length >= 2;
}

/** Busca foto de deputado federal pela API oficial da Câmara */
async function fetchCamaraPhoto(name: string): Promise<string | null> {
  try {
    // Busca por cada palavra do nome para aumentar chances
    const words = name.split(' ').filter(w => w.length > 3);
    for (const word of words.slice(0, 2)) {
      const res = await axios.get(`${CAMARA_API}/deputados`, {
        params: { nome: word, siglaUf: 'TO', itens: 20 },
        headers: { Accept: 'application/json' },
        timeout: 10000,
      });
      const match = res.data.dados?.find((d: any) => namesMatch(d.nome || '', name));
      if (match?.urlFoto) return match.urlFoto;
    }
    return null;
  } catch { return null; }
}

/** Busca foto de senador pela API oficial do Senado */
async function fetchSenadoPhoto(name: string): Promise<string | null> {
  try {
    const res = await axios.get(`${SENADO_API}/senador/lista/atual`, {
      headers: { Accept: 'application/json' },
      timeout: 10000,
    });
    const parlamentares = res.data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
    const match = parlamentares.find((s: any) => {
      const n = s.IdentificacaoParlamentar?.NomeParlamentar || '';
      return namesMatch(n, name);
    });
    return match?.IdentificacaoParlamentar?.UrlFotoParlamentar || null;
  } catch { return null; }
}

/**
 * Busca foto na Wikipedia PT.
 * Só aceita se o título do artigo contiver o nome do político (evita fotos erradas).
 */
async function fetchWikipediaPhoto(name: string, role: string): Promise<string | null> {
  try {
    const queries = [
      `${name} político Tocantins`,
      `${name} ${role === 'dep_estadual' ? 'deputado estadual' : role === 'prefeito' ? 'prefeito' : role} Tocantins`,
      name,
    ];

    for (const query of queries) {
      const searchRes = await axios.get(WIKI_API, {
        params: { action: 'query', list: 'search', srsearch: query, srlimit: 5, format: 'json', origin: '*' },
        headers: { 'User-Agent': UA },
        timeout: 8000,
      });

      const results = searchRes.data?.query?.search || [];

      for (const result of results) {
        const title: string = result.title;

        // Só aceita artigo cujo título contenha pelo menos uma palavra significativa do nome
        const titleNorm = normalizeName(title);
        const nameWords = normalizeName(name).split(/\s+/).filter(w => w.length > 3);
        const titleMatch = nameWords.filter(w => titleNorm.includes(w)).length >= 2;
        if (!titleMatch) continue;

        const imgRes = await axios.get(WIKI_API, {
          params: { action: 'query', titles: title, prop: 'pageimages', pithumbsize: 400, format: 'json', origin: '*' },
          headers: { 'User-Agent': UA },
          timeout: 8000,
        });

        const pages = imgRes.data?.query?.pages || {};
        for (const page of Object.values(pages) as any[]) {
          if (page.thumbnail?.source) return page.thumbnail.source;
        }
      }
    }
    return null;
  } catch { return null; }
}

/**
 * Busca foto para um político.
 * Ordem: API oficial (Câmara/Senado) → Wikipedia (com validação de nome)
 * DuckDuckGo removido por retornar fotos incorretas.
 */
export async function findPhotoForPolitician(name: string, role: string): Promise<string | null> {
  if (role === 'dep_federal') {
    const photo = await fetchCamaraPhoto(name);
    if (photo) return photo;
  }

  if (role === 'senador') {
    const photo = await fetchSenadoPhoto(name);
    if (photo) return photo;
  }

  // Para todos os cargos, tenta Wikipedia com validação
  const wikiPhoto = await fetchWikipediaPhoto(name, role);
  if (wikiPhoto) return wikiPhoto;

  return null;
}

/**
 * Busca e atualiza fotos de todos os políticos sem foto.
 */
export async function fetchAllMissingPhotos(): Promise<{
  total: number;
  found: number;
  failed: number;
  details: { name: string; status: string }[];
}> {
  const politicians = await Politician.findAll({
    where: { active: true },
    order: [['role', 'ASC'], ['name', 'ASC']],
  });

  const withoutPhoto = politicians.filter(p => !p.photo_url);
  console.log(`[Photos] ${withoutPhoto.length} políticos sem foto de ${politicians.length} total`);

  const details: { name: string; status: string }[] = [];
  let found = 0;
  let failed = 0;

  for (const pol of withoutPhoto) {
    console.log(`[Photos] Buscando: ${pol.name} (${pol.role})...`);
    try {
      const photo = await findPhotoForPolitician(pol.name, pol.role);
      if (photo) {
        await pol.update({ photo_url: photo });
        details.push({ name: pol.name, status: `✅ Encontrada` });
        found++;
      } else {
        details.push({ name: pol.name, status: '❌ Não encontrada' });
        failed++;
      }
    } catch (err: any) {
      details.push({ name: pol.name, status: `❌ Erro: ${err.message}` });
      failed++;
    }

    await new Promise(r => setTimeout(r, 600));
  }

  return { total: withoutPhoto.length, found, failed, details };
}
