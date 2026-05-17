import { Order } from "../order/order.entity.js";
import { Stop, StopType } from "./deliveryRoute.entity.js";

export interface IRouteAssignmentService {
  assignRoute(
    deliveryLat: number,
    deliveryLng: number,
    availableOrders: Order[],
  ): Promise<Stop[]>;
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class HaversineRouteAssignment implements IRouteAssignmentService {
  async assignRoute(
    deliveryLat: number,
    deliveryLng: number,
    availableOrders: Order[],
  ): Promise<Stop[]> {
    // Filter orders where shop or client lack lat/lng
    const validOrders = availableOrders.filter((order) => {
      const shop = order.lineItems[0]?.product?.shop;
      if (!shop?.latitude || !shop?.longitude) return false;
      if (!order.client?.latitude || !order.client?.longitude) return false;
      return true;
    });

    if (validOrders.length === 0) return [];

    // Sort by distance from delivery user to shop
    const sorted = validOrders.sort((a, b) => {
      const shopA = a.lineItems[0].product.shop;
      const shopB = b.lineItems[0].product.shop;
      const distA = haversineDistance(
        deliveryLat,
        deliveryLng,
        shopA.latitude!,
        shopA.longitude!,
      );
      const distB = haversineDistance(
        deliveryLat,
        deliveryLng,
        shopB.latitude!,
        shopB.longitude!,
      );
      return distA - distB;
    });

    // Select nearest 1-3 orders
    const selected = sorted.slice(0, 3);

    // Create pickup + delivery stops for each order
    const unorderedStops: Stop[] = [];
    for (const order of selected) {
      const shop = order.lineItems[0].product.shop;
      const client = order.client;

      const pickupStop: Stop = {
        orderId: order.id,
        type: StopType.pickup,
        shopName: shop.name,
        address: shop.address || `${shop.street} ${shop.streetNumber}`,
        latitude: shop.latitude!,
        longitude: shop.longitude!,
      };

      const deliveryStop: Stop = {
        orderId: order.id,
        type: StopType.delivery,
        clientName: `${client.name} ${client.surname}`,
        address: client.address || `${client.street} ${client.streetNumber}`,
        latitude: client.latitude!,
        longitude: client.longitude!,
      };

      unorderedStops.push(pickupStop, deliveryStop);
    }

    // Order stops using nearest-neighbor greedy algorithm
    return this.orderStopsNearestNeighbor(
      deliveryLat,
      deliveryLng,
      unorderedStops,
      selected,
    );
  }

  private orderStopsNearestNeighbor(
    startLat: number,
    startLng: number,
    stops: Stop[],
    orders: Order[],
  ): Stop[] {
    const ordered: Stop[] = [];
    const remaining = [...stops];
    // Track which orders have had their pickup completed
    const pickedUp = new Set<string>();

    let currentLat = startLat;
    let currentLng = startLng;

    while (remaining.length > 0) {
      // Filter candidates: pickups are always eligible,
      // deliveries only if their pickup has been done
      const candidates = remaining.filter((stop) => {
        if (stop.type === StopType.pickup) return true;
        return pickedUp.has(stop.orderId);
      });

      // Find nearest candidate
      let nearestIdx = -1;
      let nearestDist = Infinity;

      for (let i = 0; i < candidates.length; i++) {
        const dist = haversineDistance(
          currentLat,
          currentLng,
          candidates[i].latitude,
          candidates[i].longitude,
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      const chosen = candidates[nearestIdx];

      // Remove from remaining
      const remainingIdx = remaining.indexOf(chosen);
      remaining.splice(remainingIdx, 1);

      // If it's a pickup, mark the order as picked up
      if (chosen.type === StopType.pickup) {
        pickedUp.add(chosen.orderId);
      }

      ordered.push(chosen);
      currentLat = chosen.latitude;
      currentLng = chosen.longitude;
    }

    return ordered;
  }
}

export const routeAssignmentService = new HaversineRouteAssignment();
