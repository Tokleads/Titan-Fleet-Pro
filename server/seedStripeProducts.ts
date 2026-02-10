import { getUncachableStripeClient } from './stripeClient';

async function seedProducts() {
  const stripe = await getUncachableStripeClient();
  
  const tiers = [
    { name: 'Starter', description: 'Up to 10 vehicles — All features included', amount: 5900, vehicles: '10' },
    { name: 'Growth', description: 'Up to 25 vehicles — All features included', amount: 12900, vehicles: '25' },
    { name: 'Pro', description: 'Up to 50 vehicles — All features included', amount: 24900, vehicles: '50' },
    { name: 'Scale', description: 'Up to 100 vehicles — All features included', amount: 39900, vehicles: '100' },
  ];
  
  for (const tier of tiers) {
    const existing = await stripe.products.search({ query: `name:'${tier.name}'` });
    if (existing.data.length > 0) {
      console.log(`${tier.name} already exists (${existing.data[0].id}), skipping`);
      continue;
    }
    
    const product = await stripe.products.create({
      name: tier.name,
      description: tier.description,
      metadata: {
        tier: tier.name.toLowerCase(),
        maxVehicles: tier.vehicles,
      },
    });
    
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: tier.amount,
      currency: 'gbp',
      recurring: { interval: 'month' },
      metadata: {
        tier: tier.name.toLowerCase(),
      },
    });
    
    console.log(`Created ${tier.name}: product=${product.id}, price=${price.id}`);
  }
  
  console.log('Done seeding Stripe products');
}

seedProducts().catch(console.error);
