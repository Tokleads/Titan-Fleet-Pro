import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { db } from './db';
import { accountSetupTokens } from '@shared/schema';
import { randomBytes } from 'crypto';
import { sendAccountSetupEmail } from './emailService';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);
  }
}

export async function handlePostCheckout(payload: Buffer, signature: string): Promise<void> {
  const stripe = await getUncachableStripeClient();
  
  const sync = await getStripeSync();
  const webhookSecret = sync.webhookSecret;
  
  let event;
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } else {
      event = JSON.parse(payload.toString());
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return;
  }
  
  if (event.type !== 'checkout.session.completed') return;
  
  const session = event.data.object;
  const customerEmail = session.customer_email || session.customer_details?.email;
  
  if (!customerEmail) {
    console.log('No customer email in checkout session');
    return;
  }
  
  let tier = 'starter';
  let maxVehicles = 10;
  
  if (session.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string, {
        expand: ['items.data.price.product']
      });
      const product = subscription.items.data[0]?.price?.product as any;
      if (product?.metadata?.tier) {
        tier = product.metadata.tier;
      }
      if (product?.metadata?.maxVehicles) {
        maxVehicles = parseInt(product.metadata.maxVehicles) || 10;
      }
    } catch (e) {
      console.error('Error fetching subscription details:', e);
    }
  }
  
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  
  await db.insert(accountSetupTokens).values({
    token,
    email: customerEmail,
    stripeCustomerId: session.customer as string || null,
    stripeSubscriptionId: session.subscription as string || null,
    tier,
    maxVehicles,
    expiresAt,
  });
  
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0];
  const baseUrl = domain ? `https://${domain}` : 'http://localhost:5000';
  const setupUrl = `${baseUrl}/setup-account?token=${token}`;
  
  const result = await sendAccountSetupEmail({
    email: customerEmail,
    setupUrl,
    tier,
  });
  
  if (result.success) {
    console.log(`Account setup email sent to ${customerEmail}`);
  } else {
    console.error(`Failed to send setup email to ${customerEmail}:`, result.error);
  }
}
