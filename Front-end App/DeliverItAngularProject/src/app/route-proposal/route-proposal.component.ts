import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DeliveryRouteService } from '../services/delivery-route.service';
import { GoogleMapsLoaderService } from '../services/google-maps-loader.service';
import { DeliveryRoute, Stop } from '../entities/delivery-route.entity';

@Component({
  selector: 'app-route-proposal',
  templateUrl: './route-proposal.component.html',
  styleUrls: ['./route-proposal.component.scss'],
})
export class RouteProposalComponent implements OnInit, OnDestroy {
  route: DeliveryRoute;
  remainingSeconds = 0;
  timerInterval: any;
  mapLoaded = false;
  confirming = false;
  rejecting = false;
  errorMessage = '';

  center: google.maps.LatLngLiteral = { lat: 0, lng: 0 };
  zoom = 13;
  markers: {
    position: google.maps.LatLngLiteral;
    label: string;
    title: string;
  }[] = [];

  constructor(
    private deliveryRouteService: DeliveryRouteService,
    private googleMapsLoader: GoogleMapsLoaderService,
    private router: Router,
  ) {}

  ngOnInit() {
    const stored = sessionStorage.getItem('currentRoute');
    if (!stored) {
      this.router.navigate(['/start-delivery']);
      return;
    }

    this.route = JSON.parse(stored);

    const expiresAt = new Date(this.route.expiresAt).getTime();
    const now = Date.now();
    this.remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

    if (this.remainingSeconds <= 0) {
      this.handleExpired();
      return;
    }

    this.startCountdown();

    this.googleMapsLoader.load().then(() => {
      this.mapLoaded = true;
      this.computeMarkers();
    });
  }

  private startCountdown() {
    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds <= 0) {
        clearInterval(this.timerInterval);
        this.handleExpired();
      }
    }, 1000);
  }

  private handleExpired() {
    this.errorMessage = 'La ruta ha expirado';
    sessionStorage.removeItem('currentRoute');
    setTimeout(() => {
      this.router.navigate(['/start-delivery']);
    }, 2000);
  }

  private computeMarkers() {
    console.log(this.route);

    if (!this.route || !this.route.stops.length) return;

    this.center = {
      lat: this.route.stops[0].latitude,
      lng: this.route.stops[0].longitude,
    };

    this.markers = this.route.stops.map((stop: Stop, index: number) => ({
      position: { lat: stop.latitude, lng: stop.longitude },
      label: String(index + 1),
      title:
        stop.type === 'pickup'
          ? `Recoger en: ${stop.shopName}`
          : `Entregar a: ${stop.clientName}`,
    }));
  }

  confirmRoute() {
    this.confirming = true;
    this.errorMessage = '';

    this.deliveryRouteService.confirmRoute(this.route.id).subscribe({
      next: (updatedRoute) => {
        sessionStorage.setItem('currentRoute', JSON.stringify(updatedRoute));
        this.confirming = false;
        this.router.navigate(['/active-delivery']);
      },
      error: (err) => {
        this.confirming = false;
        if (err.status === 410) {
          this.errorMessage = 'La ruta ha expirado, solicitá una nueva';
          sessionStorage.removeItem('currentRoute');
          setTimeout(() => {
            this.router.navigate(['/start-delivery']);
          }, 2000);
        } else {
          this.errorMessage = 'Error al confirmar la ruta. Intentá de nuevo.';
        }
      },
    });
  }

  rejectRoute() {
    this.rejecting = true;
    this.deliveryRouteService.rejectRoute(this.route.id).subscribe({
      next: () => {
        sessionStorage.removeItem('currentRoute');
        this.rejecting = false;
        this.router.navigate(['/start-delivery']);
      },
      error: () => {
        this.rejecting = false;
        sessionStorage.removeItem('currentRoute');
        this.router.navigate(['/start-delivery']);
      },
    });
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  isTimeLow(): boolean {
    return this.remainingSeconds < 30;
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
