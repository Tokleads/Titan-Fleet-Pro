import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowRight,
  Clock,
  Menu,
  X,
  Instagram,
  Facebook,
  FileText,
  BookOpen,
} from "lucide-react";

interface ResourceArticle {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  readingTime: string;
  lastUpdated: string;
  parentGuide: { title: string; href: string };
  content: string;
  relatedProducts: { title: string; href: string }[];
  relatedArticles: { title: string; href: string }[];
}

const articles: ResourceArticle[] = [
  {
    slug: "dvsa-walkaround-checklist",
    title: "DVSA Walkaround Check Checklist: Complete Reference for 2026",
    metaTitle: "DVSA Walkaround Check Checklist 2026 | Free Download | TitanFleet",
    metaDescription: "Complete DVSA walkaround check checklist for HGVs and commercial vehicles. Covers all inspection areas with pass/fail criteria. Use digitally or print. Updated 2026.",
    excerpt: "A comprehensive walkaround check checklist aligned with DVSA guidance. Covers every inspection area for HGVs, rigid vehicles, and articulated units. Use this as a reference alongside your daily inspections.",
    readingTime: "8 min read",
    lastUpdated: "March 2026",
    parentGuide: { title: "HGV Walkaround Check Guide", href: "/guides/hgv-walkaround-check-guide" },
    content: `<p>This checklist is based on the DVSA's recommended walkaround check procedure. It covers all the areas a driver should inspect before taking a commercial vehicle on the road. Use it as a training tool, a reference, or a basis for your own digital or paper inspection process.</p>

<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Part of a Larger Guide</p>
<p class="text-blue-800">This checklist supports our comprehensive <a href="/guides/hgv-walkaround-check-guide" class="underline font-medium">HGV Walkaround Check Guide</a>, which covers why checks matter, how to conduct them, recording methods, and what to do when defects are found.</p>
</div>

<h2>Pre-Start Cab Checks</h2>
<table class="w-full border-collapse my-4">
<thead><tr class="bg-slate-100"><th class="border border-slate-200 px-4 py-3 text-left w-1/2">Item</th><th class="border border-slate-200 px-4 py-3 text-left">What to Check</th></tr></thead>
<tbody>
<tr><td class="border border-slate-200 px-4 py-3">Dashboard warning lights</td><td class="border border-slate-200 px-4 py-3">No warning lights illuminated after engine start</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Air pressure</td><td class="border border-slate-200 px-4 py-3">Builds to operating pressure, no excessive drop with brake applied</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Mirrors</td><td class="border border-slate-200 px-4 py-3">All mirrors present, clean, correctly adjusted, no damage</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Windscreen</td><td class="border border-slate-200 px-4 py-3">No significant chips/cracks in swept area, clean</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Wipers and washers</td><td class="border border-slate-200 px-4 py-3">Functioning correctly, adequate washer fluid</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Horn</td><td class="border border-slate-200 px-4 py-3">Functioning correctly</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Seat belt</td><td class="border border-slate-200 px-4 py-3">Present, functioning, not damaged</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Cab security</td><td class="border border-slate-200 px-4 py-3">Doors close and latch properly, steps secure</td></tr>
</tbody>
</table>

<h2>Front of Vehicle</h2>
<table class="w-full border-collapse my-4">
<thead><tr class="bg-slate-100"><th class="border border-slate-200 px-4 py-3 text-left w-1/2">Item</th><th class="border border-slate-200 px-4 py-3 text-left">What to Check</th></tr></thead>
<tbody>
<tr><td class="border border-slate-200 px-4 py-3">Headlights</td><td class="border border-slate-200 px-4 py-3">Both working (dip and main beam), lenses clean and intact</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Front indicators</td><td class="border border-slate-200 px-4 py-3">Both working, lenses undamaged, correct colour</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Front fog lights</td><td class="border border-slate-200 px-4 py-3">Working (where fitted), lenses intact</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Number plate</td><td class="border border-slate-200 px-4 py-3">Clean, legible, correctly illuminated, securely fixed</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Bumper</td><td class="border border-slate-200 px-4 py-3">Securely attached, no sharp edges or damage</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Fluid leaks</td><td class="border border-slate-200 px-4 py-3">No visible leaks underneath (oil, coolant, fuel, hydraulic fluid)</td></tr>
</tbody>
</table>

<h2>Nearside (Left/Passenger Side)</h2>
<table class="w-full border-collapse my-4">
<thead><tr class="bg-slate-100"><th class="border border-slate-200 px-4 py-3 text-left w-1/2">Item</th><th class="border border-slate-200 px-4 py-3 text-left">What to Check</th></tr></thead>
<tbody>
<tr><td class="border border-slate-200 px-4 py-3">Front tyre</td><td class="border border-slate-200 px-4 py-3">Tread depth min 1mm across central 3/4, no cuts, bulges, or damage. Correct inflation</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Front wheel</td><td class="border border-slate-200 px-4 py-3">All nuts present and tight, no signs of movement (rust trails)</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Rear tyres (inner and outer)</td><td class="border border-slate-200 px-4 py-3">Same checks as front. Check between dual tyres for trapped debris</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Rear wheels</td><td class="border border-slate-200 px-4 py-3">All nuts present and tight, no movement signs</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Side markers and indicators</td><td class="border border-slate-200 px-4 py-3">All functioning, lenses intact</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Side guards</td><td class="border border-slate-200 px-4 py-3">Present, securely attached, not damaged</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Fuel and AdBlue caps</td><td class="border border-slate-200 px-4 py-3">Secure, no leaks</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Battery compartment</td><td class="border border-slate-200 px-4 py-3">Cover secure, no visible corrosion or damage</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Mud flaps/spray suppression</td><td class="border border-slate-200 px-4 py-3">Present and secure</td></tr>
</tbody>
</table>

<h2>Rear of Vehicle</h2>
<table class="w-full border-collapse my-4">
<thead><tr class="bg-slate-100"><th class="border border-slate-200 px-4 py-3 text-left w-1/2">Item</th><th class="border border-slate-200 px-4 py-3 text-left">What to Check</th></tr></thead>
<tbody>
<tr><td class="border border-slate-200 px-4 py-3">Rear lights</td><td class="border border-slate-200 px-4 py-3">Both working, lenses clean and intact</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Brake lights</td><td class="border border-slate-200 px-4 py-3">Both working</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Rear indicators</td><td class="border border-slate-200 px-4 py-3">Both working, correct colour</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Reversing lights</td><td class="border border-slate-200 px-4 py-3">Working (where fitted)</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Rear fog lights</td><td class="border border-slate-200 px-4 py-3">Working</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Number plate and light</td><td class="border border-slate-200 px-4 py-3">Clean, legible, properly illuminated</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Rear reflective plates</td><td class="border border-slate-200 px-4 py-3">Present, clean, correct type for vehicle</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Rear underrun protection</td><td class="border border-slate-200 px-4 py-3">Securely attached, no significant damage</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Doors/curtains/tail lift</td><td class="border border-slate-200 px-4 py-3">Closing properly, latches secure, tail lift operating correctly</td></tr>
</tbody>
</table>

<h2>Offside (Right/Driver Side)</h2>
<p>Repeat the same tyre, wheel, light, and side guard checks as the nearside. Additionally check:</p>
<table class="w-full border-collapse my-4">
<thead><tr class="bg-slate-100"><th class="border border-slate-200 px-4 py-3 text-left w-1/2">Item</th><th class="border border-slate-200 px-4 py-3 text-left">What to Check</th></tr></thead>
<tbody>
<tr><td class="border border-slate-200 px-4 py-3">Exhaust system</td><td class="border border-slate-200 px-4 py-3">Securely mounted, no excessive noise or visible damage, no excessive smoke</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Suspension</td><td class="border border-slate-200 px-4 py-3">No visible damage to air bags, springs, or shock absorbers. No air leaks</td></tr>
</tbody>
</table>

<h2>Coupling Equipment (Articulated Vehicles Only)</h2>
<table class="w-full border-collapse my-4">
<thead><tr class="bg-slate-100"><th class="border border-slate-200 px-4 py-3 text-left w-1/2">Item</th><th class="border border-slate-200 px-4 py-3 text-left">What to Check</th></tr></thead>
<tbody>
<tr><td class="border border-slate-200 px-4 py-3">Fifth wheel</td><td class="border border-slate-200 px-4 py-3">Properly greased, locking mechanism fully engaged, mounting bolts secure</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Kingpin</td><td class="border border-slate-200 px-4 py-3">Visible check that kingpin is properly seated in fifth wheel jaw</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Airlines (red and yellow)</td><td class="border border-slate-200 px-4 py-3">Connected correctly, no leaks, not rubbing on any surfaces</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Electrical connections (suzi cables)</td><td class="border border-slate-200 px-4 py-3">Connected, no damage to cables or connectors</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Landing legs</td><td class="border border-slate-200 px-4 py-3">Fully raised, handle stowed</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Trailer brake test</td><td class="border border-slate-200 px-4 py-3">Apply trailer brake, gently pull away to confirm engagement</td></tr>
</tbody>
</table>

<h2>Final Checks</h2>
<table class="w-full border-collapse my-4">
<thead><tr class="bg-slate-100"><th class="border border-slate-200 px-4 py-3 text-left w-1/2">Item</th><th class="border border-slate-200 px-4 py-3 text-left">What to Check</th></tr></thead>
<tbody>
<tr><td class="border border-slate-200 px-4 py-3">Service brake</td><td class="border border-slate-200 px-4 py-3">Effective when tested (low speed test if possible)</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Parking brake</td><td class="border border-slate-200 px-4 py-3">Holds vehicle on slope/incline</td></tr>
<tr><td class="border border-slate-200 px-4 py-3">Steering</td><td class="border border-slate-200 px-4 py-3">No excessive free play, power steering operating</td></tr>
<tr class="bg-slate-50"><td class="border border-slate-200 px-4 py-3">Load security (if loaded)</td><td class="border border-slate-200 px-4 py-3">Load properly secured, not exceeding weight limits, load distribution appropriate</td></tr>
</tbody>
</table>

<h2>What to Do if You Find a Defect</h2>
<p>If any check item fails, the response depends on severity:</p>
<ul>
<li><strong>Safety-critical defect</strong> (brakes, tyres, coupling) — do not drive the vehicle. Report immediately to your transport manager.</li>
<li><strong>Major defect</strong> (single light failure, cracked mirror) — report before driving. The transport manager decides whether the vehicle can complete its planned journey.</li>
<li><strong>Minor defect</strong> (cosmetic damage, minor issues) — report for scheduling. The vehicle can continue to operate.</li>
</ul>

<p>Whatever the severity, always report defects through your company's defect reporting process. Never ignore a defect, even a minor one — it could worsen during the day.</p>

<div class="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
<p class="font-semibold text-green-900 mb-2">Go Digital</p>
<p class="text-green-800">TitanFleet's <a href="/solutions/dvsa-walkaround-check-app" class="underline font-medium">DVSA Walkaround Check App</a> turns this checklist into a guided digital inspection. Drivers complete checks on their phone, attach photos, and submit in under 3 minutes. Any defects are automatically reported to the transport manager and triaged by AI. <a href="/demo" class="underline font-medium">Request a demo</a>.</p>
</div>`,
    relatedProducts: [
      { title: "DVSA Walkaround Check App", href: "/solutions/dvsa-walkaround-check-app" },
      { title: "Driver Defect Reporting App", href: "/solutions/driver-defect-reporting-app" },
      { title: "Fleet Compliance Software", href: "/solutions/fleet-compliance-software" },
    ],
    relatedArticles: [
      { title: "HGV Walkaround Check Guide", href: "/guides/hgv-walkaround-check-guide" },
      { title: "Driver Defect Reporting Guide", href: "/resources/driver-defect-reporting-guide" },
      { title: "How to Prepare for a DVSA Audit", href: "/resources/prepare-for-dvsa-audit" },
    ],
  },
  {
    slug: "transport-manager-responsibilities",
    title: "Transport Manager Responsibilities: A Complete Breakdown",
    metaTitle: "Transport Manager Responsibilities UK 2026 | Complete Guide | TitanFleet",
    metaDescription: "Complete breakdown of UK transport manager responsibilities. Covers O-licence duties, compliance management, driver oversight, and how to demonstrate continuous and effective control.",
    excerpt: "What UK transport managers are legally responsible for, how to demonstrate 'continuous and effective' management, and practical advice for managing compliance alongside daily operations.",
    readingTime: "10 min read",
    lastUpdated: "March 2026",
    parentGuide: { title: "DVSA Compliance Guide", href: "/guides/dvsa-compliance-guide" },
    content: `<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Part of a Larger Guide</p>
<p class="text-blue-800">This article supports our comprehensive <a href="/guides/dvsa-compliance-guide" class="underline font-medium">DVSA Compliance Guide</a> and <a href="/guides/transport-manager-compliance-guide" class="underline font-medium">Transport Manager Compliance Guide</a>.</p>
</div>

<h2>The Legal Position</h2>
<p>The transport manager nominated on an O-licence has a legal duty to exercise "continuous and effective" management of the transport operation. This phrase comes directly from EU regulation (retained in UK law) and is the standard against which the Traffic Commissioner will assess your performance.</p>

<p>"Continuous" means you are actively involved in managing the operation on an ongoing basis — not just occasionally reviewing records. "Effective" means your management actually achieves compliance outcomes — it is not enough to have systems in place if those systems are not working.</p>

<h2>Core Responsibilities</h2>

<h3>Vehicle Maintenance Oversight</h3>
<ul>
<li>Ensuring all vehicles have a planned preventative maintenance schedule</li>
<li>Monitoring walkaround check completion rates</li>
<li>Reviewing defect reports and ensuring timely resolution</li>
<li>Tracking MOT and tax expiry dates</li>
<li>Maintaining complete maintenance records for at least 15 months</li>
<li>Liaising with workshops on repair quality and timescales</li>
</ul>

<h3>Driver Management</h3>
<ul>
<li>Verifying driver licences are valid and appropriate for the vehicles they drive</li>
<li>Monitoring Driver CPC validity and planning periodic training</li>
<li>Overseeing driver hours compliance and tachograph data analysis</li>
<li>Ensuring drivers understand and follow walkaround check and defect reporting procedures</li>
<li>Addressing driver non-compliance promptly</li>
</ul>

<h3>Compliance Administration</h3>
<ul>
<li>Downloading tachograph data (vehicle units every 90 days, driver cards every 28 days)</li>
<li>Analysing driver hours data for infringements</li>
<li>Maintaining operator licence conditions and notifying the Traffic Commissioner of changes within 28 days</li>
<li>Preparing for and managing DVSA audits</li>
<li>Keeping up to date with regulatory changes</li>
</ul>

<h2>Demonstrating Continuous and Effective Management</h2>
<p>If called to a public inquiry, the Traffic Commissioner will look for evidence that the transport manager is genuinely managing the operation. Evidence that supports this includes:</p>
<ul>
<li>Regular documented reviews of compliance data (weekly/monthly)</li>
<li>Personal involvement in maintenance decisions</li>
<li>Driver meetings and documented training sessions</li>
<li>Signed-off inspection reports and defect resolutions</li>
<li>Dashboard access logs showing regular use of compliance systems</li>
<li>Personal presence at the operating centre (not just remote oversight)</li>
</ul>

<h3>External Transport Managers</h3>
<p>If you use an external transport manager (not employed by your company), the Traffic Commissioner will scrutinise the arrangement closely. The external TM must:</p>
<ul>
<li>Have a written contract specifying their responsibilities</li>
<li>Spend sufficient time at the operating centre (DVSA guidance suggests at least 2-4 hours per week for a small fleet)</li>
<li>Have genuine authority to make compliance decisions</li>
<li>Not be named on too many other O-licences (the TC may question whether they can provide continuous and effective management to multiple operators)</li>
</ul>

<h2>Common Transport Manager Failures</h2>
<ol>
<li><strong>Delegating without oversight</strong> — you can delegate tasks but not responsibility. If a clerk downloads tachograph data but nobody analyses it, that is a TM failure.</li>
<li><strong>Not reviewing data</strong> — having a system that generates compliance reports is not enough. You need to review them and act on findings.</li>
<li><strong>Ignoring patterns</strong> — if the same vehicle has repeated defects or the same driver consistently has hours infringements, the TM should be intervening.</li>
<li><strong>Inadequate documentation</strong> — if you cannot show evidence of your management activities, the TC will assume they did not happen.</li>
<li><strong>Reactive rather than proactive</strong> — waiting for DVSA to find problems rather than identifying and fixing them yourself.</li>
</ol>

<div class="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
<p class="font-semibold text-green-900 mb-2">TitanFleet for Transport Managers</p>
<p class="text-green-800">TitanFleet's compliance dashboard gives transport managers the real-time visibility they need to demonstrate continuous and effective management. Inspection rates, defect resolution times, MOT status, and fleet health metrics — all accessible from one dashboard. <a href="/solutions/fleet-management-software-uk" class="underline font-medium">Learn more</a> or <a href="/demo" class="underline font-medium">request a demo</a>.</p>
</div>`,
    relatedProducts: [
      { title: "Fleet Management Software UK", href: "/solutions/fleet-management-software-uk" },
      { title: "Fleet Compliance Software", href: "/solutions/fleet-compliance-software" },
    ],
    relatedArticles: [
      { title: "DVSA Compliance Guide", href: "/guides/dvsa-compliance-guide" },
      { title: "Transport Manager Compliance Guide", href: "/guides/transport-manager-compliance-guide" },
      { title: "How to Prepare for a DVSA Audit", href: "/resources/prepare-for-dvsa-audit" },
    ],
  },
  {
    slug: "prepare-for-dvsa-audit",
    title: "How Transport Managers Prepare for DVSA Audits",
    metaTitle: "How to Prepare for a DVSA Audit 2026 | Step-by-Step | TitanFleet",
    metaDescription: "Step-by-step guide to preparing for a DVSA audit. Covers what auditors check, records you need, common failures, and how to be permanently audit-ready. Updated 2026.",
    excerpt: "A practical step-by-step guide to DVSA audit preparation. What the auditors check, what records you need, the most common failures operators face, and how to be permanently audit-ready.",
    readingTime: "9 min read",
    lastUpdated: "March 2026",
    parentGuide: { title: "DVSA Compliance Guide", href: "/guides/dvsa-compliance-guide" },
    content: `<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Part of a Larger Guide</p>
<p class="text-blue-800">This article supports our comprehensive <a href="/guides/dvsa-compliance-guide" class="underline font-medium">DVSA Compliance Guide</a>, which covers all areas of fleet compliance in detail.</p>
</div>

<h2>What Is a DVSA Audit?</h2>
<p>A DVSA audit (also called a compliance investigation or maintenance investigation) is a formal review of your operation's compliance with O-licence conditions and road transport regulations. Audits can be announced (you receive notice) or unannounced (DVSA arrives without warning). Both types cover the same areas.</p>

<p>The audit typically reviews the previous 15 months of operation. A DVSA examiner will visit your operating centre and examine your records, systems, and processes. The outcome can range from a satisfactory rating (no action required) to referral to the Traffic Commissioner for regulatory action.</p>

<h2>What DVSA Auditors Examine</h2>

<h3>1. Maintenance Records</h3>
<ul>
<li>Daily walkaround check records — completeness and consistency</li>
<li>Safety inspection (PMI) reports — have inspections been conducted at the declared intervals?</li>
<li>Defect reports — are defects being reported, and more importantly, are they being resolved?</li>
<li>Defect resolution evidence — invoices, work orders, or notes showing what was done to fix each defect</li>
<li>Maintenance planning — evidence of a planned system, not ad-hoc maintenance</li>
</ul>

<h3>2. Driver Hours and Tachograph Records</h3>
<ul>
<li>Vehicle unit downloads — have they been downloaded at least every 90 days?</li>
<li>Driver card downloads — at least every 28 days?</li>
<li>Infringement analysis — has the operator analysed the data and addressed infringements?</li>
<li>Driver debriefs — is there evidence that drivers have been spoken to about infringements?</li>
</ul>

<h3>3. Driver Records</h3>
<ul>
<li>Licence checks — evidence of regular verification that drivers hold valid licences</li>
<li>CPC status — confirmation all professional drivers have valid CPC qualifications</li>
<li>Training records — evidence of driver training, particularly around walkaround checks and defect reporting</li>
</ul>

<h3>4. Vehicle Records</h3>
<ul>
<li>MOT certificates for all vehicles</li>
<li>Vehicle registration documents</li>
<li>Plating certificates (for HGVs)</li>
<li>Evidence of calibration for digital tachographs</li>
</ul>

<h3>5. Management Systems</h3>
<ul>
<li>Evidence of transport manager involvement in compliance decisions</li>
<li>Compliance monitoring procedures (what you review and how often)</li>
<li>Corrective action processes (how you address compliance failures)</li>
</ul>

<h2>Most Common Audit Failures</h2>
<ol>
<li><strong>Incomplete walkaround check records</strong> — gaps in the record, particularly for weekends or holiday cover</li>
<li><strong>Overdue tachograph downloads</strong> — vehicle units or driver cards not downloaded within required timescales</li>
<li><strong>Unresolved defects</strong> — defects reported but no evidence of repair</li>
<li><strong>No infringement analysis</strong> — tachograph data downloaded but never analysed</li>
<li><strong>Expired driver CPC</strong> — professional drivers operating without valid CPC</li>
<li><strong>Missing PMI records</strong> — planned inspections not conducted on schedule</li>
</ol>

<h2>How to Be Permanently Audit-Ready</h2>
<p>The most effective approach is not to prepare for audits — it is to maintain your compliance systems so that an audit at any time would find you in order. This means:</p>
<ol>
<li><strong>Use a digital compliance system</strong> — digital records cannot be lost, are automatically timestamped, and can be compiled into audit reports instantly</li>
<li><strong>Review compliance weekly</strong> — spend 30 minutes each week reviewing your compliance dashboard, addressing any issues, and documenting your review</li>
<li><strong>Address issues immediately</strong> — do not let compliance gaps accumulate. A defect reported last week but still unresolved this week is a growing risk</li>
<li><strong>Maintain a compliance calendar</strong> — MOT dates, PMI schedules, tachograph download due dates, CPC expiry dates all in one view</li>
<li><strong>Train and retrain drivers</strong> — annual refresher training on walkaround checks and defect reporting</li>
</ol>

<div class="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
<p class="font-semibold text-green-900 mb-2">Audit-Ready with TitanFleet</p>
<p class="text-green-800">TitanFleet's <a href="/solutions/fleet-compliance-software" class="underline font-medium">compliance dashboard</a> keeps you permanently audit-ready. Inspection records, defect histories, MOT status, and fleet health metrics are all available instantly as PDF reports. <a href="/demo" class="underline font-medium">Request a demo</a>.</p>
</div>`,
    relatedProducts: [
      { title: "Fleet Compliance Software", href: "/solutions/fleet-compliance-software" },
      { title: "DVSA Walkaround Check App", href: "/solutions/dvsa-walkaround-check-app" },
    ],
    relatedArticles: [
      { title: "DVSA Compliance Guide", href: "/guides/dvsa-compliance-guide" },
      { title: "Transport Manager Responsibilities", href: "/resources/transport-manager-responsibilities" },
      { title: "DVSA Walkaround Check Checklist", href: "/resources/dvsa-walkaround-checklist" },
    ],
  },
  {
    slug: "driver-defect-reporting-guide",
    title: "Driver Defect Reporting: Best Practices for UK Fleets",
    metaTitle: "Driver Defect Reporting Guide 2026 | Best Practices | TitanFleet",
    metaDescription: "Best practices for driver defect reporting in UK fleets. Covers what to report, severity categories, escalation processes, and the benefits of digital defect reporting. Updated 2026.",
    excerpt: "Best practices for driver defect reporting — what to report, how to categorise severity, how to ensure defects are escalated and resolved, and why digital reporting is replacing paper.",
    readingTime: "7 min read",
    lastUpdated: "March 2026",
    parentGuide: { title: "Fleet Maintenance Guide", href: "/guides/fleet-maintenance-guide" },
    content: `<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Part of a Larger Guide</p>
<p class="text-blue-800">This article supports our <a href="/guides/fleet-maintenance-guide" class="underline font-medium">Fleet Maintenance Guide</a> and <a href="/guides/hgv-walkaround-check-guide" class="underline font-medium">HGV Walkaround Check Guide</a>.</p>
</div>

<h2>Why Defect Reporting Matters</h2>
<p>The DVSA expects every fleet operator to have a clear process for drivers to report vehicle defects. This is not a suggestion — it is a fundamental part of maintaining your O-licence. At any DVSA audit, the examiner will look at your defect reports and, critically, the evidence that defects were resolved.</p>

<p>A fleet with no defect reports is more suspicious than a fleet with many. No defects suggests either that vehicles are not being inspected properly or that drivers are not reporting what they find. Both are serious compliance failures.</p>

<h2>What Drivers Should Report</h2>
<p>Drivers should report any vehicle issue that could affect safety, roadworthiness, or legal compliance. This includes:</p>
<ul>
<li>Any defect found during a walkaround check</li>
<li>Any issue that develops during a journey (new noise, warning light, handling change)</li>
<li>Any damage sustained during the shift</li>
<li>Any fluid leak or loss noticed during operation</li>
<li>Any concern about a vehicle system, even if the driver is unsure whether it constitutes a defect</li>
</ul>

<p>The rule for drivers is simple: if in doubt, report it. It is better to report something that turns out to be nothing than to miss a genuine defect.</p>

<h2>Defect Severity Categories</h2>
<p>Categorising defect severity helps transport managers prioritise response. The DVSA's Guide to Roadworthiness provides a framework for categorisation:</p>

<h3>Safety-Critical (Immediate)</h3>
<p>The vehicle must not be driven. Examples:</p>
<ul>
<li>Brake system failure or significant brake defect</li>
<li>Major tyre damage (cuts to cords, bulges, blowout)</li>
<li>Steering defect affecting control</li>
<li>Insecure coupling on articulated vehicle</li>
<li>Chassis or structural failure</li>
</ul>

<h3>Major (Resolve Before Next Use)</h3>
<p>The vehicle should complete its current journey but not be used again until repaired:</p>
<ul>
<li>Failed headlight or multiple rear light failures</li>
<li>Cracked or missing mirror</li>
<li>Significant fluid leak</li>
<li>Worn tyres approaching legal minimum</li>
<li>Warning light indicating potential system failure</li>
</ul>

<h3>Minor (Schedule for Repair)</h3>
<p>The vehicle can continue to operate but the defect should be repaired at the next scheduled opportunity:</p>
<ul>
<li>Small bodywork damage not affecting safety</li>
<li>Cosmetic issues</li>
<li>Minor non-safety items</li>
</ul>

<h2>The Defect Reporting Process</h2>
<ol>
<li><strong>Identify</strong> — driver spots a defect during walkaround check or during shift</li>
<li><strong>Report</strong> — driver submits a report with description and photos (if possible)</li>
<li><strong>Categorise</strong> — severity is assessed (ideally automatically using DVSA standards)</li>
<li><strong>Notify</strong> — transport manager is alerted, with priority based on severity</li>
<li><strong>Assign</strong> — defect assigned for repair (in-house or external workshop)</li>
<li><strong>Repair</strong> — work carried out and documented</li>
<li><strong>Verify</strong> — repair confirmed, vehicle returned to service</li>
<li><strong>Record</strong> — complete audit trail maintained</li>
</ol>

<h2>Paper vs Digital Defect Reporting</h2>
<p>Paper defect reporting has a fundamental problem: it relies on the driver physically handing a piece of paper to someone who will act on it. If the driver finishes their shift after the office is closed, or works from a remote location, that handover may not happen for hours or even days.</p>

<p>Digital defect reporting eliminates this delay. A driver submits a defect report on their phone and the transport manager receives it instantly, regardless of time or location. Photos provide immediate visual evidence. AI-powered systems can automatically categorise severity.</p>

<div class="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
<p class="font-semibold text-green-900 mb-2">Digital Defect Reporting with TitanFleet</p>
<p class="text-green-800">TitanFleet's <a href="/solutions/driver-defect-reporting-app" class="underline font-medium">Driver Defect Reporting App</a> lets drivers report defects in under 60 seconds with photos and descriptions. AI automatically categorises severity using the DVSA Guide to Roadworthiness. Defects flow into a Kanban workflow for tracking to resolution. <a href="/demo" class="underline font-medium">Request a demo</a>.</p>
</div>`,
    relatedProducts: [
      { title: "Driver Defect Reporting App", href: "/solutions/driver-defect-reporting-app" },
      { title: "DVSA Walkaround Check App", href: "/solutions/dvsa-walkaround-check-app" },
      { title: "Fleet Maintenance Software", href: "/solutions/fleet-maintenance-software" },
    ],
    relatedArticles: [
      { title: "Fleet Maintenance Guide", href: "/guides/fleet-maintenance-guide" },
      { title: "HGV Walkaround Check Guide", href: "/guides/hgv-walkaround-check-guide" },
      { title: "DVSA Walkaround Check Checklist", href: "/resources/dvsa-walkaround-checklist" },
    ],
  },
  {
    slug: "fleet-maintenance-scheduling",
    title: "Fleet Maintenance Scheduling: A Practical Guide",
    metaTitle: "Fleet Maintenance Scheduling Guide 2026 | PMI Planning | TitanFleet",
    metaDescription: "Practical guide to fleet maintenance scheduling for UK operators. Covers PMI intervals, scheduling strategies, workshop management, and compliance requirements. Updated 2026.",
    excerpt: "How to plan and manage your fleet's preventative maintenance schedule. Covers setting PMI intervals, managing workshop capacity, tracking compliance, and moving from reactive to proactive maintenance.",
    readingTime: "8 min read",
    lastUpdated: "March 2026",
    parentGuide: { title: "Fleet Maintenance Guide", href: "/guides/fleet-maintenance-guide" },
    content: `<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
<p class="font-semibold text-blue-900 mb-2">Part of a Larger Guide</p>
<p class="text-blue-800">This article supports our comprehensive <a href="/guides/fleet-maintenance-guide" class="underline font-medium">Fleet Maintenance Guide</a>, which covers all aspects of fleet maintenance best practices.</p>
</div>

<h2>Why Scheduling Matters</h2>
<p>A planned preventative maintenance (PPM) schedule is a condition of your O-licence. The DVSA expects operators to maintain vehicles at regular intervals and to demonstrate that inspections are being conducted on time. An overdue PMI is a compliance gap that DVSA auditors will identify immediately.</p>

<p>Beyond compliance, proper scheduling reduces costs. Planned maintenance is cheaper than emergency repairs. A scheduled PMI costs a predictable amount. An unplanned roadside breakdown costs £750+ in direct costs plus the indirect costs of missed work, recovery, and customer dissatisfaction.</p>

<h2>Setting PMI Intervals</h2>
<p>The right PMI interval depends on several factors:</p>

<h3>Vehicle Type</h3>
<ul>
<li><strong>HGVs (articulated tractors)</strong>: 4-6 weeks in intensive use, 6-8 weeks in standard use</li>
<li><strong>HGVs (rigid vehicles)</strong>: 6-8 weeks</li>
<li><strong>Trailers</strong>: 8-10 weeks (they cover the same miles but experience less wear on many systems)</li>
<li><strong>Large vans (3.5t+)</strong>: 8-10 weeks</li>
<li><strong>Light commercials (under 3.5t)</strong>: 10-13 weeks</li>
</ul>

<h3>Operating Conditions</h3>
<p>Vehicles in demanding conditions need more frequent inspections:</p>
<ul>
<li>Multi-shift operations (vehicle runs 16+ hours/day) — shorten interval by 25-30%</li>
<li>Off-road or construction use — shorten interval by 30-40%</li>
<li>Short urban delivery routes (frequent braking) — monitor brake wear closely</li>
<li>Long-distance motorway work — standard intervals usually sufficient</li>
</ul>

<h2>Scheduling Strategies</h2>

<h3>Rolling Schedule</h3>
<p>The most common approach: vehicles are scheduled at their declared interval from the date of their last inspection. This spreads the maintenance workload across the calendar. For a fleet of 50 vehicles on a 6-week interval, approximately 8-9 vehicles are due each week.</p>

<h3>Block Schedule</h3>
<p>Groups of vehicles are inspected together. This can be more efficient for workshop planning but creates peaks in workload. Most suitable for fleets with regular downtime periods (weekends, seasonal slowdowns).</p>

<h3>Mileage-Based</h3>
<p>Inspections triggered by mileage rather than time. This ensures vehicles that cover more miles are inspected more frequently. However, it requires reliable mileage tracking and does not guarantee a maximum time between inspections, which DVSA may question.</p>

<h2>Managing Workshop Capacity</h2>
<ul>
<li>Book PMI appointments 2-3 weeks in advance to secure slots</li>
<li>Build in buffer capacity for unplanned repairs — a 100% booked workshop has no space for emergency work</li>
<li>Track PMI pass rates by workshop — a workshop consistently finding problems may be more thorough (which is good) or vehicles may be deteriorating between inspections</li>
<li>Keep a record of workshop costs and quality for annual review</li>
</ul>

<h2>Tracking Compliance</h2>
<p>For every vehicle, you should be able to answer:</p>
<ul>
<li>When was the last PMI?</li>
<li>When is the next PMI due?</li>
<li>Is the vehicle overdue?</li>
<li>What was the outcome of the last inspection?</li>
<li>Are there any outstanding defects?</li>
</ul>

<p>If you cannot answer these questions for every vehicle in your fleet, your scheduling system needs improvement. Digital fleet management platforms make this information available instantly through dashboards and automated alerts.</p>

<div class="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
<p class="font-semibold text-green-900 mb-2">TitanFleet</p>
<p class="text-green-800">TitanFleet tracks MOT dates, inspection histories, and defect status for every vehicle. The compliance dashboard shows fleet-wide maintenance health at a glance. <a href="/solutions/fleet-maintenance-software" class="underline font-medium">Learn more about Fleet Maintenance Software</a> or <a href="/demo" class="underline font-medium">request a demo</a>.</p>
</div>`,
    relatedProducts: [
      { title: "Fleet Maintenance Software", href: "/solutions/fleet-maintenance-software" },
      { title: "Fleet Compliance Software", href: "/solutions/fleet-compliance-software" },
    ],
    relatedArticles: [
      { title: "Fleet Maintenance Guide", href: "/guides/fleet-maintenance-guide" },
      { title: "Driver Defect Reporting Guide", href: "/resources/driver-defect-reporting-guide" },
      { title: "DVSA Walkaround Check Checklist", href: "/resources/dvsa-walkaround-checklist" },
    ],
  },
];

function ArticleContent({ article }: { article: ResourceArticle }) {
  useEffect(() => {
    document.title = article.metaTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', article.metaDescription);
    else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = article.metaDescription;
      document.head.appendChild(meta);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', article.metaTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', article.metaDescription);
    window.scrollTo(0, 0);
    return () => { document.title = "Titan Fleet Management"; };
  }, [article]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <Link href={article.parentGuide.href}>
        <span className="inline-flex items-center gap-1 text-sm text-[#2563eb] hover:underline cursor-pointer mb-6" data-testid="link-parent-guide">
          <BookOpen className="h-4 w-4" /> Part of: {article.parentGuide.title}
        </span>
      </Link>

      <div className="flex items-center gap-3 text-slate-400 text-sm mb-4">
        <FileText className="h-4 w-4" />
        <span>Resource Article</span>
        <span>•</span>
        <Clock className="h-4 w-4" />
        <span>{article.readingTime}</span>
        <span>•</span>
        <span>Updated {article.lastUpdated}</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a] leading-tight mb-6" data-testid="text-article-title">
        {article.title}
      </h1>
      <p className="text-lg text-slate-500 leading-relaxed mb-10">{article.excerpt}</p>

      <article
        className="prose prose-slate max-w-none prose-headings:text-[#0f172a] prose-a:text-[#2563eb] prose-a:no-underline hover:prose-a:underline prose-li:text-slate-600 prose-p:text-slate-600 prose-p:leading-relaxed prose-td:text-slate-600 prose-th:text-[#0f172a]"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <div className="mt-16 grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="font-bold text-[#0f172a] text-sm mb-3">Related Solutions</h3>
          <div className="space-y-2">
            {article.relatedProducts.map((link, i) => (
              <Link key={i} href={link.href}>
                <span className="flex items-center gap-1 text-sm text-[#2563eb] hover:underline cursor-pointer" data-testid={`link-related-product-${i}`}>
                  <ArrowRight className="h-3 w-3" /> {link.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
          <h3 className="font-bold text-[#0f172a] text-sm mb-3">Related Reading</h3>
          <div className="space-y-2">
            {article.relatedArticles.map((link, i) => (
              <Link key={i} href={link.href}>
                <span className="flex items-center gap-1 text-sm text-slate-600 hover:text-[#2563eb] hover:underline cursor-pointer" data-testid={`link-related-article-${i}`}>
                  <ArrowRight className="h-3 w-3" /> {link.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 p-8 bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl text-white text-center">
        <h3 className="text-2xl font-bold mb-3">Ready to Digitise Your Fleet Compliance?</h3>
        <p className="text-slate-300 mb-6">Start your free trial — no setup fees, no contracts.</p>
        <Link href="/demo">
          <span className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold px-8 py-4 rounded-xl transition-colors cursor-pointer" data-testid="button-article-cta">
            Request a Demo <ArrowRight className="h-5 w-5" />
          </span>
        </Link>
      </div>
    </div>
  );
}

function ResourcesIndex() {
  useEffect(() => {
    document.title = "Resources | Titan Fleet — Fleet Compliance Articles";
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a] mb-4 text-center" data-testid="text-resources-title">Fleet Compliance Resources</h1>
        <p className="text-slate-500 text-center mb-6 text-lg max-w-2xl mx-auto">
          Practical articles, checklists, and guides for UK fleet compliance and operations.
        </p>

        <div className="flex justify-center gap-4 mb-12">
          <Link href="/guides">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors cursor-pointer" data-testid="link-view-guides">
              <BookOpen className="h-4 w-4" /> View Comprehensive Guides
            </span>
          </Link>
          <Link href="/solutions">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium text-[#2563eb] transition-colors cursor-pointer" data-testid="link-view-solutions">
              View Solutions
            </span>
          </Link>
        </div>

        <div className="space-y-6">
          {articles.map((a) => (
            <Link key={a.slug} href={`/resources/${a.slug}`}>
              <div className="border border-slate-200 rounded-2xl p-6 hover:border-[#2563eb] hover:shadow-md transition-all cursor-pointer group" data-testid={`card-article-${a.slug}`}>
                <div className="flex items-center gap-3 text-slate-400 text-sm mb-2">
                  <FileText className="h-4 w-4" />
                  <span>{a.readingTime}</span>
                  <span>•</span>
                  <span>Part of: {a.parentGuide.title}</span>
                </div>
                <h2 className="text-lg font-bold text-[#0f172a] mb-2 group-hover:text-[#2563eb] transition-colors">{a.title}</h2>
                <p className="text-slate-500 text-[15px] leading-relaxed mb-3">{a.excerpt}</p>
                <span className="inline-flex items-center gap-1 text-[#2563eb] text-sm font-medium">
                  Read article <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Resources() {
  const [, params] = useRoute("/resources/:slug");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const article = params?.slug ? articles.find(a => a.slug === params.slug) : null;

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
              <Link href="/guides"><span className="text-slate-600 hover:text-[#0f172a] transition-colors text-sm font-medium cursor-pointer">Guides</span></Link>
              <Link href="/resources"><span className="text-[#2563eb] font-medium text-sm cursor-pointer" data-testid="link-nav-resources">Resources</span></Link>
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
              <Link href="/guides" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Guides</span></Link>
              <Link href="/resources" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-[#2563eb] bg-blue-50 font-medium text-sm cursor-pointer">Resources</span></Link>
              <Link href="/solutions" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Solutions</span></Link>
              <Link href="/blog" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Blog</span></Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {article ? <ArticleContent article={article} /> : <ResourcesIndex />}
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

export { articles as resourceArticles };
