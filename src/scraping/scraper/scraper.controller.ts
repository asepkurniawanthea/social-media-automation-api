// src/scraping/scraper/scraper.controller.ts
import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { Roles } from '../../auth/decorators';
import { Role } from '../../auth/auth.types';

@ApiBearerAuth()
@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  // Scrape satu artikel
  @Roles(Role.Admin, Role.Editor)
  @Post('articles/:id')
  scrapeArticle(@Param('id', ParseIntPipe) id: number) {
    return this.scraperService.scrapeById(id);
  }
}
