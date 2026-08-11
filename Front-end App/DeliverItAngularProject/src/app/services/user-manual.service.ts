import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseUrlService } from './base-url.service';

@Injectable({
  providedIn: 'root',
})
export class UserManualService {
  constructor(
    private http: HttpClient,
    private baseUrlService: BaseUrlService
  ) {}

  readonly baseUrl = `${this.baseUrlService.getBaseUrl()}user-manuals`;

  readonly manualNames: Record<string, string> = {
    client: 'DeliverIt - Manual de Usuario Cliente.pdf',
    owner: 'DeliverIt - Manual de Usuario Dueño de Local.pdf',
    delivery: 'DeliverIt - Manual de Usuario Repartidor.pdf',
    admin: 'DeliverIt - Manual de Usuario Administrador.pdf',
  };

  downloadUserManual(role: string) {
    this.http
      .get(`${this.baseUrl}/${role}`, { responseType: 'blob' })
      .subscribe((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.manualNames[role] || 'DeliverIt - Manual de Usuario.pdf';
        link.click();
        window.URL.revokeObjectURL(url);
      });
  }
}