import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Download,
  Menu,
  X,
  Instagram,
  Facebook,
  Wrench,
  Calculator,
  Shield,
  Truck,
  BarChart3,
  FileText,
} from "lucide-react";

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors" data-testid="button-faq-toggle">
        <span className="font-semibold text-[#0f172a] text-base pr-4">{q}</span>
        {open ? <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />}
      </button>
      {open && <div className="px-6 pb-5 text-slate-600 leading-relaxed text-[15px]">{a}</div>}
    </div>
  );
}

function WalkaroundCheckGenerator() {
  const [vehicleType, setVehicleType] = useState("hgv-rigid");
  const [includeTrailer, setIncludeTrailer] = useState(false);
  const [includeEndOfShift, setIncludeEndOfShift] = useState(false);
  const [generated, setGenerated] = useState(false);

  const vehicleTypes: Record<string, string> = {
    "hgv-rigid": "HGV (Rigid)",
    "hgv-artic": "HGV (Articulated)",
    "van-large": "Large Van (3.5t+)",
    "van-small": "Small Van (Under 3.5t)",
    "coach": "Coach / Bus",
  };

  const baseChecks = [
    { area: "Cab", items: ["Dashboard warning lights — no warnings illuminated", "Air pressure — builds to operating pressure", "Mirrors — all present, clean, correctly adjusted", "Windscreen — no significant chips/cracks in swept area", "Wipers and washers — functioning, adequate fluid", "Horn — functioning", "Seat belt — present and functioning", "Cab security — doors close properly, steps secure"] },
    { area: "Front", items: ["Headlights — both dip and main beam working", "Front indicators — both functioning, lenses intact", "Number plate — clean, legible, properly illuminated", "Bumper — securely attached, no sharp edges", "Fluid leaks — no oil, coolant, or fuel visible underneath"] },
    { area: "Nearside", items: ["Front tyre — tread depth min 1mm (HGV) / 1.6mm (van), no cuts or bulges", "Front wheel fixings — all nuts present, no movement signs", "Rear tyres — same checks (check between duals for debris)", "Rear wheel fixings — all nuts present and tight", "Side markers and indicators — functioning", "Side guards — present, securely attached", "Fuel and AdBlue caps — secure, no leaks", "Battery compartment — cover secure", "Mud flaps — present and secure"] },
    { area: "Rear", items: ["Rear lights — both working", "Brake lights — both working", "Rear indicators — both working, correct colour", "Reversing lights — working (where fitted)", "Rear fog lights — working", "Number plate light — illuminating plate", "Rear reflective plates — present, clean, correct type", "Rear underrun protection — securely attached", "Doors/curtains/tail lift — closing properly, latches secure"] },
    { area: "Offside", items: ["Tyres — same checks as nearside", "Wheels — same checks as nearside", "Exhaust — securely mounted, no excessive noise or smoke", "Suspension — no visible damage, no air leaks", "Side lights and indicators — functioning"] },
    { area: "Final Checks", items: ["Service brake — effective", "Parking brake — holds vehicle", "Steering — no excessive free play", "Load security (if loaded) — properly secured, within weight limits"] },
  ];

  const trailerChecks = { area: "Coupling & Trailer", items: ["Fifth wheel — properly greased, locking mechanism engaged", "Kingpin — visible, correctly seated in jaw", "Airlines (red and yellow) — connected, no leaks", "Electrical connections (suzi cables) — connected, undamaged", "Landing legs — fully raised, handle stowed", "Trailer brake test — apply trailer brake, confirm engagement", "Trailer tyres and wheels — all checks as per tractor unit", "Trailer lights — all functioning via tractor connection"] };

  const endOfShiftChecks = { area: "End-of-Shift", items: ["Walk around for new damage sustained during shift", "Check for fluid leaks developed during operation", "Note any warning lights that appeared during driving", "Check tyre condition after day's driving", "Report any handling changes noticed during shift", "Confirm load area is empty/secure for next driver"] };

  const getChecklist = () => {
    const list = [...baseChecks];
    if (vehicleType === "hgv-artic" || includeTrailer) list.push(trailerChecks);
    if (includeEndOfShift) list.push(endOfShiftChecks);
    if (vehicleType === "van-small") {
      return list.map(section => ({
        ...section,
        items: section.items.filter(item => !item.includes("Side guards") && !item.includes("AdBlue") && !item.includes("Air pressure"))
      }));
    }
    return list;
  };

  const handleDownload = () => {
    const checklist = getChecklist();
    let text = `DVSA WALKAROUND CHECK CHECKLIST\nVehicle Type: ${vehicleTypes[vehicleType]}\nGenerated by TitanFleet (titanfleet.co.uk)\n${"=".repeat(60)}\n\n`;
    text += `Date: ________________  Driver: ________________\nRegistration: ________________  Odometer: ________________\n\n`;
    checklist.forEach(section => {
      text += `\n--- ${section.area.toUpperCase()} ---\n`;
      section.items.forEach(item => { text += `[ ] ${item}\n`; });
    });
    text += `\n${"=".repeat(60)}\nDriver Signature: ________________  Time: ________________\n\nDefects Found (describe below):\n${"_".repeat(60)}\n${"_".repeat(60)}\n${"_".repeat(60)}\n\n---\nManage walkaround checks digitally with TitanFleet\nhttps://titanfleet.co.uk/solutions/dvsa-walkaround-check-app\n`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dvsa-walkaround-checklist-${vehicleType}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a] mb-4" data-testid="text-tool-title">DVSA Walkaround Check Generator</h1>
        <p className="text-slate-500 text-lg mb-8 leading-relaxed">Generate a custom vehicle inspection checklist aligned with DVSA walkaround check guidance. Select your vehicle type, choose your options, and download a ready-to-use checklist.</p>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-10">
          <h2 className="font-bold text-[#0f172a] text-xl mb-6">Configure Your Checklist</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Type</label>
              <select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent" data-testid="select-vehicle-type">
                {Object.entries(vehicleTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={includeTrailer} onChange={e => setIncludeTrailer(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]" data-testid="checkbox-trailer" />
                <span className="text-slate-700">Include trailer coupling checks</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={includeEndOfShift} onChange={e => setIncludeEndOfShift(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]" data-testid="checkbox-end-shift" />
                <span className="text-slate-700">Include end-of-shift inspection items</span>
              </label>
            </div>
            <button onClick={() => setGenerated(true)} className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-4 rounded-xl transition-colors" data-testid="button-generate">
              Generate Checklist
            </button>
          </div>
        </div>

        {generated && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-[#0f172a] text-xl">Your Checklist — {vehicleTypes[vehicleType]}</h2>
              <button onClick={handleDownload} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm" data-testid="button-download">
                <Download className="h-4 w-4" /> Download
              </button>
            </div>
            {getChecklist().map((section, i) => (
              <div key={i} className="mb-6">
                <h3 className="font-bold text-[#0f172a] text-lg mb-3 flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-[#2563eb]" /> {section.area}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, j) => (
                    <label key={j} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer group" data-testid={`check-item-${i}-${j}`}>
                      <input type="checkbox" className="w-5 h-5 mt-0.5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 shrink-0" />
                      <span className="text-slate-600 text-[15px] group-hover:text-slate-800">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
              <p className="font-semibold text-blue-900 mb-2">Go Digital with TitanFleet</p>
              <p className="text-blue-800 text-sm mb-4">Replace paper checklists with TitanFleet's digital walkaround check app. Drivers complete checks on their phone with photo evidence, instant defect alerts, and automatic PDF reports.</p>
              <Link href="/solutions/dvsa-walkaround-check-app"><span className="inline-flex items-center gap-1 text-[#2563eb] font-medium text-sm hover:underline cursor-pointer">Learn more about TitanFleet's Walkaround Check App <ArrowRight className="h-4 w-4" /></span></Link>
            </div>
          </div>
        )}

        <div className="prose prose-slate max-w-none mb-12">
          <h2 className="text-2xl font-bold text-[#0f172a]">About This Tool</h2>
          <p className="text-slate-600 leading-relaxed">This walkaround check generator creates a DVSA-aligned vehicle inspection checklist tailored to your vehicle type. The checklist follows the inspection areas recommended in the DVSA's Guide to Maintaining Roadworthiness.</p>
          <p className="text-slate-600 leading-relaxed">Daily walkaround checks are a fundamental part of fleet compliance. DVSA data shows that 43% of prohibition notices relate to defects that should have been caught during a walkaround check. Using a structured checklist ensures drivers cover every area consistently.</p>
          <p className="text-slate-600 leading-relaxed">While paper checklists are accepted by DVSA, digital walkaround check systems provide timestamped records, photo evidence, and automatic defect escalation — creating a significantly stronger audit trail.</p>
        </div>

        <div className="space-y-3 mb-12">
          <h2 className="text-2xl font-bold text-[#0f172a] mb-6">Frequently Asked Questions</h2>
          <FAQ q="Is this checklist DVSA compliant?" a="This checklist is aligned with the inspection areas recommended by the DVSA. It covers all the key areas a driver should check before taking a commercial vehicle on the road. However, operators should review and adapt any checklist to suit their specific vehicles and operations." />
          <FAQ q="Can I customise the checklist?" a="Yes — you can select your vehicle type, add trailer checks, and include end-of-shift items. The generated checklist adapts to your selections. For fully customisable digital checklists, see TitanFleet's walkaround check app." />
          <FAQ q="Should I use paper or digital walkaround checks?" a="While paper checks are acceptable, the DVSA recommends digital systems because they provide timestamped, evidenced records that cannot be lost or backdated. Digital systems also automatically escalate defects to the transport manager." />
          <FAQ q="How often should walkaround checks be done?" a="A walkaround check should be completed before every journey, or at the start of every shift if the vehicle is used throughout the day. The DVSA expects this as part of your maintenance system." />
        </div>
      </div>
    </div>
  );
}

function MaintenanceScheduleCalculator() {
  const [fleetSize, setFleetSize] = useState(10);
  const [vehicleType, setVehicleType] = useState("hgv");
  const [avgMileage, setAvgMileage] = useState(2000);
  const [calculated, setCalculated] = useState(false);

  const intervals: Record<string, { weeks: number; label: string }> = {
    hgv: { weeks: 6, label: "HGV (6-week interval)" },
    "hgv-intensive": { weeks: 4, label: "HGV Intensive Use (4-week interval)" },
    trailer: { weeks: 8, label: "Trailer (8-week interval)" },
    "van-large": { weeks: 8, label: "Large Van 3.5t+ (8-week interval)" },
    "van-small": { weeks: 12, label: "Light Commercial (12-week interval)" },
  };

  const selected = intervals[vehicleType];
  const inspectionsPerYear = Math.ceil(52 / selected.weeks);
  const totalInspections = inspectionsPerYear * fleetSize;
  const inspectionsPerWeek = Math.ceil(totalInspections / 52);
  const annualMileage = avgMileage * 52;
  const mileageBetweenPMI = avgMileage * selected.weeks;

  const generateSchedule = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const schedule = [];
    for (let v = 1; v <= Math.min(fleetSize, 12); v++) {
      const offset = Math.floor(((v - 1) * selected.weeks) / (fleetSize > 1 ? fleetSize - 1 || 1 : 1) * fleetSize) % 12;
      const pmiMonths = [];
      let month = (offset) % 12;
      for (let i = 0; i < inspectionsPerYear && i < 12; i++) {
        pmiMonths.push(months[month % 12]);
        month += Math.ceil(selected.weeks / 4.33);
      }
      schedule.push({ vehicle: `Vehicle ${v}`, months: pmiMonths.slice(0, 6) });
    }
    return schedule;
  };

  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a] mb-4" data-testid="text-tool-title">Fleet Maintenance Schedule Calculator</h1>
        <p className="text-slate-500 text-lg mb-8 leading-relaxed">Calculate the recommended preventative maintenance inspection (PMI) schedule for your fleet. Enter your fleet details to see inspection intervals, annual totals, and workshop capacity requirements.</p>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-10">
          <h2 className="font-bold text-[#0f172a] text-xl mb-6">Enter Fleet Details</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Type</label>
              <select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 bg-white focus:ring-2 focus:ring-[#2563eb]" data-testid="select-vehicle-type">
                {Object.entries(intervals).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fleet Size (number of vehicles)</label>
              <input type="number" min="1" max="500" value={fleetSize} onChange={e => setFleetSize(parseInt(e.target.value) || 1)} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-[#2563eb]" data-testid="input-fleet-size" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Average Weekly Mileage per Vehicle</label>
              <input type="number" min="100" max="10000" value={avgMileage} onChange={e => setAvgMileage(parseInt(e.target.value) || 1000)} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-[#2563eb]" data-testid="input-mileage" />
            </div>
            <button onClick={() => setCalculated(true)} className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-4 rounded-xl transition-colors" data-testid="button-calculate">
              Calculate Schedule
            </button>
          </div>
        </div>

        {calculated && (
          <div className="mb-10">
            <h2 className="font-bold text-[#0f172a] text-xl mb-6">Your Maintenance Schedule</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <p className="text-sm text-blue-600 font-medium">PMI Interval</p>
                <p className="text-2xl font-bold text-[#0f172a]">Every {selected.weeks} weeks</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <p className="text-sm text-blue-600 font-medium">Inspections per Vehicle/Year</p>
                <p className="text-2xl font-bold text-[#0f172a]">{inspectionsPerYear}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                <p className="text-sm text-emerald-600 font-medium">Total Fleet Inspections/Year</p>
                <p className="text-2xl font-bold text-[#0f172a]">{totalInspections}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                <p className="text-sm text-emerald-600 font-medium">Avg. Inspections per Week</p>
                <p className="text-2xl font-bold text-[#0f172a]">{inspectionsPerWeek}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                <p className="text-sm text-slate-500 font-medium">Annual Mileage per Vehicle</p>
                <p className="text-2xl font-bold text-[#0f172a]">{annualMileage.toLocaleString()} miles</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                <p className="text-sm text-slate-500 font-medium">Mileage Between PMIs</p>
                <p className="text-2xl font-bold text-[#0f172a]">{mileageBetweenPMI.toLocaleString()} miles</p>
              </div>
            </div>

            <h3 className="font-bold text-[#0f172a] text-lg mb-4">Sample Rolling Schedule</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-200 px-4 py-3 text-left">Vehicle</th>
                    <th className="border border-slate-200 px-4 py-3 text-left" colSpan={6}>Scheduled PMI Months</th>
                  </tr>
                </thead>
                <tbody>
                  {generateSchedule().map((row, i) => (
                    <tr key={i} className={i % 2 ? "bg-slate-50" : ""}>
                      <td className="border border-slate-200 px-4 py-2 font-medium">{row.vehicle}</td>
                      {row.months.map((m, j) => (
                        <td key={j} className="border border-slate-200 px-4 py-2 text-center text-[#2563eb] font-medium">{m}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {fleetSize > 12 && <p className="text-sm text-slate-400 mt-2">Showing first 12 of {fleetSize} vehicles.</p>}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
              <p className="font-semibold text-blue-900 mb-2">Track Maintenance Automatically</p>
              <p className="text-blue-800 text-sm mb-4">TitanFleet tracks MOT dates, inspection histories, and fleet maintenance health automatically. Get alerts before deadlines and generate audit-ready reports instantly.</p>
              <Link href="/solutions/fleet-maintenance-software"><span className="inline-flex items-center gap-1 text-[#2563eb] font-medium text-sm hover:underline cursor-pointer">Learn more about Fleet Maintenance Software <ArrowRight className="h-4 w-4" /></span></Link>
            </div>
          </div>
        )}

        <div className="prose prose-slate max-w-none mb-12">
          <h2 className="text-2xl font-bold text-[#0f172a]">About This Calculator</h2>
          <p className="text-slate-600 leading-relaxed">This calculator helps transport managers plan their fleet's preventative maintenance inspection schedule. The DVSA expects all operators to have a planned preventative maintenance (PPM) programme as a condition of their O-licence.</p>
          <p className="text-slate-600 leading-relaxed">Inspection intervals vary by vehicle type and usage. HGVs in standard use typically require inspections every 6-8 weeks. Vehicles in intensive use (high mileage, multi-shift operations) may need shorter intervals of 4-6 weeks.</p>
          <p className="text-slate-600 leading-relaxed">A rolling schedule — where vehicles are spread across the calendar — helps manage workshop capacity and avoids peaks in maintenance workload.</p>
        </div>

        <div className="space-y-3 mb-12">
          <h2 className="text-2xl font-bold text-[#0f172a] mb-6">Frequently Asked Questions</h2>
          <FAQ q="How often should commercial vehicles have a PMI?" a="The DVSA recommends inspection intervals of no more than 6-8 weeks for HGVs in standard use. Vehicles in intensive use may need 4-6 week intervals. Trailers typically require inspections every 8-10 weeks." />
          <FAQ q="What is the difference between a PMI and a walkaround check?" a="A walkaround check is a visual inspection done by the driver before each journey. A PMI (Preventative Maintenance Inspection) is a thorough mechanical inspection done by a qualified technician at scheduled intervals." />
          <FAQ q="Can I adjust the inspection interval?" a="Yes. The right interval depends on your specific vehicles, operating conditions, and defect history. If vehicles consistently pass PMIs with no issues, your interval is likely appropriate. If defects are found between inspections, consider shortening the interval." />
        </div>
      </div>
    </div>
  );
}

function ComplianceChecklist() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const categories = [
    {
      title: "Vehicle Maintenance",
      items: [
        "Planned preventative maintenance schedule in place for all vehicles",
        "PMI inspections conducted at declared intervals",
        "Daily walkaround check process established and documented",
        "Walkaround check records retained for minimum 15 months",
        "Defect reporting process in place — drivers know how to report",
        "Defect resolution tracked from report to completion",
        "MOT certificates on file for all vehicles",
        "MOT expiry dates monitored with advance alerts",
        "Vehicle tax current for all vehicles",
        "Tachograph calibration certificates current (every 2 years)",
      ],
    },
    {
      title: "Driver Management",
      items: [
        "All drivers hold valid licences for vehicles they drive",
        "Driver licence checks conducted at regular intervals",
        "All professional drivers hold valid CPC qualifications",
        "CPC expiry dates tracked and training planned in advance",
        "Driver hours compliance monitored",
        "Tachograph data downloaded — vehicle units every 90 days",
        "Tachograph data downloaded — driver cards every 28 days",
        "Driver hours infringements analysed and addressed",
        "Driver training records maintained",
      ],
    },
    {
      title: "Operator Licence Compliance",
      items: [
        "Operating within authorised vehicle numbers",
        "All vehicles operated from authorised operating centres",
        "Transport manager CPC valid and on file",
        "Financial standing evidence available if requested",
        "Traffic Commissioner notified of relevant changes within 28 days",
        "O-licence disc displayed on each vehicle",
      ],
    },
    {
      title: "Record Keeping",
      items: [
        "All maintenance records retained for minimum 15 months",
        "Tachograph records retained for minimum 12 months",
        "Driver records (licences, CPC, training) up to date",
        "Defect report and resolution records complete",
        "Prohibition notices and fixed penalties on file",
        "Previous DVSA audit reports and action plans on file",
      ],
    },
    {
      title: "Management Systems",
      items: [
        "Transport manager has continuous and effective oversight",
        "Regular compliance reviews documented (weekly/monthly)",
        "Corrective action process for compliance failures",
        "Internal audit programme in place (quarterly recommended)",
        "Staff aware of compliance responsibilities",
      ],
    },
  ];

  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);
  const checkedItems = Object.values(checks).filter(Boolean).length;
  const percentage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const toggle = (key: string) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a] mb-4" data-testid="text-tool-title">Operator Licence Compliance Checklist</h1>
        <p className="text-slate-500 text-lg mb-8 leading-relaxed">An interactive compliance checklist covering the key areas DVSA auditors examine. Work through each section to assess your readiness for a DVSA audit or Traffic Commissioner review.</p>

        <div className="sticky top-16 z-10 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-[#0f172a]">Compliance Score</span>
            <span className="text-2xl font-bold text-[#0f172a]">{percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: percentage >= 80 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444' }} />
          </div>
          <p className="text-sm text-slate-500 mt-2">{checkedItems} of {totalItems} items completed</p>
        </div>

        {categories.map((cat, ci) => (
          <div key={ci} className="mb-8">
            <h2 className="font-bold text-[#0f172a] text-xl mb-4 flex items-center gap-2"><Shield className="h-5 w-5 text-[#2563eb]" /> {cat.title}</h2>
            <div className="space-y-2">
              {cat.items.map((item, ii) => {
                const key = `${ci}-${ii}`;
                return (
                  <label key={key} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${checks[key] ? 'bg-emerald-50' : 'hover:bg-slate-50'}`} data-testid={`compliance-${ci}-${ii}`}>
                    <input type="checkbox" checked={!!checks[key]} onChange={() => toggle(key)} className="w-5 h-5 mt-0.5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 shrink-0" />
                    <span className={`text-[15px] ${checks[key] ? 'text-emerald-700 line-through' : 'text-slate-600'}`}>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8 mb-12">
          <p className="font-semibold text-blue-900 mb-2">Automate Your Compliance Tracking</p>
          <p className="text-blue-800 text-sm mb-4">TitanFleet's compliance dashboard tracks these items automatically. MOT status, inspection completion, defect resolution, and driver compliance — all visible in real-time with automated alerts.</p>
          <Link href="/solutions/fleet-compliance-software"><span className="inline-flex items-center gap-1 text-[#2563eb] font-medium text-sm hover:underline cursor-pointer">See Fleet Compliance Software <ArrowRight className="h-4 w-4" /></span></Link>
        </div>

        <div className="prose prose-slate max-w-none mb-12">
          <h2 className="text-2xl font-bold text-[#0f172a]">About This Checklist</h2>
          <p className="text-slate-600 leading-relaxed">This checklist covers the key compliance areas that DVSA auditors examine during a fleet investigation. It is based on the requirements set out in the DVSA Guide to Maintaining Roadworthiness and the conditions attached to standard O-licences.</p>
          <p className="text-slate-600 leading-relaxed">Working through this checklist helps transport managers identify compliance gaps before DVSA does. Areas marked as incomplete should be prioritised for action.</p>
        </div>

        <div className="space-y-3 mb-12">
          <h2 className="text-2xl font-bold text-[#0f172a] mb-6">Frequently Asked Questions</h2>
          <FAQ q="What does DVSA check during an audit?" a="DVSA auditors examine maintenance records (walkaround checks, PMI reports, defect records), driver records (licences, CPC, hours), tachograph compliance, vehicle records (MOT, tax), and your management systems. The audit typically covers the previous 15 months." />
          <FAQ q="How often should I review my compliance?" a="Transport managers should review compliance data at least weekly. A 30-minute weekly review of your compliance dashboard helps catch issues early. Monthly and quarterly reviews should cover broader trends." />
          <FAQ q="What happens if I fail a DVSA audit?" a="The outcome depends on severity. Minor issues result in recommendations. Serious failures can lead to referral to the Traffic Commissioner, who can curtail, suspend, or revoke your O-licence." />
        </div>
      </div>
    </div>
  );
}

function FleetCostCalculator() {
  const [fleetSize, setFleetSize] = useState(20);
  const [avgDowntimeDays, setAvgDowntimeDays] = useState(5);
  const [dailyRevenue, setDailyRevenue] = useState(450);
  const [avgRepairCost, setAvgRepairCost] = useState(750);
  const [breakdownsPerYear, setBreakdownsPerYear] = useState(3);
  const [calculated, setCalculated] = useState(false);

  const totalBreakdowns = fleetSize * breakdownsPerYear;
  const revenueLoss = totalBreakdowns * avgDowntimeDays * dailyRevenue;
  const repairCosts = totalBreakdowns * avgRepairCost;
  const totalCost = revenueLoss + repairCosts;
  const costPerVehicle = Math.round(totalCost / fleetSize);
  const potentialSaving = Math.round(totalCost * 0.35);

  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a] mb-4" data-testid="text-tool-title">Fleet Downtime Cost Calculator</h1>
        <p className="text-slate-500 text-lg mb-8 leading-relaxed">Calculate how much unplanned vehicle downtime costs your fleet annually. See the financial impact of breakdowns and how proactive fleet management can reduce these costs.</p>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-10">
          <h2 className="font-bold text-[#0f172a] text-xl mb-6">Enter Your Fleet Data</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fleet Size</label>
              <input type="number" min="1" max="500" value={fleetSize} onChange={e => setFleetSize(parseInt(e.target.value) || 1)} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-[#2563eb]" data-testid="input-fleet-size" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Average Unplanned Breakdowns per Vehicle/Year</label>
              <input type="number" min="0" max="20" value={breakdownsPerYear} onChange={e => setBreakdownsPerYear(parseInt(e.target.value) || 0)} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-[#2563eb]" data-testid="input-breakdowns" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Average Downtime per Breakdown (days)</label>
              <input type="number" min="1" max="30" value={avgDowntimeDays} onChange={e => setAvgDowntimeDays(parseInt(e.target.value) || 1)} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-[#2563eb]" data-testid="input-downtime" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Daily Revenue per Vehicle (£)</label>
              <input type="number" min="0" max="5000" value={dailyRevenue} onChange={e => setDailyRevenue(parseInt(e.target.value) || 0)} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-[#2563eb]" data-testid="input-revenue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Average Repair Cost per Breakdown (£)</label>
              <input type="number" min="0" max="10000" value={avgRepairCost} onChange={e => setAvgRepairCost(parseInt(e.target.value) || 0)} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-[#2563eb]" data-testid="input-repair-cost" />
            </div>
            <button onClick={() => setCalculated(true)} className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-4 rounded-xl transition-colors" data-testid="button-calculate">
              Calculate Costs
            </button>
          </div>
        </div>

        {calculated && (
          <div className="mb-10">
            <h2 className="font-bold text-[#0f172a] text-xl mb-6">Your Fleet Downtime Costs</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                <p className="text-sm text-red-600 font-medium">Total Annual Downtime Cost</p>
                <p className="text-3xl font-bold text-red-700">£{totalCost.toLocaleString()}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                <p className="text-sm text-amber-600 font-medium">Cost per Vehicle/Year</p>
                <p className="text-3xl font-bold text-amber-700">£{costPerVehicle.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                <p className="text-sm text-slate-500 font-medium">Lost Revenue</p>
                <p className="text-2xl font-bold text-[#0f172a]">£{revenueLoss.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                <p className="text-sm text-slate-500 font-medium">Repair Costs</p>
                <p className="text-2xl font-bold text-[#0f172a]">£{repairCosts.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                <p className="text-sm text-slate-500 font-medium">Total Breakdowns/Year</p>
                <p className="text-2xl font-bold text-[#0f172a]">{totalBreakdowns}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                <p className="text-sm text-emerald-600 font-medium">Potential Saving (35% reduction)</p>
                <p className="text-3xl font-bold text-emerald-700">£{potentialSaving.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <p className="font-semibold text-emerald-900 mb-2">How Digital Inspections Reduce Downtime</p>
              <p className="text-emerald-800 text-sm mb-2">Operators who switch from paper to digital fleet management typically see a 25-40% reduction in unplanned downtime. This comes from:</p>
              <ul className="text-emerald-800 text-sm space-y-1 ml-4 list-disc">
                <li>Earlier defect detection through consistent walkaround checks</li>
                <li>Faster defect resolution through instant reporting and AI triage</li>
                <li>Proactive MOT and service scheduling with automated alerts</li>
                <li>Predictive analytics identifying vehicles at risk before they fail</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-4">
              <p className="font-semibold text-blue-900 mb-2">Reduce Your Downtime Costs</p>
              <p className="text-blue-800 text-sm mb-4">TitanFleet helps transport operators catch defects early, track maintenance proactively, and keep vehicles on the road. At £59/month per vehicle, the system typically pays for itself within weeks.</p>
              <Link href="/solutions/fleet-management-software-uk"><span className="inline-flex items-center gap-1 text-[#2563eb] font-medium text-sm hover:underline cursor-pointer">Learn more about TitanFleet <ArrowRight className="h-4 w-4" /></span></Link>
            </div>
          </div>
        )}

        <div className="prose prose-slate max-w-none mb-12">
          <h2 className="text-2xl font-bold text-[#0f172a]">About This Calculator</h2>
          <p className="text-slate-600 leading-relaxed">This calculator estimates the annual cost of unplanned vehicle downtime for your fleet. It factors in both direct costs (repairs) and indirect costs (lost revenue during downtime).</p>
          <p className="text-slate-600 leading-relaxed">Industry data suggests that the average unplanned breakdown costs £750 in direct repair costs alone. When you add lost revenue from missed deliveries and driver downtime, the true cost is often two to three times higher.</p>
        </div>

        <div className="space-y-3 mb-12">
          <h2 className="text-2xl font-bold text-[#0f172a] mb-6">Frequently Asked Questions</h2>
          <FAQ q="How much does fleet downtime really cost?" a="The direct cost of an unplanned breakdown averages £750 (recovery, roadside repair, parts). The total cost — including lost revenue, missed deliveries, and driver downtime — typically ranges from £1,500 to £3,000 per incident depending on your operation." />
          <FAQ q="How can I reduce unplanned downtime?" a="The most effective approach is proactive fleet management: consistent walkaround checks to catch defects early, planned preventative maintenance at proper intervals, fast defect resolution, and MOT/service scheduling. Digital fleet management tools automate much of this." />
          <FAQ q="What is a good target for fleet availability?" a="Most well-managed fleets aim for 95%+ vehicle availability. This means no more than 1-2 days of unplanned downtime per vehicle per month. Achieving this requires robust maintenance systems and fast defect resolution." />
        </div>
      </div>
    </div>
  );
}

function SoftwareComparison() {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [compared, setCompared] = useState(false);

  const allFeatures = [
    "DVSA walkaround checks",
    "Defect reporting",
    "AI defect triage",
    "GPS tracking",
    "Driver timesheets",
    "MOT tracking (live DVSA data)",
    "Compliance dashboard",
    "Earned Recognition KPIs",
    "Proof of Delivery",
    "Predictive analytics",
    "Driver CPC tracking",
    "Geofencing",
    "Wage calculation & CSV export",
    "Offline mode",
    "No app download required",
    "No hardware required",
  ];

  const platforms: { name: string; features: Record<string, "yes" | "partial" | "no" | "addon"> } = {
    name: "", features: {}
  };

  const platformData = [
    {
      name: "TitanFleet",
      highlight: true,
      price: "£59/mo per vehicle",
      setup: "No setup fee",
      features: Object.fromEntries(allFeatures.map(f => [f, "yes" as const])),
    },
    {
      name: "FleetCheck",
      highlight: false,
      price: "Custom pricing",
      setup: "Setup fee applies",
      features: {
        "DVSA walkaround checks": "yes" as const,
        "Defect reporting": "yes" as const,
        "AI defect triage": "no" as const,
        "GPS tracking": "addon" as const,
        "Driver timesheets": "no" as const,
        "MOT tracking (live DVSA data)": "yes" as const,
        "Compliance dashboard": "yes" as const,
        "Earned Recognition KPIs": "partial" as const,
        "Proof of Delivery": "no" as const,
        "Predictive analytics": "no" as const,
        "Driver CPC tracking": "partial" as const,
        "Geofencing": "addon" as const,
        "Wage calculation & CSV export": "no" as const,
        "Offline mode": "no" as const,
        "No app download required": "no" as const,
        "No hardware required": "yes" as const,
      },
    },
    {
      name: "Webfleet",
      highlight: false,
      price: "Custom pricing",
      setup: "Hardware + setup",
      features: {
        "DVSA walkaround checks": "partial" as const,
        "Defect reporting": "partial" as const,
        "AI defect triage": "no" as const,
        "GPS tracking": "yes" as const,
        "Driver timesheets": "partial" as const,
        "MOT tracking (live DVSA data)": "no" as const,
        "Compliance dashboard": "partial" as const,
        "Earned Recognition KPIs": "no" as const,
        "Proof of Delivery": "addon" as const,
        "Predictive analytics": "partial" as const,
        "Driver CPC tracking": "no" as const,
        "Geofencing": "yes" as const,
        "Wage calculation & CSV export": "no" as const,
        "Offline mode": "partial" as const,
        "No app download required": "no" as const,
        "No hardware required": "no" as const,
      },
    },
  ];

  const toggleFeature = (f: string) => {
    setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const featuresToShow = compared && selectedFeatures.length > 0 ? selectedFeatures : allFeatures;

  const getIcon = (val: "yes" | "partial" | "no" | "addon") => {
    if (val === "yes") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (val === "partial") return <span className="text-amber-500 font-medium text-sm">Partial</span>;
    if (val === "addon") return <span className="text-blue-500 font-medium text-sm">Add-on</span>;
    return <X className="h-5 w-5 text-slate-300" />;
  };

  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a] mb-4" data-testid="text-tool-title">Fleet Software Comparison Tool</h1>
        <p className="text-slate-500 text-lg mb-8 leading-relaxed">Select the features you need and see how leading UK fleet management platforms compare. Find the right software for your fleet operation.</p>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-10">
          <h2 className="font-bold text-[#0f172a] text-xl mb-4">Select Features You Need</h2>
          <p className="text-slate-500 text-sm mb-6">Choose the features that matter most to your operation, then compare platforms.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {allFeatures.map(f => (
              <label key={f} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedFeatures.includes(f) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                <input type="checkbox" checked={selectedFeatures.includes(f)} onChange={() => toggleFeature(f)} className="w-5 h-5 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]" data-testid={`feature-${f.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}`} />
                <span className="text-slate-700 text-sm">{f}</span>
              </label>
            ))}
          </div>
          <button onClick={() => setCompared(true)} className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-4 rounded-xl transition-colors mt-6" data-testid="button-compare">
            Compare Platforms
          </button>
        </div>

        {compared && (
          <div className="mb-10">
            <h2 className="font-bold text-[#0f172a] text-xl mb-6">Comparison Results</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-200 px-4 py-3 text-left">Feature</th>
                    {platformData.map(p => (
                      <th key={p.name} className={`border border-slate-200 px-4 py-3 text-center ${p.highlight ? 'bg-blue-50' : ''}`}>
                        <div className="font-bold">{p.name}</div>
                        <div className="text-xs font-normal text-slate-500 mt-1">{p.price}</div>
                        <div className="text-xs font-normal text-slate-400">{p.setup}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featuresToShow.map((f, i) => (
                    <tr key={f} className={i % 2 ? "bg-slate-50" : ""}>
                      <td className="border border-slate-200 px-4 py-3 font-medium text-slate-700">{f}</td>
                      {platformData.map(p => (
                        <td key={p.name} className={`border border-slate-200 px-4 py-3 text-center ${p.highlight ? 'bg-blue-50/50' : ''}`}>
                          {getIcon(p.features[f] || "no")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedFeatures.length > 0 && (
              <div className="mt-6 grid sm:grid-cols-3 gap-4">
                {platformData.map(p => {
                  const matchCount = selectedFeatures.filter(f => p.features[f] === "yes").length;
                  const pct = Math.round((matchCount / selectedFeatures.length) * 100);
                  return (
                    <div key={p.name} className={`rounded-xl p-5 border ${p.highlight ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                      <p className="font-bold text-[#0f172a] mb-1">{p.name}</p>
                      <p className="text-2xl font-bold" style={{ color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>{pct}% match</p>
                      <p className="text-sm text-slate-500">{matchCount}/{selectedFeatures.length} selected features</p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
              <p className="font-semibold text-blue-900 mb-2">Try TitanFleet Free</p>
              <p className="text-blue-800 text-sm mb-4">TitanFleet includes all features at one price — £59/month per vehicle, no setup fees, no contracts. Start your free trial to see if it is the right fit for your fleet.</p>
              <Link href="/demo"><span className="inline-flex items-center gap-1 text-[#2563eb] font-medium text-sm hover:underline cursor-pointer">Request a Demo <ArrowRight className="h-4 w-4" /></span></Link>
            </div>
          </div>
        )}

        <div className="prose prose-slate max-w-none mb-12">
          <h2 className="text-2xl font-bold text-[#0f172a]">About This Comparison Tool</h2>
          <p className="text-slate-600 leading-relaxed">This tool compares leading UK fleet management platforms based on features relevant to transport operators. Feature availability is based on publicly available information and may change as platforms update their offerings.</p>
          <p className="text-slate-600 leading-relaxed">When choosing fleet management software, consider not just the feature list but also pricing transparency, ease of use for drivers, UK-specific compliance features, and whether the platform requires dedicated hardware.</p>
        </div>

        <div className="space-y-3 mb-12">
          <h2 className="text-2xl font-bold text-[#0f172a] mb-6">Frequently Asked Questions</h2>
          <FAQ q="What is the best fleet management software for UK operators?" a="The best software depends on your specific needs. For UK operators focused on DVSA compliance, look for platforms with DVSA-aligned walkaround checks, live MOT tracking, and Earned Recognition KPIs. TitanFleet is designed specifically for this use case." />
          <FAQ q="Do I need hardware for fleet tracking?" a="Not necessarily. Some platforms like TitanFleet use smartphone-based GPS tracking, which eliminates the need for dedicated hardware. Hardware-based systems may offer additional data (vehicle diagnostics) but come with higher costs." />
          <FAQ q="What should fleet software cost?" a="Pricing varies widely. Some platforms charge per vehicle per month with transparent pricing (e.g., TitanFleet at £59/mo). Others use custom pricing based on fleet size, features, and contract length. Watch for hidden costs like setup fees, hardware, and add-on charges." />
        </div>
      </div>
    </div>
  );
}

const toolDefinitions = [
  {
    slug: "dvsa-walkaround-check-generator",
    title: "DVSA Walkaround Check Generator",
    desc: "Generate a custom DVSA-aligned vehicle inspection checklist. Select your vehicle type, add trailer checks, and download a ready-to-use checklist.",
    icon: "clipboard",
    component: WalkaroundCheckGenerator,
  },
  {
    slug: "fleet-maintenance-schedule-calculator",
    title: "Fleet Maintenance Schedule Calculator",
    desc: "Calculate your fleet's recommended PMI schedule. Enter your fleet details to see inspection intervals, annual totals, and workshop capacity needs.",
    icon: "wrench",
    component: MaintenanceScheduleCalculator,
  },
  {
    slug: "operator-licence-compliance-checklist",
    title: "Operator Licence Compliance Checklist",
    desc: "Interactive compliance checklist covering all the areas DVSA auditors examine. Score your compliance readiness and identify gaps.",
    icon: "shield",
    component: ComplianceChecklist,
  },
  {
    slug: "fleet-cost-calculator",
    title: "Fleet Downtime Cost Calculator",
    desc: "Calculate how much unplanned vehicle downtime costs your fleet annually and see the potential savings from proactive fleet management.",
    icon: "calculator",
    component: FleetCostCalculator,
  },
  {
    slug: "fleet-software-comparison",
    title: "Fleet Software Comparison Tool",
    desc: "Select the features you need and compare leading UK fleet management platforms side by side. Find the right software for your operation.",
    icon: "chart",
    component: SoftwareComparison,
  },
];

const TOOL_ICONS: Record<string, React.ReactNode> = {
  clipboard: <ClipboardCheck className="h-6 w-6" />,
  wrench: <Wrench className="h-6 w-6" />,
  shield: <Shield className="h-6 w-6" />,
  calculator: <Calculator className="h-6 w-6" />,
  chart: <BarChart3 className="h-6 w-6" />,
};

function ToolsIndex() {
  useEffect(() => { document.title = "Free Fleet Tools | Titan Fleet"; }, []);
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a] mb-4 text-center" data-testid="text-tools-title">Free Fleet Management Tools</h1>
        <p className="text-slate-500 text-center mb-12 text-lg max-w-2xl mx-auto">
          Practical tools for UK transport managers. Generate checklists, calculate costs, and assess your compliance — all free.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolDefinitions.map(t => (
            <Link key={t.slug} href={`/tools/${t.slug}`}>
              <div className="border border-slate-200 rounded-2xl p-6 hover:border-[#2563eb] hover:shadow-lg transition-all cursor-pointer group h-full" data-testid={`card-tool-${t.slug}`}>
                <div className="w-12 h-12 rounded-xl bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center mb-4">
                  {TOOL_ICONS[t.icon]}
                </div>
                <h3 className="font-bold text-[#0f172a] text-lg mb-2 group-hover:text-[#2563eb] transition-colors">{t.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{t.desc}</p>
                <span className="inline-flex items-center gap-1 text-[#2563eb] text-sm font-medium">
                  Use tool <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Tools() {
  const [, params] = useRoute("/tools/:slug");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tool = params?.slug ? toolDefinitions.find(t => t.slug === params.slug) : null;
  const ToolComponent = tool?.component;

  useEffect(() => {
    if (tool) {
      document.title = `${tool.title} | Titan Fleet — Free Fleet Tools`;
      window.scrollTo(0, 0);
    }
    return () => { document.title = "Titan Fleet Management"; };
  }, [tool]);

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/"><span className="flex items-center gap-2 cursor-pointer" data-testid="link-home"><span className="text-xl font-bold text-[#0f172a]">Titan</span><span className="text-xl text-slate-500">Fleet</span></span></Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/"><span className="text-slate-600 hover:text-[#0f172a] transition-colors text-sm font-medium cursor-pointer">Home</span></Link>
              <Link href="/tools"><span className="text-[#2563eb] font-medium text-sm cursor-pointer" data-testid="link-nav-tools">Tools</span></Link>
              <Link href="/guides"><span className="text-slate-600 hover:text-[#0f172a] transition-colors text-sm font-medium cursor-pointer">Guides</span></Link>
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
              <Link href="/tools" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-[#2563eb] bg-blue-50 font-medium text-sm cursor-pointer">Tools</span></Link>
              <Link href="/guides" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Guides</span></Link>
              <Link href="/solutions" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Solutions</span></Link>
              <Link href="/blog" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Blog</span></Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {ToolComponent ? <ToolComponent /> : <ToolsIndex />}
      </main>

      <footer className="bg-[#0f172a] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xl font-bold">Titan</span><span className="text-xl text-slate-400 ml-1">Fleet</span>
              <p className="text-slate-400 text-sm mt-2">Built by a Class 1 Driver. Trusted by UK Operators.</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/titan.fleet" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="https://www.facebook.com/people/Titan-Fleet/61586509495375/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Facebook className="h-5 w-5" /></a>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} Titan Fleet. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
