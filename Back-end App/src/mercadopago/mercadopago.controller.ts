import { MercadoPagoConfig, Preference } from 'mercadopago';
import { Request, Response } from 'express';
import { orm } from '../shared/orm.js';
import { Order } from '../order/order.entity.js';

async function createMpPreference(body: any) {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN no está definido');
  }

  const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  });

  const preference = new Preference(client);
  return await preference.create({ body });
}

export async function createPreference(req: Request, res: Response) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    const order = await orm.em.findOne(Order, orderId, {
      populate: ['lineItems.product.prices', 'client'],
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const items = order.lineItems.map((item) => ({
      title: item.product.name,
      quantity: Number(item.quantity),
      currency_id: 'ARS',
      unit_price: Number(item.product.prices[0].amount),
    }));

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

    const body = {
      items: items as any,
      auto_return: 'approved',
      back_urls: {
        success: `${frontendUrl}`,
        failure: `${frontendUrl}`,
        pending: `${frontendUrl}`,
      },
      external_reference: order.id,
    };

    const result = await createMpPreference(body);

    return res.status(200).json({
      message: 'Preference created',
      init_point: result.init_point,
      preferenceId: result.id,
    });
  } catch (error: any) {
    console.error('MercadoPago Error:', error);
    return res.status(500).json({ message: error.message });
  }
}

export async function createPreferenceFromData(req: Request, res: Response) {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items array is required' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

    const body = {
      items: items as any,
      auto_return: 'approved',
      back_urls: {
        success: `${frontendUrl}/order-confirmed`,
        failure: `${frontendUrl}/order-details`,
        pending: `${frontendUrl}/order-details`,
      },
    };

    const result = await createMpPreference(body);

    return res.status(200).json({
      message: 'Preference created',
      init_point: result.init_point,
      preferenceId: result.id,
    });
  } catch (error: any) {
    console.error('MercadoPago Error:', error);
    return res.status(500).json({ message: error.message });
  }
}
