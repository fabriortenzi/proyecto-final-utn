import {
  Rel,
  Entity,
  ManyToOne,
  Property,
  DateTimeType,
} from "@mikro-orm/core";
import { BaseEntity } from "../shared/baseEntity.entity.js";
import { User } from "../user/user.entity.js";

export enum DeliveryRouteStatus {
  proposed = "proposed",
  active = "active",
  completed = "completed",
  expired = "expired",
  rejected = "rejected",
}

export enum StopType {
  pickup = "pickup",
  delivery = "delivery",
}

export class Stop {
  orderId!: string;
  type!: StopType;
  shopName?: string;
  clientName?: string;
  address!: string;
  latitude!: number;
  longitude!: number;
  completedAt?: Date;
}

@Entity()
export class DeliveryRoute extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  deliveryUser!: Rel<User>;

  @Property({ type: "json" })
  stops!: Stop[];

  @Property({ nullable: false })
  status!: DeliveryRouteStatus;

  @Property({ nullable: false, type: DateTimeType })
  expiresAt!: Date;

  @Property({ nullable: false, type: DateTimeType })
  createdAt!: Date;
}
