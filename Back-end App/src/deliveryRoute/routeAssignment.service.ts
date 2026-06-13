import { Client } from "@googlemaps/google-maps-services-js";
import { Order } from "../order/order.entity.js";
import { Stop, StopType } from "./deliveryRoute.entity.js";

export interface IRouteAssignmentService {
  assignRoute(
    deliveryLat: number,
    deliveryLng: number,
    availableOrders: Order[],
  ): Promise<Stop[]>;
}

// ─── Google Maps client ───────────────────────────────────────────────────────

const mapsClient = new Client({});
//const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY_BACKEND!;

/**
 * Llama a Distance Matrix API UNA SOLA VEZ con todos los nodos
 * y devuelve una matriz de tiempos en segundos.
 *
 * matrix[i][j] = segundos de viaje del nodo i al nodo j
 */
async function fetchTravelTimeMatrix(
  coords: { lat: number; lng: number }[],
): Promise<number[][]> {

  const apiKey = process.env.GOOGLE_MAPS_API_KEY_BACKEND;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY_BACKEND is not set");
  const latLngs = coords.map((c) => ({ lat: c.lat, lng: c.lng }));

  console.log("Calling Maps with", coords.length, "nodes");

  const response = await mapsClient.distancematrix({
    params: {
      origins: latLngs,
      destinations: latLngs,
      departure_time: new Date(),   // tráfico en tiempo real
      key: apiKey,
    },
  });

  const rows = response.data.rows;

  console.log("Maps status:", response.data.status);
  console.log("Maps rows:", JSON.stringify(response.data.rows?.slice(0,2)));

  return rows.map((row) =>
    row.elements.map((el) => {
      if (el.status !== "OK") return Infinity;
      // duration_in_traffic si está disponible, si no duration
      return (el.duration_in_traffic ?? el.duration).value;
    }),
  );
}

// ─── Permutaciones ────────────────────────────────────────────────────────────

/**
 * Genera todas las permutaciones de un array.
 */
function* permutations<T>(arr: T[]): Generator<T[]> {
  if (arr.length <= 1) {
    yield arr;
    return;
  }
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      yield [arr[i], ...perm];
    }
  }
}

/**
 * Valida que en la secuencia, cada pickup ocurra antes que su delivery.
 */
function isValidSequence(sequence: Stop[]): boolean {
  const pickedUp = new Set<string>();
  for (const stop of sequence) {
    if (stop.type === StopType.delivery && !pickedUp.has(stop.orderId)) {
      return false;
    }
    if (stop.type === StopType.pickup) {
      pickedUp.add(stop.orderId);
    }
  }
  return true;
}

/**
 * Simula el recorrido de una secuencia de paradas y calcula
 * el tiempo total en segundos, teniendo en cuenta:
 *
 *  - Tiempo de viaje real entre paradas (de la matriz de Maps)
 *  - Si el repartidor llega al restaurante ANTES de que el pedido
 *    esté listo → espera el tiempo restante de preparación
 *
 * preparationTime está en minutos (campo estático del shop),
 * y lo usamos como estimación desde el momento 0 (cuando el
 * repartidor hace click en "Repartir").
 */
function simulateRoute(
  sequence: Stop[],
  nodeIndexMap: Map<Stop, number>,
  travelMatrix: number[][],
  prepTimeSeconds: Map<string, number>, // orderId → segundos de preparación
): number {
  let currentTime = 0;   // segundos desde ahora
  let currentNode = 0;   // índice 0 = repartidor (origen)

  for (const stop of sequence) {
    const toNode = nodeIndexMap.get(stop)!;
    const travelTime = travelMatrix[currentNode][toNode];
    const arrivalTime = currentTime + travelTime;

    if (stop.type === StopType.pickup) {
      const readyAt = prepTimeSeconds.get(stop.orderId) ?? 0;
      // Si llegamos antes de que esté listo, esperamos
      currentTime = Math.max(arrivalTime, readyAt);
    } else {
      currentTime = arrivalTime;
    }

    currentNode = toNode;
  }

  return currentTime;
}

// ─── Servicio principal ───────────────────────────────────────────────────────

export class OptimalRouteAssignment implements IRouteAssignmentService {
  async assignRoute(
    deliveryLat: number,
    deliveryLng: number,
    availableOrders: Order[],
  ): Promise<Stop[]> {

    // 1. Filtrar órdenes sin coordenadas válidas
    const validOrders = availableOrders.filter((order) => {
      const shop = order.lineItems[0]?.product?.shop;
      return (
        shop?.latitude && shop?.longitude &&
        order.client?.latitude && order.client?.longitude
      );
    });

    if (validOrders.length === 0) return [];

    // 2. Tomar hasta 3 órdenes
    //    Usamos las 3 más cercanas al repartidor como pre-filtro
    //    para no llamar a Maps con candidatos lejanos irrelevantes
    const preFiltered = validOrders
      .map((order) => {
        const shop = order.lineItems[0].product.shop;
        const dx = shop.latitude! - deliveryLat;
        const dy = shop.longitude! - deliveryLng;
        return { order, dist: dx * dx + dy * dy }; // distancia euclídea simple para pre-filtro
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3)
      .map((x) => x.order);

    // 3. Construir los nodos:
    //    nodo 0          → repartidor (origen)
    //    nodo 1,3,5,...  → pickup de cada orden
    //    nodo 2,4,6,...  → delivery de cada orden
    const coords: { lat: number; lng: number }[] = [
      { lat: deliveryLat, lng: deliveryLng },
    ];

    const stops: Stop[] = [];
    const nodeIndexMap = new Map<Stop, number>();
    const prepTimeSeconds = new Map<string, number>();

    for (const order of preFiltered) {
      const shop   = order.lineItems[0].product.shop;
      const client = order.client;

      const pickupStop: Stop = {
        orderId:  order.id,
        type:     StopType.pickup,
        shopName: shop.name,
        address:  shop.address ?? `${shop.street} ${shop.streetNumber}`,
        latitude: shop.latitude!,
        longitude: shop.longitude!,
      };

      const deliveryStop: Stop = {
        orderId:    order.id,
        type:       StopType.delivery,
        clientName: `${client.name} ${client.surname}`,
        address:    client.address ?? `${client.street} ${client.streetNumber}`,
        latitude:   client.latitude!,
        longitude:  client.longitude!,
      };

      // El índice en la matriz es la posición en coords[]
      nodeIndexMap.set(pickupStop, coords.length);
      coords.push({ lat: shop.latitude!, lng: shop.longitude! });

      nodeIndexMap.set(deliveryStop, coords.length);
      coords.push({ lat: client.latitude!, lng: client.longitude! });

      stops.push(pickupStop, deliveryStop);

      // preparationTime en minutos → segundos
      prepTimeSeconds.set(order.id, (shop.preparationTime ?? 0) * 60);
    }

    // 4. Una sola llamada a Google Maps con todos los nodos
    const travelMatrix = await fetchTravelTimeMatrix(coords);

    // 5. Evaluar todas las permutaciones válidas (~90 con 3 órdenes)
    let bestTime = Infinity;
    let bestSequence: Stop[] = stops; // fallback

    for (const perm of permutations(stops)) {
      if (!isValidSequence(perm)) continue;

      const totalTime = simulateRoute(
        perm,
        nodeIndexMap,
        travelMatrix,
        prepTimeSeconds,
      );

      if (totalTime < bestTime) {
        bestTime     = totalTime;
        bestSequence = perm;
      }
    }

    return bestSequence;
  }
}

// Mismo nombre de export que antes → el controller no cambia
export const routeAssignmentService = new OptimalRouteAssignment();