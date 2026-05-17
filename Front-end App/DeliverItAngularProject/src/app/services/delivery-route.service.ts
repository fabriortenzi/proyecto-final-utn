import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BaseUrlService } from './base-url.service';
import { DeliveryRoute } from '../entities/delivery-route.entity';

@Injectable({
  providedIn: 'root',
})
export class DeliveryRouteService {
  readonly url = `${this.baseUrl.getBaseUrl()}delivery-routes`;

  constructor(
    private http: HttpClient,
    private baseUrl: BaseUrlService
  ) {}

  requestRoute(latitude: number, longitude: number): Observable<DeliveryRoute> {
    const body = { latitude, longitude };
    return this.http
      .post<DeliveryRoute>(`${this.url}/request`, body)
      .pipe(map((response: any) => response.data));
  }

  confirmRoute(routeId: string): Observable<DeliveryRoute> {
    return this.http
      .post<DeliveryRoute>(`${this.url}/${routeId}/confirm`, {})
      .pipe(map((response: any) => response.data));
  }

  completeStop(routeId: string, stopIndex: number): Observable<DeliveryRoute> {
    return this.http
      .put<DeliveryRoute>(`${this.url}/${routeId}/stops/${stopIndex}/complete`, {})
      .pipe(map((response: any) => response.data));
  }

  rejectRoute(routeId: string): Observable<void> {
    return this.http
      .post<void>(`${this.url}/${routeId}/reject`, {})
      .pipe(map((response: any) => response.data));
  }
}
