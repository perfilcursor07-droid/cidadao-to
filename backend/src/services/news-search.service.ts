import axios from 'axios';

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  date: string;
  snippet: string;
}

/**
 * Busca notícias reais via Google News RSS (gratuito, sem API key).
 * Retorna artigos com título, URL real, fonte e data.
 */
export async function searchNews(query: string, maxResults = 10): Promise<NewsArticle[]> {
  try {
    const encoded = encodeURIComponent(query);
    const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

    const response = await axios.get(rssUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const xml = response.data as string;
    const articles: NewsArticle[] = [];

    // Parse XML simples (sem dependência extra)
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    for (const item of items.slice(0, maxResults)) {
      const title = extractTag(item, 'title');
      const link = extractTag(item, 'link');
      const pubDate = extractTag(item, 'pubDate');
      const source = extractTag(item, 'source');
      const description = extractTag(item, 'description');

      if (!title || !link) continue;

      // Google News redireciona — pega a URL real
      let realUrl = link;
      try {
        const resp = await axios.get(link, {
          timeout: 8000,
          maxRedirects: 10,
          validateStatus: () => true,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        // Pega URL final após redirects
        const finalUrl = resp.request?.res?.responseUrl || resp.request?.responseURL;
        if (finalUrl && !finalUrl.includes('news.google.com')) {
          realUrl = finalUrl;
        } else {
          // Tenta extrair do HTML se é uma página de redirect
          const html = typeof resp.data === 'string' ? resp.data : '';
          const metaRefresh = html.match(/url=([^"'\s>]+)/i);
          const jsRedirect = html.match(/window\.location\s*=\s*["']([^"']+)/i);
          const dataUrl = html.match(/data-url="([^"]+)"/i);
          const extracted = metaRefresh?.[1] || jsRedirect?.[1] || dataUrl?.[1];
          if (extracted && extracted.startsWith('http')) {
            realUrl = extracted;
          }
        }
      } catch {
        // Mantém o link do Google News
      }

      articles.push({
        title: decodeHtml(title),
        url: realUrl,
        source: source || extractSourceFromUrl(realUrl),
        date: pubDate || '',
        snippet: decodeHtml(description?.replace(/<[^>]+>/g, '') || ''),
      });
    }

    return articles;
  } catch (error) {
    console.error('[NewsSearch] Erro:', error);
    return [];
  }
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`));
  return match ? (match[1] || match[2] || '').trim() : '';
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractSourceFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return hostname;
  } catch {
    return '';
  }
}
