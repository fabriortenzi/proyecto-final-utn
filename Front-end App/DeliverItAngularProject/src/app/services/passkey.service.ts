import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseUrlService } from './base-url.service';
import { Observable, catchError, from, map, of, switchMap } from 'rxjs';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { LoginService } from './login.service';
import { LoginResponse } from '../entities/user.entity';

@Injectable({ providedIn: 'root' })
export class PasskeyService {
  private baseUrl = `${this.baseUrlService.getBaseUrl()}webauthn`;

  constructor(
    private http: HttpClient,
    private baseUrlService: BaseUrlService,
    private loginService: LoginService
  ) {}

  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.PublicKeyCredential;
  }

  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  registerPasskey(): Observable<{ verified: boolean; authenticator?: any }> {
    return this.http.post<any>(`${this.baseUrl}/register/begin`, {}).pipe(
      switchMap((options) => from(startRegistration({ optionsJSON: options }))),
      switchMap((registrationResponse) =>
        this.http.post<any>(`${this.baseUrl}/register/complete`, registrationResponse)
      )
    );
  }

  loginWithPasskey(email?: string): Observable<LoginResponse> {
    return this.http.post<any>(`${this.baseUrl}/authenticate/begin`, { email }).pipe(
      switchMap(({ options, challengeId }) =>
        from(startAuthentication({ optionsJSON: options })).pipe(
          switchMap((authResponse) =>
            this.http.post<LoginResponse>(`${this.baseUrl}/authenticate/complete`, {
              response: authResponse,
              challengeId,
            })
          )
        )
      ),
      switchMap((response: LoginResponse) => {
        this.loginService.setToken(response.token);
        this.loginService.setLoggedUser(response.user);
        return from(Promise.resolve(response));
      })
    );
  }

  tryRegisterPasskey(): Observable<boolean> {
    return from(this.isPlatformAuthenticatorAvailable()).pipe(
      switchMap((available) => {
        if (available && window.confirm('¿Querés configurar inicio con datos biométricos? (huella digital, Face ID, etc.)')) {
          return this.registerPasskey().pipe(
            map(() => true),
            catchError(() => of(false))
          );
        }
        return of(false);
      })
    );
  }
}
