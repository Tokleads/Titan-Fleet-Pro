import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  Tag,
  Share2,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Link as LinkIcon,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  author: { name: string; role: string };
  publishDate: string;
  readingTime: string;
  category: string;
  tags: string[];
  featured: boolean;
  featuredImage: string;
}

const blogPosts: BlogPost[] = [
  {
    slug: "dvsa-walk-around-check-guide-2025",
    title: "DVSA Walk-Around Check Guide 2025",
    metaTitle: "DVSA Walk-Around Check Guide 2025 | Titan Fleet",
    metaDescription: "Complete guide to DVSA walk-around checks for HGV and PSV operators. Learn the mandatory inspection points and stay compliant in 2025.",
    excerpt: "A comprehensive guide to conducting DVSA-compliant walk-around checks for your fleet vehicles. Learn every inspection point, common defects to look for, and how to document checks properly.",
    content: `<h2>Why Walk-Around Checks Matter</h2>
<p>Walk-around checks are the first line of defence against vehicle defects and roadside prohibitions. Under the Goods Vehicles (Licensing of Operators) Act 1995, every operator has a legal duty to ensure their vehicles are roadworthy before they leave the yard.</p>
<p>A proper walk-around check takes just 15–20 minutes but can prevent costly breakdowns, prohibition notices, and — most importantly — keep your drivers and other road users safe.</p>

<h2>The Mandatory Inspection Points</h2>
<p>DVSA expects drivers to check the following areas as a minimum before every journey:</p>
<ul>
<li><strong>Lights and indicators</strong> – all external lights must be clean and functional</li>
<li><strong>Tyres and wheel fixings</strong> – check tread depth (minimum 1mm across 75% of the width for HGVs), tyre pressure, and wheel nut indicators</li>
<li><strong>Mirrors and glass</strong> – no cracks, chips, or obstructions in the driver's line of sight</li>
<li><strong>Brakes</strong> – service brake, secondary brake, and parking brake operation</li>
<li><strong>Diesel exhaust fluid (AdBlue)</strong> – check levels and top up if needed</li>
<li><strong>Oil and coolant levels</strong> – inspect for leaks under the vehicle</li>
<li><strong>Bodywork and load security</strong> – curtains, doors, tailgate, and load restraints</li>
<li><strong>Number plates</strong> – clean and clearly visible</li>
</ul>

<h2>Common Defects Found at Roadside</h2>
<p>According to DVSA data, the most common immediate prohibition defects are:</p>
<ol>
<li>Tyre defects (worn below legal limits, cuts, bulges)</li>
<li>Brake defects (worn pads, air leaks, imbalance)</li>
<li>Lighting defects (inoperative headlamps, indicators)</li>
<li>Insecure loads</li>
<li>Steering defects</li>
</ol>

<h2>Digital Walk-Around Checks</h2>
<p>Paper-based check sheets are still legal but increasingly inadequate for modern compliance. Digital walk-around checks offer timestamped, GPS-tagged, photo-evidenced records that are far more robust if DVSA ever questions your maintenance systems.</p>
<p>With Titan Fleet, drivers complete checks on their phone in under 10 minutes. Defects are flagged immediately to the transport manager, and safety-critical issues automatically place the vehicle off-road (VOR) until resolved.</p>

<h2>Best Practice Tips</h2>
<p>To get the most from your walk-around check process:</p>
<ul>
<li>Always check vehicles before the first use of the day, not just at the start of each journey</li>
<li>Train drivers to report defects immediately — even minor ones</li>
<li>Keep records for at least 15 months (DVSA can request them at any time)</li>
<li>Use a structured checklist rather than relying on memory</li>
<li>Monitor check completion rates and follow up on missed checks</li>
</ul>`,
    author: { name: "Jon Byrne", role: "Class 1 Driver & Founder" },
    publishDate: "2025-01-15",
    readingTime: "8 min read",
    category: "DVSA Compliance",
    tags: ["DVSA", "walk-around checks", "compliance", "HGV", "vehicle inspection"],
    featured: true,
    featuredImage: "DVSA walk-around check inspection of HGV vehicle",
  },
  {
    slug: "how-gps-tracking-reduces-fleet-costs",
    title: "How GPS Tracking Reduces Fleet Costs",
    metaTitle: "How GPS Tracking Reduces Fleet Costs | Titan Fleet",
    metaDescription: "Discover how GPS fleet tracking cuts fuel costs, reduces unauthorised use, and improves route efficiency for UK haulage operators.",
    excerpt: "GPS tracking isn't just about knowing where your vehicles are. Discover how real-time fleet tracking can cut fuel bills, reduce unauthorised use, and improve overall operational efficiency.",
    content: `<h2>The Real Cost of Running Blind</h2>
<p>If you're running a fleet without GPS tracking in 2025, you're almost certainly leaving money on the table. The average UK haulage operator spends 30–40% of their operating costs on fuel alone. Without visibility into driver behaviour, route efficiency, and vehicle utilisation, those costs only go up.</p>

<h2>5 Ways GPS Tracking Saves Money</h2>

<h3>1. Fuel Savings Through Driver Behaviour Monitoring</h3>
<p>Harsh acceleration, excessive idling, and speeding all burn extra fuel. GPS tracking systems that monitor driver behaviour can reduce fuel consumption by 10–15% on average. That's a significant saving when diesel prices are hovering around £1.40 per litre.</p>

<h3>2. Route Optimisation</h3>
<p>Real-time traffic data combined with GPS tracking allows dispatchers to reroute vehicles around congestion, roadworks, and incidents. Even small improvements in route efficiency compound into major savings over thousands of journeys per year.</p>

<h3>3. Reducing Unauthorised Vehicle Use</h3>
<p>Out-of-hours vehicle use is a surprisingly common problem. GPS tracking with geofence alerts immediately flags when a vehicle leaves a designated area or moves outside of working hours, deterring personal use of company vehicles.</p>

<h3>4. Accurate Mileage Records</h3>
<p>Manual mileage logs are notoriously inaccurate. GPS tracking provides precise, automated mileage records for HMRC compliance, customer billing, and maintenance scheduling. No more guesswork or inflated expense claims.</p>

<h3>5. Insurance Premium Reductions</h3>
<p>Many fleet insurers offer discounts of 5–15% for vehicles fitted with approved GPS tracking systems. The tracking data also provides invaluable evidence in the event of an accident or insurance claim.</p>

<h2>What to Look for in a Fleet Tracking System</h2>
<p>Not all GPS tracking solutions are created equal. For UK fleet operators, look for:</p>
<ul>
<li>Real-time tracking with updates every 5 minutes or less</li>
<li>Geofence capabilities for depot and customer site alerts</li>
<li>Driver behaviour scoring and reporting</li>
<li>Integration with existing fleet management software</li>
<li>No long-term contracts or hidden hardware costs</li>
</ul>

<p>Titan Fleet includes GPS tracking as standard in every plan — no additional hardware required. Drivers simply use the mobile app, and fleet managers get real-time visibility from their dashboard.</p>`,
    author: { name: "Jon Byrne", role: "Class 1 Driver & Founder" },
    publishDate: "2025-02-10",
    readingTime: "6 min read",
    category: "GPS Tracking",
    tags: ["GPS tracking", "fleet costs", "fuel savings", "route optimisation", "telematics"],
    featured: false,
    featuredImage: "GPS satellite tracking dashboard showing fleet vehicle locations on map",
  },
  {
    slug: "5-driver-safety-tips-fleet-managers",
    title: "5 Driver Safety Tips Every Fleet Manager Should Know",
    metaTitle: "5 Driver Safety Tips for Fleet Managers | Titan Fleet",
    metaDescription: "Essential driver safety tips for UK fleet managers. Reduce accidents, improve compliance, and protect your drivers with these proven strategies.",
    excerpt: "Driver safety should be every fleet manager's top priority. These five practical tips will help you reduce accident rates, improve compliance scores, and protect your most valuable asset — your drivers.",
    content: `<h2>Safety Starts with Culture</h2>
<p>Driver safety isn't just about rules and regulations — it's about building a culture where safety is valued from the top down. The best fleet operators in the UK treat safety as a competitive advantage, not a compliance burden.</p>

<h3>1. Invest in Regular Driver Training</h3>
<p>Driver CPC training is a legal requirement, but the best operators go beyond the minimum. Regular toolbox talks, seasonal driving awareness sessions (especially for winter driving), and hazard perception refreshers keep safety front of mind.</p>
<p>Consider tracking training completion dates digitally so you never miss a renewal deadline. Expired CPC qualifications can result in fixed penalty notices and driver disqualification.</p>

<h3>2. Monitor Fatigue and Working Hours</h3>
<p>Driver fatigue is a factor in approximately 20% of serious road accidents. Ensure your drivers are taking proper breaks, and use tachograph analysis to identify patterns of non-compliance before DVSA does.</p>
<p>Key rules to monitor:</p>
<ul>
<li>Maximum 9 hours daily driving (extendable to 10 hours twice per week)</li>
<li>45-minute break after 4.5 hours of driving</li>
<li>Minimum 11 hours daily rest (reducible to 9 hours three times per week)</li>
<li>Maximum 56 hours driving per week, 90 hours per fortnight</li>
</ul>

<h3>3. Implement a Robust Defect Reporting System</h3>
<p>Drivers are your eyes on the ground. Make it easy for them to report defects — even minor ones — without fear of repercussion. A simple, mobile-friendly defect reporting system with photo evidence ensures nothing gets missed.</p>
<p>Safety-critical defects (brakes, steering, tyres) should automatically trigger a vehicle off-road (VOR) status until resolved. This is exactly how Titan Fleet handles it — no manual intervention required.</p>

<h3>4. Use Telematics to Coach, Not Punish</h3>
<p>Driver behaviour data should be used constructively. Instead of punishing drivers for harsh braking events, use the data to identify training opportunities. Drivers who feel supported rather than surveilled are far more likely to engage with safety programmes.</p>

<h3>5. Review Accident Data and Near-Misses</h3>
<p>Every accident and near-miss is a learning opportunity. Maintain a central register of incidents, identify patterns (time of day, location, driver, vehicle type), and implement targeted interventions. Even a simple monthly safety review meeting can dramatically reduce repeat incidents.</p>

<h2>The Business Case for Safety</h2>
<p>Beyond the moral imperative, there's a strong commercial case for investing in driver safety. Fewer accidents mean lower insurance premiums, reduced vehicle downtime, and better OCRS scores — which directly impact your ability to win contracts and avoid DVSA attention.</p>`,
    author: { name: "Jon Byrne", role: "Class 1 Driver & Founder" },
    publishDate: "2025-03-05",
    readingTime: "7 min read",
    category: "Driver Safety",
    tags: ["driver safety", "fleet management", "CPC training", "fatigue management", "accident prevention"],
    featured: true,
    featuredImage: "Professional HGV driver performing safety checks before journey",
  },
  {
    slug: "understanding-o-licence-compliance-requirements",
    title: "Understanding O-Licence Compliance Requirements",
    metaTitle: "O-Licence Compliance Guide for UK Operators | Titan Fleet",
    metaDescription: "Everything UK fleet operators need to know about O-Licence compliance. Understand your obligations and avoid Traffic Commissioner action.",
    excerpt: "Your Operator's Licence is the foundation of your haulage business. This guide explains the key compliance requirements every O-Licence holder must meet to avoid Traffic Commissioner action.",
    content: `<h2>What Is an Operator's Licence?</h2>
<p>An Operator's Licence (O-Licence) is the legal authority to operate goods vehicles over 3.5 tonnes in Great Britain. Issued by the Traffic Commissioner, it comes with a set of undertakings that you must comply with at all times — not just when you apply.</p>
<p>There are three types of O-Licence:</p>
<ul>
<li><strong>Restricted</strong> – for carrying your own goods only</li>
<li><strong>Standard National</strong> – for carrying goods for hire or reward within Great Britain</li>
<li><strong>Standard International</strong> – for carrying goods for hire or reward, including international journeys</li>
</ul>

<h2>Key Undertakings You Must Meet</h2>
<p>When you receive your O-Licence, you make undertakings to the Traffic Commissioner. Breaking these undertakings can lead to regulatory action, including licence revocation. The key undertakings include:</p>

<h3>Vehicle Maintenance</h3>
<ul>
<li>Vehicles must be kept in a fit and serviceable condition at all times</li>
<li>Maintenance must be carried out at the intervals stated on your licence</li>
<li>You must use the operating centre(s) declared on your licence</li>
<li>Drivers must report defects in writing, and you must act on them</li>
</ul>

<h3>Financial Standing</h3>
<p>You must demonstrate adequate financial standing: currently £8,000 for the first vehicle and £4,500 for each additional vehicle (Standard licence). The Traffic Commissioner can request evidence of financial standing at any time.</p>

<h3>Transport Manager</h3>
<p>Standard licence holders must have a nominated Transport Manager who holds a valid CPC. The Transport Manager must exercise continuous and effective management of the transport operation.</p>

<h3>Operating Centre</h3>
<p>Vehicles must be normally kept at the operating centre(s) specified on your licence. If you need to change your operating centre, you must apply to vary your licence before moving vehicles.</p>

<h2>OCRS: Your Compliance Score</h2>
<p>DVSA uses the Operator Compliance Risk Score (OCRS) to assess operators. Your OCRS is based on two factors:</p>
<ol>
<li><strong>Roadworthiness</strong> – results from roadside encounters and annual test history</li>
<li><strong>Traffic</strong> – drivers' hours offences, overloading, and other traffic-related issues</li>
</ol>
<p>A high OCRS score (red band) means your vehicles are more likely to be stopped for inspection. A consistently poor score can trigger a public inquiry with the Traffic Commissioner.</p>

<h2>How to Stay Compliant</h2>
<p>The operators who stay out of trouble are the ones with robust systems in place:</p>
<ul>
<li>Digital maintenance records with full audit trails</li>
<li>Automated reminders for MOT, tax, and service dates</li>
<li>Regular driver defect reporting with photo evidence</li>
<li>Continuous monitoring of drivers' hours compliance</li>
<li>Regular self-audit against your licence undertakings</li>
</ul>
<p>Titan Fleet was built specifically to help UK operators meet these requirements. From automated compliance alerts to DVSA-ready inspection records, every feature is designed with O-Licence compliance in mind.</p>`,
    author: { name: "Jon Byrne", role: "Class 1 Driver & Founder" },
    publishDate: "2025-04-20",
    readingTime: "9 min read",
    category: "Fleet Management",
    tags: ["O-Licence", "compliance", "Traffic Commissioner", "OCRS", "fleet management"],
    featured: false,
    featuredImage: "UK Operator Licence compliance documentation and fleet records",
  },
  {
    slug: "fleet-technology-trends-2026",
    title: "Fleet Technology Trends for 2026",
    metaTitle: "Fleet Technology Trends 2026 | Titan Fleet Blog",
    metaDescription: "The top fleet technology trends shaping UK haulage in 2026. From AI-powered compliance to electric vehicles and autonomous logistics.",
    excerpt: "The fleet management industry is evolving rapidly. Here are the key technology trends that will shape UK haulage and logistics operations in 2026 and beyond.",
    content: `<h2>The Fleet Industry Is Changing Fast</h2>
<p>UK fleet operators are facing a perfect storm of regulatory change, driver shortages, and rising costs. Technology is no longer optional — it's the differentiator between operators who thrive and those who struggle to survive. Here are the trends we're watching for 2026.</p>

<h2>1. AI-Powered Compliance Automation</h2>
<p>Artificial intelligence is moving beyond buzzword status in fleet management. In 2026, expect to see AI systems that can automatically triage defect reports from driver photos, predict maintenance failures before they happen, and generate compliance reports without human intervention.</p>
<p>At Titan Fleet, we're already building these capabilities into our platform. Our AI agent can identify safety-critical defects from photos and escalate them automatically — no human triage required.</p>

<h2>2. Electric Vehicle Fleet Integration</h2>
<p>While full electrification of HGV fleets remains some years away, 2026 will see significant progress in electric van and light commercial vehicle adoption. Fleet management systems will need to handle charge scheduling, range planning, and energy cost tracking alongside traditional diesel fleet management.</p>
<p>The government's zero-emission vehicle mandate continues to push operators towards cleaner vehicles, with tax incentives making the business case increasingly compelling for last-mile delivery operations.</p>

<h2>3. Mobile-First Fleet Management</h2>
<p>The days of desktop-only fleet management software are numbered. In 2026, the expectation is that drivers, mechanics, and transport managers can all access the tools they need from their smartphones. This means purpose-built mobile apps — not clunky responsive websites.</p>
<p>Walk-around checks, defect reporting, proof of delivery, and even timesheet management should all be achievable from a driver's phone in under a minute per task.</p>

<h2>4. Integrated Proof of Delivery</h2>
<p>Separate POD systems are becoming obsolete. The trend is towards fully integrated platforms where proof of delivery — including digital signatures, photographs, and GPS coordinates — feeds directly into the same system that handles compliance, tracking, and billing.</p>
<p>This integration eliminates duplicate data entry, reduces disputes, and gives fleet operators a single source of truth for every delivery.</p>

<h2>5. Predictive Maintenance</h2>
<p>Rather than reacting to breakdowns, forward-thinking operators are using data to predict when vehicles will need maintenance. By analysing patterns in defect reports, mileage data, and historical maintenance records, fleet management systems can flag vehicles that are at risk of failure before the breakdown truck is needed.</p>
<p>This shift from reactive to predictive maintenance reduces vehicle off-road time, cuts repair costs, and improves fleet reliability.</p>

<h2>6. Earned Recognition and Digital Compliance</h2>
<p>DVSA's Earned Recognition scheme rewards operators who can demonstrate high compliance standards through digital record-keeping. As the scheme matures, operators with robust digital systems will benefit from fewer roadside checks and a reputational advantage when tendering for contracts.</p>

<h2>Looking Ahead</h2>
<p>The fleet operators who invest in technology now will be best positioned for the challenges ahead. Whether it's AI-powered compliance, electric vehicle integration, or predictive maintenance, the common thread is data — and the platforms that can turn that data into actionable insights will win.</p>`,
    author: { name: "Jon Byrne", role: "Class 1 Driver & Founder" },
    publishDate: "2025-05-12",
    readingTime: "7 min read",
    category: "Industry News",
    tags: ["fleet technology", "AI", "electric vehicles", "predictive maintenance", "2026 trends"],
    featured: false,
    featuredImage: "Futuristic fleet management technology dashboard with AI analytics",
  },
];

const categories = ["All", "DVSA Compliance", "Fleet Management", "GPS Tracking", "Driver Safety", "Industry News"];

function getCategoryGradient(category: string): string {
  const gradients: Record<string, string> = {
    "DVSA Compliance": "bg-gradient-to-br from-blue-600 to-indigo-800",
    "Fleet Management": "bg-gradient-to-br from-emerald-600 to-teal-800",
    "GPS Tracking": "bg-gradient-to-br from-violet-600 to-purple-800",
    "Driver Safety": "bg-gradient-to-br from-amber-500 to-orange-700",
    "Industry News": "bg-gradient-to-br from-slate-600 to-slate-800",
  };
  return gradients[category] || "bg-gradient-to-br from-blue-600 to-blue-800";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function BlogListing() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPosts = activeCategory === "All"
    ? blogPosts
    : blogPosts.filter((p) => p.category === activeCategory);

  return (
    <>
      <section className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1
            className="font-['Oswald'] text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4"
            data-testid="text-blog-heading"
          >
            Titan Fleet Blog
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
            Expert insights on fleet compliance, GPS tracking, driver safety, and the latest industry trends — straight from the cab.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-3 justify-center" data-testid="category-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              data-testid={`filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-[#2563eb] text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <article
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                data-testid={`card-post-${post.slug}`}
              >
                <div className={`h-48 rounded-t-2xl ${getCategoryGradient(post.category)}`} role="img" aria-label={post.featuredImage}>
                  <div className="h-full flex items-center justify-center p-6">
                    <span className="text-white/80 text-sm font-medium text-center">{post.title}</span>
                  </div>
                </div>
                <div className="p-6">
                  <span
                    className="inline-block bg-[#2563eb]/10 text-[#2563eb] text-xs font-semibold px-3 py-1 rounded-full mb-4"
                    data-testid={`badge-category-${post.slug}`}
                  >
                    {post.category}
                  </span>
                  <h2 className="font-['Oswald'] text-xl font-bold text-[#0f172a] mb-3 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-white text-xs font-bold">
                        JB
                      </div>
                      <span className="font-medium text-slate-700">{post.author.name}</span>
                    </div>
                    <span className="text-slate-300">·</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(post.publishDate)}</span>
                    </div>
                    <span className="text-slate-300">·</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{post.readingTime}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[#2563eb] font-medium text-sm" data-testid={`link-read-more-${post.slug}`}>
                    Read More <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg">No posts found in this category.</p>
          </div>
        )}
      </section>
    </>
  );
}

function BlogPost({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const post = blogPosts.find((p) => p.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="font-['Oswald'] text-3xl font-bold text-[#0f172a] mb-4">Post Not Found</h1>
        <p className="text-slate-600 mb-8">The article you're looking for doesn't exist.</p>
        <Link href="/blog">
          <span className="inline-flex items-center gap-2 text-[#2563eb] font-medium cursor-pointer" data-testid="link-back-to-blog">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </span>
        </Link>
      </div>
    );
  }

  const relatedPosts = blogPosts
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 3);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = encodeURIComponent(post.title);
  const shareUrlEncoded = encodeURIComponent(shareUrl);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    author: {
      "@type": "Person",
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      "@type": "Organization",
      name: "Titan Fleet",
      url: "https://titanfleet.co.uk",
    },
    datePublished: post.publishDate,
    image: "https://titanfleet.co.uk/favicon.png",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": shareUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <Link href="/blog">
          <span
            className="inline-flex items-center gap-2 text-[#2563eb] font-medium cursor-pointer hover:underline"
            data-testid="link-back-to-blog"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </span>
        </Link>
      </div>

      <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-8`}>
        <div className={`h-64 sm:h-80 rounded-2xl ${getCategoryGradient(post.category)} flex items-center justify-center p-8`} role="img" aria-label={post.featuredImage}>
          <h2 className="text-white text-2xl sm:text-3xl font-bold text-center font-['Oswald'] drop-shadow-lg">{post.title}</h2>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <header className="mb-10">
          <span className="inline-block bg-[#2563eb]/10 text-[#2563eb] text-xs font-semibold px-3 py-1 rounded-full mb-4">
            {post.category}
          </span>
          <h1
            className="font-['Oswald'] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0f172a] mb-6 leading-tight"
            data-testid="text-post-title"
          >
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0f172a] flex items-center justify-center text-white text-sm font-bold">
                JB
              </div>
              <div>
                <p className="font-medium text-slate-800">{post.author.name}</p>
                <p className="text-xs text-slate-500">{post.author.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.publishDate)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{post.readingTime}</span>
              </div>
            </div>
          </div>
        </header>

        <div
          className="prose prose-lg prose-slate max-w-none
            prose-headings:font-['Oswald'] prose-headings:text-[#0f172a]
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-slate-600 prose-p:leading-relaxed
            prose-li:text-slate-600
            prose-strong:text-slate-800
            prose-a:text-[#2563eb] prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.content }}
          data-testid="article-content"
        />

        <div className="mt-10 pt-6 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Tag className="h-4 w-4 text-slate-400" />
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <Share2 className="h-4 w-4" /> Share:
            </span>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrlEncoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#1877F2] hover:text-white text-slate-600 flex items-center justify-center transition-colors"
              data-testid="button-share-facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrlEncoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-black hover:text-white text-slate-600 flex items-center justify-center transition-colors"
              data-testid="button-share-twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrlEncoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#0A66C2] hover:text-white text-slate-600 flex items-center justify-center transition-colors"
              data-testid="button-share-linkedin"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <button
              onClick={handleCopyLink}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#2563eb] hover:text-white text-slate-600 flex items-center justify-center transition-colors"
              data-testid="button-copy-link"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            {copied && <span className="text-xs text-emerald-600 font-medium">Copied!</span>}
          </div>
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="bg-slate-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-['Oswald'] text-2xl font-bold text-[#0f172a] mb-8">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedPosts.map((rp) => (
                <Link key={rp.slug} href={`/blog/${rp.slug}`}>
                  <article
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    data-testid={`card-related-${rp.slug}`}
                  >
                    <div className="p-6">
                      <span className="inline-block bg-[#2563eb]/10 text-[#2563eb] text-xs font-semibold px-3 py-1 rounded-full mb-3">
                        {rp.category}
                      </span>
                      <h3 className="font-['Oswald'] text-lg font-bold text-[#0f172a] mb-2">
                        {rp.title}
                      </h3>
                      <p className="text-slate-600 text-sm line-clamp-2">{rp.excerpt}</p>
                      <div className="mt-3 flex items-center gap-1 text-[#2563eb] font-medium text-sm">
                        Read More <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default function Blog() {
  const [match, params] = useRoute("/blog/:slug");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const post = match && params?.slug ? blogPosts.find((p) => p.slug === params.slug) : undefined;

  useEffect(() => {
    if (post) {
      document.title = `${post.metaTitle} | Titan Fleet`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', post.metaDescription);
      else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = post.metaDescription;
        document.head.appendChild(meta);
      }
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', post.metaTitle);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', post.metaDescription);
    } else {
      document.title = "Blog | Titan Fleet - Fleet Management Insights";
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', 'Expert insights on DVSA compliance, fleet management, GPS tracking, and driver safety from Titan Fleet.');
    }
    return () => {
      document.title = "Titan Fleet Management";
    };
  }, [post]);

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <span className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
                <span className="text-xl font-bold text-[#0f172a]">Titan</span>
                <span className="text-xl text-slate-500">Fleet</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/">
                <span className="text-slate-600 hover:text-[#0f172a] transition-colors text-sm font-medium cursor-pointer" data-testid="link-nav-home">
                  Home
                </span>
              </Link>
              <Link href="/blog">
                <span className="text-[#2563eb] font-medium text-sm cursor-pointer" data-testid="link-nav-blog">
                  Blog
                </span>
              </Link>
              <Link href="/help">
                <span className="text-slate-600 hover:text-[#0f172a] transition-colors text-sm font-medium cursor-pointer" data-testid="link-nav-help">
                  Help
                </span>
              </Link>
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              data-testid="button-blog-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">
                  Home
                </span>
              </Link>
              <Link href="/blog" onClick={() => setMobileMenuOpen(false)}>
                <span className="block px-4 py-3 rounded-xl text-[#2563eb] bg-blue-50 font-medium text-sm cursor-pointer">
                  Blog
                </span>
              </Link>
              <Link href="/help" onClick={() => setMobileMenuOpen(false)}>
                <span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">
                  Help
                </span>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {match && params?.slug ? <BlogPost slug={params.slug} /> : <BlogListing />}
      </main>

      <footer className="bg-[#0f172a] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xl font-bold">Titan</span>
              <span className="text-xl text-slate-400 ml-1">Fleet</span>
              <p className="text-slate-400 text-sm mt-2">
                Built by a Class 1 Driver. Trusted by UK Operators.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/titan.fleet"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                data-testid="link-social-instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/people/Titan-Fleet/61586509495375/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                data-testid="link-social-facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} Titan Fleet. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}