import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Menu,
  X,
  Instagram,
  Facebook,
  BookOpen,
  ExternalLink,
} from "lucide-react";

interface GuideSection {
  id: string;
  title: string;
  content: string;
}

interface RelatedLink {
  title: string;
  href: string;
  type: "guide" | "article" | "product";
}

interface Guide {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  readingTime: string;
  lastUpdated: string;
  sections: GuideSection[];
  tableOfContents: string[];
  relatedArticles: RelatedLink[];
  relatedProducts: RelatedLink[];
}

const guides: Guide[] = [
  {
    slug: "dvsa-compliance-guide",
    title: "The Complete DVSA Compliance Guide for Fleet Operators",
    metaTitle: "DVSA Compliance Guide 2026 | Complete Fleet Operator Guide | TitanFleet",
    metaDescription: "The definitive DVSA compliance guide for UK fleet operators. Covers walkaround checks, operator licensing, driver hours, maintenance standards, and how to prepare for DVSA audits. Updated for 2026.",
    excerpt: "Everything UK fleet operators need to know about DVSA compliance — from daily walkaround checks to operator licensing, driver hours rules, and audit preparation. Built by industry professionals for transport managers.",
    readingTime: "18 min read",
    lastUpdated: "March 2026",
    tableOfContents: [
      "What Is DVSA Compliance?",
      "The Six Pillars of Fleet Compliance",
      "Daily Walkaround Checks",
      "Operator Licence Requirements",
      "Driver Hours and Working Time",
      "Vehicle Maintenance Standards",
      "DVSA Enforcement and Penalties",
      "Preparing for a DVSA Audit",
      "Earned Recognition Scheme",
      "Digital Compliance Systems",
    ],
    sections: [
      {
        id: "what-is-dvsa-compliance",
        title: "What Is DVSA Compliance?",
        content: `<p>The Driver and Vehicle Standards Agency (DVSA) is responsible for ensuring that commercial vehicles operating on UK roads meet strict safety, roadworthiness, and legal standards. For fleet operators holding a standard or restricted Operator's Licence (O-licence), DVSA compliance is not optional — it is a condition of your licence and a legal requirement.</p>

<p>DVSA compliance encompasses everything from the condition of your vehicles to the working hours of your drivers, the qualifications they hold, and the records you maintain. The Traffic Commissioner, who grants and supervises O-licences, expects operators to demonstrate a systematic approach to compliance. Failure to do so can result in licence curtailment, suspension, or revocation — effectively shutting down your operation.</p>

<p>This guide covers every area of DVSA compliance that UK fleet operators need to understand. Whether you run 5 vehicles or 500, the principles are the same. The difference between a compliant operator and one facing enforcement action is usually not knowledge — it is having proper systems in place to manage compliance consistently.</p>

<div class="bg-amber-50 border border-amber-200 rounded-xl p-6 my-6">
<p class="font-semibold text-amber-900 mb-2">Key Statistic</p>
<p class="text-amber-800">In 2024-25, DVSA conducted over 100,000 vehicle inspections at the roadside and issued prohibition notices on 25% of HGVs checked. The most common failures were brake defects (18%), tyre issues (14%), and lighting defects (12%).</p>
</div>`
      },
      {
        id: "six-pillars",
        title: "The Six Pillars of Fleet Compliance",
        content: `<p>DVSA compliance for fleet operators rests on six interconnected areas. Weakness in any one area can trigger enforcement action and put your O-licence at risk.</p>

<h3>1. Vehicle Roadworthiness</h3>
<p>Every vehicle in your fleet must be maintained in a roadworthy condition at all times. This means regular inspections, prompt defect repair, and a documented maintenance system. The DVSA uses its <em>Guide to Maintaining Roadworthiness</em> as the benchmark for what constitutes an adequate maintenance system.</p>

<p>For most operators, this means conducting daily walkaround checks, maintaining a planned preventative maintenance schedule (typically every 6-8 weeks for HGVs), and resolving defects within defined timescales based on severity.</p>

<h3>2. Driver Hours and Working Time</h3>
<p>UK-retained EU regulations (EC 561/2006) set strict limits on how long drivers can drive and how much rest they must take. The Working Time Directive adds further limits on total working hours. Compliance with driver hours rules is one of the most heavily enforced areas — DVSA officers can check tachograph records at the roadside and at your operating centre.</p>

<h3>3. Operator Licensing</h3>
<p>Your O-licence sets the terms under which you can operate goods vehicles. This includes the number of vehicles you can run, the operating centre conditions, and the undertakings you gave when applying. Breaching licence conditions — such as operating more vehicles than authorised or failing to maintain vehicles at your declared operating centre — is a serious matter.</p>

<h3>4. Driver Licensing and Qualifications</h3>
<p>Every driver must hold the correct licence category for the vehicles they drive. Professional HGV drivers must also hold a valid Driver Certificate of Professional Competence (CPC), which requires 35 hours of periodic training every 5 years. Operating with an unqualified driver is an immediate prohibition offence.</p>

<h3>5. Load Security</h3>
<p>Loads must be properly secured for every journey. The Department for Transport's <em>Code of Practice: Safety of Loads on Vehicles</em> sets out the standards. An insecure load is a prohibition offence and, in serious cases, can result in criminal prosecution of both the driver and the operator.</p>

<h3>6. Tachograph Compliance</h3>
<p>Digital tachographs must be properly calibrated (every 2 years), data must be downloaded regularly (every 90 days from the vehicle unit, every 28 days from driver cards), and records must be retained for at least 12 months. Failure to manage tachograph compliance is one of the most common findings at DVSA audits.</p>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">Read our <a href="/resources/transport-manager-responsibilities" class="underline font-medium">Transport Manager Responsibilities</a> article for a detailed breakdown of the transport manager's role in maintaining compliance across all six pillars.</p>
</div>`
      },
      {
        id: "daily-walkaround-checks",
        title: "Daily Walkaround Checks",
        content: `<p>The daily walkaround check is the foundation of vehicle compliance. Before a driver takes a vehicle on the road, they must conduct a visual inspection covering key safety items. This is not a legal requirement in statute, but the DVSA considers it an essential part of a proper maintenance system — and the Traffic Commissioner will ask about your walkaround check procedures at any public inquiry.</p>

<h3>What a Walkaround Check Should Cover</h3>
<p>A thorough walkaround check should cover the following areas, as recommended in the DVSA's Guide to Maintaining Roadworthiness:</p>

<ul>
<li><strong>Tyres and wheels</strong> — tread depth (minimum 1mm across central three-quarters for HGVs), inflation, damage, wheel security</li>
<li><strong>Lights and indicators</strong> — all external lights functioning, lenses clean and undamaged</li>
<li><strong>Mirrors</strong> — clean, properly adjusted, undamaged</li>
<li><strong>Windscreen and wipers</strong> — no significant damage, wipers functioning, adequate washer fluid</li>
<li><strong>Brakes</strong> — service brake, secondary brake, parking brake all functioning. Air pressure gauges reading correctly</li>
<li><strong>Fluid levels</strong> — engine oil, coolant, power steering fluid, brake fluid, AdBlue</li>
<li><strong>Exhaust and emissions</strong> — no excessive smoke, exhaust system secure</li>
<li><strong>Body and structure</strong> — no damage affecting safety, load platform secure, tail lift functioning</li>
<li><strong>Coupling equipment</strong> — fifth wheel, kingpin, airlines, electrical connections (for articulated vehicles)</li>
<li><strong>Number plates</strong> — clean, legible, properly illuminated</li>
<li><strong>Reflectors and markings</strong> — rear reflective plates, side markings in place</li>
</ul>

<h3>Recording Walkaround Checks</h3>
<p>The DVSA expects operators to maintain records of walkaround checks. While paper forms are still accepted, digital walkaround check systems provide a significantly stronger audit trail. Digital systems timestamp every inspection, capture photo evidence, and automatically flag defects for resolution.</p>

<p>The key advantage of digital walkaround checks is that they eliminate the two most common problems with paper systems: lost paperwork and unreported defects. When a driver completes a digital check, the result is immediately visible to the transport manager, and any defects are automatically escalated.</p>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">See our detailed <a href="/resources/dvsa-walkaround-checklist" class="underline font-medium">DVSA Walkaround Check Checklist</a> for a printable and digital-ready checklist covering all inspection areas. Also see how <a href="/solutions/dvsa-walkaround-check-app" class="underline font-medium">TitanFleet's Walkaround Check App</a> digitises this process.</p>
</div>`
      },
      {
        id: "operator-licence-requirements",
        title: "Operator Licence Requirements",
        content: `<p>Operating goods vehicles over 3.5 tonnes gross vehicle weight (GVW) in the UK requires an Operator's Licence (O-licence) granted by the Traffic Commissioner. There are two types relevant to most fleet operators:</p>

<h3>Standard National Licence</h3>
<p>Allows you to carry goods for hire and reward within the UK. This is the licence held by most haulage companies. To obtain a standard national licence, you must demonstrate:</p>
<ul>
<li><strong>Good repute</strong> — the operator and transport manager must be of good repute, meaning no relevant criminal convictions or serious compliance failures</li>
<li><strong>Financial standing</strong> — evidence of available funds: £8,000 for the first vehicle and £4,500 for each additional vehicle (or £3,100 per vehicle if using the community licence format)</li>
<li><strong>Professional competence</strong> — a nominated transport manager who holds a Certificate of Professional Competence (CPC) in national road haulage operations</li>
<li><strong>Appropriate operating centre</strong> — suitable premises for vehicle maintenance and parking, with planning permission for the intended use</li>
</ul>

<h3>Restricted Licence</h3>
<p>Allows you to carry your own goods (not for hire and reward). This is used by businesses that transport their own products — for example, a building supplies company delivering to customers. A restricted licence has lower requirements: no transport manager CPC is needed, and financial standing thresholds are lower.</p>

<h3>Licence Conditions and Undertakings</h3>
<p>Every O-licence comes with conditions and undertakings that the operator must comply with. Standard undertakings include:</p>
<ul>
<li>Vehicles will be kept in a fit and serviceable condition</li>
<li>Vehicles will not be overloaded</li>
<li>Drivers' hours rules will be observed and records maintained</li>
<li>The traffic commissioner will be informed within 28 days of any relevant changes (e.g., change of address, convictions, additional operating centres)</li>
<li>Vehicles will be operated from the authorised operating centre(s)</li>
</ul>

<p>Breaching these undertakings is treated seriously. The Traffic Commissioner can call you to a public inquiry, where your licence may be curtailed (reduced vehicle numbers), suspended, or revoked entirely.</p>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">Read our <a href="/resources/operator-licence-explained" class="underline font-medium">Operator Licence Compliance Explained</a> article for detailed guidance on maintaining your O-licence conditions. See how <a href="/solutions/fleet-compliance-software" class="underline font-medium">TitanFleet's Compliance Dashboard</a> helps you track licence obligations.</p>
</div>`
      },
      {
        id: "driver-hours-working-time",
        title: "Driver Hours and Working Time",
        content: `<p>Driver hours rules exist to prevent driver fatigue, which is a factor in approximately 20% of serious road accidents involving HGVs. The UK has retained the EU driver hours rules (EC 561/2006) in domestic law, and these apply to most commercial vehicle operations.</p>

<h3>EU/UK Retained Driver Hours Rules</h3>
<table class="w-full border-collapse my-4">
<thead><tr class="bg-slate-100"><th class="border border-slate-200 px-4 py-3 text-left">Rule</th><th class="border border-slate-200 px-4 py-3 text-left">Limit</th></tr></thead>
<tbody>
<tr><td class="border border-slate-200 px-4 py-3">Maximum daily driving</td><td class="border border-slate-200 px-4 py-3">9 hours (extendable to 10 hours twice per week)</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Maximum weekly driving</td><td class="border border-slate-200 px-4 py-3">56 hours</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Maximum fortnightly driving</td><td class="border border-slate-200 px-4 py-3">90 hours</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Continuous driving before break</td><td class="border border-slate-200 px-4 py-3">4.5 hours</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Minimum break duration</td><td class="border border-slate-200 px-4 py-3">45 minutes (can be split: 15 min + 30 min)</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Minimum daily rest</td><td class="border border-slate-200 px-4 py-3">11 hours (reducible to 9 hours, max 3 times per week)</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Minimum weekly rest</td><td class="border border-slate-200 px-4 py-3">45 hours (reducible to 24 hours every other week)</td></tr>
</tbody>
</table>

<h3>Working Time Directive (Road Transport)</h3>
<p>In addition to driver hours rules, the Road Transport Working Time Directive applies. This limits the total working time (not just driving) of mobile workers:</p>
<ul>
<li>Maximum 60 hours in any single week</li>
<li>Average of 48 hours per week over a reference period (typically 17 or 26 weeks)</li>
<li>Maximum 10 hours of night work in any 24-hour period</li>
<li>A 30-minute break after 6 consecutive hours of work, or 45 minutes after 9 hours</li>
</ul>

<h3>Record Keeping</h3>
<p>Operators must ensure tachograph records are complete and accurate. This means:</p>
<ul>
<li>Downloading vehicle unit data at least every 90 days</li>
<li>Downloading driver card data at least every 28 days</li>
<li>Retaining all records for at least 12 months</li>
<li>Making records available to DVSA on request</li>
</ul>

<p>Driver hours infringements are one of the most common findings at DVSA investigations. A single working day where a driver exceeded the 9-hour limit can result in a fixed penalty notice. Persistent infringements lead to public inquiries.</p>`
      },
      {
        id: "vehicle-maintenance-standards",
        title: "Vehicle Maintenance Standards",
        content: `<p>The DVSA's <em>Guide to Maintaining Roadworthiness</em> sets out what constitutes an adequate maintenance system. This guide is effectively the standard against which your compliance will be measured at any DVSA audit or Traffic Commissioner hearing.</p>

<h3>Planned Preventative Maintenance (PPM)</h3>
<p>Every vehicle must be subject to a planned preventative maintenance schedule. For HGVs, the DVSA recommends inspection intervals of no more than 6-8 weeks. The inspection should be comprehensive and cover all safety-critical systems. Common PPM intervals:</p>
<ul>
<li><strong>HGVs (rigid and articulated)</strong>: every 6 weeks</li>
<li><strong>Trailers</strong>: every 8-10 weeks</li>
<li><strong>Vans (3.5t and above)</strong>: every 8-10 weeks</li>
<li><strong>Smaller vans (under 3.5t)</strong>: every 12 weeks or as appropriate</li>
</ul>

<h3>Maintenance Records</h3>
<p>You must maintain records that demonstrate your maintenance system is working. These records should include:</p>
<ul>
<li>Daily walkaround check records</li>
<li>Safety inspection reports (PMI reports)</li>
<li>Defect reports and evidence of repair</li>
<li>MOT certificates</li>
<li>Service records and invoices</li>
</ul>

<p>Records should be retained for at least 15 months (the period a DVSA audit typically covers). Many operators retain records for longer as good practice.</p>

<h3>Defect Management</h3>
<p>A robust defect management process is critical. The DVSA expects:</p>
<ul>
<li>A clear process for drivers to report defects</li>
<li>Defined timescales for defect resolution based on severity</li>
<li>Evidence that defects are resolved (not just noted)</li>
<li>A system to prevent vehicles with safety-critical defects from being used</li>
</ul>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">See how <a href="/solutions/fleet-maintenance-software" class="underline font-medium">TitanFleet's Fleet Maintenance Software</a> helps you manage planned preventative maintenance, defect resolution, and MOT tracking in one platform. Also read our <a href="/resources/fleet-maintenance-scheduling" class="underline font-medium">Fleet Maintenance Scheduling Guide</a>.</p>
</div>`
      },
      {
        id: "dvsa-enforcement-penalties",
        title: "DVSA Enforcement and Penalties",
        content: `<p>DVSA enforcement takes several forms, from roadside checks to full operating centre audits. Understanding the enforcement landscape helps you prepare and prioritise your compliance efforts.</p>

<h3>Roadside Checks</h3>
<p>DVSA examiners conduct roadside checks at weighbridges, industrial estates, and other locations. A typical roadside check involves:</p>
<ul>
<li>Visual inspection of the vehicle's condition</li>
<li>Brake performance test (roller brake test)</li>
<li>Tachograph and driver hours check</li>
<li>Driver licence and CPC verification</li>
<li>Load security inspection</li>
</ul>

<h3>Prohibition Notices</h3>
<p>If a defect is found, the DVSA examiner can issue a prohibition notice:</p>
<ul>
<li><strong>Immediate prohibition (PG9)</strong> — the vehicle cannot be moved until the defect is repaired. Issued for the most serious safety defects.</li>
<li><strong>Delayed prohibition</strong> — the vehicle can complete its current journey but must be repaired before being used again.</li>
</ul>

<h3>Fixed Penalty Notices</h3>
<p>Financial penalties start at £300 for less serious offences and can reach £1,500 for more serious violations. Multiple fixed penalties can be issued at a single stop. Common FPN offences include driver hours infringements, tachograph violations, and vehicle condition issues.</p>

<h3>Traffic Commissioner Action</h3>
<p>For persistent or serious non-compliance, cases are referred to the Traffic Commissioner, who can:</p>
<ul>
<li>Call the operator and/or transport manager to a public inquiry</li>
<li>Curtail the O-licence (reduce vehicle numbers)</li>
<li>Suspend the O-licence for a defined period</li>
<li>Revoke the O-licence entirely</li>
<li>Disqualify the transport manager or operator</li>
</ul>

<p>A public inquiry is a formal hearing. The Traffic Commissioner will examine your maintenance records, compliance systems, driver hours data, and overall management of the operation. Operators who can demonstrate robust systems — even if they have had failures — are treated more favourably than those with no systems at all.</p>`
      },
      {
        id: "preparing-for-dvsa-audit",
        title: "Preparing for a DVSA Audit",
        content: `<p>DVSA audits can be announced or unannounced. An audit typically covers the previous 15 months of operation. The examiner will want to see evidence of your compliance systems across all areas.</p>

<h3>What DVSA Auditors Check</h3>
<ul>
<li><strong>Maintenance records</strong> — daily walkaround checks, safety inspection reports, defect reports and resolution evidence</li>
<li><strong>Tachograph data</strong> — driver card downloads, vehicle unit downloads, analysis of driver hours compliance</li>
<li><strong>Driver records</strong> — licence checks, CPC validity, training records</li>
<li><strong>Vehicle records</strong> — MOT certificates, registration documents, plating certificates</li>
<li><strong>Operating centre</strong> — condition, suitability, planning compliance</li>
<li><strong>Management systems</strong> — evidence of how the transport manager oversees compliance</li>
</ul>

<h3>How to Prepare</h3>
<ol>
<li><strong>Organise your records</strong> — ensure walkaround checks, inspection reports, and defect records are complete and accessible for the past 15 months</li>
<li><strong>Review tachograph compliance</strong> — check that downloads are up to date and analyse any driver hours infringements</li>
<li><strong>Verify driver qualifications</strong> — confirm all drivers hold valid licences and CPC cards</li>
<li><strong>Check MOT and tax status</strong> — ensure no vehicles are operating with expired MOTs or vehicle tax</li>
<li><strong>Review your maintenance schedule</strong> — confirm all vehicles are on a planned maintenance programme and inspections are up to date</li>
</ol>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">Read our detailed guide on <a href="/resources/prepare-for-dvsa-audit" class="underline font-medium">How Transport Managers Prepare for DVSA Audits</a>. See how <a href="/solutions/fleet-compliance-software" class="underline font-medium">TitanFleet's Compliance Dashboard</a> gives you audit-ready reports instantly.</p>
</div>`
      },
      {
        id: "earned-recognition",
        title: "Earned Recognition Scheme",
        content: `<p>The DVSA Earned Recognition scheme is a voluntary programme that allows compliant operators to demonstrate their standards through regular data sharing with the DVSA. In return, operators benefit from a reduced likelihood of roadside checks and a positive reputation indicator.</p>

<h3>How Earned Recognition Works</h3>
<p>Operators submit key performance data to DVSA on a regular basis. This data covers:</p>
<ul>
<li><strong>MOT first-time pass rates</strong> — the percentage of vehicles passing MOT without prior remedial work</li>
<li><strong>Vehicle inspection completion rates</strong> — evidence that planned maintenance is being carried out on schedule</li>
<li><strong>Defect resolution times</strong> — how quickly reported defects are resolved</li>
<li><strong>Tachograph compliance</strong> — driver hours data showing consistent compliance</li>
<li><strong>Driver CPC compliance</strong> — evidence that all drivers hold valid CPC qualifications</li>
</ul>

<h3>Benefits</h3>
<ul>
<li>Reduced roadside checks — DVSA is less likely to stop your vehicles</li>
<li>Positive reputation — demonstrates to customers and insurers that you meet high standards</li>
<li>Early warning — the data monitoring helps you spot compliance dips before they become problems</li>
<li>Tendering advantage — many large customers now ask about Earned Recognition status in procurement</li>
</ul>

<h3>Who Should Consider Earned Recognition?</h3>
<p>Earned Recognition is suitable for operators who already have good compliance systems in place and want formal recognition. It requires investment in data reporting capabilities — which is where digital fleet management tools become essential.</p>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">TitanFleet tracks Earned Recognition KPIs automatically. See <a href="/solutions/fleet-compliance-software" class="underline font-medium">Fleet Compliance Software</a> for details on how TitanFleet calculates your MOT pass rates, inspection completion, and defect resolution metrics.</p>
</div>`
      },
      {
        id: "digital-compliance-systems",
        title: "Digital Compliance Systems",
        content: `<p>Digital compliance systems replace paper-based processes with connected platforms that provide real-time visibility, automatic escalation, and complete audit trails. For most operators, the question is no longer whether to digitise — it is how to choose the right platform.</p>

<h3>What a Good Digital Compliance System Should Do</h3>
<ul>
<li><strong>Digital walkaround checks</strong> — replace paper forms with a mobile-friendly inspection tool that captures photos, timestamps, and GPS data</li>
<li><strong>Automated defect management</strong> — defects flagged during inspections should be automatically escalated and tracked through to resolution</li>
<li><strong>MOT and tax monitoring</strong> — live data from DVSA showing expiry dates with automated alerts</li>
<li><strong>Compliance dashboard</strong> — a single view showing fleet compliance status across all vehicles</li>
<li><strong>Audit-ready reporting</strong> — instant generation of inspection records, defect histories, and compliance summaries</li>
<li><strong>Driver management</strong> — CPC tracking, licence monitoring, and training records</li>
</ul>

<h3>What to Avoid</h3>
<p>Not all fleet software is built for UK compliance. Many platforms are designed for global markets and add UK-specific features as afterthoughts. Look for software that:</p>
<ul>
<li>Aligns walkaround checks with DVSA guidance (not US DOT or other international standards)</li>
<li>Uses the DVSA Guide to Roadworthiness for defect categorisation</li>
<li>Tracks Earned Recognition KPIs natively</li>
<li>Provides a driver experience designed for commercial vehicle operators</li>
</ul>

<div class="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
<p class="font-semibold text-green-900 mb-2">TitanFleet</p>
<p class="text-green-800">TitanFleet is built specifically for UK fleet compliance. It covers digital walkaround checks, AI-powered defect triage using the DVSA Guide to Roadworthiness, live MOT tracking, GPS tracking, driver timesheets, and Earned Recognition KPIs — all in one platform. <a href="/solutions/fleet-management-software-uk" class="underline font-medium">Learn more about TitanFleet</a> or <a href="/demo" class="underline font-medium">request a demo</a>.</p>
</div>`
      },
    ],
    relatedArticles: [
      { title: "DVSA Walkaround Check Checklist", href: "/resources/dvsa-walkaround-checklist", type: "article" },
      { title: "Transport Manager Responsibilities", href: "/resources/transport-manager-responsibilities", type: "article" },
      { title: "How to Prepare for a DVSA Audit", href: "/resources/prepare-for-dvsa-audit", type: "article" },
      { title: "Operator Licence Compliance Explained", href: "/resources/operator-licence-explained", type: "article" },
      { title: "Fleet Maintenance Scheduling Guide", href: "/resources/fleet-maintenance-scheduling", type: "article" },
    ],
    relatedProducts: [
      { title: "DVSA Walkaround Check App", href: "/solutions/dvsa-walkaround-check-app", type: "product" },
      { title: "Fleet Compliance Software", href: "/solutions/fleet-compliance-software", type: "product" },
      { title: "Driver Defect Reporting App", href: "/solutions/driver-defect-reporting-app", type: "product" },
      { title: "Fleet Maintenance Software", href: "/solutions/fleet-maintenance-software", type: "product" },
    ],
  },
  {
    slug: "hgv-walkaround-check-guide",
    title: "The Ultimate Guide to HGV Walkaround Checks",
    metaTitle: "HGV Walkaround Check Guide 2026 | Complete Inspection Guide | TitanFleet",
    metaDescription: "The definitive guide to HGV walkaround checks. Covers what to check, how to record results, DVSA requirements, defect reporting, and digital inspection tools. Updated 2026.",
    excerpt: "Everything you need to know about HGV walkaround checks — what to inspect, how to record results, what DVSA expects, and how digital tools eliminate the problems with paper-based systems.",
    readingTime: "14 min read",
    lastUpdated: "March 2026",
    tableOfContents: [
      "Why Walkaround Checks Matter",
      "What to Check: Complete Inspection Areas",
      "How to Conduct an Effective Check",
      "Recording and Reporting Results",
      "Common Walkaround Check Failures",
      "Paper vs Digital Walkaround Checks",
      "What Happens When Defects Are Found",
      "End-of-Shift Inspections",
    ],
    sections: [
      {
        id: "why-walkaround-checks-matter",
        title: "Why Walkaround Checks Matter",
        content: `<p>The daily walkaround check is the single most important routine inspection in fleet operations. It is the last line of defence before a vehicle goes on the road. A properly conducted walkaround check catches defects that could cause breakdowns, roadside prohibitions, or — in the worst case — accidents.</p>

<p>DVSA data shows that 43% of prohibition notices issued at roadside checks relate to defects that should have been identified during a walkaround check. The most common are tyre defects, lighting failures, and brake issues — all items covered in a standard walkaround inspection.</p>

<p>For operators, walkaround checks are not just about safety. They are a fundamental part of your O-licence obligations. The Traffic Commissioner expects operators to have a systematic walkaround check process, and evidence that checks are being completed consistently is one of the first things examined at a DVSA audit.</p>

<div class="bg-amber-50 border border-amber-200 rounded-xl p-6 my-6">
<p class="font-semibold text-amber-900 mb-2">The Numbers</p>
<p class="text-amber-800">A roadside prohibition typically costs £1,500 when you factor in the fine, vehicle downtime, recovery costs, and missed deliveries. An effective walkaround check takes 5-10 minutes and costs nothing. The maths is straightforward.</p>
</div>`
      },
      {
        id: "what-to-check",
        title: "What to Check: Complete Inspection Areas",
        content: `<p>A thorough HGV walkaround check should cover every external safety-critical area of the vehicle. The following checklist is based on DVSA guidance and represents best practice for UK fleet operations.</p>

<h3>Cab Area</h3>
<ul>
<li>Windscreen — no significant chips or cracks in the swept area</li>
<li>Wipers and washers — functioning correctly, adequate washer fluid</li>
<li>Mirrors — all mirrors clean, properly adjusted, no cracks or missing mirrors</li>
<li>Cab security — doors close and lock properly, steps and grab handles secure</li>
<li>Dashboard — warning lights, air pressure gauges reading correctly</li>
</ul>

<h3>Front of Vehicle</h3>
<ul>
<li>Headlights — both working, lenses clean and undamaged</li>
<li>Front indicators — functioning, lenses intact</li>
<li>Number plate — clean, legible, properly illuminated</li>
<li>Bumper and bodywork — no damage affecting safety</li>
<li>Fluid leaks — check underneath for oil, coolant, or fuel leaks</li>
</ul>

<h3>Nearside (Passenger Side)</h3>
<ul>
<li>Tyres — tread depth, inflation, condition, no cuts or bulges</li>
<li>Wheel fixings — all nuts present and correctly torqued, no signs of movement</li>
<li>Side lights and indicators — functioning</li>
<li>Side guards — secure, no damage</li>
<li>Fuel and AdBlue caps — secure</li>
<li>Battery compartment — secure, no corrosion</li>
</ul>

<h3>Rear of Vehicle</h3>
<ul>
<li>Rear lights and indicators — all functioning</li>
<li>Brake lights — both working</li>
<li>Reversing lights — functioning (where fitted)</li>
<li>Number plate light — illuminating plate</li>
<li>Rear reflective plates — present, clean, correctly positioned</li>
<li>Rear bumper/underrun protection — secure, no damage</li>
<li>Doors or curtains — closing and securing properly</li>
</ul>

<h3>Offside (Driver Side)</h3>
<ul>
<li>Tyres and wheels — same checks as nearside</li>
<li>Exhaust — secure, no excessive emissions</li>
<li>Suspension — no obvious damage or air leaks</li>
<li>Lights and indicators — same checks as nearside</li>
</ul>

<h3>Coupling Equipment (Articulated Vehicles)</h3>
<ul>
<li>Fifth wheel — properly greased, locking mechanism engaged</li>
<li>Kingpin — visible and correctly seated</li>
<li>Airlines — connected, no leaks, no rubbing</li>
<li>Electrical connections (suzi cables) — connected, no damage</li>
<li>Trailer landing legs — fully raised, handle stowed</li>
</ul>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">Download our complete <a href="/resources/dvsa-walkaround-checklist" class="underline font-medium">DVSA Walkaround Check Checklist</a> for a reference you can use alongside your inspections.</p>
</div>`
      },
      {
        id: "how-to-conduct",
        title: "How to Conduct an Effective Check",
        content: `<p>An effective walkaround check follows a consistent route around the vehicle. Starting from the cab and working around the vehicle in a set direction ensures nothing is missed. Most experienced drivers complete a thorough check in 5-10 minutes.</p>

<h3>Recommended Sequence</h3>
<ol>
<li>Start in the cab — check dashboard warning lights, air pressure, mirrors</li>
<li>Exit and check the front — headlights, indicators, number plate, windscreen</li>
<li>Walk down the nearside — tyres, wheels, lights, fuel caps, battery</li>
<li>Check the rear — all lights, reflectors, plates, doors/curtains</li>
<li>Walk up the offside — tyres, wheels, exhaust, suspension, lights</li>
<li>Check coupling (if articulated) — fifth wheel, airlines, suzi cables</li>
<li>Return to cab — start engine, check brakes, confirm all clear</li>
</ol>

<h3>Tips for Drivers</h3>
<ul>
<li>Always check in daylight or with adequate lighting</li>
<li>Use a torch for checking under the vehicle and in dark areas</li>
<li>Do not rush — a 5-minute check is worthless if you miss a critical defect</li>
<li>If in doubt about a defect, report it — it is better to flag something that turns out to be minor than to miss something serious</li>
<li>Check the vehicle, not just tick boxes — actively look at each item rather than going through the motions</li>
</ul>`
      },
      {
        id: "recording-reporting",
        title: "Recording and Reporting Results",
        content: `<p>Recording walkaround check results is essential. Without records, you cannot prove to DVSA that checks are being conducted. The method of recording — paper or digital — is less important than consistency and completeness.</p>

<h3>Paper Records</h3>
<p>Paper walkaround check sheets are still widely used. They typically list inspection items with checkboxes for pass/fail and space for defect descriptions. While acceptable, paper records have inherent weaknesses:</p>
<ul>
<li>Sheets get lost, damaged, or left in cabs</li>
<li>Handwriting can be illegible</li>
<li>There is no way to verify when a check was actually completed</li>
<li>Defects noted on paper may not be escalated to the right person</li>
<li>Compiling paper records for a DVSA audit is time-consuming</li>
</ul>

<h3>Digital Records</h3>
<p>Digital walkaround check systems address the weaknesses of paper:</p>
<ul>
<li>Every check is timestamped and cannot be backdated</li>
<li>Photos provide visual evidence of vehicle condition and defects</li>
<li>GPS data confirms the check was conducted at the correct location</li>
<li>Defects are automatically escalated to the transport manager</li>
<li>Records are stored centrally and searchable — audit preparation takes minutes, not hours</li>
</ul>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">See how <a href="/solutions/dvsa-walkaround-check-app" class="underline font-medium">TitanFleet's DVSA Walkaround Check App</a> replaces paper with digital inspections your drivers can complete on any smartphone in under 3 minutes.</p>
</div>`
      },
      {
        id: "common-failures",
        title: "Common Walkaround Check Failures",
        content: `<p>Understanding the most common walkaround check failures helps you focus your inspection process and driver training on the areas that matter most.</p>

<h3>Top 5 Walkaround Check Failures</h3>
<ol>
<li><strong>Tyre defects (23%)</strong> — under-inflation, low tread depth, cuts, and bulges. Tyre defects are the most common single cause of prohibitions.</li>
<li><strong>Lighting failures (18%)</strong> — blown bulbs, cracked lenses, dirty lenses reducing visibility. Often missed because drivers do not walk around the vehicle when lights are on.</li>
<li><strong>Brake defects (15%)</strong> — low air pressure, warning light issues, visible brake component damage. Brake defects are the most serious safety concern.</li>
<li><strong>Insecure loads (12%)</strong> — inadequate restraint, shifted loads, missing load securing equipment. More common on flatbed and curtainsider vehicles.</li>
<li><strong>Mirror issues (8%)</strong> — cracked mirrors, misaligned mirrors, missing mirrors. Class V and VI mirrors are commonly damaged and not replaced promptly.</li>
</ol>

<p>Operators who track walkaround check results over time can identify recurring defect patterns by vehicle. A vehicle that repeatedly has tyre issues may have an alignment problem. A vehicle with frequent lighting failures may have an electrical fault. This pattern analysis turns reactive maintenance into proactive maintenance.</p>`
      },
      {
        id: "paper-vs-digital",
        title: "Paper vs Digital Walkaround Checks",
        content: `<p>The transition from paper to digital walkaround checks is one of the highest-impact changes a fleet operator can make. Here is a direct comparison:</p>

<table class="w-full border-collapse my-4">
<thead><tr class="bg-slate-100"><th class="border border-slate-200 px-4 py-3 text-left">Aspect</th><th class="border border-slate-200 px-4 py-3 text-left">Paper</th><th class="border border-slate-200 px-4 py-3 text-left">Digital</th></tr></thead>
<tbody>
<tr><td class="border border-slate-200 px-4 py-3">Time to complete</td><td class="border border-slate-200 px-4 py-3">5-10 min + office handover</td><td class="border border-slate-200 px-4 py-3">2-3 minutes, instant submission</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Photo evidence</td><td class="border border-slate-200 px-4 py-3">Not practical</td><td class="border border-slate-200 px-4 py-3">Timestamped photos on every item</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Defect escalation</td><td class="border border-slate-200 px-4 py-3">Manual — relies on driver handover</td><td class="border border-slate-200 px-4 py-3">Automatic and instant</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Audit preparation</td><td class="border border-slate-200 px-4 py-3">Hours of sorting paper files</td><td class="border border-slate-200 px-4 py-3">Instant PDF generation</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Lost records</td><td class="border border-slate-200 px-4 py-3">Common</td><td class="border border-slate-200 px-4 py-3">Impossible — stored centrally</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Verification</td><td class="border border-slate-200 px-4 py-3">No way to verify timing</td><td class="border border-slate-200 px-4 py-3">GPS + timestamp verification</td></tr>
</tbody>
</table>

<p>The transition is straightforward. Drivers access the digital check on their smartphone — no app download required. Most drivers are comfortable with the process after one use. The investment in a digital system typically pays for itself within weeks through reduced admin time and improved defect management.</p>`
      },
      {
        id: "defects-found",
        title: "What Happens When Defects Are Found",
        content: `<p>When a driver finds a defect during a walkaround check, the response depends on the severity of the defect. A clear defect management process is essential for compliance.</p>

<h3>Defect Severity Categories</h3>
<ul>
<li><strong>Safety-critical</strong> — the vehicle must not be driven. Examples: brake failure, major tyre damage, insecure coupling. The vehicle should be taken off the road immediately (VOR — Vehicle Off Road).</li>
<li><strong>Major</strong> — the vehicle can complete its current journey but the defect must be repaired before the next trip. Examples: one failed headlight, cracked mirror, minor fluid leak.</li>
<li><strong>Minor</strong> — the defect should be scheduled for repair but does not prevent the vehicle from operating. Examples: small bodywork damage, cosmetic issues, non-safety items.</li>
</ul>

<p>The key is having a defined process. Drivers need to know how to report defects, transport managers need to be alerted promptly, and there must be a system to track defects through to resolution. DVSA auditors look specifically at defect resolution timelines — a reported defect that is never resolved is worse than no report at all.</p>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">Read our guide on <a href="/resources/driver-defect-reporting-guide" class="underline font-medium">Driver Defect Reporting</a> for best practices. See how <a href="/solutions/driver-defect-reporting-app" class="underline font-medium">TitanFleet's Defect Reporting App</a> uses AI to categorise defect severity using the DVSA Guide to Roadworthiness.</p>
</div>`
      },
      {
        id: "end-of-shift",
        title: "End-of-Shift Inspections",
        content: `<p>While the pre-use walkaround check is the primary inspection, some operators also require end-of-shift inspections. This is particularly common in operations where:</p>
<ul>
<li>Vehicles are shared between drivers (multi-shift operations)</li>
<li>Vehicles operate in demanding conditions (construction, waste management)</li>
<li>The operator wants to identify damage that occurred during the shift</li>
</ul>

<p>An end-of-shift check is typically shorter than a full walkaround, focusing on new damage, fluid levels, and any defects the driver noticed during the shift. The benefit is that defects are reported immediately when the driver returns, rather than being discovered by the next driver at the start of their shift.</p>

<p>End-of-shift checks also create a clear record of vehicle condition at handover, which is valuable when investigating damage or allocating responsibility in multi-driver operations.</p>

<div class="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
<p class="font-semibold text-green-900 mb-2">TitanFleet Feature</p>
<p class="text-green-800">TitanFleet supports both pre-use walkaround checks and end-of-shift inspections. Transport managers can view end-of-shift results in a dedicated tab on the inspections page. <a href="/solutions/dvsa-walkaround-check-app" class="underline font-medium">Learn more about TitanFleet's inspection capabilities</a>.</p>
</div>`
      },
    ],
    relatedArticles: [
      { title: "DVSA Walkaround Check Checklist", href: "/resources/dvsa-walkaround-checklist", type: "article" },
      { title: "Driver Defect Reporting Guide", href: "/resources/driver-defect-reporting-guide", type: "article" },
      { title: "Complete DVSA Compliance Guide", href: "/guides/dvsa-compliance-guide", type: "guide" },
    ],
    relatedProducts: [
      { title: "DVSA Walkaround Check App", href: "/solutions/dvsa-walkaround-check-app", type: "product" },
      { title: "Driver Defect Reporting App", href: "/solutions/driver-defect-reporting-app", type: "product" },
      { title: "Fleet Compliance Software", href: "/solutions/fleet-compliance-software", type: "product" },
    ],
  },
  {
    slug: "fleet-maintenance-guide",
    title: "Fleet Maintenance Best Practices for Transport Companies",
    metaTitle: "Fleet Maintenance Guide 2026 | Best Practices for UK Transport | TitanFleet",
    metaDescription: "Complete fleet maintenance guide for UK transport companies. Covers PPM scheduling, defect management, MOT preparation, cost control, and predictive maintenance. Updated 2026.",
    excerpt: "A practical guide to fleet maintenance for UK transport operators — covering planned preventative maintenance, defect management, MOT preparation, cost control, and how predictive analytics is changing the game.",
    readingTime: "15 min read",
    lastUpdated: "March 2026",
    tableOfContents: [
      "Why Fleet Maintenance Matters",
      "Planned Preventative Maintenance",
      "Defect Management Best Practices",
      "MOT Preparation and Management",
      "Maintenance Cost Control",
      "Predictive Maintenance",
      "Choosing a Maintenance System",
    ],
    sections: [
      {
        id: "why-maintenance-matters",
        title: "Why Fleet Maintenance Matters",
        content: `<p>Fleet maintenance is not just about keeping vehicles running — it is a legal obligation, a safety imperative, and a significant cost driver. For UK transport operators, the DVSA expects a documented, systematic approach to maintenance as a condition of holding an O-licence.</p>

<p>The financial case for proactive maintenance is clear. Reactive maintenance — fixing things when they break — is consistently more expensive than planned maintenance. An unplanned breakdown costs an average of £750 in direct costs (recovery, roadside repair, parts) plus the indirect costs of missed deliveries, driver downtime, and customer complaints.</p>

<p>Operators who invest in proper maintenance systems typically see 15-25% lower total maintenance costs compared to those running a reactive approach. The savings come from catching problems early, extending component life through proper care, and avoiding the premium costs associated with emergency repairs.</p>`
      },
      {
        id: "planned-preventative-maintenance",
        title: "Planned Preventative Maintenance",
        content: `<p>Planned Preventative Maintenance (PPM) is the cornerstone of a compliant fleet operation. The DVSA's Guide to Maintaining Roadworthiness specifically requires operators to have a planned maintenance programme covering all vehicles.</p>

<h3>Setting Inspection Intervals</h3>
<p>The right inspection interval depends on vehicle type, usage, and operating conditions:</p>
<ul>
<li><strong>HGVs in intensive use</strong> (high mileage, multi-shift): every 4-6 weeks</li>
<li><strong>HGVs in standard use</strong>: every 6-8 weeks</li>
<li><strong>Trailers</strong>: every 8-10 weeks</li>
<li><strong>Vans (above 3.5t)</strong>: every 8-10 weeks</li>
<li><strong>Light commercial vehicles</strong>: every 10-13 weeks</li>
</ul>

<p>These intervals should be reviewed regularly. If a vehicle is consistently passing inspections with no defects, the interval may be appropriate. If defects are found regularly between inspections, the interval should be shortened.</p>

<h3>What a PMI Should Cover</h3>
<p>A Preventative Maintenance Inspection (PMI) should be more thorough than a daily walkaround check. It typically includes:</p>
<ul>
<li>Brake system — disc/drum condition, pad/shoe wear, air system integrity, brake performance test</li>
<li>Steering — free play, track rod ends, power steering operation</li>
<li>Suspension — springs, air bags, shock absorbers, bushes</li>
<li>Chassis and body — structural integrity, corrosion, mountings</li>
<li>Electrical system — alternator output, battery condition, wiring</li>
<li>Exhaust and emissions — exhaust system integrity, emissions performance</li>
<li>Lubrication and fluids — oil condition, coolant, all fluid levels and condition</li>
</ul>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">Read our detailed <a href="/resources/fleet-maintenance-scheduling" class="underline font-medium">Fleet Maintenance Scheduling Guide</a> for practical advice on setting up and managing your PMI programme.</p>
</div>`
      },
      {
        id: "defect-management",
        title: "Defect Management Best Practices",
        content: `<p>Defect management is the process of identifying, recording, categorising, and resolving vehicle defects. It is one of the areas DVSA auditors focus on most closely, because it reveals how seriously an operator takes vehicle safety.</p>

<h3>A Good Defect Process</h3>
<ol>
<li><strong>Report</strong> — drivers report defects as soon as they are identified, using a clear and simple process</li>
<li><strong>Categorise</strong> — defects are categorised by severity (safety-critical, major, minor) to determine response urgency</li>
<li><strong>Assign</strong> — the defect is assigned to the appropriate person or workshop for repair</li>
<li><strong>Track</strong> — progress is monitored from report to completion</li>
<li><strong>Verify</strong> — the repair is verified as complete and the vehicle returned to service</li>
<li><strong>Record</strong> — the entire process is documented for audit purposes</li>
</ol>

<h3>Common Defect Management Failures</h3>
<ul>
<li><strong>Delayed reporting</strong> — defects reported at end of shift or next day, allowing the vehicle to operate unsafely</li>
<li><strong>No categorisation</strong> — all defects treated equally, meaning critical issues do not get urgent attention</li>
<li><strong>No tracking</strong> — defects are reported but there is no system to ensure they are actually repaired</li>
<li><strong>Missing records</strong> — defect reports or repair evidence is lost, creating audit gaps</li>
</ul>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">See our <a href="/resources/driver-defect-reporting-guide" class="underline font-medium">Driver Defect Reporting Guide</a> for best practices. Learn how <a href="/solutions/driver-defect-reporting-app" class="underline font-medium">TitanFleet's AI-powered defect reporting</a> automates severity categorisation using the DVSA Guide to Roadworthiness.</p>
</div>`
      },
      {
        id: "mot-management",
        title: "MOT Preparation and Management",
        content: `<p>The annual MOT test is a legal requirement for all commercial vehicles. An MOT failure is costly — not just the retest fee, but the vehicle downtime and the impact on your MOT first-time pass rate, which is a key metric for DVSA Earned Recognition.</p>

<h3>MOT Preparation</h3>
<p>Vehicles should receive a pre-MOT inspection to identify and resolve any issues before the test. Common MOT failure items include:</p>
<ul>
<li>Brake performance below minimum standards</li>
<li>Tyre tread depth or condition</li>
<li>Suspension defects</li>
<li>Lighting failures</li>
<li>Exhaust emissions</li>
<li>Structural corrosion</li>
</ul>

<h3>Tracking MOT Dates</h3>
<p>With a fleet of vehicles, tracking MOT expiry dates manually is error-prone. A single expired MOT means operating an illegal vehicle — a serious compliance failure. Digital systems that pull live MOT data from the DVSA database and send automated alerts eliminate this risk.</p>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">TitanFleet pulls live MOT data directly from DVSA for every vehicle in your fleet. See <a href="/solutions/fleet-maintenance-software" class="underline font-medium">Fleet Maintenance Software</a> for details on automated MOT tracking and expiry alerts.</p>
</div>`
      },
      {
        id: "cost-control",
        title: "Maintenance Cost Control",
        content: `<p>Fleet maintenance typically represents 10-15% of total operating costs for a transport company. Managing these costs without compromising safety or compliance requires data and planning.</p>

<h3>Cost Control Strategies</h3>
<ul>
<li><strong>Track cost per vehicle</strong> — identify vehicles that are disproportionately expensive to maintain. These may be candidates for replacement.</li>
<li><strong>Monitor cost per mile</strong> — this normalises costs across vehicles with different usage levels, giving a fairer comparison.</li>
<li><strong>Plan for replacements</strong> — when a vehicle's maintenance cost exceeds a threshold (often 50-60% of monthly depreciation), replacement becomes more economical.</li>
<li><strong>Negotiate with workshops</strong> — if using external workshops, review costs regularly. Standardise parts procurement where possible.</li>
<li><strong>Prevent failures</strong> — every prevented breakdown saves money. Investment in walkaround check compliance and PMI adherence pays for itself.</li>
</ul>

<h3>Using Data for Cost Decisions</h3>
<p>Operators who track maintenance data over time can make better decisions about vehicle replacement, workshop selection, and maintenance intervals. A vehicle with steadily increasing defect frequency is likely approaching the end of its economically useful life, even if it is still passing MOTs.</p>`
      },
      {
        id: "predictive-maintenance",
        title: "Predictive Maintenance",
        content: `<p>Predictive maintenance uses data analysis to identify vehicles at risk of problems before they occur. While traditional predictive maintenance in other industries uses sensor data and IoT, fleet operators can achieve significant benefits using the data they already have.</p>

<h3>Data Sources for Prediction</h3>
<ul>
<li><strong>Walkaround check history</strong> — vehicles with increasing defect frequency are at higher risk</li>
<li><strong>Defect patterns</strong> — recurring defects in the same system (e.g., repeated brake issues) indicate an underlying problem</li>
<li><strong>MOT history</strong> — vehicles that failed previous MOTs on specific items are likely to fail again in those areas</li>
<li><strong>Age and mileage</strong> — older, higher-mileage vehicles naturally have higher maintenance needs</li>
<li><strong>Usage patterns</strong> — vehicles in more demanding operations (construction, waste) experience faster wear</li>
</ul>

<p>Fleet health scoring — assigning a numerical score to each vehicle based on these factors — gives transport managers a prioritisation tool. Vehicles with lower health scores should receive more attention, more frequent inspections, and earlier maintenance intervention.</p>

<div class="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
<p class="font-semibold text-green-900 mb-2">TitanFleet Feature</p>
<p class="text-green-800">TitanFleet includes predictive analytics with fleet health scoring, risk identification, and 30-day maintenance cost projections. See <a href="/solutions/fleet-maintenance-software" class="underline font-medium">Fleet Maintenance Software</a> for details.</p>
</div>`
      },
      {
        id: "choosing-system",
        title: "Choosing a Maintenance System",
        content: `<p>When choosing a fleet maintenance system, UK operators should look for:</p>
<ul>
<li><strong>DVSA MOT integration</strong> — live data, not manual entry</li>
<li><strong>Digital walkaround checks</strong> — integrated with maintenance workflow</li>
<li><strong>Defect management</strong> — from report to resolution with clear tracking</li>
<li><strong>Compliance dashboard</strong> — fleet-wide view of maintenance status</li>
<li><strong>Reporting</strong> — audit-ready reports for DVSA inspections</li>
<li><strong>Driver experience</strong> — mobile-friendly for use in the field</li>
</ul>

<p>Avoid systems designed for car fleets that have been adapted for commercial vehicles. The requirements are fundamentally different. A system built for UK transport compliance from the ground up will serve you better than a generic fleet tool with UK features bolted on.</p>

<div class="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
<p class="font-semibold text-green-900 mb-2">TitanFleet</p>
<p class="text-green-800">TitanFleet is built specifically for UK fleet maintenance and compliance. Digital walkaround checks, AI defect triage, live MOT tracking, predictive analytics, and compliance dashboard — all in one platform. <a href="/solutions/fleet-management-software-uk" class="underline font-medium">Learn more</a> or <a href="/demo" class="underline font-medium">request a demo</a>.</p>
</div>`
      },
    ],
    relatedArticles: [
      { title: "Fleet Maintenance Scheduling Guide", href: "/resources/fleet-maintenance-scheduling", type: "article" },
      { title: "Driver Defect Reporting Guide", href: "/resources/driver-defect-reporting-guide", type: "article" },
      { title: "Complete DVSA Compliance Guide", href: "/guides/dvsa-compliance-guide", type: "guide" },
    ],
    relatedProducts: [
      { title: "Fleet Maintenance Software", href: "/solutions/fleet-maintenance-software", type: "product" },
      { title: "Driver Defect Reporting App", href: "/solutions/driver-defect-reporting-app", type: "product" },
      { title: "Fleet Compliance Software", href: "/solutions/fleet-compliance-software", type: "product" },
    ],
  },
  {
    slug: "operator-licence-guide",
    title: "Operator Licence Compliance Explained: A Complete Guide",
    metaTitle: "Operator Licence Guide 2026 | O-Licence Compliance | TitanFleet",
    metaDescription: "Complete guide to UK operator licence compliance. Covers O-licence conditions, Traffic Commissioner requirements, maintenance undertakings, and how to avoid licence action. Updated 2026.",
    excerpt: "Understanding your O-licence obligations is essential for any UK transport operator. This guide covers licence types, conditions, undertakings, Traffic Commissioner expectations, and how to maintain compliance.",
    readingTime: "12 min read",
    lastUpdated: "March 2026",
    tableOfContents: [
      "What Is an Operator Licence?",
      "Licence Types and Requirements",
      "Conditions and Undertakings",
      "The Transport Manager's Role",
      "Maintaining Compliance",
      "Traffic Commissioner Hearings",
    ],
    sections: [
      {
        id: "what-is-o-licence",
        title: "What Is an Operator Licence?",
        content: `<p>An Operator's Licence (O-licence) is the legal authority to operate goods vehicles over 3.5 tonnes gross vehicle weight on UK roads. It is granted by the Traffic Commissioner for your traffic area and sets out the terms under which you can operate.</p>

<p>Without a valid O-licence, operating goods vehicles is a criminal offence. The licence is not just a piece of paper — it represents an ongoing commitment to compliance. The Traffic Commissioner has the power to revoke, suspend, or curtail your licence at any time if you fail to meet the required standards.</p>

<p>Every operator should understand their licence conditions thoroughly. Many compliance failures stem not from deliberate non-compliance but from operators simply not understanding what their licence requires.</p>`
      },
      {
        id: "licence-types",
        title: "Licence Types and Requirements",
        content: `<h3>Standard National Licence</h3>
<p>Required for carrying goods for hire and reward within the UK. This is the licence held by haulage companies, courier firms, and logistics operators. Requirements:</p>
<ul>
<li>Good repute of operator and transport manager</li>
<li>Financial standing: £8,000 for first vehicle, £4,500 each additional</li>
<li>Professional competence: nominated transport manager with CPC</li>
<li>Suitable operating centre with environmental compliance</li>
</ul>

<h3>Standard International Licence</h3>
<p>Required for international haulage operations in addition to domestic work. Same requirements as national, plus the transport manager must hold an international CPC. Post-Brexit, additional documentation may be required for some international routes.</p>

<h3>Restricted Licence</h3>
<p>For operators carrying their own goods (not for hire and reward). Lower requirements — no transport manager CPC needed. Common for businesses like builders merchants, food manufacturers, and retailers who deliver their own products.</p>

<h3>Financial Standing</h3>
<p>You must maintain the required level of financial standing throughout the life of your licence, not just at application. The Traffic Commissioner can request evidence of financial standing at any time. Acceptable evidence includes bank statements, audited accounts, or a financial guarantee from an approved body.</p>`
      },
      {
        id: "conditions-undertakings",
        title: "Conditions and Undertakings",
        content: `<p>Every O-licence comes with standard undertakings that the operator agrees to when the licence is granted. These are legally binding commitments:</p>

<h3>Standard Undertakings</h3>
<ol>
<li>Vehicles will be kept in a fit and serviceable condition</li>
<li>Vehicles will be inspected at intervals not exceeding those specified by the licence</li>
<li>Drivers will not be required to drive if unfit</li>
<li>Drivers' hours and tachograph rules will be observed</li>
<li>Vehicles will not be overloaded</li>
<li>The Traffic Commissioner will be informed of relevant changes within 28 days</li>
<li>Records will be maintained and made available on request</li>
</ol>

<h3>What "Relevant Changes" Must Be Reported</h3>
<ul>
<li>Change of address (operator or operating centre)</li>
<li>Criminal convictions of the operator, directors, or transport manager</li>
<li>Fixed penalty notices or prohibition notices</li>
<li>Change of transport manager</li>
<li>Change of legal entity (e.g., sole trader to limited company)</li>
<li>Financial difficulties or insolvency</li>
</ul>

<p>Failure to notify relevant changes is itself a compliance failure and can lead to regulatory action.</p>`
      },
      {
        id: "transport-manager-role",
        title: "The Transport Manager's Role",
        content: `<p>The transport manager is the individual nominated on the O-licence as being responsible for the day-to-day management of transport operations. This is a legal role with real responsibilities — not just a title.</p>

<h3>Key Responsibilities</h3>
<ul>
<li>Ensuring vehicles are properly maintained and inspected</li>
<li>Managing driver hours compliance and tachograph records</li>
<li>Overseeing driver licence and CPC checks</li>
<li>Maintaining compliance records</li>
<li>Reporting relevant matters to the Traffic Commissioner</li>
<li>Ensuring vehicles operate from authorised operating centres</li>
</ul>

<h3>Continuous and Effective Responsibility</h3>
<p>The Traffic Commissioner expects the transport manager to have "continuous and effective" responsibility for the operation. This means the transport manager must be genuinely involved in managing compliance — not just named on the licence while someone else (or no one) actually manages the fleet.</p>

<p>Evidence of continuous and effective management includes regular review of compliance data, documented involvement in maintenance decisions, and demonstrable oversight of driver management.</p>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">Read our detailed <a href="/resources/transport-manager-responsibilities" class="underline font-medium">Transport Manager Responsibilities</a> article for practical guidance on demonstrating continuous and effective management.</p>
</div>`
      },
      {
        id: "maintaining-compliance",
        title: "Maintaining Compliance",
        content: `<p>Maintaining O-licence compliance is an ongoing process, not a one-time exercise. The most effective operators build compliance into their daily operations through systems and processes.</p>

<h3>Daily Compliance Activities</h3>
<ul>
<li>Walkaround checks completed for every vehicle before use</li>
<li>Defects reported and escalated appropriately</li>
<li>Driver hours monitored and managed</li>
</ul>

<h3>Weekly/Monthly Activities</h3>
<ul>
<li>Review of driver hours data and tachograph downloads</li>
<li>Review of outstanding defects and resolution progress</li>
<li>MOT and tax status checks across the fleet</li>
<li>Driver licence and CPC validity verification</li>
</ul>

<h3>Periodic Activities</h3>
<ul>
<li>PMI inspections at defined intervals</li>
<li>Internal compliance audits (quarterly recommended)</li>
<li>Review and update of maintenance schedules</li>
<li>Financial standing evidence preparation</li>
</ul>

<div class="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
<p class="font-semibold text-green-900 mb-2">TitanFleet</p>
<p class="text-green-800">TitanFleet's compliance dashboard tracks all of these activities automatically. MOT status, inspection completion rates, defect resolution times, and driver compliance metrics are all visible in real-time. <a href="/solutions/fleet-compliance-software" class="underline font-medium">See Fleet Compliance Software</a>.</p>
</div>`
      },
      {
        id: "traffic-commissioner",
        title: "Traffic Commissioner Hearings",
        content: `<p>A Traffic Commissioner public inquiry is the most serious consequence of compliance failure. Understanding the process helps you prepare — and ideally avoid one in the first place.</p>

<h3>Why You Might Be Called</h3>
<ul>
<li>Repeated DVSA prohibition notices</li>
<li>Failed DVSA audit revealing systematic compliance failures</li>
<li>Multiple fixed penalty notices over a period</li>
<li>Criminal convictions related to transport operations</li>
<li>Complaints from the public or other operators</li>
<li>Poor MOT first-time pass rates</li>
</ul>

<h3>Possible Outcomes</h3>
<ul>
<li><strong>No action</strong> — the TC is satisfied with your response and remedial action</li>
<li><strong>Warning</strong> — a formal warning with specific requirements</li>
<li><strong>Curtailment</strong> — reduction in the number of vehicles you can operate</li>
<li><strong>Suspension</strong> — temporary loss of your O-licence</li>
<li><strong>Revocation</strong> — permanent loss of your O-licence</li>
<li><strong>Disqualification</strong> — the operator or transport manager is disqualified from holding or being named on any O-licence</li>
</ul>

<h3>How to Prepare</h3>
<p>If called to a public inquiry, you should seek legal advice. However, the most important preparation happens long before any hearing — by maintaining robust compliance systems and records that demonstrate your commitment to meeting the required standards.</p>

<p>Traffic Commissioners consistently treat operators more favourably when they can show they have proper systems in place, even if those systems have had failures. An operator with a digital compliance platform, documented procedures, and evidence of management oversight is in a much stronger position than one with boxes of paper records and no clear system.</p>`
      },
    ],
    relatedArticles: [
      { title: "Transport Manager Responsibilities", href: "/resources/transport-manager-responsibilities", type: "article" },
      { title: "Operator Licence Compliance Explained", href: "/resources/operator-licence-explained", type: "article" },
      { title: "How to Prepare for a DVSA Audit", href: "/resources/prepare-for-dvsa-audit", type: "article" },
    ],
    relatedProducts: [
      { title: "Fleet Compliance Software", href: "/solutions/fleet-compliance-software", type: "product" },
      { title: "Fleet Management Software UK", href: "/solutions/fleet-management-software-uk", type: "product" },
    ],
  },
  {
    slug: "transport-manager-compliance-guide",
    title: "How UK Transport Managers Stay Compliant: A Practical Guide",
    metaTitle: "Transport Manager Compliance Guide 2026 | Practical Guide | TitanFleet",
    metaDescription: "Practical compliance guide for UK transport managers. Covers daily tasks, audit preparation, driver management, fleet monitoring, and digital tools. Updated 2026.",
    excerpt: "A practical, day-to-day guide for transport managers responsible for fleet compliance. Covers daily routines, audit preparation, driver management, and the tools that make compliance manageable.",
    readingTime: "13 min read",
    lastUpdated: "March 2026",
    tableOfContents: [
      "The Transport Manager's Daily Reality",
      "Daily Compliance Routine",
      "Managing Drivers Effectively",
      "Fleet Monitoring and Oversight",
      "Audit Readiness",
      "Using Technology Effectively",
    ],
    sections: [
      {
        id: "daily-reality",
        title: "The Transport Manager's Daily Reality",
        content: `<p>Being a transport manager means balancing operational demands with compliance obligations. On any given day, you might be dealing with driver shortages, vehicle breakdowns, customer complaints, and regulatory requirements — all at once.</p>

<p>The challenge is that compliance is not a separate activity from operations — it is embedded in everything you do. Every driver who clocks in, every vehicle that leaves the depot, and every delivery that is made has compliance implications. The transport managers who succeed are those who build compliance into their daily routine rather than treating it as an additional burden.</p>

<p>This guide focuses on practical, actionable advice for transport managers who need to maintain compliance while running a busy operation.</p>`
      },
      {
        id: "daily-routine",
        title: "Daily Compliance Routine",
        content: `<h3>Morning Priorities</h3>
<ol>
<li><strong>Review walkaround check completion</strong> — have all vehicles been checked before going on the road? Which drivers have not completed their checks?</li>
<li><strong>Check defect reports</strong> — are there any new defects from yesterday evening or this morning? Any safety-critical issues that need immediate attention?</li>
<li><strong>Review driver availability</strong> — are all scheduled drivers fit and available? Do any drivers have CPC or licence issues?</li>
<li><strong>Check MOT and tax status</strong> — any vehicles approaching expiry?</li>
</ol>

<h3>During the Day</h3>
<ul>
<li>Monitor driver locations (if GPS tracking is available)</li>
<li>Respond to defect reports as they come in</li>
<li>Track driver hours approaching limits</li>
<li>Handle any compliance issues that arise</li>
</ul>

<h3>End of Day</h3>
<ul>
<li>Review any outstanding defects and assign for repair</li>
<li>Check tachograph data for any driver hours infringements</li>
<li>Confirm maintenance bookings for upcoming PMIs</li>
<li>Note any compliance actions needed for the following day</li>
</ul>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">Read our <a href="/resources/transport-manager-responsibilities" class="underline font-medium">Transport Manager Responsibilities</a> article for a complete breakdown of the TM role across all compliance areas.</p>
</div>`
      },
      {
        id: "managing-drivers",
        title: "Managing Drivers Effectively",
        content: `<p>Drivers are at the front line of compliance. Their behaviour — completing walkaround checks, reporting defects, managing their hours — determines whether your fleet is compliant or not.</p>

<h3>Setting Expectations</h3>
<ul>
<li>Make walkaround checks non-negotiable — no check, no drive</li>
<li>Explain why defect reporting matters — not just for compliance, but for their safety</li>
<li>Be clear about driver hours rules and the consequences of infringements</li>
<li>Provide simple, accessible tools for completing checks and reporting issues</li>
</ul>

<h3>Monitoring and Feedback</h3>
<ul>
<li>Review walkaround check completion rates regularly — identify drivers who skip checks</li>
<li>Look at the quality of checks, not just completion — are drivers actually inspecting or just ticking boxes?</li>
<li>Recognise good compliance behaviour — drivers who consistently complete thorough checks and report defects promptly</li>
<li>Address non-compliance quickly and consistently</li>
</ul>

<h3>CPC and Licence Management</h3>
<ul>
<li>Maintain a record of every driver's licence category, CPC expiry date, and any endorsements</li>
<li>Check licences at regular intervals (DVLA check codes or DVLA licence checking service)</li>
<li>Monitor CPC hours — drivers need 35 hours of periodic training every 5 years</li>
<li>Plan CPC training to avoid last-minute rushes as expiry dates approach</li>
</ul>`
      },
      {
        id: "fleet-monitoring",
        title: "Fleet Monitoring and Oversight",
        content: `<p>Effective fleet monitoring means having visibility of your entire operation at a glance. The transport manager should be able to answer these questions at any time:</p>

<ul>
<li>Which vehicles are on the road and where are they?</li>
<li>Have all vehicles been inspected today?</li>
<li>Are there any outstanding defects?</li>
<li>Which drivers are approaching their hours limits?</li>
<li>Are any MOTs or tax discs expiring soon?</li>
<li>What is the overall compliance health of the fleet?</li>
</ul>

<p>If you cannot answer these questions quickly, your oversight system needs improvement. Paper-based systems make this almost impossible for fleets of more than a few vehicles. Digital compliance platforms provide this visibility through dashboards and automated alerts.</p>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">See how <a href="/solutions/fleet-management-software-uk" class="underline font-medium">TitanFleet's fleet management platform</a> gives transport managers a single dashboard covering compliance, tracking, and operations.</p>
</div>`
      },
      {
        id: "audit-readiness",
        title: "Audit Readiness",
        content: `<p>The best approach to DVSA audits is to be permanently ready. This means maintaining your records and systems as if an audit could happen tomorrow — because it can. DVSA can conduct unannounced audits.</p>

<h3>Staying Audit-Ready</h3>
<ul>
<li>Keep all records for at least 15 months (the typical audit review period)</li>
<li>Ensure walkaround check records are complete — no gaps</li>
<li>Maintain defect records showing both the report and the resolution</li>
<li>Keep tachograph downloads current — vehicle units every 90 days, driver cards every 28 days</li>
<li>Verify driver licences and CPC status are documented</li>
<li>Ensure MOT certificates are on file for all vehicles</li>
</ul>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Related</p>
<p class="text-blue-800">Read our step-by-step guide on <a href="/resources/prepare-for-dvsa-audit" class="underline font-medium">How to Prepare for a DVSA Audit</a>. See how <a href="/solutions/fleet-compliance-software" class="underline font-medium">TitanFleet's compliance dashboard</a> generates audit-ready reports instantly.</p>
</div>`
      },
      {
        id: "using-technology",
        title: "Using Technology Effectively",
        content: `<p>Technology should make compliance easier, not more complicated. The best compliance tools are those that your drivers actually use and that give you the information you need without excessive admin.</p>

<h3>What Good Compliance Technology Looks Like</h3>
<ul>
<li><strong>Simple for drivers</strong> — if drivers find the tool difficult, they will not use it properly. PIN login, guided checklists, and a clean mobile interface matter.</li>
<li><strong>Informative for managers</strong> — a dashboard that shows compliance status at a glance, with the ability to drill into detail when needed.</li>
<li><strong>Automatic where possible</strong> — MOT data pulled from DVSA, defects escalated automatically, alerts sent without manual intervention.</li>
<li><strong>Audit-ready</strong> — reports generated instantly, not compiled manually over hours.</li>
</ul>

<p>The goal is to spend less time on compliance admin and more time on compliance management — actually overseeing your fleet rather than shuffling paper.</p>

<div class="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
<p class="font-semibold text-green-900 mb-2">TitanFleet</p>
<p class="text-green-800">TitanFleet was built by a transport professional for transport professionals. Digital walkaround checks, AI defect triage, GPS tracking, timesheets, and compliance dashboard — designed to make the transport manager's job easier, not harder. <a href="/solutions/fleet-management-software-uk" class="underline font-medium">Learn more</a> or <a href="/demo" class="underline font-medium">request a demo</a>.</p>
</div>`
      },
    ],
    relatedArticles: [
      { title: "Transport Manager Responsibilities", href: "/resources/transport-manager-responsibilities", type: "article" },
      { title: "How to Prepare for a DVSA Audit", href: "/resources/prepare-for-dvsa-audit", type: "article" },
      { title: "DVSA Walkaround Check Checklist", href: "/resources/dvsa-walkaround-checklist", type: "article" },
    ],
    relatedProducts: [
      { title: "Fleet Management Software UK", href: "/solutions/fleet-management-software-uk", type: "product" },
      { title: "Fleet Compliance Software", href: "/solutions/fleet-compliance-software", type: "product" },
      { title: "DVSA Walkaround Check App", href: "/solutions/dvsa-walkaround-check-app", type: "product" },
    ],
  },
  {
    slug: "dvsa-earned-recognition-guide",
    title: "DVSA Earned Recognition: The Complete Guide for Fleet Operators",
    metaTitle: "DVSA Earned Recognition Guide 2026 | How to Get Accredited | TitanFleet",
    metaDescription: "The complete guide to DVSA Earned Recognition for UK HGV and PSV operators. Covers eligibility, the 5-step accreditation process, KPI requirements, and how fleet management software helps you achieve and maintain ER status.",
    excerpt: "DVSA Earned Recognition is the gold standard for UK transport operators — and the key to winning high-value contracts, reducing roadside stops, and proving exemplary compliance. This guide explains exactly how to achieve and maintain ER status.",
    readingTime: "14 min read",
    lastUpdated: "March 2026",
    tableOfContents: [
      "What Is DVSA Earned Recognition?",
      "Why Earned Recognition Exists",
      "The Benefits of Accreditation",
      "How to Get Accredited: Step-by-Step",
      "Understanding the KPIs",
      "Vehicle Maintenance KPIs",
      "Drivers' Hours KPIs",
      "How TitanFleet Supports ER Status",
      "Standard vs Earned Recognition Operator",
    ],
    sections: [
      {
        id: "what-is-dvsa-earned-recognition",
        title: "What Is DVSA Earned Recognition?",
        content: `<p>DVSA Earned Recognition (ER) is a voluntary compliance scheme launched by the Driver and Vehicle Standards Agency that allows HGV and PSV operators to prove they meet the highest standards of driver and vehicle compliance — not through periodic visits, but through continuous, automated data sharing.</p>

<p>Instead of being subject to random roadside checks or intensive site visits, ER-accredited operators use DVSA-validated IT systems to monitor their own compliance. These systems track a defined set of Key Performance Indicators (KPIs) and automatically notify the DVSA every four weeks. If KPIs are consistently met, the operator remains on the DVSA's list of exemplary operators and benefits from a significantly reduced enforcement footprint.</p>

<p>The scheme is open to operators holding a valid HGV or PSV operator's licence. It is administered by the DVSA and recognised by Traffic Commissioners, the police, HMRC, and enforcement bodies across the UK. For operators aiming to scale and compete for high-value government and infrastructure contracts, Earned Recognition status is increasingly a prerequisite rather than a differentiator.</p>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Official Scheme</p>
<p class="text-blue-800">Earned Recognition is administered by the DVSA under powers derived from the Goods Vehicles (Licensing of Operators) Act 1995. Participation is voluntary, but once enrolled, operators must maintain KPI standards continuously or risk removal from the scheme and referral to the Traffic Commissioner.</p>
</div>`
      },
      {
        id: "why-earned-recognition-exists",
        title: "Why Earned Recognition Exists",
        content: `<p>The DVSA's core mandate is road safety. With limited enforcement resources and over 50,000 licensed HGV operators in the UK, the agency cannot intensively monitor every fleet. The Earned Recognition scheme is a strategic solution to this resource problem — it allows the DVSA to concentrate enforcement where the risk is highest.</p>

<p>By offering compliant operators a "lighter touch" in exchange for transparent data sharing, the DVSA creates a self-regulating tier of operators at the top of the compliance spectrum. These operators use validated digital systems to monitor themselves. The DVSA receives automated reports every four weeks. If the data shows consistent compliance, the operator is left to operate efficiently. If KPIs slip, the DVSA is alerted immediately — and so is the operator, who has the opportunity to self-correct before enforcement action begins.</p>

<p>The result is a system that rewards genuine compliance with operational freedom, while creating stronger accountability than periodic audits ever could. It is a fundamentally different relationship between operator and regulator — one based on evidence rather than inspection.</p>

<div class="bg-amber-50 border border-amber-200 rounded-xl p-6 my-6">
<p class="font-semibold text-amber-900 mb-2">Key Point</p>
<p class="text-amber-800">Earned Recognition is not simply about avoiding enforcement. It is a public signal of operational excellence. The DVSA publishes the list of ER-accredited operators on GOV.UK, making it visible to potential clients, procurement teams, and the public.</p>
</div>`
      },
      {
        id: "benefits-of-accreditation",
        title: "The Benefits of Accreditation",
        content: `<p>Achieving Earned Recognition status delivers tangible operational, commercial, and reputational advantages that compound over time. The benefits fall into three categories: enforcement relief, market access, and operational efficiency.</p>

<h3>Enforcement Relief</h3>
<p><strong>Reduced roadside interruptions.</strong> ER-accredited vehicles are flagged in the DVSA's system. When an officer checks the VRM, the system indicates the operator's ER status. While this is not an absolute exemption, in practice ER operators experience significantly fewer targeted stops — meaning better delivery reliability and fewer driver delays.</p>

<p><strong>Exemption from frequent site visits.</strong> DVSA enforcement staff are instructed to deprioritise ER operators for routine site visits and audits. Your team can focus on operations rather than preparing for unannounced inspections.</p>

<h3>Commercial and Market Access</h3>
<p><strong>The Earned Recognition marque.</strong> Accredited operators receive the official ER marque, which can be used on websites, marketing materials, tenders, and business correspondence (though not on vehicles themselves). This is a DVSA-endorsed quality signal that carries significant weight with sophisticated procurement teams.</p>

<p><strong>Competitive advantage in tendering.</strong> High-value contracts — particularly in government, infrastructure, and regulated industries — increasingly require or strongly prefer ER-accredited operators. Projects such as HS2, London Power Tunnels, Thames Tideway, and major local authority contracts have all included ER as a tender evaluation criterion. Accreditation opens doors that are closed to non-accredited operators.</p>

<p><strong>Direct DVSA access.</strong> ER operators are assigned a dedicated DVSA Business Manager — a named individual who provides direct support and compliance advice. This relationship is invaluable when navigating complex regulatory questions or managing isolated compliance issues before they escalate.</p>

<h3>Operational Efficiency</h3>
<p>The data infrastructure required for Earned Recognition — validated digital maintenance records, automated KPI tracking, real-time defect management — also makes your operation measurably more efficient. Operators who pursue ER typically report reduced vehicle downtime, faster defect resolution, and improved driver accountability as by-products of the accreditation process.</p>

<div class="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
<p class="font-semibold text-green-900 mb-2">TitanFleet Insight</p>
<p class="text-green-800">Operators using TitanFleet's Earned Recognition Dashboard report that the accreditation process identified process gaps they were unaware of — gaps that, if found during a DVSA audit, could have put their O-licence at risk. The preparation is as valuable as the accreditation itself.</p>
</div>`
      },
      {
        id: "how-to-get-accredited",
        title: "How to Get Accredited: Step-by-Step",
        content: `<p>The path to Earned Recognition is structured and sequential. Each step builds on the last, and the DVSA expects operators to demonstrate a genuine track record of compliance rather than a compliance exercise conducted purely for the application. The five steps below reflect the actual process as described by the DVSA on GOV.UK.</p>

<h3>Step 1: Eligibility Check</h3>
<p>Before applying, you must confirm that your operation meets the baseline eligibility requirements:</p>
<ul>
<li>You hold a valid HGV or PSV operator's licence and have held it for <strong>at least 2 years</strong>.</li>
<li>The Traffic Commissioner has not taken any regulatory action against your licence beyond a formal warning in the <strong>last 2 years</strong>. This includes licence curtailment, suspension, revocation, or a public inquiry finding against you.</li>
<li>You have — or are prepared to implement — a <strong>DVSA-validated IT system</strong> for vehicle maintenance and drivers' hours monitoring. Not all software qualifies. The system must meet the DVSA's data specification requirements.</li>
</ul>

<h3>Step 2: The Self-Assessment</h3>
<p>Before submission, you must complete the self-assessment checklist available on GOV.UK. This assessment covers the DVSA's <strong>10 core audit standards</strong>, which include:</p>
<ul>
<li>Documented maintenance schedules and safety inspection frequencies</li>
<li>Defect reporting and rectification procedures</li>
<li>Driver licence and CPC checking procedures</li>
<li>Tachograph management (downloads, calibration, analysis)</li>
<li>Driver briefing and training records</li>
<li>Load security procedures</li>
<li>Sub-contractor management (where applicable)</li>
</ul>
<p>The self-assessment is not just a form — it is a genuine review of your systems. Operators who rush it typically fail the subsequent audit. Use the process to identify and close genuine gaps before applying.</p>

<h3>Step 3: Application Submission</h3>
<p>Once confident in your compliance position, submit form <strong>DVSAER01</strong> through GOV.UK. You will need to provide:</p>
<ul>
<li>Entity details and all operator licence numbers to be included in the scheme.</li>
<li><strong>Three reporting periods</strong> (12 weeks) of KPI reports generated by your validated IT system, demonstrating consistent performance against the M1–M5 vehicle maintenance KPIs and the drivers' hours KPIs.</li>
<li>Raw drivers' hours data for the same periods, in the format specified by the DVSA.</li>
</ul>
<p>The DVSA will review your submission and determine whether to proceed to the formal audit stage. Applications with inconsistent KPI data or gaps in record-keeping are typically rejected at this stage.</p>

<h3>Step 4: The Formal Audit</h3>
<p>If your application is accepted, you must book an audit with a <strong>DVSA-accredited third-party auditor</strong> within three months of receiving approval to proceed. The auditor will:</p>
<ul>
<li>Verify your documented maintenance processes against the 10 audit standards.</li>
<li>Check a sample of vehicles in your fleet for roadworthiness.</li>
<li>Confirm that your digital systems are recording data accurately and in the required format.</li>
<li>Review driver records, including licence checks, CPC records, and tachograph downloads.</li>
</ul>
<p>Auditors issue a report to the DVSA. If the audit is passed, the DVSA will formally notify you of your Earned Recognition status and add your business to the published operator list.</p>

<h3>Step 5: Continuous Monitoring</h3>
<p>Earned Recognition is not a one-time achievement — it is a continuous commitment. Once accredited, your validated IT system reports to the DVSA automatically <strong>every four weeks</strong>. The DVSA reviews these reports and classifies your status as:</p>
<ul>
<li><strong>Green:</strong> KPIs consistently met. Minimal enforcement attention.</li>
<li><strong>Amber:</strong> KPI thresholds close to breach. The DVSA may make contact. The operator should self-correct.</li>
<li><strong>Red:</strong> KPI thresholds breached. The DVSA will investigate. Repeated red ratings risk removal from the scheme.</li>
</ul>

<div class="bg-amber-50 border border-amber-200 rounded-xl p-6 my-6">
<p class="font-semibold text-amber-900 mb-2">Important</p>
<p class="text-amber-800">Earned Recognition status can be withdrawn at any time if KPIs are not maintained or if a serious compliance event occurs (such as a DVSA prohibition or Traffic Commissioner action). Withdrawal is not just a loss of the accreditation — it is a flag to enforcement agencies that the operator's self-assessment was inaccurate, which can trigger increased scrutiny.</p>
</div>`
      },
      {
        id: "understanding-the-kpis",
        title: "Understanding the KPIs",
        content: `<p>The DVSA Earned Recognition scheme monitors two categories of Key Performance Indicators: vehicle maintenance KPIs and drivers' hours KPIs. These are not aspirational targets — they are minimum performance thresholds. Breaching them puts your ER status at risk.</p>

<p>The KPIs are calculated over 13 reporting periods per year (four-weekly), using data exported automatically from your validated IT system. The DVSA does not accept manually compiled reports — the data must come directly from a system that meets the DVSA's technical specification.</p>

<p>Understanding each KPI in detail — and knowing what operational failures cause them to slip — is essential both for achieving accreditation and for maintaining it long-term.</p>`
      },
      {
        id: "vehicle-maintenance-kpis",
        title: "Vehicle Maintenance KPIs",
        content: `<p>The DVSA monitors five vehicle maintenance KPIs, designated M1 through M5. Each measures a different aspect of your maintenance system's effectiveness.</p>

<h3>M1 — Safety Inspections Completed on Time</h3>
<p>Measures the percentage of scheduled safety inspections completed within the ISO week in which they fall due. A safety inspection is due when the vehicle reaches the interval specified in your maintenance schedule (typically every 6–8 weeks for HGVs). Late inspections — even by one day into the following ISO week — count as a failure against M1.</p>
<p><strong>Why it matters:</strong> M1 is the primary indicator of maintenance discipline. Operators who consistently miss inspection windows are, by definition, operating vehicles whose roadworthiness has not been verified for longer than their own schedule requires.</p>

<h3>M2 — Safety-Related Defects Addressed Immediately</h3>
<p>Measures the percentage of safety-related defects identified during inspections or walkaround checks that are addressed (repaired or the vehicle taken off-road) without delay. A safety-related defect is any defect that affects the vehicle's roadworthiness — brake failure, tyre damage, steering defects, and lighting failures are common examples.</p>
<p><strong>Why it matters:</strong> Delayed resolution of safety-related defects is the DVSA's single greatest concern. A vehicle with a known safety defect continuing in service is not just an M2 failure — it is a potential prohibition offence and, in the event of an accident, evidence of negligence.</p>

<h3>M3 — Inspections Completed Within Tolerance</h3>
<p>Similar to M1, but measures inspections completed within a defined tolerance window around the due date. M3 catches operators who are consistently running late on inspections but not so late as to breach the ISO week threshold. It is a leading indicator that M1 is likely to deteriorate without intervention.</p>

<h3>M4 — Driver-Reported Defects Tracked and Resolved</h3>
<p>Measures the percentage of defects reported by drivers during walkaround checks that are properly logged in the maintenance system and resolved within the required timescale. This KPI specifically validates the integrity of the driver-to-maintenance feedback loop. If drivers report defects verbally or on paper but these are not transferred to the digital system, M4 will slip.</p>
<p><strong>Why it matters:</strong> The DVSA views driver-reported defect management as a fundamental maintenance system requirement. An operator who cannot demonstrate that driver-reported defects are systematically captured and resolved does not have a robust maintenance system — regardless of how well the scheduled inspections score.</p>

<h3>M5 — MOT First-Time Pass Rate</h3>
<p>Measures the percentage of vehicles in your fleet that pass their Annual Test (MOT) on the first attempt. Vehicles that require a retest — due to defects identified at the test station — count as failures against M5. A high M5 rate demonstrates that your maintenance system is effective at identifying and resolving defects before they are found by a tester.</p>
<p><strong>Why it matters:</strong> An MOT failure is evidence that a vehicle had a defect that should have been identified and corrected during routine maintenance. High retest rates signal systematic maintenance failures, not isolated incidents.</p>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">TitanFleet Tracks All Five KPIs Automatically</p>
<p class="text-blue-800">TitanFleet's Earned Recognition Dashboard calculates M1–M5 in real time from your inspection and defect data. Each reporting period's performance is displayed in a traffic-light format so you can identify deterioration weeks before the four-weekly DVSA report is generated. <a href="/solutions/fleet-compliance-software" class="underline font-medium">Learn more about TitanFleet's compliance features</a>.</p>
</div>`
      },
      {
        id: "drivers-hours-kpis",
        title: "Drivers' Hours KPIs",
        content: `<p>The drivers' hours KPIs measure compliance with EU drivers' hours rules (EC 561/2006, retained in UK law), Working Time Regulations, and tachograph management requirements. These KPIs are calculated from tachograph data downloaded from vehicle units and driver cards.</p>

<h3>Driving Time Compliance</h3>
<p>Measures the percentage of journeys where drivers do not exceed the maximum daily driving time (9 hours, extendable to 10 hours twice per week) and the maximum weekly driving time (56 hours, with a two-week limit of 90 hours). Infringements — recorded by the tachograph and analysed by the system — count against this KPI.</p>

<h3>Rest Period Compliance</h3>
<p>Measures adherence to minimum daily rest requirements (11 hours, reducible to 9 hours no more than three times between weekly rests) and weekly rest requirements (45 hours, reducible to 24 hours with compensatory rest). Split daily rest rules are also tracked.</p>

<h3>Break Compliance</h3>
<p>Measures adherence to the mandatory 45-minute break after 4.5 hours of driving (which may be split into 15 minutes followed by 30 minutes). Violations of the break requirement are "Most Serious Infringements" (MSIs) under EU rules and carry the highest weighting in the KPI calculation.</p>

<h3>Most Serious Infringements (MSIs)</h3>
<p>The DVSA specifically tracks MSIs — the most severe category of drivers' hours violations — as a separate metric within the drivers' hours KPIs. An excessive number of MSIs, even if the operator is technically meeting the headline KPI thresholds, can trigger DVSA attention. MSIs include: exceeding maximum driving time by more than 25%, insufficient daily rest, and falsification of records.</p>

<h3>Unaccounted Mileage</h3>
<p>Measures the gap between vehicle odometer readings and the mileage accounted for in tachograph records. Significant unaccounted mileage suggests that the vehicle is being driven in modes that are not being properly recorded — either accidentally (incorrect mode selection) or deliberately (attempting to circumvent hours rules).</p>

<div class="bg-amber-50 border border-amber-200 rounded-xl p-6 my-6">
<p class="font-semibold text-amber-900 mb-2">Tachograph Downloads</p>
<p class="text-amber-800">Drivers' hours KPIs can only be calculated accurately if tachograph data is downloaded on schedule — vehicle units every 90 days, driver cards every 28 days. Gaps in download data create gaps in KPI calculations, which the DVSA treats as a process failure, not a data issue. Automated download reminders are essential.</p>
</div>`
      },
      {
        id: "how-titanfleet-supports-er",
        title: "How TitanFleet Supports Earned Recognition Status",
        content: `<p>TitanFleet is designed to bridge the gap between standard O-licence compliance and Earned Recognition excellence. The platform automates the data collection, KPI calculation, and reporting processes that are the most time-consuming aspects of maintaining ER status.</p>

<h3>1. Automated KPI Tracking</h3>
<p>TitanFleet's <strong>Earned Recognition Dashboard</strong> provides a real-time, traffic-light view of your M1–M5 vehicle maintenance KPIs and drivers' hours KPIs. The dashboard tracks all 13 four-weekly reporting periods annually, calculating performance automatically from your inspection and tachograph data. You see your KPI position today — not in four weeks when the DVSA report is generated.</p>

<h3>2. Paperless Maintenance Records</h3>
<p>The system digitises walkaround checks and safety inspections. When a driver identifies a defect on the TitanFleet mobile app, it is instantly logged with a timestamp, GPS coordinates, photo evidence, and the driver's digital signature. This creates the precise audit trail the DVSA demands — immutable, time-stamped, and immediately visible to the transport manager.</p>
<p>Auto-VOR (Vehicle Off Road) triggers automatically when a safety check fails, removing the vehicle from service without requiring a manual management decision. This directly supports M2 KPI performance by eliminating the risk of a safety-related defect being overlooked while the vehicle continues operating.</p>

<h3>3. Proactive Alerts and Reminders</h3>
<p>TitanFleet monitors every compliance deadline and sends automated alerts before thresholds are breached. MOT due dates, safety inspection windows, tachograph download deadlines, and CPC training requirements all generate proactive notifications. You receive the alert in time to act — not after the breach has been recorded. This is the operational difference between consistently green KPIs and the amber alerts that bring the DVSA's Business Manager to your inbox.</p>

<h3>4. Seamless Data Reporting</h3>
<p>When it is time to report to the DVSA, TitanFleet generates the required KPI reports in the pre-configured format specified by the scheme. This eliminates manual data entry, eliminates the risk of transcription errors, and ensures you never miss a reporting deadline. The data is extracted directly from the operational system — the same data your team uses daily — so there is no discrepancy between what you report and what your operation actually achieves.</p>

<h3>5. Drivers' Hours Compliance Engine</h3>
<p>TitanFleet's rules engine calculates daily driving time, rest periods, breaks, and MSIs for every driver in your fleet. Infringements are flagged immediately when tachograph data is processed — giving transport managers the opportunity to investigate and address patterns before they accumulate into a KPI breach. The 14-hour spread-over warning is surfaced to drivers in real time during their shift.</p>

<h3>6. Support for High-Value Contract Modules</h3>
<p>TitanFleet is built to handle the additional module requirements for operators competing for HS2, TfL, Network Rail, and other major infrastructure contracts. These contracts require extended compliance reporting, enhanced driver vetting records, and specific documentation formats — all of which can be configured within the platform.</p>

<div class="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
<p class="font-semibold text-green-900 mb-2">Built for Earned Recognition</p>
<p class="text-green-800">TitanFleet's data architecture was designed with DVSA Earned Recognition in mind. The system captures every data point required for ER reporting as a by-product of normal operations — no additional data entry, no separate compliance process. <a href="/solutions/fleet-compliance-software" class="underline font-medium">See how TitanFleet supports ER accreditation</a>.</p>
</div>`
      },
      {
        id: "standard-vs-earned-recognition",
        title: "Standard vs Earned Recognition Operator",
        content: `<p>The table below summarises the practical differences between operating as a standard O-licence holder and operating as a DVSA Earned Recognition operator. The differences are not marginal — they represent a fundamentally different relationship with the regulator and the market.</p>

<div class="overflow-x-auto my-6">
<table class="w-full text-sm border-collapse">
<thead>
<tr class="bg-[#0f172a] text-white">
<th class="text-left px-4 py-3 rounded-tl-lg">Feature</th>
<th class="text-left px-4 py-3">Standard Operator</th>
<th class="text-left px-4 py-3 rounded-tr-lg">Earned Recognition Operator</th>
</tr>
</thead>
<tbody>
<tr class="border-b border-slate-100">
<td class="px-4 py-3 font-medium text-slate-900">Roadside checks</td>
<td class="px-4 py-3 text-slate-600">Random, high frequency</td>
<td class="px-4 py-3 text-emerald-700 font-medium">Very low frequency — deprioritised by DVSA</td>
</tr>
<tr class="border-b border-slate-100 bg-slate-50">
<td class="px-4 py-3 font-medium text-slate-900">DVSA site visits</td>
<td class="px-4 py-3 text-slate-600">Periodic or targeted</td>
<td class="px-4 py-3 text-emerald-700 font-medium">Exceptionally rare</td>
</tr>
<tr class="border-b border-slate-100">
<td class="px-4 py-3 font-medium text-slate-900">Compliance reporting</td>
<td class="px-4 py-3 text-slate-600">Manual, on-demand</td>
<td class="px-4 py-3 text-emerald-700 font-medium">Automated every 4 weeks</td>
</tr>
<tr class="border-b border-slate-100 bg-slate-50">
<td class="px-4 py-3 font-medium text-slate-900">IT systems required</td>
<td class="px-4 py-3 text-slate-600">Paper or basic digital</td>
<td class="px-4 py-3 text-emerald-700 font-medium">DVSA-validated digital system</td>
</tr>
<tr class="border-b border-slate-100">
<td class="px-4 py-3 font-medium text-slate-900">Market status</td>
<td class="px-4 py-3 text-slate-600">General operator</td>
<td class="px-4 py-3 text-emerald-700 font-medium">Exemplary / preferred contractor</td>
</tr>
<tr class="border-b border-slate-100 bg-slate-50">
<td class="px-4 py-3 font-medium text-slate-900">DVSA relationship</td>
<td class="px-4 py-3 text-slate-600">Enforcement-based</td>
<td class="px-4 py-3 text-emerald-700 font-medium">Dedicated Business Manager</td>
</tr>
<tr class="border-b border-slate-100">
<td class="px-4 py-3 font-medium text-slate-900">High-value contracts</td>
<td class="px-4 py-3 text-slate-600">Often excluded or deprioritised</td>
<td class="px-4 py-3 text-emerald-700 font-medium">ER status frequently required (HS2, TfL, etc.)</td>
</tr>
<tr class="bg-slate-50">
<td class="px-4 py-3 font-medium text-slate-900">Published status</td>
<td class="px-4 py-3 text-slate-600">No public listing</td>
<td class="px-4 py-3 text-emerald-700 font-medium">Listed on GOV.UK as an exemplary operator</td>
</tr>
</tbody>
</table>
</div>

<p>Earned Recognition is not simply a compliance exercise — it is a strategic business decision. The operators who achieve ER status are not doing so to reduce roadside stops alone. They are doing it because it signals to every client, every procurement team, and every enforcement officer that their operation meets the highest standards the DVSA can certify.</p>

<p>For operators with ambitions to grow — whether into new geographic markets, larger contract values, or regulated sectors — Earned Recognition is the foundation on which that growth should be built.</p>

<div class="bg-[#0f172a] text-white rounded-xl p-6 my-6">
<p class="font-semibold text-white mb-2">Ready to Start Your Earned Recognition Journey?</p>
<p class="text-slate-300 mb-4">TitanFleet is built to support every step of the Earned Recognition process — from the self-assessment through to continuous four-weekly reporting. Book a demonstration to see the Earned Recognition Dashboard in action.</p>
<a href="/manager/login" class="inline-block bg-[#2563eb] text-white font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-blue-600 transition-colors">See TitanFleet in Action</a>
</div>`
      },
    ],
    relatedArticles: [
      { title: "Complete DVSA Compliance Guide", href: "/guides/dvsa-compliance-guide", type: "guide" },
      { title: "Fleet Maintenance Best Practices", href: "/guides/fleet-maintenance-guide", type: "guide" },
      { title: "Transport Manager Responsibilities", href: "/resources/transport-manager-responsibilities", type: "article" },
    ],
    relatedProducts: [
      { title: "Fleet Compliance Software", href: "/solutions/fleet-compliance-software", type: "product" },
      { title: "Fleet Management Software UK", href: "/solutions/fleet-management-software-uk", type: "product" },
      { title: "DVSA Walkaround Check App", href: "/solutions/dvsa-walkaround-check-app", type: "product" },
    ],
  },
];

function GuideContent({ guide }: { guide: Guide }) {
  useEffect(() => {
    document.title = guide.metaTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', guide.metaDescription);
    else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = guide.metaDescription;
      document.head.appendChild(meta);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', guide.metaTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', guide.metaDescription);
    window.scrollTo(0, 0);
    return () => { document.title = "Titan Fleet Management"; };
  }, [guide]);

  return (
    <>
      <section className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-4">
            <BookOpen className="h-4 w-4" />
            <span>Comprehensive Guide</span>
            <span className="text-slate-500">•</span>
            <Clock className="h-4 w-4" />
            <span>{guide.readingTime}</span>
            <span className="text-slate-500">•</span>
            <span>Updated {guide.lastUpdated}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold leading-tight mb-6" data-testid="text-guide-title">
            {guide.title}
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed" data-testid="text-guide-excerpt">
            {guide.excerpt}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-24">
              <h3 className="font-bold text-[#0f172a] mb-4 text-sm uppercase tracking-wider">Contents</h3>
              <nav className="space-y-2">
                {guide.tableOfContents.map((item, i) => (
                  <a
                    key={i}
                    href={`#${guide.sections[i]?.id || ''}`}
                    className="block text-sm text-slate-500 hover:text-[#2563eb] transition-colors py-1"
                    data-testid={`link-toc-${i}`}
                  >
                    {item}
                  </a>
                ))}
              </nav>

              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-semibold text-[#0f172a] text-sm mb-3">Related Solutions</h4>
                <div className="space-y-2">
                  {guide.relatedProducts.map((link, i) => (
                    <Link key={i} href={link.href}>
                      <span className="flex items-center gap-1 text-sm text-[#2563eb] hover:underline cursor-pointer" data-testid={`link-product-${i}`}>
                        <ArrowRight className="h-3 w-3" /> {link.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-semibold text-[#0f172a] text-sm mb-3">Related Articles</h4>
                <div className="space-y-2">
                  {guide.relatedArticles.map((link, i) => (
                    <Link key={i} href={link.href}>
                      <span className="flex items-center gap-1 text-sm text-slate-600 hover:text-[#2563eb] hover:underline cursor-pointer" data-testid={`link-article-${i}`}>
                        <ArrowRight className="h-3 w-3" /> {link.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <article className="flex-1 min-w-0">
            {guide.sections.map((section) => (
              <div key={section.id} id={section.id} className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#0f172a] mb-4">{section.title}</h2>
                <div
                  className="prose prose-slate max-w-none prose-headings:text-[#0f172a] prose-a:text-[#2563eb] prose-a:no-underline hover:prose-a:underline prose-li:text-slate-600 prose-p:text-slate-600 prose-p:leading-relaxed prose-td:text-slate-600 prose-th:text-[#0f172a]"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </div>
            ))}

            <div className="mt-16 p-8 bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl text-white text-center">
              <h3 className="text-2xl font-bold mb-3">Ready to Digitise Your Fleet Compliance?</h3>
              <p className="text-slate-300 mb-6">TitanFleet gives transport managers a single platform for DVSA compliance, inspections, defect management, and fleet tracking.</p>
              <Link href="/demo">
                <span className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold px-8 py-4 rounded-xl transition-colors cursor-pointer" data-testid="button-guide-cta">
                  Request a Demo <ArrowRight className="h-5 w-5" />
                </span>
              </Link>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}

function GuidesIndex() {
  useEffect(() => {
    document.title = "Guides | Titan Fleet — UK Fleet Compliance Guides";
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a] mb-4 text-center" data-testid="text-guides-title">Fleet Compliance Guides</h1>
        <p className="text-slate-500 text-center mb-12 text-lg max-w-2xl mx-auto">
          In-depth guides covering every aspect of UK fleet compliance. Written by transport professionals for transport managers.
        </p>
        <div className="space-y-6">
          {guides.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`}>
              <div className="border border-slate-200 rounded-2xl p-8 hover:border-[#2563eb] hover:shadow-lg transition-all cursor-pointer group" data-testid={`card-guide-${g.slug}`}>
                <div className="flex items-center gap-3 text-slate-400 text-sm mb-3">
                  <BookOpen className="h-4 w-4" />
                  <span>Comprehensive Guide</span>
                  <span>•</span>
                  <Clock className="h-4 w-4" />
                  <span>{g.readingTime}</span>
                  <span>•</span>
                  <span>Updated {g.lastUpdated}</span>
                </div>
                <h2 className="text-xl font-bold text-[#0f172a] mb-3 group-hover:text-[#2563eb] transition-colors">{g.title}</h2>
                <p className="text-slate-500 text-[15px] leading-relaxed mb-4">{g.excerpt}</p>
                <span className="inline-flex items-center gap-1 text-[#2563eb] text-sm font-medium">
                  Read the full guide <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Guides() {
  const [, params] = useRoute("/guides/:slug");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const guide = params?.slug ? guides.find(g => g.slug === params.slug) : null;

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
              <Link href="/"><span className="text-slate-600 hover:text-[#0f172a] transition-colors text-sm font-medium cursor-pointer">Home</span></Link>
              <Link href="/guides"><span className="text-[#2563eb] font-medium text-sm cursor-pointer" data-testid="link-nav-guides">Guides</span></Link>
              <Link href="/resources"><span className="text-slate-600 hover:text-[#0f172a] transition-colors text-sm font-medium cursor-pointer">Resources</span></Link>
              <Link href="/solutions"><span className="text-slate-600 hover:text-[#0f172a] transition-colors text-sm font-medium cursor-pointer">Solutions</span></Link>
              <Link href="/blog"><span className="text-slate-600 hover:text-[#0f172a] transition-colors text-sm font-medium cursor-pointer">Blog</span></Link>
            </nav>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors" data-testid="button-mobile-menu">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Home</span></Link>
              <Link href="/guides" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-[#2563eb] bg-blue-50 font-medium text-sm cursor-pointer">Guides</span></Link>
              <Link href="/resources" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Resources</span></Link>
              <Link href="/solutions" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Solutions</span></Link>
              <Link href="/blog" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Blog</span></Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {guide ? <GuideContent guide={guide} /> : <GuidesIndex />}
      </main>

      <footer className="bg-[#0f172a] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xl font-bold">Titan</span>
              <span className="text-xl text-slate-400 ml-1">Fleet</span>
              <p className="text-slate-400 text-sm mt-2">Built by a Class 1 Driver. Trusted by UK Operators.</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/titan.fleet" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="https://www.facebook.com/people/Titan-Fleet/61586509495375/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Facebook className="h-5 w-5" /></a>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Titan Fleet. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export { guides };
