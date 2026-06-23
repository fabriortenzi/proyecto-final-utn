import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../services/order.service';
import { LoginService } from '../services/login.service';
import { ShopService } from '../services/shop.service';
import { Order } from '../entities/order.entity';

@Component({
  selector: 'app-pedidos-a-confirmar',
  templateUrl: './pedidos-a-confirmar.component.html',
  styleUrls: ['./pedidos-a-confirmar.component.scss'],
})
export class PedidosAConfirmarComponent {
  orders: Order[] = [];
  loading = false;
  shopId: string;

  constructor(
    private orderService: OrderService,
    private loginService: LoginService,
    private shopService: ShopService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    const loggedUser = this.loginService.getLoggedUser();
    this.shopService.getShopByOwnerId(loggedUser.id).subscribe({
      next: (shop: any) => {
        this.shopId = shop.id;
        this.orderService.findOrdersToConfirm(this.shopId).subscribe({
          next: (orders) => {
            this.orders = orders;
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          },
        });
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  confirmOrder(orderId: string) {
    this.orderService.confirmOrder(orderId).subscribe({
      next: () => {
        this.orders = this.orders.filter((o) => o.id !== orderId);
      },
    });
  }

  cancelOrder(orderId: string) {
    this.orderService.cancelOrder(orderId).subscribe({
      next: () => {
        this.orders = this.orders.filter((o) => o.id !== orderId);
      },
    });
  }

  getDescription(order: Order): string {
    return this.orderService.getDescription(order);
  }

  getStatusText(status: string): string {
    return this.orderService.getStatusDisplayText(status);
  }

  goBack() {
    this.router.navigate(['/home-shop']);
  }
}
