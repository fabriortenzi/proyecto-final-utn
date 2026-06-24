import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseUrlService } from './base-url.service';
import { Shop } from '../entities/shop.entity';
import { Product } from '../entities/product.entity';

export type statsType = {
  totalSellAmount: number,
  topProducts: productStatsType[]
}

export type productStatsType = {
    product: Product,
    amount: number
}

export type weeklySaleType = {
  _id: {
    year: number,
    week: number
  },
  totalSales: number
}

@Injectable({
  providedIn: 'root'
})

export class StatsService {

  private shop : Shop

  constructor(private http: HttpClient, private baseUrlService: BaseUrlService) { }

  readonly url = `${this.baseUrlService.getBaseUrl()}shops/`;


  getStats(productCategoryIds?: string[]) {
    let url = `${this.url}${this.shop.id}/true`
    let params = new HttpParams()

    if (productCategoryIds && productCategoryIds.length > 0) {
      productCategoryIds.forEach(id => {
        params = params.append('productCategories', id)
      })
    }

    return this.http.get(url, { params })
  }

  getShop() {
    return this.shop;
  }

  setShop(shop:Shop){
    this.shop = shop;
  }
}
