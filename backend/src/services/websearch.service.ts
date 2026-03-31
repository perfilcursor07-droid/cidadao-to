import axios from 'axios';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// Busca via DuckDuckGo Instant Answer API (sem API key)
// Fallback: busca via Google com scraping leve
export async function searchWeb(query: string, maxResults = 5): Promise<SearchResult[]> {
  try {
    // Tenta DuckDuckGo HTML lite (mais confiável pra extrair links)
    const results = await searchDuckDuckGo(query, maxResults);
    if (results.length > 0) return results;
  } catch {}

  // Fallback: retorna vazio se não conseguir
  return [];
}

async function searchDuckDuckGo(query: string, max: number): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/`;
  const response = await axios.post(url, `q=${encodeURIComponent(query)}`, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    timeout: 10000,
  });

  const html = response.data as string;
  const results: SearchResult[] = [];

  // Extrai resultados do HTML do DuckDuckGo
  const linkRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  const snippetRegex = /<a[^>]+class="result__snippet"[^>]*>([^<]*(?:<[^>]+>[^<]*)*)<\/a>/g;

  const links: { url: string; title: string }[] = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null && links.length < max) {
    let href = match[1];
    // DuckDuckGo wraps URLs in redirect
    const uddg = href.match(/uddg=([^&]+)/);
    if (uddg) href = decodeURIComponent(uddg[1]);
    links.push({ url: href, title: match[2].replace(/<[^>]+>/g, '').trim() });
  }

  const snippets: string[] = [];
  while ((match = snippetRegex.exec(html)) !== null) {
    snippets.push(match[1].replace(/<[^>]+>/g, '').trim());
  }

  for (let i = 0; i < links.length; i++) {
    results.push({
      title: links[i].title,
      url: links[i].url,
      snippet: snippets[i] || '',
    });
  }

  return results;
}
