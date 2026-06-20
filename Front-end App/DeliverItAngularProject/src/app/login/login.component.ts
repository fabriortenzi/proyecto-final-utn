import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { PasskeyService } from '../services/passkey.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  constructor(
    private router: Router,
    private loginService: LoginService,
    private passkeyService: PasskeyService
  ) {}

  loginForm: FormGroup;

  passwordVisible = false;
  submitted = false;
  passkeyAvailable = false;

  changeVisibilityPass(visib: boolean) {
    this.passwordVisible = visib;
  }

  ngOnInit() {
    this.loginForm = new FormGroup({
      email: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
    });
    this.passkeyService.isPlatformAuthenticatorAvailable().then((available) => {
      this.passkeyAvailable = available;
    });
  }

  submitForm() {
    this.submitted = true;
    if (this.loginForm.valid) {
      const body = {
        email: this.getEmail().value,
        password: this.getPassword().value,
      };

      this.loginService.login(body).subscribe((res) => {
        this.loginService.setLoggedUser(res.user);
        this.loginService.redirectUser(res.user);
      });
    }
  }

  loginWithPasskey() {
    const email = this.getEmail()?.value || undefined;
    this.passkeyService.loginWithPasskey(email).subscribe({
      next: (res) => this.loginService.redirectUser(res.user),
      error: () => {
        console.error('Passkey login failed');
      },
    });
  }

  getPassword() {
    return this.loginForm.get('password');
  }

  getEmail() {
    return this.loginForm.get('email');
  }

  getEmailValue(): string {
    return this.getEmail()?.value || '';
  }
}
