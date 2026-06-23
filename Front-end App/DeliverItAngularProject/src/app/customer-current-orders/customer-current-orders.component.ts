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

  constructor(private orderService: OrderService) {}

  ngOnInit()
  {
    this.orderService.findCurrentCustomerOrders().subscribe((response) => {
      this.currentOrders = response.filter((o) =>
        o.status === 'PENDING_CONFIRMATION' ||
        o.status === 'CONFIRMED' ||
        o.status === 'PENDING_DELIVERY'
      );
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
