import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DeliveryRouteService } from '../services/delivery-route.service';

@Component({
  selector: 'app-start-delivery',
  templateUrl: './start-delivery.component.html',
  styleUrls: ['./start-delivery.component.scss'],
})
export class StartDeliveryComponent {
  loading = false;
  errorMessage = '';

  constructor(
    private deliveryRouteService: DeliveryRouteService,
    private router: Router,
  ) {}

  startDelivery() {
    this.loading = true;
    this.errorMessage = '';

    if (!navigator.geolocation) {
      this.errorMessage = 'Tu navegador no soporta geolocalización';
      this.loading = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.deliveryRouteService.requestRoute(latitude, longitude).subscribe({
          next: (route) => {
            sessionStorage.setItem('currentRoute', JSON.stringify(route));
            this.loading = false;
            this.router.navigate(['/route-proposal']);
          },
          error: (err) => {
            this.loading = false;
            if (err.status === 404) {
              this.errorMessage = 'No hay pedidos disponibles en este momento';
            } else if (err.status === 409) {
              this.router.navigate(['/active-delivery']);
            } else {
              this.errorMessage =
                'Error al solicitar la ruta. Intentá de nuevo.';
            }
          },
        });
      },
      () => {
        this.loading = false;
        this.errorMessage =
          'Se necesita acceso a la ubicación para iniciar una entrega';
      },
    );
  }
}
