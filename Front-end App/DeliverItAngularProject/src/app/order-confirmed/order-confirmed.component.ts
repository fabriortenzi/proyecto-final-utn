import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-order-confirmed',
  templateUrl: './order-confirmed.component.html',
  styleUrls: ['./order-confirmed.component.scss']
})
export class OrderConfirmedComponent {
  constructor(
    private orderService: OrderService,
    private router: Router,
  ) {}

  loading = false;
  private isMpPayment = false;

  ngOnInit() {
    this.isMpPayment = sessionStorage.getItem('deliverit_paymentTypeId') !== null;
  }

  goHome() {
    if (this.isMpPayment) {
      this.loading = true;
      const paymentTypeId = sessionStorage.getItem('deliverit_paymentTypeId')!;
      const totalAmount = Number(sessionStorage.getItem('deliverit_totalAmount') || '0');

      this.orderService.create(paymentTypeId, totalAmount).subscribe({
        next: () => {
          sessionStorage.removeItem('deliverit_paymentTypeId');
          sessionStorage.removeItem('deliverit_totalAmount');
          this.loading = false;
          this.router.navigate(['/home-customer']);
        },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      this.router.navigate(['/home-customer']);
    }
  }
}
