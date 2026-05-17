export type DeliveryRouteStatus = 'proposed' | 'active' | 'completed' | 'expired' | 'rejected';
export type StopType = 'pickup' | 'delivery';

export interface Stop {
  orderId: string;
  type: StopType;
  shopName?: string;
  clientName?: string;
  address: string;
  latitude: number;
  longitude: number;
  completedAt?: string;
}

export interface DeliveryRoute {
  id: string;
  stops: Stop[];
  status: DeliveryRouteStatus;
  expiresAt: string;
  createdAt: string;
}
