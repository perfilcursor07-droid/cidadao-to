import axios from 'axios';
import Politician from '../models/Politician';

const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2';
const SENADO_API = 'https://legis.senado.leg.br/dadosabertos';
const WIKI_API = 'https://pt.wikipedia.org/w/api.php';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

/**
 * Busca foto de um deputado federal pela API da Câmara.
 */
async function fetchCamaraPhoto(name: string): Promise<string | null> {
  try {
    const res = await axios.get(`${CAMARA_API}/deputados`, {
      params: { nome: name.split(' ')[0], siglaUf: 'TO', itens: 10 },
      headers: { Accept: 'application/json' },
      timeout: 8000,
    });
    const nameLower = name.toLowerCase();
    const match = res.data.dados?.find((d: any) =>
      d.nome?.toLowerCase().includes(nameLower) || nameLower.includes(d.nome?.toLowerCase())
    );
    return match?.urlFoto || null;
  } catch { return null; }
}

/**
 * Busca foto de um senador pela API do Senado.
 */
async function fetchSenadoPhoto(name: string): Promise<string | null> {
  try {
    const res = await axios.get(`${SENADO_API}/senador/lista/atual`, {
      headers: { Accept: 'application/json' },
      timeout: 8000,
    });
    const parlamentares = res.data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
    const nameLower = name.toLowerCase();
    const match = parlamentares.find((s: any) => {
      const n = s.IdentificacaoParlamentar?.NomeParlamentar?.toLowerCase() || '';
      return n.includes(nameLower) || nameLower.includes(n);
    });
    return match?.IdentificacaoParlamentar?.UrlFotoParlamentar || null;
  } catch { return null; }
}

/**
 * Busca foto na Wikipedia PT via API.
 * Procura pelo nome do político e tenta extrair a imagem principal do artigo.
 */
async function fetchWikipediaPhoto(name: string, role: string): Promise<string | null> {
  try {
    // Busca o artigo
    const searchRes = await axios.get(WIKI_API, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: `${name} político Tocantins`,
        srlimit: 3,
        format: 'json',
        origin: '*',
      },
      headers: { 'User-Agent': UA },
      timeout: 8000,
    });

    const results = searchRes.data?.query?.search || [];
    if (results.length === 0) return null;

    // Tenta cada resultado
    for (const result of results) {
      const title = result.title;
      // Busca imagens do artigo
      const imgRes = await axios.get(WIKI_API, {
        params: {
          action: 'query',
          titles: title,
          prop: 'pageimages',
          pithumbsize: 400,
          format: 'json',
          origin: '*',
        },
        headers: { 'User-Agent': UA },
        timeout: 8000,
      });

      const pages = imgRes.data?.query?.pages || {};
      for (const page of Object.values(pages) as any[]) {
        if (page.thumbnail?.source) {
          return page.thumbnail.source;
        }
      }
    }
    return null;
  } catch { return null; }
}

/**
 * Busca foto via Google Images (scraping leve do DuckDuckGo).
 */
async function fetchDuckDuckGoImage(name: string, role: string): Promise<string | null> {
  try {
    const query = `${name} ${role} Tocantins foto`;
    const res = await axios.get('https://duckduckgo.com/', {
      params: { q: query, iax: 'images', ia: 'images' },
      headers: { 'User-Agent': UA },
      timeout: 8000,
    });
    // Tenta extrair vqd token para API de imagens
    const vqd = (res.data as string).match(/vqd='([^']+)'/)?.[1];
    if (!vqd) return null;

    const imgRes = await axios.get('https://duckduckgo.com/i.js', {
      params: { l: 'br-pt', o: 'json', q: query, vqd, f: ',,,', p: 1 },
      headers: { 'User-Agent': UA },
      timeout: 8000,
    });

    const images = imgRes.data?.results || [];
    // Pega a primeira imagem que parece ser uma foto de pessoa
    for (const img of images.slice(0, 3)) {
      if (img.image && !img.image.includes('logo') && !img.image.includes('banner')) {
        return img.image;
      }
    }
    return null;
  } catch { return null; }
}

/**
 * Busca foto para um político usando múltiplas fontes.
 * Ordem: API oficial (Câmara/Senado) → Wikipedia → DuckDuckGo
 */
export async function findPhotoForPolitician(name: string, role: string): Promise<string | null> {
  // 1. APIs oficiais
  if (role === 'dep_federal') {
    const photo = await fetchCamaraPhoto(name);
    if (photo) return photo;
  }
  if (role === 'senador') {
    const photo = await fetchSenadoPhoto(name);
    if (photo) return photo;
  }

  // 2. Wikipedia
  const wikiPhoto = await fetchWikipediaPhoto(name, role);
  if (wikiPhoto) return wikiPhoto;

  // 3. DuckDuckGo Images
  const ddgPhoto = await fetchDuckDuckGoImage(name, role);
  if (ddgPhoto) return ddgPhoto;

  return null;
}

/**
 * Busca e atualiza fotos de TODOS os políticos que não têm foto.
 * Retorna estatísticas do processo.
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
    console.log(`[Photos] Buscando foto: ${pol.name} (${pol.role})...`);
    try {
      const photo = await findPhotoForPolitician(pol.name, pol.role);
      if (photo) {
        await pol.update({ photo_url: photo });
        details.push({ name: pol.name, status: `✅ Foto encontrada` });
        found++;
        console.log(`[Photos] ✅ ${pol.name}: ${photo.substring(0, 60)}...`);
      } else {
        details.push({ name: pol.name, status: '❌ Não encontrada' });
        failed++;
        console.log(`[Photos] ❌ ${pol.name}: nenhuma foto encontrada`);
      }
    } catch (err: any) {
      details.push({ name: pol.name, status: `❌ Erro: ${err.message}` });
      failed++;
    }

    // Delay entre requisições para não sobrecarregar APIs
    await new Promise(r => setTimeout(r, 500));
  }

  return { total: withoutPhoto.length, found, failed, details };
}
