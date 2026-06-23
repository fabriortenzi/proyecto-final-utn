import { PaymentType } from "./paymentType.entity";
import { Product } from "./product.entity";
import { ProductVariation } from "./productVariation.entity";
import { User } from "./user.entity";

export enum OrderStatus {
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  CANCELED = 'CANCELED',
  PENDING_DELIVERY = 'PENDING_DELIVERY',
  DELIVERED = 'DELIVERED',
}

export class Order {
  public id?: string
  public dateTimeOrder: Date
  public dateTimeArrival?: Date
  public client: User
  public delivery?: User
  public paymentType: PaymentType
  public lineItems: LineItem[]
  public status?: string
  public commissionForDelivery?: number
  public totalAmount?: number
}

export interface LineItem {
  product: Product
  quantity: number
  productVariationArrays?: ProductVariation[][]
}

class CustomerSelectedFlavours {
  public productVariations: string[]
}