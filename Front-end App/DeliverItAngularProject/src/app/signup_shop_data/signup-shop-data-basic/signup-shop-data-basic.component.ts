import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ShopRegisterServiceService } from 'src/app/services/shop-register-service.service';
import { AddressValue } from 'src/app/address-autocomplete/address-autocomplete.component';

function addressValidator(control: AbstractControl): ValidationErrors | null {
  const val: AddressValue = control.value;
  if (!val || !val.latitude || !val.longitude) {
    return { addressRequired: true };
  }
  return null;
}

@Component({
  selector: 'app-signup-shop-data-basic',
  templateUrl: './signup-shop-data-basic.component.html',
  styleUrls: ['./signup-shop-data-basic.component.scss']
})
export class SignupShopDataBasicComponent {
  submitted = false;

  shopSignUpForm = new FormGroup({
    name: new FormControl('', Validators.required),
    phoneNumber: new FormControl('', Validators.required),
    address: new FormControl<AddressValue | null>(null, addressValidator),
    email: new FormControl('', Validators.required),
  });

  constructor(
    private shopRegisterService: ShopRegisterServiceService,
    private router: Router
  ) {}

  submit() {
    this.submitted = true;
    if (this.shopSignUpForm.valid) {
      const addressVal: AddressValue = this.shopSignUpForm.get('address')!.value!;

      const body = {
        name: this.getName().value,
        phoneNumber: this.getPhoneNumber().value,
        street: addressVal.street,
        streetNumber: addressVal.streetNumber,
        address: addressVal.address,
        latitude: addressVal.latitude,
        longitude: addressVal.longitude,
        email: this.getEmail().value,
      };
      this.shopRegisterService.addShopFormData(body);

      this.router.navigate(['/signup_shop_data1']);
    }
  }

  getName() {
    return this.shopSignUpForm.get('name');
  }

  getEmail() {
    return this.shopSignUpForm.get('email');
  }

  getPhoneNumber() {
    return this.shopSignUpForm.get('phoneNumber');
  }

  getAddress() {
    return this.shopSignUpForm.get('address');
  }
}
