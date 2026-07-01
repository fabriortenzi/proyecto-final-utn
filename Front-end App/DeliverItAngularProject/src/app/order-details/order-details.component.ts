import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { OrderService } from '../services/order.service';
import { Router } from '@angular/router';
import { PaymentTypeService } from '../services/payment-type.service';
import { PaymentType } from '../entities/paymentType.entity';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LineItem } from '../entities/order.entity';
import { ProductVariation } from '../entities/productVariation.entity';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
})
export class OrderDetailsComponent {
  constructor(
    private orderService: OrderService,
    private paymentTypeService: PaymentTypeService,
    private router: Router,
    private location: Location,
  ) {}

  items: LineItem[] = [];
  subTotal: number;
  shippingPrice: number;
  total: number;
  paymentTypes: PaymentType[];
  submitted = false;
  paymentTypeForm = new FormGroup({
    selectedPaymentType: new FormControl('', Validators.required),
  });

  ngOnInit() {
    this.getItems();
    this.getSubTotal();
    this.getShippingPrice();
    this.getPaymentTypes();
    this.total = this.subTotal + this.shippingPrice;
  }

  // Devuelvo un Array con los Productos y sus cantidades
  getItems() {
    this.items = this.orderService.getOrder().lineItems;
  }

  getProductVariationDescription(productVariations: ProductVariation[]) {
    const pvCopy = [...productVariations];

    if (pvCopy.length === 1) {
      return pvCopy[0].description;
    } else if (pvCopy.length === 2) {
      return pvCopy.map((pv) => pv.description).join(' y ');
    } else {
      const lastVariation = pvCopy.pop().description;
      const descriptions = pvCopy.map((pv) => pv.description);
      return descriptions.join(', ') + ' y ' + lastVariation;
    }
  }

  getSubTotal() {
    this.subTotal = this.orderService.getSubTotal();
  }

  getShippingPrice() {
    this.shippingPrice = Number(localStorage.getItem('shippingPrice'));
  }

  getSelectedPaymentType() {
    return this.paymentTypeForm.get('selectedPaymentType');
  }

  create() {
    this.submitted = true;
    if (this.paymentTypeForm.valid) {
      const selectedPaymentTypeId = this.getSelectedPaymentType().value;
      const selectedPaymentType = this.paymentTypes.find(
        (p) => p.id === selectedPaymentTypeId,
      );
      const isMercadoPago = selectedPaymentType?.description === 'Mercado Pago';

      if (isMercadoPago) {
        const items = this.items.map((item) => ({
          title: item.product.name,
          quantity: item.quantity,
          currency_id: 'ARS',
          unit_price: Number(item.product.prices[0].amount),
        }));

        if (this.shippingPrice > 0) {
          items.push({
            title: 'Envío',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: this.shippingPrice,
          });
        }

        sessionStorage.setItem('deliverit_paymentTypeId', selectedPaymentTypeId);
        sessionStorage.setItem('deliverit_totalAmount', this.total.toString());

        this.orderService
          .createMercadoPagoPreferenceFromData(items)
          .subscribe((mpResponse: any) => {
            window.location.href = mpResponse.init_point;
          });
      } else {
        this.orderService
          .create(selectedPaymentTypeId, this.total)
          .subscribe(() => {
            this.router.navigate(['order-confirmed']);
          });
      }
    }
  }

  getPaymentTypes() {
    this.paymentTypeService.getAll().subscribe((data: PaymentType[]) => {
      this.paymentTypes = data;
    });
  }

  goBack() {
    this.location.back();
  }
}
