import { getUncachableStripeClient } from './stripeClient';

async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  // Archive old flat-fee products
  const oldNames = ['Starter', 'Growth', 'Pro', 'Scale'];
  for (const name of oldNames) {
    const existing = await stripe.products.search({ query: `name:'${name}'` });
    for (const product of existing.data) {
      if (product.active) {
        await stripe.products.update(product.id, { active: false });
        console.log(`Archived old product: ${name} (${product.id})`);
      }
    }
  }

  // New per-vehicle plans
  const plans = [
    {
      name: 'TitanFleet Core',
      description: 'DVSA-compliant walkarounds, defect management, fuel logging, driver app — everything you need for full compliance',
      tier: 'core',
      monthlyPence: 1200,      // £12/vehicle/month
      annualPencePerYear: 12000, // £10/vehicle/month equiv = £120/vehicle/year
    },
    {
      name: 'TitanFleet Professional',
      description: 'Core + live GPS tracking, driver timesheets, geofencing, Proof of Delivery, fleet analytics, white-label branding',
      tier: 'professional',
      monthlyPence: 1800,      // £18/vehicle/month
      annualPencePerYear: 18000, // £15/vehicle/month equiv = £180/vehicle/year
    },
    {
      name: 'TitanFleet AI Pro',
      description: 'Professional + AI photo defect triage, autonomous compliance agent, predictive maintenance, one-click AI audit reports',
      tier: 'ai_pro',
      monthlyPence: 2500,      // £25/vehicle/month
      annualPencePerYear: 25200, // £21/vehicle/month equiv = £252/vehicle/year
    },
  ];

  for (const plan of plans) {
    const existing = await stripe.products.search({ query: `name:'${plan.name}'` });
    if (existing.data.length > 0) {
      console.log(`${plan.name} already exists (${existing.data[0].id}), skipping`);
      continue;
    }

    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: {
        tier: plan.tier,
        perVehicle: 'true',
      },
    });

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthlyPence,
      currency: 'gbp',
      recurring: { interval: 'month' },
      metadata: {
        tier: plan.tier,
        billing: 'monthly',
      },
    });

    const annualPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.annualPencePerYear,
      currency: 'gbp',
      recurring: { interval: 'year' },
      metadata: {
        tier: plan.tier,
        billing: 'annual',
      },
    });

    console.log(`Created ${plan.name}: product=${product.id}`);
    console.log(`  Monthly: ${monthlyPrice.id}  (£${plan.monthlyPence / 100}/vehicle/mo)`);
    console.log(`  Annual:  ${annualPrice.id}  (£${plan.annualPencePerYear / 100}/vehicle/year)`);
  }

  console.log('\nDone seeding Stripe products');
}

seedProducts().catch(console.error);
