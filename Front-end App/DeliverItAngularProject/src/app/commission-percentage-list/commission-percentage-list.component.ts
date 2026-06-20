import { Component } from '@angular/core';
import { Commission } from '../entities/commission.entity';
import { CommissionService } from '../services/commission.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-commission-percentage-list',
  templateUrl: './commission-percentage-list.component.html',
  styleUrls: ['./commission-percentage-list.component.scss'],
})
export class CommissionPercentageListComponent {
  commissions?: Commission[] = [];

  constructor(
    private commissionService: CommissionService,
    private router: Router
  ) {}

  ngOnInit() {
    this.commissionService
      .findAll()
      .subscribe((response) => (this.commissions = response));
  }

  onEditClick(commission: Commission) {
    sessionStorage.setItem('idCommission', commission.id);
    this.router.navigate(['edit-commission-percentage']);
  }
}
