import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { OrderService } from '../services/order.service';
import { Order } from '../entities/order.entity';

@Component({
  selector: 'app-customer-current-orders',
  templateUrl: './customer-current-orders.component.html',
  styleUrls: ['./customer-current-orders.component.scss'],
})
export class CustomerCurrentOrdersComponent {
  currentOrders: Order[] = [];
  historyOrders: Order[] = [];

  constructor(
    private orderService: OrderService,
    private location: Location,
  ) {}

  ngOnInit() {
    this.orderService.findAllCustomerOrders().subscribe((response) => {
      this.currentOrders = response.filter(
        (o) =>
          o.status === 'PENDING_CONFIRMATION' ||
          o.status === 'CONFIRMED' ||
          o.status === 'PENDING_DELIVERY',
      );
      this.historyOrders = response
        .filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELED')
        .sort(
          (a, b) =>
            new Date(b.dateTimeOrder).getTime() -
            new Date(a.dateTimeOrder).getTime(),
        );
    });
  }

  getDescription(order: Order): string {
    return this.orderService.getDescription(order);
  }

  cancelOrder(orderId: string | undefined) {
    if (!orderId) return;
    const order = this.currentOrders.find((o) => o.id === orderId);
    this.orderService.cancelOrder(orderId).subscribe({
      next: () => {
        this.currentOrders = this.currentOrders.filter((o) => o.id !== orderId);
        if (order) {
          order.status = 'CANCELED';
          this.historyOrders.unshift(order);
        }
        if (order?.paymentType?.description === 'Mercado Pago') {
          alert(
            'Cancelaste tu pedido. Como pagaste con Mercado Pago, el reintegro se verá reflejado en tu cuenta pronto.',
          );
        }
      },
    });
  }

  wasCanceledWithMP(order: Order): boolean {
    if (
      order.status !== 'CANCELED' ||
      order.paymentType?.description !== 'Mercado Pago'
    ) {
      return false;
    }

    const orderDate = new Date(order.dateTimeOrder);
    const now = new Date();
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    return diffMin <= 15;
  }

  getStatusText(status: string | undefined): string {
    return this.orderService.getStatusDisplayText(status || '');
  }

  goBack() {
    this.location.back();
  }
}
