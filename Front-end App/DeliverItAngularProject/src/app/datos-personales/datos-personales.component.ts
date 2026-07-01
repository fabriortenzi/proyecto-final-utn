import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DatosPersonalesService } from '../services/datos-personales.service';
import { Router } from '@angular/router';
import { UserType } from '../entities/userType.entity';
import { LoginService } from '../services/login.service';


@Component({
  selector: 'app-datos-personales',
  templateUrl: './datos-personales.component.html',
  styleUrls: ['./datos-personales.component.scss'],
})
export class DatosPersonalesComponent {
  submitted = false;

  userDataForm = new FormGroup({
    name: new FormControl('', Validators.required),
    surname: new FormControl('', Validators.required),
    phoneNumber: new FormControl('', Validators.required),
    idUserType: new FormControl('0', [Validators.required, this.notAccept0]),
  });

  constructor(
    private service: DatosPersonalesService,
    private router: Router,
    private loginService: LoginService,
    private location: Location
  ) {}

  userTypes: UserType[] = null;

  userTypeLabels: Record<string, string> = {
    client: 'Cliente',
    owner: 'Dueño de Local',
    delivery: 'Repartidor',
    admin: 'Administrador',
  };

  ngOnInit() {
    this.service.getUserTypes().subscribe((data) => {
      this.userTypes = data;
    });
  }

  submitForm() {
    this.submitted = true;
    if (this.userDataForm.valid) {
      const body = {
        name: this.getName().value,
        surname: this.getSurname().value,
        phoneNumber: this.getPhoneNumber().value,
        userType: this.getUserTypeId().value,
      };

      this.service.sendUserDataForm(body);

      const userType = this.userTypes.find((u) => u.id === body.userType);
      switch (userType.description) {
        case 'client':
          this.router.navigate(['/direccion']);
          break;

        case 'delivery':
          this.router.navigate(['/mp-login'], { queryParams: { role: 'delivery' } });
          break;

        case 'owner':
          this.router.navigate(['/mp-login'], { queryParams: { role: 'owner' } });
          break;
      }
    }
  }

  getName() {
    return this.userDataForm.get('name');
  }

  getSurname() {
    return this.userDataForm.get('surname');
  }

  getPhoneNumber() {
    return this.userDataForm.get('phoneNumber');
  }

  getUserTypeId() {
    return this.userDataForm.get('idUserType');
  }

  notAccept0(control) {
    const value = control.value;
    if (value === '0') {
      return { notAccept0: true };
    }
    return null;
  }

  goBack() {
    this.location.back();
  }
}
