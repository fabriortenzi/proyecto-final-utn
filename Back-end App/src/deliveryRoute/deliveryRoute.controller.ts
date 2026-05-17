import { orm } from "../shared/orm.js";
import { DeliveryRoute, DeliveryRouteStatus } from "./deliveryRoute.entity.js";
import { Order } from "../order/order.entity.js";
import { User } from "../user/user.entity.js";
import { routeAssignmentService } from "./routeAssignment.service.js";
import { Request, Response, NextFunction } from "express";

const em = orm.em;

function getUserId(req: Request): string {
  return (req as any).token.id;
}

function isRouteOwner(route: DeliveryRoute, userId: string): boolean {
  const ownerId = route.deliveryUser?.id ?? String(route.deliveryUser);
  return ownerId === userId;
}

export function sanitizeRouteInput(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { latitude, longitude } = req.body;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res
      .status(400)
      .json({ message: "latitude and longitude must be numbers" });
  }

  req.body.sanitizedInput = { latitude, longitude };
  next();
}

export async function requestRoute(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { latitude, longitude } = req.body.sanitizedInput;

    // Lazy cleanup: expire stale proposed routes
    const expiredRoutes = await em.find(DeliveryRoute, {
      status: DeliveryRouteStatus.proposed,
      expiresAt: { $lt: new Date() },
    });

    for (const expiredRoute of expiredRoutes) {
      expiredRoute.status = DeliveryRouteStatus.expired;
      const expiredOrderIds = [
        ...new Set(expiredRoute.stops.map((s) => s.orderId)),
      ];
      const expiredOrders = await em.find(Order, {
        id: { $in: expiredOrderIds },
      });
      for (const order of expiredOrders) {
        order.tentativeRouteId = undefined;
      }
    }

    if (expiredRoutes.length > 0) {
      await em.flush();
    }

    // Check if delivery user already has an active or proposed route
    const existingRoute = await em.findOne(DeliveryRoute, {
      deliveryUser: userId,
      status: {
        $in: [DeliveryRouteStatus.proposed, DeliveryRouteStatus.active],
      },
    });

    if (existingRoute) {
      return res
        .status(409)
        .json({ message: "You already have an active or proposed route" });
    }

    // Query available orders: no delivery assigned and no tentative route
    const availableOrders = await em.find(
      Order,
      { delivery: { $eq: undefined }, tentativeRouteId: { $eq: undefined } },
      { populate: ["lineItems.product.shop", "client"] },
    );

    // Assign route using the service
    const stops = await routeAssignmentService.assignRoute(
      latitude,
      longitude,
      availableOrders,
    );

    if (stops.length === 0) {
      return res
        .status(404)
        .json({ message: "No available orders found nearby" });
    }

    // Create the delivery route
    const route = em.create(DeliveryRoute, {
      deliveryUser: userId,
      stops,
      status: DeliveryRouteStatus.proposed,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
      createdAt: new Date(),
    });

    // Set tentativeRouteId on selected orders
    const uniqueOrderIds = [...new Set(stops.map((s) => s.orderId))];
    const selectedOrders = await em.find(Order, {
      id: { $in: uniqueOrderIds },
    });
    for (const order of selectedOrders) {
      order.tentativeRouteId = route.id;
    }

    await em.flush();

    return res.status(201).json({ message: "Route proposed", data: route });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function confirmRoute(req: Request, res: Response) {
  try {
    const userId = getUserId(req);

    const route = await em.findOne(DeliveryRoute, req.params.id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    if (!isRouteOwner(route, userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (route.status !== DeliveryRouteStatus.proposed) {
      return res
        .status(409)
        .json({ message: "Route is not in proposed status" });
    }

    if (route.expiresAt <= new Date()) {
      // Route expired, clean up
      route.status = DeliveryRouteStatus.expired;
      const expiredOrderIds = [...new Set(route.stops.map((s) => s.orderId))];
      const expiredOrders = await em.find(Order, {
        id: { $in: expiredOrderIds },
      });
      for (const order of expiredOrders) {
        order.tentativeRouteId = undefined;
      }
      await em.flush();
      return res.status(410).json({ message: "Route has expired" });
    }

    // Activate route
    route.status = DeliveryRouteStatus.active;

    // Assign delivery user to orders and clear tentativeRouteId
    const uniqueOrderIds = [...new Set(route.stops.map((s) => s.orderId))];
    const orders = await em.find(Order, { id: { $in: uniqueOrderIds } });
    const user = await em.findOneOrFail(User, { id: userId });

    for (const order of orders) {
      order.delivery = user;
      order.tentativeRouteId = undefined;
    }

    await em.flush();

    return res.status(200).json({ message: "Route confirmed", data: route });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function completeStop(req: Request, res: Response) {
  try {
    const userId = getUserId(req);

    const route = await em.findOne(DeliveryRoute, req.params.id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    if (!isRouteOwner(route, userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (route.status !== DeliveryRouteStatus.active) {
      return res.status(400).json({ message: "Route is not active" });
    }

    const stopIndex = parseInt(req.params.stopIndex, 10);
    if (isNaN(stopIndex) || stopIndex < 0 || stopIndex >= route.stops.length) {
      return res.status(400).json({ message: "Invalid stop index" });
    }

    // Validate stop is the next uncompleted one (sequential completion)
    const firstUncompletedIndex = route.stops.findIndex((s) => !s.completedAt);
    console.log(route.stops);

    if (firstUncompletedIndex !== stopIndex) {
      return res
        .status(400)
        .json({ message: "Stops must be completed in sequence" });
    }

    // Mark stop as completed
    const updatedStops = [...route.stops];
    updatedStops[stopIndex] = { ...updatedStops[stopIndex], completedAt: new Date() };

    // If delivery stop: mark order as arrived and credit the delivery user
    if (updatedStops[stopIndex].type === "delivery") {
      const order = await em.findOne(Order, updatedStops[stopIndex].orderId);
      if (order) {
        order.dateTimeArrival = new Date();

        const deliveryUser = await em.findOne(User, userId);
        if (deliveryUser) {
          deliveryUser.creditBalance += order.commissionForDelivery;
        }
      }
    }

    // Check if all stops are completed
    const allCompleted = updatedStops.every((s) => s.completedAt);
    if (allCompleted) {
      route.status = DeliveryRouteStatus.completed;
    }

    // Assign new array reference — MikroORM needs this to detect JSON changes
    route.stops = updatedStops;

    await em.flush();

    return res.status(200).json({ message: "Stop completed", data: route });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function rejectRoute(req: Request, res: Response) {
  try {
    const userId = getUserId(req);

    const route = await em.findOne(DeliveryRoute, req.params.id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    if (!isRouteOwner(route, userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    route.status = DeliveryRouteStatus.rejected;

    // Clear tentativeRouteId on affected orders
    const uniqueOrderIds = [...new Set(route.stops.map((s) => s.orderId))];
    const orders = await em.find(Order, { id: { $in: uniqueOrderIds } });
    for (const order of orders) {
      order.tentativeRouteId = undefined;
    }

    await em.flush();

    return res.status(200).json({ message: "Route rejected", data: route });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}
