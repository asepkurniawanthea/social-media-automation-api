// src/scraping/scraper/article-parser.service.ts
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export interface ParsedArticle {
  title: string | null;
  author: string | null;
  published_at: Date | null;
  content: string;
}

type $ = cheerio.CheerioAPI;

const USER_AGENT = 'Mozilla/5.0 (compatible; SocialMediaAutomationBot/1.0)';
const TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 5 * 1024 * 1024;
const MIN_CONTENT_LENGTH = 200;

// Urutan = prioritas. Tambahkan selector khusus situs Anda di bagian atas.
const CONTENT_SELECTORS = [
  '[itemprop="articleBody"]',
  '.detail__body-text', // detik
  '.read__content', // kompas
  '.entry-content', // WordPress
  '.post-content',
  '.article-content',
  'article',
  'main',
];

const NOISE_SELECTORS =
  'script, style, noscript, iframe, form, nav, header, footer, aside, figure, figcaption, ' +
  '.ads, .advertisement, .related, .share, .comment, .comments';

const ARTICLE_LD_TYPES = ['NewsArticle', 'Article', 'BlogPosting', 'ReportageNewsArticle'];

const clean = (s?: string | null): string | null =>
  s?.replace(/\s+/g, ' ').trim() || null;

const toDate = (v?: string | null): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

@Injectable()
export class ArticleParserService {
  async scrape(url: string): Promise<ParsedArticle> {
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    // Metadata dibaca DULU, sebelum elemen "noise" dibuang dari DOM.
    const ld = this.readJsonLd($);

    const title = (
      clean(ld?.headline) ??
      this.meta($, 'og:title') ??
      clean($('h1').first().text()) ??
      clean($('title').first().text())
    )?.slice(0, 500) ?? null;

    const published_at =
      toDate(ld?.datePublished) ??
      toDate(
        this.meta($, 'article:published_time', 'datePublished', 'pubdate', 'publishdate'),
      ) ??
      toDate($('time[datetime]').first().attr('datetime'));

    const author = this.extractAuthor($, ld);
    const content = this.extractContent($, ld);

    return { title, author, published_at, content };
  }

  /* ------------------------------- Ekstraksi ------------------------------ */

  private meta($: $, ...names: string[]): string | null {
    for (const name of names) {
      const value = $(
        `meta[property="${name}"], meta[name="${name}"], meta[itemprop="${name}"]`,
      )
        .first()
        .attr('content');
      if (value?.trim()) return value.trim();
    }
    return null;
  }

  private readJsonLd($: $): Record<string, any> | null {
    const nodes: Record<string, any>[] = [];
    const collect = (v: any) => {
      if (Array.isArray(v)) v.forEach(collect);
      else if (v && typeof v === 'object') {
        nodes.push(v);
        if (v['@graph']) collect(v['@graph']);
      }
    };

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        collect(JSON.parse($(el).html() ?? ''));
      } catch {
        /* JSON-LD rusak: abaikan */
      }
    });

    return (
      nodes.find((n) =>
        ([] as string[]).concat(n['@type'] ?? []).some((t) => ARTICLE_LD_TYPES.includes(t)),
      ) ?? null
    );
  }

  private authorFromLd(author: any): string | null {
    if (!author) return null;
    if (typeof author === 'string') return clean(author);
    if (Array.isArray(author)) {
      return author.map((a) => this.authorFromLd(a)).filter(Boolean).join(', ') || null;
    }
    return typeof author.name === 'string' ? clean(author.name) : null;
  }

  private extractAuthor($: $, ld: Record<string, any> | null): string | null {
    const candidates = [
      this.authorFromLd(ld?.author),
      this.meta($, 'author'),
      this.meta($, 'article:author'),
      clean($('[rel="author"]').first().text()),
      clean($('.author, .author-name, [itemprop="author"]').first().text()),
    ];
    // article:author kadang berisi URL profil, bukan nama.
    const found = candidates.find((c) => c && !/^https?:\/\//i.test(c));
    return found ? found.slice(0, 255) : null;
  }

  private extractContent($: $, ld: Record<string, any> | null): string {
    $(NOISE_SELECTORS).remove();

    for (const selector of CONTENT_SELECTORS) {
      const root = $(selector).first();
      if (!root.length) continue;

      const text = root
        .find('p')
        .toArray()
        .map((el) => clean($(el).text()) ?? '')
        .filter((p) => p.length > 1)
        .join('\n\n');

      if (text.length >= MIN_CONTENT_LENGTH) return text;
    }

    // Cadangan: articleBody dari JSON-LD.
    const body = clean(ld?.articleBody);
    if (body && body.length >= MIN_CONTENT_LENGTH) return body;

    throw new Error('Article content not found or too short');
  }

  /* -------------------------------- Fetching ------------------------------ */

  private async fetchHtml(rawUrl: string): Promise<string> {
    let current = rawUrl;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      // Dicek di setiap hop, termasuk hasil redirect.
      await this.assertPublicUrl(current);

      const res = await fetch(current, {
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'id,en;q=0.8',
        },
      });

      if (res.status >= 300 && res.status < 400) {
        await res.body?.cancel();
        const location = res.headers.get('location');
        if (!location) throw new Error(`Redirect ${res.status} without Location header`);
        current = new URL(location, current).toString();
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const type = res.headers.get('content-type') ?? '';
      if (!type.includes('html')) {
        throw new Error(`Unsupported content-type: ${type || 'unknown'}`);
      }
      if (Number(res.headers.get('content-length') ?? 0) > MAX_HTML_BYTES) {
        throw new Error('Page too large');
      }

      const html = await res.text();
      if (html.length > MAX_HTML_BYTES) throw new Error('Page too large');
      return html;
    }

    throw new Error('Too many redirects');
  }

  /* ------------------------ Perlindungan SSRF ------------------------------ */
  // URL berasal dari input pengguna, jadi server tidak boleh diarahkan
  // ke localhost / jaringan internal / metadata cloud (169.254.x.x).

  private async assertPublicUrl(rawUrl: string): Promise<void> {
    const url = new URL(rawUrl); // melempar error bila URL tidak valid
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Only http/https URLs are allowed');
    }

    const host = url.hostname.replace(/^\[|\]$/g, '');
    const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });

    if (addresses.length === 0 || addresses.some((a) => this.isPrivateIp(a.address))) {
      throw new Error('URL points to a private or unresolvable address');
    }
  }

  private isPrivateIp(ip: string): boolean {
    if (isIP(ip) === 4) {
      const [a, b] = ip.split('.').map(Number);
      return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168)
      );
    }
    const v6 = ip.toLowerCase();
    return (
      v6 === '::' ||
      v6 === '::1' ||
      v6.startsWith('fc') ||
      v6.startsWith('fd') ||
      v6.startsWith('fe80') ||
      v6.startsWith('::ffff:') // IPv4-mapped: ditolak demi aman
    );
  }
}
