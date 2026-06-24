import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-withdrawal-confirmed',
  templateUrl: './withdrawal-confirmed.component.html',
  styleUrls: ['./withdrawal-confirmed.component.scss']
})
export class WithdrawalConfirmedComponent
{
  amount: string
  state: 'idle' | 'confirming' | 'done' = 'idle'

  constructor(private router: Router){}

  ngOnInit()
  {
    this.amount = localStorage.getItem('withdrawalAmount')
  }

  confirmWithdrawal()
  {
    this.state = 'confirming'
    setTimeout(() => {
      this.state = 'done'
    }, 2500)
  }

  goBackToMenu()
  {
    localStorage.removeItem('withdrawalAmount')
    this.router.navigate(['withdrawal-menu'])
  }

}
