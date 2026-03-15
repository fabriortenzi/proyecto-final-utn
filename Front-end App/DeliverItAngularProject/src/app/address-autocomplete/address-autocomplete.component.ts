import {
  Component,
  ElementRef,
  forwardRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GoogleMapsLoaderService } from '../services/google-maps-loader.service';

export interface AddressValue {
  address: string;
  street: string;
  streetNumber: string;
  latitude: number | null;
  longitude: number | null;
}

@Component({
  selector: 'app-address-autocomplete',
  templateUrl: './address-autocomplete.component.html',
  styleUrls: ['./address-autocomplete.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddressAutocompleteComponent),
      multi: true,
    },
  ],
})
export class AddressAutocompleteComponent
  implements OnInit, ControlValueAccessor
{
  @ViewChild('addressInput', { static: true })
  addressInput!: ElementRef<HTMLInputElement>;

  value: AddressValue = {
    address: '',
    street: '',
    streetNumber: '',
    latitude: null,
    longitude: null,
  };

  mapCenter: google.maps.LatLngLiteral | null = null;
  markerPosition: google.maps.LatLngLiteral | null = null;
  mapOptions: google.maps.MapOptions = {
    zoom: 16,
    gestureHandling: 'none',
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  };

  private onChange: (value: AddressValue) => void = () => {};
  private onTouched: () => void = () => {};
  private autocomplete: google.maps.places.Autocomplete | null = null;

  constructor(private mapsLoader: GoogleMapsLoaderService) {}

  ngOnInit(): void {
    this.mapsLoader.load().then(() => {
      this.autocomplete = new google.maps.places.Autocomplete(
        this.addressInput.nativeElement,
        {
          componentRestrictions: { country: 'ar' },
          fields: ['formatted_address', 'address_components', 'geometry'],
          types: ['address'],
        },
      );

      this.autocomplete.addListener('place_changed', () => {
        const place = this.autocomplete!.getPlace();

        if (!place.geometry?.location) {
          return;
        }

        let street = '';
        let streetNumber = '';

        for (const component of place.address_components || []) {
          const type = component.types[0];
          if (type === 'route') {
            street = component.long_name;
          } else if (type === 'street_number') {
            streetNumber = component.long_name;
          }
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        this.value = {
          address: place.formatted_address || '',
          street,
          streetNumber,
          latitude: lat,
          longitude: lng,
        };

        this.mapCenter = { lat, lng };
        this.markerPosition = { lat, lng };

        this.onChange(this.value);
        this.onTouched();
      });
    });
  }

  writeValue(val: AddressValue | null): void {
    if (val) {
      this.value = val;
      if (this.addressInput) {
        this.addressInput.nativeElement.value = val.address || '';
      }
      if (val.latitude && val.longitude) {
        this.mapCenter = { lat: val.latitude, lng: val.longitude };
        this.markerPosition = { lat: val.latitude, lng: val.longitude };
      }
    }
  }

  registerOnChange(fn: (value: AddressValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onInputBlur(): void {
    this.onTouched();
  }
}
