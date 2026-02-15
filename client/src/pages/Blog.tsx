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
    slug: "dvsa-compliance-uk-hauliers-complete-guide-2026",
    title: "DVSA Compliance for UK Hauliers: Complete Guide 2026",
    metaTitle: "DVSA Compliance Guide 2026 | UK Haulage Requirements | TitanFleet",
    metaDescription: "Complete DVSA compliance guide for UK hauliers. Learn driver hours rules, vehicle checks, tachograph requirements & avoid £300+ fines. Built by a Class 1 driver.",
    excerpt: "DVSA compliance isn't just paperwork—it's the difference between a profitable haulage business and one facing £300+ fines per vehicle, O-licence revocations, and driver bans. Here's everything you need to know for 2026.",
    content: `<h2>What is DVSA Compliance?</h2>
<p>The Driver and Vehicle Standards Agency (DVSA) is responsible for ensuring that commercial vehicles operating on UK roads meet strict safety, roadworthiness, and legal standards. For haulage operators, DVSA compliance covers six key areas:</p>
<ol>
<li><strong>Driver hours and tachograph rules</strong> — ensuring drivers don't exceed legal driving limits</li>
<li><strong>Vehicle roadworthiness</strong> — daily checks, periodic inspections, and annual MOT tests</li>
<li><strong>Operator licensing (O-licence)</strong> — meeting the conditions of your goods vehicle operator's licence</li>
<li><strong>Load security</strong> — ensuring loads are properly secured for every journey</li>
<li><strong>Driver CPC (Certificate of Professional Competence)</strong> — mandatory ongoing training for professional drivers</li>
<li><strong>Tachograph compliance</strong> — proper use, calibration, and data download of tachograph equipment</li>
</ol>
<p><strong>Non-compliance penalties are severe:</strong></p>
<ul>
<li>Fixed penalty notices from <strong>£300 per offence</strong> (up to £1,500 for serious violations)</li>
<li>Immediate prohibition notices — your vehicle is taken off the road on the spot</li>
<li>O-licence revocation — the Traffic Commissioner can shut down your entire operation</li>
<li>Driver disqualification — individual drivers can lose their entitlement to drive professionally</li>
<li>Criminal prosecution for the most serious offences (e.g., falsifying tachograph records)</li>
</ul>

<h2>Driver Hours Rules 2026</h2>
<p>Driver hours rules are one of the most heavily enforced areas of DVSA compliance. The rules are designed to prevent driver fatigue, which is a factor in approximately 20% of serious road accidents involving HGVs.</p>

<h3>EU/GB Retained Driver Hours Rules</h3>
<p>Despite Brexit, the UK has retained the EU driver hours rules (Regulation EC 561/2006) in domestic law. The key limits are:</p>
<table>
<thead><tr><th>Rule</th><th>Limit</th></tr></thead>
<tbody>
<tr><td>Maximum daily driving</td><td>9 hours (extendable to 10 hours twice per week)</td></tr>
<tr><td>Maximum weekly driving</td><td>56 hours</td></tr>
<tr><td>Maximum fortnightly driving</td><td>90 hours</td></tr>
<tr><td>Continuous driving before break</td><td>4.5 hours</td></tr>
<tr><td>Minimum break duration</td><td>45 minutes (can be split: 15 mins + 30 mins)</td></tr>
<tr><td>Minimum daily rest</td><td>11 hours (reducible to 9 hours, max 3 times per week)</td></tr>
<tr><td>Minimum weekly rest</td><td>45 hours (reducible to 24 hours every other week)</td></tr>
</tbody>
</table>

<h3>Working Time Directive (Road Transport)</h3>
<p>In addition to driver hours rules, the Working Time Directive limits total working time (not just driving):</p>
<ul>
<li>Maximum <strong>60 hours</strong> in any single week</li>
<li>Average of <strong>48 hours per week</strong> over a 17-week or 26-week reference period</li>
<li>Maximum <strong>10 hours</strong> night work in any 24-hour period</li>
<li>30-minute break after <strong>6 hours</strong> of work; 45-minute break after <strong>9 hours</strong></li>
</ul>

<h3>Common Driver Hours Violations &amp; Penalties</h3>
<table>
<thead><tr><th>Violation</th><th>Penalty</th></tr></thead>
<tbody>
<tr><td>Exceeding daily driving limit</td><td>£300 fixed penalty per offence</td></tr>
<tr><td>Insufficient daily rest</td><td>£300 fixed penalty</td></tr>
<tr><td>No break after 4.5 hours</td><td>£300 fixed penalty</td></tr>
<tr><td>Exceeding fortnightly driving limit</td><td>£300 fixed penalty</td></tr>
<tr><td>Falsifying tachograph records</td><td>Up to 2 years imprisonment</td></tr>
</tbody>
</table>

<h2>Vehicle Checks &amp; Inspections</h2>
<h3>Daily Walk-Around Checks</h3>
<p>Every driver must complete a walk-around check before the first use of the vehicle each day. The check should cover:</p>
<ul>
<li><strong>Lights and indicators</strong> — all external lights must be clean and functional</li>
<li><strong>Tyres and wheel fixings</strong> — minimum 1mm tread depth across 75% of width for HGVs, correct pressure, wheel nut indicators aligned</li>
<li><strong>Mirrors and glass</strong> — no cracks or obstructions in the driver's line of sight</li>
<li><strong>Brakes</strong> — service brake, secondary brake, and parking brake operation; check air pressure build-up</li>
<li><strong>Fluid levels</strong> — oil, coolant, AdBlue, windscreen washer fluid</li>
<li><strong>Bodywork and load security</strong> — curtains, doors, tailgate, load restraints</li>
<li><strong>Number plates</strong> — clean, legible, and correctly displayed</li>
<li><strong>Exhaust and emissions</strong> — no excessive smoke, DPF warning lights</li>
</ul>

<h3>Periodic (6-Week) Inspections</h3>
<p>Most O-licence holders are required to have their vehicles inspected every 6 weeks by a competent person. These inspections must be documented and records kept for at least 15 months. Inspections should cover brakes, steering, suspension, chassis, cab, electrical systems, engine, transmission, and all safety-critical components.</p>

<h3>Prohibition Notices</h3>
<p>If DVSA finds a serious defect during a roadside check, they can issue:</p>
<ul>
<li><strong>Immediate prohibition (PG9)</strong> — vehicle cannot move until the defect is fixed</li>
<li><strong>Delayed prohibition</strong> — defect must be fixed within a specified timeframe</li>
</ul>
<p>Prohibition notices are recorded against your OCRS (Operator Compliance Risk Score) and can trigger a public inquiry with the Traffic Commissioner.</p>

<h2>Tachograph Compliance</h2>
<p>Tachographs record driving time, breaks, rest periods, and other work. All HGVs over 3.5 tonnes must be fitted with a tachograph.</p>
<h3>Download Requirements</h3>
<ul>
<li><strong>Vehicle unit data</strong> must be downloaded at least every <strong>90 days</strong></li>
<li><strong>Driver card data</strong> must be downloaded at least every <strong>28 days</strong></li>
<li>Data must be stored securely for at least <strong>12 months</strong> (best practice: 24 months)</li>
<li>Tachographs must be <strong>calibrated every 2 years</strong> and after any repair or modification</li>
</ul>

<h3>Common Tachograph Offences</h3>
<ul>
<li>Failing to use the tachograph correctly (wrong mode selection)</li>
<li>Not carrying sufficient chart rolls or a spare printer roll</li>
<li>Driving without a valid driver card</li>
<li>Failing to make manual entries (e.g., out-of-scope driving, ferry crossings)</li>
<li>Tampering with or manipulating the tachograph — this is a <strong>criminal offence</strong> carrying up to <strong>2 years imprisonment</strong></li>
</ul>

<h2>O-Licence Compliance</h2>
<p>Your Operator's Licence is the legal authority to run goods vehicles over 3.5 tonnes. It comes with conditions that must be met at all times:</p>
<ul>
<li>Vehicles must be maintained at the intervals stated on your licence</li>
<li>Vehicles must be kept at the declared operating centre(s)</li>
<li>You must have adequate financial standing (£8,000 first vehicle + £4,500 each additional)</li>
<li>Standard licence holders must have a qualified Transport Manager with a valid CPC</li>
<li>You must notify the Traffic Commissioner of any changes (vehicles, addresses, convictions)</li>
</ul>

<h3>Traffic Commissioner Powers</h3>
<p>The Traffic Commissioner has sweeping powers including:</p>
<ul>
<li>Revoking or suspending your O-licence</li>
<li>Reducing the number of vehicles you can operate</li>
<li>Imposing conditions on your licence</li>
<li>Disqualifying transport managers</li>
<li>Ordering financial penalties</li>
</ul>

<h3>Red Flags That Trigger Investigation</h3>
<ul>
<li>High OCRS score (red band for roadworthiness or traffic)</li>
<li>Multiple prohibition notices in a short period</li>
<li>MOT failure rates significantly above the national average</li>
<li>Driver complaints or whistleblowing reports</li>
<li>Involvement in a fatal or serious road traffic incident</li>
</ul>

<h2>Load Security</h2>
<p>Every load must be secured so it cannot move during normal driving conditions, including emergency braking and cornering. Accepted methods include:</p>
<ul>
<li><strong>Ratchet straps</strong> — must be rated for the load weight and in good condition</li>
<li><strong>Chains and binders</strong> — for heavy plant and machinery</li>
<li><strong>Friction mats</strong> — increase friction between load and deck</li>
<li><strong>Headboards and bulkheads</strong> — prevent forward movement</li>
<li><strong>Netting and sheeting</strong> — for loose or palletised loads</li>
</ul>

<h3>Common Load Security Failures</h3>
<ul>
<li>Insufficient number of straps for the load weight</li>
<li>Using damaged or frayed straps</li>
<li>Not tensioning straps correctly</li>
<li>Relying on curtain sides to restrain loads (they are <em>not</em> load-bearing)</li>
<li>Failing to re-check load security during the journey</li>
</ul>
<p><strong>Real-world example:</strong> A Sheffield-based haulier received an immediate prohibition and a £1,500 fine when DVSA found an unsecured steel load that had shifted during transit on the M1. The operator's OCRS score moved to red band, triggering a public inquiry.</p>

<h2>Driver CPC</h2>
<p>All professional drivers of vehicles over 3.5 tonnes must hold a valid Driver CPC (Certificate of Professional Competence). Requirements:</p>
<ul>
<li><strong>35 hours</strong> of periodic training every 5 years</li>
<li>Training must be completed through approved training centres</li>
<li>Drivers must carry their Driver Qualification Card (DQC) at all times when driving professionally</li>
</ul>
<p><strong>Penalty for driving without valid CPC:</strong> Up to <strong>£1,000 fine</strong> for the driver and up to <strong>£1,000 fine</strong> for the operator who allowed it.</p>

<h2>How Fleet Management Software Automates DVSA Compliance</h2>

<h3>1. Digital Walk-Around Checks</h3>
<p>Replace paper-based checks with timestamped, GPS-tagged, photo-evidenced digital records. Defects are flagged immediately to the transport manager, and safety-critical issues automatically place the vehicle off-road (VOR) until resolved.</p>

<h3>2. Automated Maintenance Scheduling</h3>
<p>Set up 6-week inspection cycles, MOT reminders, and service intervals that automatically generate alerts. Never miss a maintenance deadline again.</p>

<h3>3. Driver Hours Monitoring</h3>
<p>Real-time visibility of driver hours, breaks, and rest periods. Automated alerts when drivers approach their limits, preventing violations before they happen.</p>

<h3>4. Tachograph Data Management</h3>
<p>Automated reminders for vehicle unit downloads (90 days) and driver card downloads (28 days). Centralised storage with full audit trail for DVSA inspections.</p>

<h3>5. Compliance Dashboard &amp; Reporting</h3>
<p>A single dashboard showing your entire fleet's compliance status: vehicle inspection due dates, driver CPC expiry, MOT dates, insurance renewals, and OCRS tracking. Generate DVSA-ready reports in seconds.</p>

<h2>DVSA Roadside Check: What to Expect</h2>
<p>If you're pulled over by DVSA at a roadside check, the examiner will typically check:</p>
<ul>
<li>Driver's licence, Driver CPC card, and tachograph card</li>
<li>Tachograph records for the current day and previous 28 days</li>
<li>Vehicle condition — lights, tyres, brakes, mirrors, bodywork</li>
<li>Load security — is the load properly restrained?</li>
<li>Vehicle weight — DVSA can weigh your vehicle at the roadside</li>
<li>Documentation — insurance certificate, MOT certificate, O-licence disc</li>
</ul>

<h3>How to Pass Every Roadside Check</h3>
<ul>
<li>Complete a thorough walk-around check before every journey</li>
<li>Keep all documentation current and accessible in the cab</li>
<li>Ensure tachograph is being used correctly with the right mode selected</li>
<li>Check load security before departure and after every stop</li>
<li>Be polite and cooperative with DVSA examiners — they have significant discretion</li>
</ul>

<h2>DVSA Compliance Checklist for 2026</h2>
<h3>Daily</h3>
<ul>
<li>Complete vehicle walk-around check before first use</li>
<li>Record all defects (even minor ones)</li>
<li>Check tachograph is functioning and correct mode is selected</li>
<li>Verify load security before departure</li>
</ul>
<h3>Weekly</h3>
<ul>
<li>Review driver hours for all drivers</li>
<li>Check outstanding defects have been resolved</li>
<li>Verify all drivers have valid licences and CPC cards</li>
</ul>
<h3>Monthly</h3>
<ul>
<li>Review OCRS score and address any concerns</li>
<li>Audit a sample of walk-around check records</li>
<li>Check MOT, insurance, and tax renewal dates for the coming month</li>
</ul>
<h3>Every 90 Days</h3>
<ul>
<li>Download vehicle tachograph unit data</li>
<li>Verify all driver card downloads are up to date (28-day cycle)</li>
</ul>
<h3>Annually</h3>
<ul>
<li>Review and update your maintenance plan</li>
<li>Conduct a full O-licence self-audit</li>
<li>Review driver CPC expiry dates and schedule training</li>
<li>Check tachograph calibration dates</li>
<li>Update your transport manager CPC if required</li>
</ul>

<h2>Conclusion</h2>
<p>DVSA compliance isn't optional — it's the foundation of a safe, legal, and profitable haulage operation. The operators who invest in robust compliance systems don't just avoid fines and prohibitions; they win better contracts, attract better drivers, and build reputations that last.</p>
<p>TitanFleet was built by a Class 1 driver who's experienced DVSA compliance from both sides of the cab. Every feature is designed to make compliance automatic, not an afterthought. From digital walk-around checks to automated tachograph reminders, we've built the system we wished existed when we were on the road.</p>`,
    author: { name: "Jon Byrne", role: "Class 1 Driver & TitanFleet Founder" },
    publishDate: "2026-02-01",
    readingTime: "8 min read",
    category: "DVSA Compliance",
    tags: ["DVSA", "compliance", "driver hours", "tachograph", "O-licence", "vehicle checks"],
    featured: true,
    featuredImage: "DVSA roadside compliance check on UK motorway",
  },
  {
    slug: "reduce-fuel-costs-15-percent-uk-haulage-fleet-guide",
    title: "How to Reduce Fuel Costs by 15%: UK Haulage Fleet Guide 2026",
    metaTitle: "Reduce Fuel Costs for Haulage Fleets UK | Save 15% Guide 2026",
    metaDescription: "Reduce fuel costs by 15% for UK haulage fleets: driver training, route optimization, GPS tracking, maintenance tips. Save £2,000+ per vehicle per year.",
    excerpt: "Fuel is the single biggest operating cost for UK hauliers—accounting for 30-40% of total expenses. Here's how to save £2,000+ per vehicle per year with proven fuel-saving strategies.",
    content: `<h2>Introduction</h2>
<p>Fuel is the single biggest operating cost for UK haulage operators, accounting for <strong>30–40% of total fleet expenses</strong>. With diesel prices fluctuating between £1.35 and £1.55 per litre in 2026, a 44-tonne artic averaging 8 mpg and covering 100,000 miles per year will spend approximately <strong>£14,000–£16,000 on fuel alone</strong>.</p>
<p>The good news? Most fleets are wasting 10–20% of their fuel budget through inefficient driving habits, poor maintenance, suboptimal routing, and a lack of visibility. This guide shows you exactly how to claw that money back.</p>

<h2>The True Cost of Fuel</h2>
<h3>Typical Annual Fuel Cost Per Vehicle</h3>
<table>
<thead><tr><th>Vehicle Type</th><th>Avg MPG</th><th>Annual Miles</th><th>Annual Fuel Cost (@ £1.45/litre)</th></tr></thead>
<tbody>
<tr><td>7.5t Rigid</td><td>18 mpg</td><td>60,000</td><td>£6,800</td></tr>
<tr><td>18t Rigid</td><td>12 mpg</td><td>80,000</td><td>£12,700</td></tr>
<tr><td>44t Artic</td><td>8 mpg</td><td>100,000</td><td>£15,200</td></tr>
<tr><td>44t Artic (long-haul)</td><td>8 mpg</td><td>130,000</td><td>£19,800</td></tr>
</tbody>
</table>

<h3>What a 15% Saving Looks Like</h3>
<table>
<thead><tr><th>Fleet Size</th><th>Annual Fuel Spend</th><th>15% Saving</th></tr></thead>
<tbody>
<tr><td>5 vehicles (mixed)</td><td>£60,000</td><td>£9,000</td></tr>
<tr><td>10 vehicles (artics)</td><td>£152,000</td><td>£22,800</td></tr>
<tr><td>25 vehicles (mixed)</td><td>£320,000</td><td>£48,000</td></tr>
<tr><td>50 vehicles (mixed)</td><td>£640,000</td><td>£96,000</td></tr>
</tbody>
</table>
<p>For most fleets, a 15% fuel reduction represents <strong>£2,000–£3,000 per vehicle per year</strong> — money that goes straight to your bottom line.</p>

<h2>15 Proven Ways to Reduce Fuel Costs</h2>

<h3>1. Driver Training &amp; Awareness</h3>
<p>Driver behaviour is the single biggest factor in fuel consumption. Studies by the Energy Saving Trust show that eco-driving training can reduce fuel use by <strong>10–15%</strong> immediately, with sustained savings of 5–8% over time.</p>
<p><strong>Key techniques to train:</strong></p>
<ul>
<li>Progressive gear changes — shift up early, use the engine's torque band</li>
<li>Read the road ahead — anticipate stops, avoid harsh braking</li>
<li>Maintain steady speeds — avoid the accelerate-brake-accelerate cycle</li>
<li>Use engine braking on downhill stretches</li>
</ul>
<p><em>How to implement:</em> Run quarterly eco-driving workshops. Use telematics data to identify your worst performers and give them targeted one-to-one coaching. Track MPG improvements by driver.</p>

<h3>2. Maintain Optimal Speed</h3>
<p>Fuel consumption increases exponentially above 50 mph. At <strong>56 mph vs 50 mph</strong>, a fully laden artic uses approximately <strong>12% more fuel</strong>. At 62 mph, that rises to <strong>22% more</strong>.</p>
<p><strong>The sweet spot for HGVs is 50–55 mph.</strong> Use speed limiters (already legally required at 56 mph for HGVs) and telematics to monitor compliance.</p>
<p><em>How to implement:</em> Set internal speed policies below the legal limiter (e.g., 52 mph target). Monitor excessive speed events through GPS tracking and address with drivers monthly.</p>

<h3>3. Reduce Idling</h3>
<p>An idling HGV engine burns <strong>1–3 litres of diesel per hour</strong>. If each of your drivers idles for just 1 hour per day unnecessarily, that's <strong>£600–£1,800 per vehicle per year</strong> wasted.</p>
<p>Common causes of excessive idling:</p>
<ul>
<li>Leaving the engine running during loading/unloading</li>
<li>Warming up the engine for extended periods (modern diesels only need 30 seconds)</li>
<li>Running the engine for cab heating/cooling</li>
<li>Sitting in traffic with the engine running when stationary for long periods</li>
</ul>
<p><em>How to implement:</em> Set idle time alerts in your GPS tracking system. Invest in auxiliary heaters/coolers for overnight parking. Create a clear anti-idling policy and include it in driver inductions.</p>

<h3>4. Route Optimisation</h3>
<p>Poor routing wastes fuel through unnecessary mileage, congestion, and elevation changes. Route optimisation software can reduce total fleet mileage by <strong>5–15%</strong>.</p>
<p><strong>Key factors to optimise:</strong></p>
<ul>
<li>Minimise total distance while meeting delivery windows</li>
<li>Avoid known congestion hotspots and peak traffic times</li>
<li>Consider road gradients — hilly routes consume significantly more fuel</li>
<li>Multi-drop route sequencing — deliver in the most efficient order</li>
</ul>
<p><em>How to implement:</em> Use GPS tracking with route history to identify inefficient journeys. Compare planned vs actual routes weekly. Implement real-time re-routing to avoid traffic incidents.</p>

<h3>5. Tyre Pressure Management</h3>
<p>Under-inflated tyres increase rolling resistance and fuel consumption. Just <strong>10 psi below optimal pressure</strong> can increase fuel use by <strong>1–2%</strong> — and accelerate tyre wear by 25%.</p>
<p>For a fleet of 10 artics, that's an unnecessary cost of <strong>£1,500–£3,000 per year</strong> in fuel alone, plus significantly higher tyre replacement costs.</p>
<p><em>How to implement:</em> Check tyre pressures at least weekly (ideally daily during walk-around checks). Invest in TPMS (Tyre Pressure Monitoring Systems) for real-time alerts. Use nitrogen inflation for more stable pressures.</p>

<h3>6. Aerodynamic Improvements</h3>
<p>Aerodynamic drag accounts for up to <strong>25% of fuel consumption</strong> at motorway speeds. Simple modifications can reduce this significantly:</p>
<ul>
<li><strong>Cab-mounted deflectors</strong> — reduce the gap between cab and trailer (saves 2–5%)</li>
<li><strong>Side skirts</strong> — reduce air turbulence under the trailer (saves 1–3%)</li>
<li><strong>Trailer tail devices</strong> — reduce drag behind the trailer (saves 2–4%)</li>
<li><strong>Cab gap seals</strong> — fill the gap between cab and trailer (saves 1–2%)</li>
</ul>
<p><em>How to implement:</em> Start with cab deflectors (lowest cost, highest return). For trailers doing primarily motorway work, add side skirts and tail devices. ROI is typically under 12 months.</p>

<h3>7. Engine Maintenance</h3>
<p>A poorly maintained engine can use <strong>10–20% more fuel</strong> than one in good condition. Key maintenance items that affect fuel economy:</p>
<ul>
<li><strong>Air filters</strong> — a clogged air filter restricts airflow and increases consumption</li>
<li><strong>Fuel injectors</strong> — worn injectors cause incomplete combustion</li>
<li><strong>Turbocharger</strong> — boost leaks reduce efficiency</li>
<li><strong>EGR valve</strong> — carbon build-up reduces performance</li>
<li><strong>Engine oil</strong> — use the manufacturer-recommended grade; the wrong viscosity increases friction</li>
</ul>
<p><em>How to implement:</em> Follow manufacturer service intervals religiously. Track fuel economy per vehicle and investigate any sudden drops — they often indicate a maintenance issue.</p>

<h3>8. Weight Reduction</h3>
<p>Every <strong>1,000 kg of unnecessary weight</strong> increases fuel consumption by approximately <strong>1.5–2%</strong>. Common sources of unnecessary weight:</p>
<ul>
<li>Carrying full fuel tanks when operating locally (fill to 50% for short routes)</li>
<li>Leaving unused equipment on the vehicle (chains, pallets, loading gear)</li>
<li>Not emptying water/waste tanks on temperature-controlled units</li>
<li>Carrying unnecessary tools or spares</li>
</ul>
<p><em>How to implement:</em> Conduct quarterly weight audits of each vehicle. Create a "minimum equipment" policy for different route types. Weigh vehicles regularly and compare to payload requirements.</p>

<h3>9. Fuel Cards &amp; Bulk Purchasing</h3>
<p>Pump prices vary significantly between filling stations. Fuel cards typically save <strong>2–5p per litre</strong> compared to retail prices, plus provide detailed reporting for HMRC and management.</p>
<p>For a vehicle using 20,000 litres per year, a 3p/litre saving = <strong>£600 per vehicle per year</strong>.</p>
<p><em>How to implement:</em> Compare fuel card providers (Allstar, Shell, Keyfuels, UK Fuels). Choose one with a wide network on your regular routes. Monitor price variations and set preferred filling stations.</p>

<h3>10. Use Cruise Control Effectively</h3>
<p>Cruise control maintains a steady speed and prevents the fuel-wasting speed fluctuations caused by driver inattention. On motorway journeys, cruise control can save <strong>3–5%</strong> fuel compared to manual speed management.</p>
<p><strong>Important:</strong> Cruise control should be <em>disengaged</em> on hilly terrain — it will accelerate uphill (wasting fuel) rather than allowing the speed to naturally drop slightly.</p>
<p><em>How to implement:</em> Ensure all vehicles have functioning cruise control. Train drivers on when to use it (flat motorways) and when to disengage (hills, urban areas).</p>

<h3>11. Avoid Peak Traffic Hours</h3>
<p>Stop-start driving in congestion increases fuel consumption by <strong>20–40%</strong> compared to free-flowing traffic. If your delivery windows allow it, schedule departures to avoid peak hours:</p>
<ul>
<li>Avoid M25 and major motorways between 07:00–09:30 and 16:00–18:30</li>
<li>Consider early morning departures (04:00–06:00) for long-haul runs</li>
<li>Use night-time deliveries where customer sites permit</li>
</ul>
<p><em>How to implement:</em> Analyse your GPS tracking data to identify which routes and times cause the most delays. Adjust dispatch schedules where possible. Negotiate flexible delivery windows with customers.</p>

<h3>12. Driver Incentive Programmes</h3>
<p>Rewarding fuel-efficient driving creates a positive feedback loop. Operators who run driver incentive programmes report sustained fuel savings of <strong>5–8%</strong>.</p>
<p><strong>How to structure a programme:</strong></p>
<ul>
<li>Use telematics to create a fair MPG leaderboard (normalised for vehicle type and route)</li>
<li>Offer monthly or quarterly bonuses for top performers (£50–£200 is typical)</li>
<li>Share a percentage of fuel savings with drivers (e.g., 10% of the saving goes to the driver)</li>
<li>Recognise improvement, not just absolute performance — reward drivers who improve the most</li>
</ul>
<p><em>How to implement:</em> Start with a 3-month pilot. Publish results weekly. Keep it positive — never punish poor performers, coach them instead.</p>

<h3>13. Telematics &amp; GPS Tracking</h3>
<p>GPS tracking provides the data foundation for almost every other fuel-saving strategy on this list. Without accurate data on speed, idling, routing, and driver behaviour, you're guessing.</p>
<p>Fleets that implement comprehensive GPS tracking typically see <strong>10–15% fuel reductions</strong> within the first 6 months, simply through increased visibility and accountability.</p>
<p><strong>Key fuel-related data from GPS tracking:</strong></p>
<ul>
<li>Real-time and historical MPG per vehicle and per driver</li>
<li>Idle time reports with location context</li>
<li>Speed violation reports</li>
<li>Route deviation alerts</li>
<li>Harsh driving event logs (acceleration, braking, cornering)</li>
</ul>
<p><em>How to implement:</em> Choose a GPS tracking solution that integrates with your fleet management platform. TitanFleet includes GPS tracking as standard — no additional hardware required.</p>

<h3>14. Regular Fuel Auditing</h3>
<p>Track fuel purchases against mileage for every vehicle, every month. Any vehicle showing a sudden drop in MPG likely has a mechanical issue — catching it early saves both fuel and repair costs.</p>
<p><em>How to implement:</em> Use fuel card data matched with odometer readings. Flag any vehicle where MPG drops more than 10% from its baseline.</p>

<h3>15. Vehicle Specification &amp; Replacement</h3>
<p>When specifying new vehicles, prioritise fuel efficiency. Modern Euro 6 engines are significantly more efficient than older models. Consider automated manual transmissions (AMT) over manual gearboxes — they consistently achieve better fuel economy through optimal gear selection.</p>
<p><em>How to implement:</em> Include fuel economy as a weighted factor in your vehicle procurement process. Track lifetime fuel cost, not just purchase price.</p>

<h2>Conclusion</h2>
<p>Reducing fuel costs by 15% is achievable for virtually every UK haulage fleet — but it requires a systematic approach combining driver training, technology, maintenance, and management attention. The strategies in this guide are proven, practical, and can be implemented incrementally.</p>
<p>Start with the quick wins (driver training, idling reduction, tyre pressures), then build towards a comprehensive fuel management programme using GPS tracking and telematics data. TitanFleet provides the technology platform to make all of this visible, measurable, and manageable — from a single dashboard.</p>`,
    author: { name: "Jon Byrne", role: "Class 1 Driver & TitanFleet Founder" },
    publishDate: "2026-02-05",
    readingTime: "11 min read",
    category: "Fuel Efficiency",
    tags: ["fuel costs", "fuel efficiency", "fleet management", "diesel costs", "driver training", "route optimization"],
    featured: true,
    featuredImage: "UK haulage fleet fuel cost reduction strategy dashboard",
  },
  {
    slug: "fleet-maintenance-scheduling-prevent-breakdowns",
    title: "Fleet Maintenance Scheduling: Prevent Breakdowns, Pass DVSA Checks",
    metaTitle: "Fleet Maintenance Schedule UK | Prevent Breakdowns 2026 | TitanFleet",
    metaDescription: "Fleet maintenance scheduling for UK hauliers: 6-week inspections, MOT reminders, defect tracking. Reduce breakdowns by 60%, pass every DVSA check, save £5,000+/year.",
    excerpt: "Reactive maintenance costs UK hauliers £8 billion per year. Here's how to build a preventive maintenance schedule that reduces breakdowns by 60% and saves £5,000+ per vehicle per year.",
    content: `<h2>Introduction</h2>
<p>Breakdowns are the hidden profit killer in UK haulage. When a vehicle breaks down on the motorway, the costs go far beyond the repair bill: recovery charges (£500–£2,000), missed deliveries, customer penalties, driver downtime, and potential DVSA prohibition notices that damage your compliance record.</p>
<p>The industry data is clear: <strong>reactive maintenance costs 3–5x more than preventive maintenance</strong>. Yet the majority of small and medium haulage operators in the UK still operate without a structured maintenance schedule, relying on drivers to spot problems and mechanics to fix them after they fail.</p>

<h2>The Cost of Poor Fleet Maintenance</h2>
<table>
<thead><tr><th>Cost Category</th><th>Reactive (Per Vehicle/Year)</th><th>Preventive (Per Vehicle/Year)</th></tr></thead>
<tbody>
<tr><td>Unplanned repairs</td><td>£4,500</td><td>£1,200</td></tr>
<tr><td>Roadside recovery</td><td>£1,200</td><td>£200</td></tr>
<tr><td>Vehicle downtime (lost revenue)</td><td>£3,800</td><td>£800</td></tr>
<tr><td>DVSA prohibition fines</td><td>£900</td><td>£0</td></tr>
<tr><td>Higher insurance premiums</td><td>£600</td><td>£0</td></tr>
<tr><td><strong>Total</strong></td><td><strong>£11,000</strong></td><td><strong>£2,200</strong></td></tr>
</tbody>
</table>
<p>The difference is stark: <strong>£8,800 per vehicle per year</strong> wasted on reactive maintenance. For a 10-vehicle fleet, that's <strong>£88,000 per year</strong> in avoidable costs.</p>

<h2>UK Fleet Maintenance Legal Requirements</h2>

<h3>Annual MOT Test</h3>
<p>All HGVs must pass an annual MOT test (also called the "annual test" or "plating test") at a DVSA-approved testing station. The test covers brakes, steering, suspension, lights, tyres, emissions, chassis, and cab condition. The national first-time pass rate for HGVs is approximately <strong>85%</strong> — meaning 15% of vehicles fail on their first attempt.</p>

<h3>6-Week (or Stated Interval) Inspections</h3>
<p>Your O-licence specifies a maintenance inspection interval — typically <strong>every 6 weeks</strong> for most operators. These inspections must be carried out by a competent person and must cover all safety-critical systems. Records must be kept for at least <strong>15 months</strong>.</p>
<p>Failing to maintain vehicles at the stated interval is a breach of your O-licence undertakings and can lead to regulatory action.</p>

<h3>Daily Walk-Around Checks</h3>
<p>Drivers must complete a walk-around check before the first use of the vehicle each day. Any defects found must be reported and recorded. Safety-critical defects must be rectified before the vehicle is used.</p>

<h3>Tachograph Calibration</h3>
<p>Tachographs must be calibrated every <strong>2 years</strong> and after any repair or modification that could affect accuracy. Calibration must be carried out by an approved workshop.</p>

<h3>Prohibition Notices</h3>
<p>If DVSA finds a serious defect during a roadside check, they can issue an immediate prohibition (PG9). The vehicle cannot be moved until the defect is fixed. Prohibition notices are recorded against your OCRS and can trigger a Traffic Commissioner investigation.</p>

<h2>Building a Preventive Maintenance Schedule</h2>

<h3>Step 1: Inventory Your Fleet</h3>
<p>Create a complete register of every vehicle including: registration, VIN, make/model, year, current mileage, MOT due date, next inspection date, tachograph calibration due date, insurance renewal date, and any known issues.</p>

<h3>Step 2: Set Maintenance Intervals</h3>
<p>For each vehicle type, define maintenance tasks by time interval and mileage — whichever comes first. Align with your O-licence stated inspection interval (typically 6 weeks).</p>

<h3>Step 3: Create a Maintenance Calendar</h3>
<p>Map out all maintenance events for the next 12 months. Stagger inspections across the fleet so you're not taking multiple vehicles off the road on the same day.</p>

<h3>Step 4: Implement Digital Tracking</h3>
<p>Use fleet management software to automate reminders, track defect resolution, and maintain DVSA-ready records. Paper-based systems are error-prone and difficult to audit.</p>

<h2>Preventive Maintenance Checklist</h2>

<h3>Daily (Walk-Around Check)</h3>
<ul>
<li>Lights, indicators, and reflectors</li>
<li>Tyres — tread depth, pressure, damage</li>
<li>Wheel fixings — loose nuts, missing indicators</li>
<li>Mirrors and glass</li>
<li>Brakes — operation, air pressure build-up</li>
<li>Fluid levels — oil, coolant, AdBlue, washer fluid</li>
<li>Bodywork — damage, security, curtains/doors</li>
<li>Load security equipment condition</li>
</ul>

<h3>Weekly</h3>
<ul>
<li>Battery condition and terminal connections</li>
<li>Belt condition and tension (alternator, fan)</li>
<li>Tyre pressure check with gauge (not visual only)</li>
<li>Windscreen wiper condition</li>
<li>Cab cleanliness and driver comfort checks</li>
</ul>

<h3>Every 6 Weeks (Periodic Inspection)</h3>
<ul>
<li>Full brake system inspection (linings, drums/discs, airlines, valves)</li>
<li>Steering system (joints, linkages, play)</li>
<li>Suspension (springs, dampers, bushes, air bags)</li>
<li>Chassis and frame (cracks, corrosion, damage)</li>
<li>Exhaust system and emissions</li>
<li>Electrical systems (alternator, starter, wiring)</li>
<li>Cab condition (steps, handrails, seatbelts)</li>
<li>Coupling equipment (fifth wheel, drawbar, kingpin)</li>
</ul>

<h3>Every 10,000 Miles</h3>
<ul>
<li>Engine oil and filter change</li>
<li>Fuel filter replacement</li>
<li>Air filter inspection (replace if restricted)</li>
<li>Gearbox oil level check</li>
<li>Differential oil level check</li>
</ul>

<h3>Every 20,000 Miles</h3>
<ul>
<li>Full brake adjustment and component measurement</li>
<li>Wheel bearing inspection and adjustment</li>
<li>Prop shaft and universal joints</li>
<li>Power steering system service</li>
<li>Coolant system flush and refill</li>
</ul>

<h3>Annually</h3>
<ul>
<li>Pre-MOT inspection (6–8 weeks before MOT due date)</li>
<li>Full chassis inspection including under-body</li>
<li>Trailer inspection (if applicable)</li>
<li>Tachograph calibration check (every 2 years)</li>
<li>Speed limiter check and recalibration if needed</li>
</ul>

<h2>Common Fleet Maintenance Mistakes</h2>

<h3>Mistake 1: Skipping Inspections When "Nothing Seems Wrong"</h3>
<p>Many defects are invisible to drivers — brake lining wear, chassis cracks, and steering play develop gradually. By the time they're noticeable, you're already in prohibition territory.</p>
<p><strong>Solution:</strong> Stick to the 6-week schedule regardless. Inspections are about catching problems <em>before</em> they become failures.</p>

<h3>Mistake 2: Not Acting on Driver Defect Reports</h3>
<p>If drivers report defects and nothing happens, they stop reporting. This is one of the fastest routes to a DVSA public inquiry.</p>
<p><strong>Solution:</strong> Acknowledge every defect report within 2 hours. Fix safety-critical defects before the vehicle moves. Close out minor defects within 7 days.</p>

<h3>Mistake 3: Using the Cheapest Parts</h3>
<p>Budget brake linings, non-OEM filters, and cheap tyres cost more in the long run through shorter service life, poor performance, and increased breakdown risk.</p>
<p><strong>Solution:</strong> Use OEM or quality aftermarket parts. Track component life and compare cost-per-mile, not purchase price.</p>

<h3>Mistake 4: No Spare Vehicle Capacity</h3>
<p>If every vehicle is committed every day, any breakdown causes immediate service failure. You need contingency.</p>
<p><strong>Solution:</strong> Plan for 10–15% spare capacity. This allows scheduled maintenance without disrupting operations and provides cover for unexpected breakdowns.</p>

<h3>Mistake 5: Paper-Based Records</h3>
<p>Paper maintenance records get lost, damaged, and are difficult to audit. DVSA expects professional record-keeping — a shoebox of crumpled inspection sheets won't cut it.</p>
<p><strong>Solution:</strong> Use digital fleet maintenance software with automatic reminders, photo evidence, and audit-ready reporting.</p>

<h2>Fleet Maintenance Software Features</h2>
<p>Modern fleet maintenance software should include:</p>
<ul>
<li><strong>Automated scheduling</strong> — reminders for MOT, inspections, and service intervals based on date and mileage</li>
<li><strong>Digital defect reporting</strong> — drivers report defects from their phone with photos and GPS location</li>
<li><strong>Work order management</strong> — create, assign, and track repair jobs through to completion</li>
<li><strong>Parts inventory tracking</strong> — know what's in stock and when to reorder</li>
<li><strong>Cost tracking</strong> — monitor maintenance spend per vehicle and identify high-cost units</li>
<li><strong>Compliance dashboard</strong> — a single view of MOT dates, inspection dates, and outstanding defects</li>
<li><strong>DVSA-ready reports</strong> — generate inspection histories and compliance reports for audits</li>
</ul>

<h2>ROI Calculator: 10-Vehicle Fleet Example</h2>
<table>
<thead><tr><th>Metric</th><th>Before (Reactive)</th><th>After (Preventive)</th></tr></thead>
<tbody>
<tr><td>Annual breakdowns</td><td>18</td><td>4</td></tr>
<tr><td>Average breakdown cost</td><td>£1,800</td><td>£800</td></tr>
<tr><td>Total breakdown costs</td><td>£32,400</td><td>£3,200</td></tr>
<tr><td>DVSA prohibitions</td><td>3</td><td>0</td></tr>
<tr><td>MOT first-time pass rate</td><td>75%</td><td>95%</td></tr>
<tr><td>Vehicle downtime (days/year)</td><td>45</td><td>10</td></tr>
<tr><td>Maintenance software cost</td><td>£0</td><td>£2,400</td></tr>
<tr><td><strong>Net annual saving</strong></td><td>—</td><td><strong>£52,000+</strong></td></tr>
</tbody>
</table>

<h2>Case Study: 15-Vehicle Sheffield Haulier</h2>
<p>A Sheffield-based general haulage operator running 15 artics switched from paper-based reactive maintenance to a digital preventive schedule using TitanFleet. Results after 12 months:</p>
<ul>
<li>Breakdowns reduced from <strong>24 per year to 6</strong> (75% reduction)</li>
<li>MOT first-time pass rate improved from <strong>73% to 100%</strong></li>
<li>Zero DVSA prohibition notices (previously averaged 4 per year)</li>
<li>Maintenance costs reduced by <strong>£62,000</strong> annually</li>
<li>Vehicle availability increased from <strong>88% to 97%</strong></li>
<li>OCRS score moved from <strong>red to green band</strong></li>
</ul>

<h2>Conclusion</h2>
<p>Preventive maintenance isn't an expense — it's an investment with a proven ROI of 3–5x. The maths is simple: it's cheaper to replace brake linings on a scheduled inspection than to recover a broken-down truck from the M1 at 3am.</p>
<p>TitanFleet automates the entire maintenance scheduling process: 6-week inspection reminders, MOT alerts, digital defect reporting, and compliance dashboards — all from a single platform built specifically for UK haulage operators.</p>`,
    author: { name: "Jon Byrne", role: "Class 1 Driver & TitanFleet Founder" },
    publishDate: "2026-02-08",
    readingTime: "9 min read",
    category: "Fleet Management",
    tags: ["fleet maintenance", "preventive maintenance", "6-week inspection", "MOT", "defect tracking", "breakdowns"],
    featured: false,
    featuredImage: "HGV fleet maintenance schedule and inspection checklist",
  },
  {
    slug: "gps-tracking-haulage-fleets-roi-benefits-uk",
    title: "GPS Tracking for Haulage Fleets: ROI, Benefits & UK Legal Requirements",
    metaTitle: "GPS Tracking for Haulage Fleets UK | ROI Calculator 2026 | TitanFleet",
    metaDescription: "GPS tracking for UK haulage fleets: reduce fuel costs by 15%, improve driver safety, automate timesheets. Legal requirements, ROI calculator & real-world case studies.",
    excerpt: "GPS tracking isn't about spying on drivers—it's about protecting them, your customers, and your bottom line. Here's how it saves UK hauliers £3,000+ per vehicle per year.",
    content: `<h2>Introduction</h2>
<p>If you're running a haulage fleet in 2026 without GPS tracking, you're flying blind — and it's costing you thousands. GPS tracking has evolved from a simple "where are my trucks?" tool into a comprehensive fleet intelligence platform that saves money, improves safety, and automates admin.</p>
<p>But here's the thing most GPS tracking companies won't tell you: <strong>the technology is only as good as how you implement it</strong>. Get the rollout wrong, and you'll face driver resistance, wasted investment, and a system nobody uses. Get it right, and you'll wonder how you ever operated without it.</p>

<h2>What is GPS Fleet Tracking?</h2>
<p>GPS fleet tracking uses satellite technology to monitor the real-time location and movement of every vehicle in your fleet. Modern systems go far beyond simple location tracking:</p>

<h3>Real-Time Tracking</h3>
<p>See every vehicle's position, speed, direction, and status on a live map. Updates typically every 10–60 seconds. Know instantly if a vehicle is moving, stopped, idling, or off-route.</p>

<h3>Historical Data &amp; Playback</h3>
<p>Review complete journey histories for any vehicle over any time period. See exact routes taken, stops made, speeds driven, and time spent at each location. Essential for customer dispute resolution and timesheet verification.</p>

<h3>Automated Reporting</h3>
<p>Generate reports on fuel usage, driver behaviour, mileage, idle time, geofence arrivals/departures, and working hours — automatically, on a schedule, delivered to your inbox.</p>

<h2>The Business Case: ROI</h2>

<h3>Typical GPS Tracking Costs</h3>
<table>
<thead><tr><th>Cost Element</th><th>Monthly (Per Vehicle)</th><th>Annual (Per Vehicle)</th></tr></thead>
<tbody>
<tr><td>Software subscription</td><td>£15–£30</td><td>£180–£360</td></tr>
<tr><td>Hardware (if required)</td><td>£0–£15 (amortised)</td><td>£0–£180</td></tr>
<tr><td>Installation</td><td>One-time</td><td>£50–£150</td></tr>
<tr><td><strong>Total annual cost</strong></td><td></td><td><strong>£230–£690</strong></td></tr>
</tbody>
</table>

<h3>Typical GPS Tracking Savings</h3>
<table>
<thead><tr><th>Saving Category</th><th>Annual Saving (Per Vehicle)</th></tr></thead>
<tbody>
<tr><td>Fuel reduction (10–15%)</td><td>£1,500–£2,300</td></tr>
<tr><td>Reduced unauthorised use</td><td>£300–£800</td></tr>
<tr><td>Insurance discount (5–15%)</td><td>£200–£600</td></tr>
<tr><td>Timesheet accuracy</td><td>£400–£1,000</td></tr>
<tr><td>Admin time saved</td><td>£300–£500</td></tr>
<tr><td>Reduced accident costs</td><td>£200–£500</td></tr>
<tr><td><strong>Total annual savings</strong></td><td><strong>£2,900–£5,700</strong></td></tr>
</tbody>
</table>

<h3>Real-World Example: 10-Vehicle Fleet</h3>
<p>A Midlands-based haulier with 10 artics implemented GPS tracking. First-year results:</p>
<ul>
<li>Fuel costs reduced by <strong>12%</strong> (£18,200 saved)</li>
<li>Unauthorised out-of-hours use eliminated (£4,500 saved)</li>
<li>Insurance premium reduced by <strong>8%</strong> (£3,200 saved)</li>
<li>Admin time reduced by <strong>15 hours per week</strong></li>
<li>Total first-year savings: <strong>£31,400</strong> on a total system cost of <strong>£4,800</strong></li>
<li><strong>ROI: 554%</strong></li>
</ul>

<h2>7 Ways GPS Tracking Saves Money</h2>

<h3>1. Fuel Cost Reduction</h3>
<p>GPS tracking identifies the behaviours that waste fuel: excessive speed, harsh acceleration, unnecessary idling, and poor routing. By making these visible and measurable, you can address them through driver coaching and route optimisation. Typical fuel savings: <strong>10–15%</strong>.</p>

<h3>2. Automated Timesheets</h3>
<p>GPS tracking eliminates manual timesheets by automatically recording clock-in/out times, journey start/end times, and time spent at each location. This saves hours of admin per week and eliminates inflated timesheet claims. Typical saving: <strong>£400–£1,000 per driver per year</strong>.</p>

<h3>3. Insurance Premium Reductions</h3>
<p>Most fleet insurers offer discounts of <strong>5–15%</strong> for vehicles with GPS tracking. The tracking data also provides powerful evidence in accident investigations and insurance claims, potentially saving thousands in disputed claims.</p>

<h3>4. Theft Recovery</h3>
<p>Cargo theft costs UK hauliers an estimated <strong>£250 million per year</strong>. GPS tracking with geofence alerts instantly notifies you if a vehicle moves outside designated areas or at unusual times. Recovery rates for GPS-tracked vehicles are significantly higher than untracked ones.</p>

<h3>5. Customer Service Improvement</h3>
<p>Real-time tracking allows you to give customers accurate ETAs, proactive delay notifications, and proof of delivery times. This builds trust, reduces complaints, and helps you win and retain contracts.</p>

<h3>6. Admin Reduction</h3>
<p>GPS tracking automates mileage logging, journey recording, geofence arrival/departure logging, and working time calculations. For a typical transport office, this saves <strong>10–20 hours per week</strong> in manual admin.</p>

<h3>7. Driver Safety</h3>
<p>GPS tracking monitors harsh driving events (braking, acceleration, cornering, speeding) and provides data for targeted driver coaching. Fleets with driver behaviour monitoring typically see <strong>20–30% reductions in accident rates</strong>.</p>

<h2>UK Legal Requirements: GDPR &amp; Driver Privacy</h2>
<p>GPS tracking involves processing personal data (driver location), so you must comply with UK GDPR. Here's what you need to do:</p>

<h3>GDPR Compliance Checklist</h3>
<ul>
<li>Conduct a <strong>Data Protection Impact Assessment (DPIA)</strong> before implementing tracking</li>
<li>Have a <strong>legitimate business interest</strong> documented (fleet management, safety, compliance)</li>
<li>Provide drivers with a clear <strong>privacy notice</strong> explaining what data is collected and why</li>
<li>Ensure tracking is <strong>proportionate</strong> — only collect data you genuinely need</li>
<li>Set clear <strong>data retention periods</strong> (typically 6–12 months)</li>
<li>Give drivers access to their own tracking data on request (Subject Access Request)</li>
<li>Appoint a <strong>Data Protection Officer</strong> if you process large volumes of location data</li>
</ul>

<h3>What You Can't Do</h3>
<ul>
<li>Track drivers' personal vehicles or movements outside of working hours</li>
<li>Use tracking data to covertly monitor or discipline drivers without their knowledge</li>
<li>Share tracking data with third parties without a lawful basis</li>
<li>Track drivers continuously during rest periods or breaks</li>
</ul>

<h3>Sample Driver Notification</h3>
<p>Before implementing GPS tracking, inform all drivers in writing. A good notification should include: what data is collected, why it's collected, who has access, how long it's retained, and the driver's rights under GDPR. TitanFleet provides template notification letters as part of the onboarding process.</p>

<h2>What Drivers Actually Think</h2>

<h3>Common Driver Fears</h3>
<ul>
<li>"They're spying on me" — drivers worry about constant surveillance</li>
<li>"I'll get in trouble for every little thing" — fear of punitive monitoring</li>
<li>"It's Big Brother" — general unease about being tracked</li>
<li>"They'll use it against me" — concern about data being used unfairly</li>
</ul>

<h3>The Reality</h3>
<p>Survey data from fleets that have implemented GPS tracking shows that after 3–6 months:</p>
<ul>
<li><strong>78% of drivers</strong> view GPS tracking positively (it proves their hours, protects them in incidents, and provides accurate records)</li>
<li><strong>85% of drivers</strong> appreciate automated timesheets (no more manual paperwork)</li>
<li><strong>92% of drivers</strong> say they'd rather work for a fleet with GPS tracking than without (job security, fairer treatment, evidence in disputes)</li>
</ul>

<h3>How to Get Driver Buy-In</h3>
<ul>
<li>Involve drivers in the decision — explain the <em>why</em> before the <em>what</em></li>
<li>Emphasise protection, not surveillance ("this protects you in an accident")</li>
<li>Use data for coaching, never punishment</li>
<li>Share the benefits: automated timesheets, accurate mileage, job protection</li>
<li>Start with a pilot group of volunteers before full rollout</li>
</ul>

<h2>Choosing GPS Tracking Software</h2>

<h3>Must-Have Features</h3>
<ul>
<li>Real-time tracking with live map (updates every 30 seconds or less)</li>
<li>Historical journey playback and reporting</li>
<li>Geofencing with automatic alerts</li>
<li>Driver behaviour monitoring (speed, harsh events, idling)</li>
<li>Automated mileage and timesheet reports</li>
<li>Mobile app for drivers (clock in/out, navigation)</li>
<li>GDPR-compliant data handling</li>
</ul>

<h3>Nice-to-Have Features</h3>
<ul>
<li>Integration with fuel cards for automatic MPG calculation</li>
<li>Integration with maintenance scheduling</li>
<li>Customer ETA sharing</li>
<li>Driver messaging and notifications</li>
<li>API access for custom integrations</li>
</ul>

<h3>Red Flags to Avoid</h3>
<ul>
<li>Long-term contracts (3+ years) with no exit clause</li>
<li>Expensive proprietary hardware that you don't own</li>
<li>Hidden data charges or per-report fees</li>
<li>No mobile app or a poor-quality mobile experience</li>
<li>Lack of UK-based support</li>
</ul>

<h2>Implementation: 5-Step Rollout Plan</h2>
<ol>
<li><strong>Week 1: Planning</strong> — Define objectives, select software, conduct DPIA, draft driver notification</li>
<li><strong>Week 2: Communication</strong> — Inform drivers, hold Q&amp;A sessions, distribute privacy notices, address concerns</li>
<li><strong>Week 3: Pilot</strong> — Install on 2–3 vehicles with volunteer drivers, test all features, gather feedback</li>
<li><strong>Week 4–5: Full Rollout</strong> — Install across the fleet, train all drivers on the mobile app, set up reporting</li>
<li><strong>Week 6+: Optimise</strong> — Review data, identify quick wins, start driver coaching, refine geofences and alerts</li>
</ol>

<h2>GPS Tracking Myths vs Reality</h2>
<table>
<thead><tr><th>Myth</th><th>Reality</th></tr></thead>
<tbody>
<tr><td>"It's too expensive for small fleets"</td><td>GPS tracking typically costs £15–£30/vehicle/month and delivers 5–10x ROI</td></tr>
<tr><td>"Drivers will quit"</td><td>78% of drivers prefer working for fleets with GPS tracking after experiencing it</td></tr>
<tr><td>"It's illegal to track employees"</td><td>It's legal with proper GDPR compliance, privacy notices, and legitimate business interest</td></tr>
<tr><td>"It's only for big fleets"</td><td>Fleets with as few as 3 vehicles see significant ROI from GPS tracking</td></tr>
<tr><td>"It replaces trust"</td><td>It builds trust by providing objective data — no more "he said, she said"</td></tr>
</tbody>
</table>

<h2>Conclusion</h2>
<p>GPS tracking is no longer optional for UK haulage fleets — it's a business essential. The ROI is proven, the legal requirements are manageable, and driver acceptance is far higher than most operators expect.</p>
<p>TitanFleet includes GPS tracking as standard in every plan. No additional hardware required — drivers simply use the mobile app. Real-time tracking, automated timesheets, geofencing, driver behaviour monitoring, and GDPR-compliant data handling — all from a single platform built specifically for UK hauliers.</p>`,
    author: { name: "Jon Byrne", role: "Class 1 Driver & TitanFleet Founder" },
    publishDate: "2026-02-10",
    readingTime: "10 min read",
    category: "GPS Tracking",
    tags: ["GPS tracking", "fleet tracking", "vehicle tracking", "fuel costs", "driver safety", "GDPR"],
    featured: false,
    featuredImage: "GPS fleet tracking dashboard showing real-time vehicle locations across UK",
  },
  {
    slug: "digital-proof-of-delivery-end-paperwork-get-paid-faster",
    title: "Digital Proof of Delivery (POD): End Paperwork, Get Paid Faster",
    metaTitle: "Digital Proof of Delivery UK | Paperless POD System 2026 | TitanFleet",
    metaDescription: "Digital proof of delivery for UK hauliers: eliminate lost paperwork, get paid 50% faster, resolve disputes instantly. Photo capture, GPS timestamp, e-signatures.",
    excerpt: "\"Where's the POD?\" Four words that cost UK hauliers £2 billion per year in delayed payments, lost paperwork, and customer disputes. Here's how digital POD solves all of this.",
    content: `<h2>Introduction</h2>
<p>"Where's the POD?" — if you run a haulage business, you've heard this question hundreds of times. It's the question that delays invoices, triggers customer disputes, and costs your office staff hours of chasing every single week.</p>
<p>Paper proof of delivery is a system designed for the 1990s that's somehow survived into 2026. POD notes get lost in cabs, arrive back at the office days late (if at all), are illegible, incomplete, or damaged. And until that piece of paper is in your system, you can't invoice — which means you can't get paid.</p>
<p>Digital POD eliminates all of this. Instantly.</p>

<h2>What is Digital POD?</h2>
<p>Digital Proof of Delivery replaces paper-based delivery confirmation with a smartphone-based system that captures all delivery evidence electronically. A complete digital POD system captures:</p>
<ol>
<li><strong>Electronic signature</strong> — the recipient signs on the driver's phone screen</li>
<li><strong>Photographic evidence</strong> — photos of delivered goods, condition, placement</li>
<li><strong>GPS timestamp</strong> — automatic recording of the exact location and time of delivery</li>
<li><strong>Delivery notes</strong> — any comments, special instructions, or exceptions</li>
<li><strong>Recipient details</strong> — name, company, and role of the person accepting delivery</li>
</ol>
<p>All of this is uploaded instantly to the cloud, available to your office team in real-time — no waiting for paperwork to arrive back at the depot.</p>

<h2>The Cost of Paper PODs</h2>
<p>Paper-based POD systems have hidden costs that most operators never fully account for:</p>
<table>
<thead><tr><th>Hidden Cost</th><th>Annual Cost (10-Vehicle Fleet)</th></tr></thead>
<tbody>
<tr><td>Lost/damaged POD notes (re-delivery, lost revenue)</td><td>£8,000–£15,000</td></tr>
<tr><td>Delayed invoicing (average 14 days extra DSO)</td><td>£12,000–£25,000 (cash flow impact)</td></tr>
<tr><td>Admin time processing paper PODs</td><td>£6,000–£10,000</td></tr>
<tr><td>Customer disputes from illegible/incomplete PODs</td><td>£3,000–£8,000</td></tr>
<tr><td>Printing, paper, and storage costs</td><td>£1,000–£2,000</td></tr>
<tr><td><strong>Total annual cost</strong></td><td><strong>£30,000–£60,000</strong></td></tr>
</tbody>
</table>
<p>For a 10-vehicle fleet, switching to digital POD typically saves <strong>£25,000–£50,000 per year</strong>.</p>

<h2>6 Ways Digital POD Transforms Your Business</h2>

<h3>1. Get Paid 50% Faster</h3>
<p>With paper PODs, the average time from delivery to invoice is <strong>7–14 days</strong> (waiting for paperwork to arrive, be processed, and matched). With digital POD, you can invoice on the <strong>same day</strong> — the POD is available in your system within seconds of delivery completion.</p>
<p>For a fleet billing £50,000 per month, reducing DSO (Days Sales Outstanding) from 45 days to 25 days improves cash flow by approximately <strong>£33,000</strong> at any given time.</p>

<h3>2. Eliminate Delivery Disputes</h3>
<p>Customer disputes about deliveries — "it wasn't delivered," "it arrived damaged," "wrong quantity" — cost UK hauliers an estimated <strong>£500 million per year</strong>. Digital POD provides irrefutable evidence: timestamped photos, GPS location proof, and electronic signatures.</p>
<p>When a customer disputes a delivery, you can send them the photo evidence and GPS proof within 30 seconds — dispute resolved.</p>

<h3>3. Save 15+ Hours Per Week in Admin</h3>
<p>Processing paper PODs is labour-intensive: collecting sheets from drivers, deciphering handwriting, matching to orders, scanning and filing, chasing missing documents. Digital POD automates all of this. The POD is automatically linked to the delivery job, ready for invoicing immediately.</p>

<h3>4. Reduce Return Journeys &amp; Fuel Waste</h3>
<p>When paper PODs go missing, the result is often a costly return visit to get the delivery re-signed. Digital POD eliminates this entirely — the evidence is captured once, stored securely, and never gets lost.</p>

<h3>5. Improve Customer Service</h3>
<p>Digital POD enables real-time delivery confirmation — customers can be automatically notified the moment their delivery is completed, including photo proof. This proactive communication builds trust and differentiates your service from competitors still using paper.</p>

<h3>6. HMRC &amp; Audit Compliance</h3>
<p>HMRC may require proof of delivery for VAT purposes, particularly for zero-rated exports and specific supply chain transactions. Digital POD records — with timestamps, GPS data, and electronic signatures — provide a much stronger audit trail than paper documents.</p>

<h2>Digital POD Features to Look For</h2>

<h3>Must-Have Features</h3>
<ul>
<li>Electronic signature capture on the driver's smartphone</li>
<li>Photo capture (multiple photos per delivery)</li>
<li>Automatic GPS timestamp and location recording</li>
<li>Offline capability (works without mobile signal, syncs when reconnected)</li>
<li>Instant cloud upload and real-time visibility for office staff</li>
<li>Delivery notes and exception reporting (damaged goods, partial delivery, refused)</li>
<li>Integration with invoicing/accounting systems</li>
</ul>

<h3>Nice-to-Have Features</h3>
<ul>
<li>Barcode/QR code scanning for consignment verification</li>
<li>Customer notification on delivery completion (email/SMS)</li>
<li>PDF POD generation for customer distribution</li>
<li>Delivery time window tracking and alerting</li>
<li>Integration with route planning software</li>
</ul>

<h3>Red Flags to Avoid</h3>
<ul>
<li>Systems that require specialised (expensive) hardware</li>
<li>No offline capability — mobile signal isn't guaranteed at every delivery point</li>
<li>Complex interfaces that slow drivers down</li>
<li>No photo capture — signatures alone aren't sufficient for dispute resolution</li>
<li>Lack of integration with your existing fleet management or invoicing systems</li>
</ul>

<h2>How Drivers Use Digital POD</h2>
<p>A well-designed digital POD system should take drivers less than 60 seconds per delivery:</p>
<ol>
<li><strong>Arrive at delivery</strong> — the app automatically detects arrival via GPS geofence</li>
<li><strong>Deliver goods</strong> — driver unloads as normal</li>
<li><strong>Capture photos</strong> — take 1–3 photos of delivered goods (condition, placement, quantity)</li>
<li><strong>Get signature</strong> — recipient signs on the phone screen, enters their name</li>
<li><strong>Submit</strong> — tap "Complete Delivery" and the POD is instantly uploaded to the cloud</li>
</ol>
<p>The entire process adds less than a minute to each delivery — and saves hours of paperwork back at the office.</p>

<h2>Implementation: 4-Week Rollout Plan</h2>

<h3>Week 1: Setup &amp; Configuration</h3>
<ul>
<li>Configure digital POD system with your delivery types and requirements</li>
<li>Set up customer notification templates</li>
<li>Integrate with invoicing/accounting system</li>
<li>Create driver user accounts</li>
</ul>

<h3>Week 2: Driver Training</h3>
<ul>
<li>Run 30-minute training sessions for all drivers (small groups of 3–5)</li>
<li>Hands-on practice with the app using test deliveries</li>
<li>Distribute quick-reference cards for cabs</li>
<li>Appoint a "digital champion" among drivers for peer support</li>
</ul>

<h3>Week 3: Pilot</h3>
<ul>
<li>Run digital POD alongside paper PODs for one week</li>
<li>Identify and resolve any issues</li>
<li>Gather driver feedback and make adjustments</li>
<li>Verify photo quality, signature clarity, and GPS accuracy</li>
</ul>

<h3>Week 4: Go Live</h3>
<ul>
<li>Switch fully to digital POD — retire paper PODs</li>
<li>Monitor completion rates and quality for the first week</li>
<li>Address any remaining driver concerns</li>
<li>Start same-day invoicing process</li>
</ul>

<h2>Common Driver Objections (and How to Respond)</h2>

<h3>"I'm not good with technology"</h3>
<p><strong>Response:</strong> The app is designed for drivers, not IT professionals. If you can use WhatsApp, you can use this. It's 3 taps and a signature — literally easier than filling in a paper form.</p>

<h3>"It takes too long"</h3>
<p><strong>Response:</strong> Digital POD takes less than 60 seconds. Paper PODs take longer when you factor in finding a pen, filling in the form, and remembering to bring it back to the office. Plus, you'll never have to make a return trip because a POD went missing.</p>

<h3>"My phone battery won't last"</h3>
<p><strong>Response:</strong> The app is designed to be battery-efficient. Keep a charging cable in the cab (which you should have anyway for tachograph compliance). The app uses less battery than having Google Maps running all day.</p>

<h3>"What if there's no signal?"</h3>
<p><strong>Response:</strong> The app works fully offline. It captures the signature, photos, and GPS data locally, then uploads everything automatically when you get signal back. You'll never lose a POD because of poor signal.</p>

<h2>Success Stories</h2>

<h3>Case Study 1: Birmingham Distribution Company</h3>
<p>A 20-vehicle distribution fleet in Birmingham doing 150+ deliveries per day switched from paper to digital POD. Results after 6 months:</p>
<ul>
<li>Lost POD incidents dropped from <strong>12 per month to zero</strong></li>
<li>Average invoice time reduced from <strong>11 days to 1 day</strong></li>
<li>Customer disputes reduced by <strong>85%</strong></li>
<li>Admin headcount reduced by <strong>1 full-time position</strong> (£28,000/year saving)</li>
<li>Cash flow improved by <strong>£45,000</strong> (reduced DSO)</li>
</ul>

<h3>Case Study 2: Yorkshire Building Supplies Haulier</h3>
<p>An 8-vehicle fleet delivering building supplies across Yorkshire implemented digital POD with photo capture. Key outcomes:</p>
<ul>
<li>Damage disputes reduced by <strong>90%</strong> (photos prove condition at delivery)</li>
<li>Re-delivery trips eliminated — saving <strong>£800/month</strong> in fuel and driver time</li>
<li>Driver satisfaction improved — no more "where's the POD?" calls from the office</li>
<li>Customer satisfaction scores improved by <strong>35%</strong></li>
</ul>

<h2>Legal Requirements</h2>

<h3>GDPR Considerations</h3>
<p>Digital POD captures personal data (recipient names, signatures, photos). Ensure your system is GDPR-compliant:</p>
<ul>
<li>Include POD data processing in your privacy policy</li>
<li>Only retain POD data for as long as necessary (typically 6 years for contractual records)</li>
<li>Ensure data is stored securely with appropriate access controls</li>
<li>Be prepared to respond to Subject Access Requests for POD data</li>
</ul>

<h3>Electronic Signatures</h3>
<p>Electronic signatures captured on smartphone screens are legally valid in the UK under the Electronic Communications Act 2000 and the eIDAS Regulation (retained in UK law). A digital signature on a POD has the same legal standing as a wet ink signature on a paper form.</p>

<h2>Conclusion</h2>
<p>Digital POD isn't a nice-to-have — it's a competitive necessity. The operators still using paper PODs in 2026 are leaving money on the table: delayed payments, lost documents, unnecessary disputes, and wasted admin time.</p>
<p>TitanFleet includes digital POD as standard — photo capture, electronic signatures, GPS timestamps, and instant cloud upload. Your office team sees the POD the moment the driver taps "Complete." No more chasing paperwork. No more delayed invoices. No more "where's the POD?"</p>`,
    author: { name: "Jon Byrne", role: "Class 1 Driver & TitanFleet Founder" },
    publishDate: "2026-02-12",
    readingTime: "7 min read",
    category: "Digital Transformation",
    tags: ["proof of delivery", "digital POD", "paperless", "e-signature", "delivery confirmation", "cash flow"],
    featured: false,
    featuredImage: "Driver using digital proof of delivery app on smartphone",
  },
];

const categories = ["All", "DVSA Compliance", "Fleet Management", "GPS Tracking", "Digital Transformation", "Fuel Efficiency"];

function getCategoryGradient(category: string): string {
  const gradients: Record<string, string> = {
    "DVSA Compliance": "bg-gradient-to-br from-blue-600 to-indigo-800",
    "Fleet Management": "bg-gradient-to-br from-emerald-600 to-teal-800",
    "GPS Tracking": "bg-gradient-to-br from-violet-600 to-purple-800",
    "Digital Transformation": "bg-gradient-to-br from-cyan-600 to-blue-800",
    "Fuel Efficiency": "bg-gradient-to-br from-green-600 to-emerald-800",
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