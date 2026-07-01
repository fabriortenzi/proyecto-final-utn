import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatosPersonalesService } from '../services/datos-personales.service';
import { LoginService } from '../services/login.service';
import { LoginResponse } from '../entities/user.entity';
import { MP_ACCOUNTS } from '../config/mp-login.config';

@Component({
  selector: 'app-mp-login',
  templateUrl: './mp-login.component.html',
  styleUrls: ['./mp-login.component.scss']
})
export class MpLoginComponent
{
  email = ''
  password = ''
  state: 'init' | 'idle' | 'loading' | 'error' | 'success' = 'init'
  submitted = false
  role: string = ''
  passwordVisible = false

  get isLoading(): boolean {
    return this.state === 'init' || this.state === 'loading'
  }

  get isSuccess(): boolean {
    return this.state === 'success'
  }

  get showForm(): boolean {
    return this.state === 'idle' || this.state === 'error'
  }

  get isError(): boolean {
    return this.state === 'error'
  }

  get isInitState(): boolean {
    return this.state === 'init'
  }

  get isLoginLoading(): boolean {
    return this.state === 'loading'
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private datosPersonalesService: DatosPersonalesService,
    private loginService: LoginService
  ) {}

  ngOnInit()
  {
    this.route.queryParams.subscribe(params =>
    {
      this.role = params['role'] || 'owner'
    })

    setTimeout(() =>
    {
      this.state = 'idle'
    }, 1800)

    const savedEmail = localStorage.getItem('mpLoginEmail')
    if (savedEmail) {
      this.email = savedEmail
    }
  }

  onSubmit()
  {
    this.submitted = true

    if (!this.email || !this.password) return

    this.state = 'loading'

    setTimeout(() =>
    {
      const account = MP_ACCOUNTS.find(
        a => a.email === this.email && a.password === this.password
      )

      if (account) {
        this.state = 'success'
        localStorage.setItem('mpLoginEmail', this.email)
        setTimeout(() => this.proceedWithSignup(), 1800)
      } else {
        this.state = 'error'
      }
    }, 2200)
  }

  private proceedWithSignup()
  {
    this.datosPersonalesService.register().subscribe({
      next: () =>
      {
        this.loginService
          .login(this.datosPersonalesService.getUserAndPassword())
          .subscribe((res: LoginResponse) =>
          {
            if (this.role === 'delivery') {
              this.loginService.redirectUser(res.user)
            } else {
              this.loginService.setLoggedUser(res.user)
              this.router.navigate(['/signup_shop_data_basic'])
            }
          })
      },
      error: () =>
      {
        this.router.navigate(['/error-panel'])
      }
    })
  }

  retry()
  {
    this.state = 'idle'
    this.submitted = false
    this.password = ''
  }
}
