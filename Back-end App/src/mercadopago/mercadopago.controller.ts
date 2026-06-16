import { MercadoPagoConfig, Preference } from 'mercadopago';
import { Request, Response } from 'express';
import { orm } from '../shared/orm.js';
import { Order } from '../order/order.entity.js';

export async function createPreference(req: Request, res: Response) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      console.error('❌ MERCADO_PAGO_ACCESS_TOKEN no está definido');
      return res
        .status(500)
        .json({ message: 'MercadoPago token not configured' });
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

    const frontendUrl =
      process.env.FRONTEND_URL ||
      `https://github.com/fabriortenzi/proyecto-final-utn`;

    if (!frontendUrl) {
      console.error('❌ MERCADO_PAGO_ACCESS_TOKEN no está definido');
      return res
        .status(500)
        .json({ message: 'MercadoPago token not configured' });
    }

    console.log(frontendUrl);

    const body = {
      items: items as any,
      auto_return: 'approved',
      back_urls: {
        success: frontendUrl,
        failure: frontendUrl,
        pending: frontendUrl,
      },
      external_reference: order.id,
    };

    // ✅ Crear el cliente DENTRO de la función
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    });

    const preference = new Preference(client);
    const result = await preference.create({ body });

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
