import { Component, ViewChild } from '@angular/core';
import { OrderService } from '../services/order.service';
import { Order } from '../entities/order.entity';
import { MatSidenav } from '@angular/material/sidenav';
import { LoginService } from '../services/login.service';
import { PasskeyService } from '../services/passkey.service';
import { User } from '../entities/user.entity';
import { UserManualService } from '../services/user-manual.service';

@Component({
  selector: 'app-home-delivery-boy',
  templateUrl: './home-delivery-boy.component.html',
  styleUrls: ['./home-delivery-boy.component.scss'],
})
export class HomeDeliveryBoyComponent {
  pastDeliveries = [];

  constructor(
    private orderService: OrderService,
    private loginService: LoginService,
    private passkeyService: PasskeyService,
    private userManualService: UserManualService,
  ) {}

  loggedUser: User = this.loginService.getLoggedUser();

  @ViewChild(MatSidenav)
  sidenav!: MatSidenav;

  ngOnInit() {
    this.orderService
      .findAllByDelivery()
      .subscribe((response) => (this.pastDeliveries = response.slice(0, 3)));
  }

  onRegisterPasskey() {
    this.passkeyService.tryRegisterPasskey().subscribe();
  }

  downloadManual() {
    this.userManualService.downloadUserManual('delivery');
  }

  getDescription(order: Order): string {
    return this.orderService.getDescription(order);
  }
}
