import { Component } from '@angular/core';
import { OrderService } from '../services/order.service';
import { Order } from '../entities/order.entity';

@Component({
  selector: 'app-customer-current-orders',
  templateUrl: './customer-current-orders.component.html',
  styleUrls: ['./customer-current-orders.component.scss']
})
export class CustomerCurrentOrdersComponent 

{

  currentOrders: Order[] = []
  historyOrders: Order[] = []

  constructor(private orderService: OrderService) {}

  ngOnInit()
  {
    this.orderService.findAllCustomerOrders().subscribe((response) => {
      this.currentOrders = response.filter((o) =>
        o.status === 'PENDING_CONFIRMATION' ||
        o.status === 'CONFIRMED' ||
        o.status === 'PENDING_DELIVERY'
      );
      this.historyOrders = response
        .filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELED')
        .sort((a, b) => new Date(b.dateTimeOrder).getTime() - new Date(a.dateTimeOrder).getTime());
    });
  }
  
  getDescription(order: Order): string
  {
    return this.orderService.getDescription(order)
  }

  cancelOrder(orderId: string | undefined) {
    if (!orderId) return;
    this.orderService.cancelOrder(orderId).subscribe({
      next: () => {
        this.currentOrders = this.currentOrders.filter((o) => o.id !== orderId);
      },
    });
  }

  getStatusText(status: string | undefined): string {
    return this.orderService.getStatusDisplayText(status || '');
  }
}
