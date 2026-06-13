import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseUrlService } from './base-url.service';
import { Shop } from '../entities/shop.entity';

export interface Recommendation {
  shopId: string;
  score: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class RecommendationService {
  readonly url = `${this.baseUrl.getBaseUrl()}recommendations`;

  constructor(
    private http: HttpClient,
    private baseUrl: BaseUrlService,
  ) {}

  getRecommendations(): Observable<Recommendation[]> {
    return this.http
      .get<Recommendation[]>(this.url)
      .pipe(map((response: any) => response.body));
  }
}