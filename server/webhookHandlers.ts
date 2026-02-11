import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { db } from './db';
import { accountSetupTokens } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { sendAccountSetupEmail } from './emailService';
import { storage } from './storage';

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
  
  const referralCode = session.metadata?.referralCode || null;
  
  await db.insert(accountSetupTokens).values({
    token,
    email: customerEmail,
    stripeCustomerId: session.customer as string || null,
    stripeSubscriptionId: session.subscription as string || null,
    tier,
    maxVehicles,
    referralCode,
    expiresAt,
  });
  
  if (referralCode) {
    try {
      const referral = await storage.getReferralByCode(referralCode);
      if (referral && referral.status === 'pending') {
        await storage.updateReferral(referral.id, {
          status: 'signed_up',
          signedUpAt: new Date(),
        });
        console.log(`[REFERRAL] Referral ${referralCode} marked as signed_up after checkout`);
      } else if (referral) {
        console.log(`[REFERRAL] Skipping update for ${referralCode} - status is already '${referral.status}'`);
      }
    } catch (err) {
      console.error('[REFERRAL] Failed to update referral after checkout:', err);
    }
  }
  
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

export async function handleInvoicePaid(payload: Buffer, signature: string): Promise<void> {
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
  
  if (event.type !== 'invoice.paid') return;
  
  const invoice = event.data.object;
  if (!invoice.subscription || invoice.amount_paid === 0) return;
  if (invoice.billing_reason !== 'subscription_cycle' && invoice.billing_reason !== 'subscription_create') return;
  
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const referralCode = subscription.metadata?.referralCode;
    
    if (!referralCode) {
      const referralFromDb = await findReferralByStripeSubscription(invoice.subscription as string);
      if (!referralFromDb) return;
      await processReferralReward(stripe, referralFromDb);
      return;
    }
    
    const referral = await storage.getReferralByCode(referralCode);
    if (!referral) {
      console.log(`[REFERRAL] No referral found for code ${referralCode}`);
      return;
    }
    
    await processReferralReward(stripe, referral);
  } catch (err) {
    console.error('[REFERRAL] Failed to process referral reward:', err);
  }
}

async function findReferralByStripeSubscription(subscriptionId: string): Promise<any> {
  const [token] = await db.select()
    .from(accountSetupTokens)
    .where(eq(accountSetupTokens.stripeSubscriptionId, subscriptionId));
  
  if (!token?.referralCode) return null;
  return storage.getReferralByCode(token.referralCode);
}

async function processReferralReward(stripe: any, referral: any): Promise<void> {
  if (referral.status === 'rewarded' || referral.status === 'converted') {
    console.log(`[REFERRAL] Already processed ${referral.referralCode} - status: ${referral.status}`);
    return;
  }
  
  const referrerCompany = await storage.getCompanyById(referral.referrerCompanyId);
  if (!referrerCompany || !referrerCompany.stripeSubscriptionId) {
    console.log(`[REFERRAL] Referrer company ${referral.referrerCompanyId} has no Stripe subscription`);
    await storage.updateReferral(referral.id, {
      status: 'converted',
      convertedAt: new Date(),
    });
    return;
  }
  
  const coupon = await stripe.coupons.create({
    percent_off: 100,
    duration: 'once',
    name: `Referral Reward - 1 Month Free (${referral.referralCode})`,
    metadata: { referralCode: referral.referralCode, referrerCompanyId: String(referral.referrerCompanyId) },
  });
  
  await stripe.subscriptions.update(referrerCompany.stripeSubscriptionId, {
    coupon: coupon.id,
  });
  
  await storage.updateReferral(referral.id, {
    status: 'rewarded',
    rewardType: 'free_month',
    rewardValue: 1,
    rewardClaimed: true,
    convertedAt: new Date(),
  });
  
  console.log(`[REFERRAL] Successfully applied 1 month free to referrer company ${referral.referrerCompanyId} for code ${referral.referralCode}`);
}
