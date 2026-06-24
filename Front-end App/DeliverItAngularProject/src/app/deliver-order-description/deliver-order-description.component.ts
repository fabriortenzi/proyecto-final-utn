import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-deliver-order-description',
  templateUrl: './deliver-order-description.component.html',
  styleUrls: ['./deliver-order-description.component.scss']
})
export class DeliverOrderDescriptionComponent {

  @Output() buttonClicked = new EventEmitter<void>()
  @Input() description: string;
  @Input() price: string;
  @Input() client: string;
  @Input() paymentType: string;
  @Input() orderStatus: string;
  @Input() dateTimeArrival: string;
  @Input() hideButton: boolean = false;
  buttonName: string;

  private statusMap: { [key: string]: string } = {
    PENDING_CONFIRMATION: 'Pendiente de confirmación',
    CONFIRMED: 'Confirmado',
    CANCELED: 'Cancelado',
    PENDING_DELIVERY: 'Para repartir',
    DELIVERED: 'Entregada',
  };

  getDisplayStatus(): string {
    return this.statusMap[this.orderStatus] || this.orderStatus;
  }

  addButtonName(): string{
    if (this.isPendingDelivery()){this.buttonName='Cambiar Estado'}
    else {this.buttonName='Aceptar Pedido'}
    return this.buttonName;
  }

  getOrderStatus(): boolean
  {
    return !this.isDelivered() && !this.isPendingDelivery();
  }

  private isDelivered(): boolean {
    return this.orderStatus === 'DELIVERED' || this.orderStatus === 'Entregada';
  }

  private isPendingDelivery(): boolean {
    return this.orderStatus === 'PENDING_DELIVERY' || this.orderStatus === 'Para repartir';
  }

  onClickedButton()
  {
    this.buttonClicked.emit()
  }
}
