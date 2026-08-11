import { Component, ViewChild } from '@angular/core';
import { OrderService } from '../services/order.service';
import { ShopService } from '../services/shop.service';
import { LoginService } from '../services/login.service';
import { PasskeyService } from '../services/passkey.service';
import { RecommendationService } from '../services/recommendation.service';
import { ShopType } from '../entities/shopType.entity';
import { Shop } from '../entities/shop.entity';
import { ShopTypeService } from '../services/shop-type.service';
import { MatSidenav } from '@angular/material/sidenav';
import { User } from '../entities/user.entity';
import { UserManualService } from '../services/user-manual.service';

@Component({
  selector: 'app-home-customer',
  templateUrl: './home-customer.component.html',
  styleUrls: ['./home-customer.component.scss'],
})
export class HomeCustomerComponent {
  public shopTypes: ShopType[] = [];
  public shops: Shop[] = [];
  public recommendedShops: Shop[] = [];

  @ViewChild(MatSidenav)
  sidenav!: MatSidenav;

  constructor(
    private shopTypeService: ShopTypeService,
    private orderService: OrderService,
    private shopService: ShopService,
    private loginService: LoginService,
    private recommendationService: RecommendationService,
    private passkeyService: PasskeyService,
    private userManualService: UserManualService,
  ) {}

  loggedUser: User = this.loginService.getLoggedUser();

  ngOnInit() {
    this.getShopTypes();
    this.getAllShops();
    this.getRecommendedShops();
    this.orderService.resetProducts();
  }

  getShopTypes() {
    this.shopTypeService.getAll().subscribe((data: ShopType[]) => {
      this.shopTypes = data;
    });
  }

  getAllShops() {
    this.shopService.getAll().subscribe((data: Shop[]) => {
      this.shops = data;
    });
  }

  getRecommendedShops() {
    this.recommendationService.getRecommendations().subscribe({
      next: (recommendations) => {
        const shopIds = recommendations.map(r => r.shopId);  // ← sin .body

        this.shopService.getAll().subscribe((allShops: Shop[]) => {
          this.recommendedShops = shopIds
            .map(id => allShops.find(s => s.id === id))
            .filter((s): s is Shop => s !== undefined);
        });
      },
      error: () => {
        this.recommendedShops = [];
      }
    });
  }

  onRegisterPasskey() {
    this.passkeyService.tryRegisterPasskey().subscribe();
  }

  downloadManual() {
    this.userManualService.downloadUserManual('client');
  }

  logout() {
    this.loginService.logout();
  }
}