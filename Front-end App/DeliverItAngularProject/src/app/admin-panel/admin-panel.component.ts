import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { PasskeyService } from '../services/passkey.service';
import { User } from '../entities/user.entity';
import { UserManualService } from '../services/user-manual.service';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
})
export class AdminPanelComponent {
  loggedUser: User;

  constructor(
    private router: Router,
    private loginService: LoginService,
    private passkeyService: PasskeyService,
    private userManualService: UserManualService
  ) {
    this.loggedUser = this.loginService.getLoggedUser();
  }

  onUserManagement() {
    this.router.navigate(['user-management']);
  }

  onAddCommissionPercentage() {
    this.router.navigate(['add-commission-percentage']);
  }

  onEditCommissionPercentage() {
    this.router.navigate(['commission-percentage-list']);
  }

  onShopPayments() {
    this.router.navigate(['shop-payments']);
  }

  onRegisterPasskey() {
    this.passkeyService.tryRegisterPasskey().subscribe();
  }

  onDownloadManual() {
    this.userManualService.downloadUserManual('admin');
  }

  logout() {
    this.loginService.logout();
  }
}
