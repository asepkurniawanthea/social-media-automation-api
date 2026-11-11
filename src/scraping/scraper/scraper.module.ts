// src/scraping/scraper/scraper.module.ts
import { Module } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { ArticleParserService } from './article-parser.service';

// Jika PrismaModule Anda tidak global, tambahkan: imports: [PrismaModule]
@Module({
  controllers: [ScraperController],
  providers: [ScraperService, ArticleParserService],
})
export class ScraperModule {}
