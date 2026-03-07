import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginResponse, User } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { DatosPersonalesService } from '../services/datos-personales.service';
import { LoginService } from '../services/login.service';
import { AddressValue } from '../address-autocomplete/address-autocomplete.component';

function addressValidator(control: AbstractControl): ValidationErrors | null {
  const val: AddressValue = control.value;
  if (!val || !val.latitude || !val.longitude) {
    return { addressRequired: true };
  }
  return null;
}

@Component({
  selector: 'app-direccion',
  templateUrl: './direccion.component.html',
  styleUrls: ['./direccion.component.scss'],
})
export class DireccionComponent {
  submitted = false;

  constructor(
    private loginService: LoginService,
    private router: Router,
    private userService: UserService,
    private datosPersonalesService: DatosPersonalesService
  ) {}

  userToUpdate: User;

  direccionForm = new FormGroup({
    address: new FormControl<AddressValue | null>(null, addressValidator),
    apartment: new FormControl(''),
    additionalInfo: new FormControl(''),
  });

  ngOnInit() {
    this.userToUpdate = this.loginService.getLoggedUser();

    if (this.userToUpdate) {
      this.userService.findOne().subscribe((data) => {
        const addressValue: AddressValue = {
          address: data.address || [data.street, data.streetNumber].filter(Boolean).join(' '),
          street: data.street || '',
          streetNumber: data.streetNumber || '',
          latitude: data.latitude || null,
          longitude: data.longitude || null,
        };

        this.direccionForm.patchValue({
          address: addressValue,
          apartment: data.apartment || '',
          additionalInfo: data.additionalInfo || '',
        });
      });
    }
  }

  submitForm() {
    this.submitted = true;
    if (this.direccionForm.valid) {
      const addressVal: AddressValue = this.direccionForm.get('address')!.value!;

      const body = {
        address: addressVal.address,
        street: addressVal.street,
        streetNumber: addressVal.streetNumber,
        latitude: addressVal.latitude,
        longitude: addressVal.longitude,
        apartment: this.direccionForm.get('apartment')!.value,
        additionalInfo: this.direccionForm.get('additionalInfo')!.value,
      };

      // Update Address
      if (this.userToUpdate) {
        this.userService.updateAll(body).subscribe((data: any) => {
          this.loginService.setLoggedUser(data.updatedUser);
          this.router.navigate(['/home-customer']);
        });
      }
      // Create User
      else {
        this.datosPersonalesService.sendDireccionForm(body);

        this.datosPersonalesService.register().subscribe((data) => {
          this.loginService
            .login(this.datosPersonalesService.getUserAndPassword())
            .subscribe((res: LoginResponse) => {
              this.loginService.setLoggedUser(res.user);
              this.loginService.redirectUser(res.user);
            });
        });

        this.router.navigate(['/home-customer']);
      }
    }
  }

  getAddress() {
    return this.direccionForm.get('address');
  }

  getApartment() {
    return this.direccionForm.get('apartment');
  }

  getInfo() {
    return this.direccionForm.get('additionalInfo');
  }
}
