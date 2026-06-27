import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { DeliveryRouteService } from '../services/delivery-route.service';
import { GoogleMapsLoaderService } from '../services/google-maps-loader.service';
import { DeliveryRoute, Stop } from '../entities/delivery-route.entity';

@Component({
  selector: 'app-active-delivery',
  templateUrl: './active-delivery.component.html',
  styleUrls: ['./active-delivery.component.scss'],
})
export class ActiveDeliveryComponent implements OnInit {
  route: DeliveryRoute;
  mapLoaded = false;
  completing = false;
  errorMessage = '';
  allCompleted = false;

  center: google.maps.LatLngLiteral = { lat: 0, lng: 0 };
  zoom = 13;
  markers: { position: google.maps.LatLngLiteral; label: string; title: string }[] = [];

  constructor(
    private deliveryRouteService: DeliveryRouteService,
    private googleMapsLoader: GoogleMapsLoaderService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    const stored = sessionStorage.getItem('currentRoute');
    if (!stored) {
      this.router.navigate(['/start-delivery']);
      return;
    }

    this.route = JSON.parse(stored);

    this.googleMapsLoader.load().then(() => {
      this.mapLoaded = true;
      this.computeMarkers();
    });
  }

  get activeStopIndex(): number {
    if (!this.route) return -1;
    return this.route.stops.findIndex((stop: Stop) => !stop.completedAt);
  }

  private computeMarkers() {
    if (!this.route || !this.route.stops.length) return;

    const activeIdx = this.activeStopIndex;
    const targetStop = activeIdx >= 0 ? this.route.stops[activeIdx] : this.route.stops[0];

    this.center = {
      lat: targetStop.latitude,
      lng: targetStop.longitude,
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

  completeStop() {
    const index = this.activeStopIndex;
    if (index < 0) return;

    this.completing = true;
    this.errorMessage = '';

    this.deliveryRouteService.completeStop(this.route.id, index).subscribe({
      next: (updatedRoute) => {
        this.route = updatedRoute;
        sessionStorage.setItem('currentRoute', JSON.stringify(updatedRoute));
        this.completing = false;
        this.computeMarkers();

        if (updatedRoute.status === 'completed') {
          this.allCompleted = true;
          sessionStorage.removeItem('currentRoute');
          setTimeout(() => {
            this.router.navigate(['/home-delivery-boy']);
          }, 3000);
        }
      },
      error: () => {
        this.completing = false;
        this.errorMessage = 'Error al completar la parada. Intentá de nuevo.';
      },
    });
  }

  isStopCompleted(index: number): boolean {
    return !!this.route?.stops[index]?.completedAt;
  }

  isStopActive(index: number): boolean {
    return index === this.activeStopIndex;
  }

  getStopButtonText(stop: Stop): string {
    return stop.type === 'pickup' ? 'Recogido' : 'Entregado';
  }

  goBack() {
    this.location.back();
  }
}
