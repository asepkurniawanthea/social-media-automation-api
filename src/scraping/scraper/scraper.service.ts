// src/scraping/scraper/scraper.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticleParserService } from './article-parser.service';

const STATUS = {
  PENDING: 'pending',
  PROCESSED: 'processed',
  FAILED: 'failed',
} as const;

const BATCH_SIZE = 10; // jumlah artikel per putaran
const DELAY_BETWEEN_MS = 1000; // jeda antar request agar tidak membebani situs sumber

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type PendingArticle = { id: number; url: string; title: string | null };

const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : String(e);

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  // Penguncian di memori: mencegah dua putaran berjalan bersamaan
  // (cron berikutnya datang sebelum putaran sebelumnya selesai).
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: ArticleParserService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    // Matikan lewat .env di lingkungan dev: SCRAPER_ENABLED=false
    if (process.env.SCRAPER_ENABLED === 'false') return;
    await this.processPending();
  }

  /** Dipanggil endpoint: jalan di latar belakang, respons langsung dikembalikan. */
  runInBackground() {
    if (this.running) {
      return { started: false, message: 'Scraper is already running' };
    }
    void this.processPending().catch((e) =>
      this.logger.error(`Scraper run crashed: ${(e as Error).message}`),
    );
    return { started: true, message: 'Scraping started' };
  }

  async processPending(limit = BATCH_SIZE) {
    if (this.running) return { skipped: true };
    this.running = true;

    try {
      const pending = await this.prisma.articles.findMany({
        where: { status: STATUS.PENDING },
        orderBy: { id: 'asc' },
        take: limit,
        select: { id: true, url: true, title: true },
      });

      if (pending.length === 0) return { found: 0, processed: 0, failed: 0 };

      this.logger.log(`Found ${pending.length} pending article(s)`);

      let processed = 0;
      let failed = 0;
      for (const article of pending) {
        const error = await this.scrapeOne(article);
        if (error) failed++;
        else processed++;
        await sleep(DELAY_BETWEEN_MS);
      }

      this.logger.log(`Done: ${processed} processed, ${failed} failed`);
      return { found: pending.length, processed, failed };
    } finally {
      this.running = false;
    }
  }

  /** Scrape satu artikel (status apa pun). Berguna untuk mencoba ulang yang failed. */
  async scrapeById(id: number) {
    const article = await this.prisma.articles.findUnique({
      where: { id },
      select: { id: true, url: true, title: true },
    });
    if (!article) throw new NotFoundException(`Article ${id} not found`);

    const error = await this.scrapeOne(article);
    return { id, status: error ? STATUS.FAILED : STATUS.PROCESSED, error };
  }

  /** @returns null bila sukses, atau pesan error bila gagal. */
  private async scrapeOne(article: PendingArticle): Promise<string | null> {
    try {
      const parsed = await this.parser.scrape(article.url);

      await this.prisma.articles.update({
        where: { id: article.id },
        data: {
          raw_content: parsed.content,
          // undefined = biarkan nilai yang sudah ada (mis. diisi manual)
          author: parsed.author ?? undefined,
          published_at: parsed.published_at ?? undefined,
          scraped_at: new Date(),
          status: STATUS.PROCESSED,
          // Judul dari form tidak ditimpa; hanya diisi bila kosong.
          ...(!article.title && parsed.title ? { title: parsed.title } : {}),
        },
      });
      return null;
    } catch (e) {
      const message = errorMessage(e);
      this.logger.warn(`Article ${article.id} failed: ${message}`);

      await this.prisma.articles
        .update({
          where: { id: article.id },
          data: { status: STATUS.FAILED, scraped_at: new Date() },
        })
        .catch((err: unknown) =>
          this.logger.error(
            `Could not mark article ${article.id} failed: ${errorMessage(err)}`,
          ),
        );

      return message;
    }
  }
}
