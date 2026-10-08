/**
 * Built-in Sample Documents with realistic high-resolution SVG-based Data URIs
 * for instant one-click testing & hackathon demonstration.
 */

// 1. TANGEDCO Electricity Bill Sample
function createSampleBillSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
    <rect width="800" height="1000" fill="#ffffff"/>
    <rect x="20" y="20" width="760" height="960" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" rx="8"/>
    <!-- Header -->
    <rect x="40" y="40" width="720" height="90" fill="#1e3a8a" rx="6"/>
    <text x="60" y="80" font-family="Arial, sans-serif" font-weight="bold" font-size="24" fill="#ffffff">TAMIL NADU GENERATION &amp; DISTRIBUTION CORP LTD</text>
    <text x="60" y="108" font-family="Arial, sans-serif" font-size="16" fill="#93c5fd">TANGEDCO - CONSUMER ELECTRICITY BILL</text>
    <text x="650" y="75" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#fef08a">SERVICE #</text>
    <text x="650" y="95" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">03-124-889-410</text>
    
    <!-- Consumer Info Box -->
    <rect x="40" y="150" width="720" height="130" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" rx="6"/>
    <text x="60" y="180" font-family="Arial, sans-serif" font-size="14" fill="#64748b">CONSUMER NAME &amp; ADDRESS</text>
    <text x="60" y="205" font-family="Arial, sans-serif" font-weight="bold" font-size="18" fill="#0f172a">K. RAMESH</text>
    <text x="60" y="230" font-family="Arial, sans-serif" font-size="14" fill="#334155">Door No. 42, Cross Cut Road, Gandhipuram</text>
    <text x="60" y="250" font-family="Arial, sans-serif" font-size="14" fill="#334155">Coimbatore, Tamil Nadu - 641012</text>
    
    <text x="450" y="180" font-family="Arial, sans-serif" font-size="14" fill="#64748b">BILL DATE</text>
    <text x="450" y="205" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="#0f172a">01 OCT 2026</text>
    <text x="450" y="235" font-family="Arial, sans-serif" font-size="14" fill="#64748b">TARIFF CATEGORY</text>
    <text x="450" y="255" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#0f172a">Domestic (1A)</text>
    
    <!-- Meter Reading Box -->
    <rect x="40" y="300" width="720" height="120" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1" rx="6"/>
    <text x="60" y="330" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#334155">METER READINGS &amp; CONSUMPTION</text>
    <text x="60" y="365" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Previous Reading: <tspan font-weight="bold" fill="#0f172a">4120 kWh</tspan></text>
    <text x="280" y="365" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Current Reading: <tspan font-weight="bold" fill="#0f172a">4465 kWh</tspan></text>
    <text x="520" y="365" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Total Units: <tspan font-weight="bold" fill="#1e40af">345 Units</tspan></text>
    <text x="60" y="395" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Subsidy Units Granted: 100 Units Free (Govt Scheme)</text>

    <!-- Amount & Due Date HIGHLIGHT BOX -->
    <rect x="40" y="440" width="720" height="160" fill="#eff6ff" stroke="#3b82f6" stroke-width="2" rx="8"/>
    <text x="70" y="480" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="#1e40af">TOTAL NET AMOUNT DUE</text>
    <text x="70" y="535" font-family="Arial, sans-serif" font-weight="bold" font-size="44" fill="#b91c1c">₹ 1,845.00</text>
    <text x="70" y="575" font-family="Arial, sans-serif" font-size="13" fill="#475569">(Rupees One Thousand Eight Hundred and Forty-Five Only)</text>
    
    <line x1="420" y1="460" x2="420" y2="580" stroke="#bfdbfe" stroke-width="2"/>
    <text x="450" y="480" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="#1e40af">DUE DATE FOR PAYMENT</text>
    <text x="450" y="525" font-family="Arial, sans-serif" font-weight="bold" font-size="32" fill="#d97706">15 OCT 2026</text>
    <text x="450" y="560" font-family="Arial, sans-serif" font-weight="bold" font-size="13" fill="#dc2626">⚠️ Disconnection warning after 20 OCT 2026</text>
    
    <!-- Breakdown table -->
    <rect x="40" y="620" width="720" height="190" fill="#ffffff" stroke="#e2e8f0" rx="6"/>
    <text x="60" y="650" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#0f172a">CHARGE BREAKDOWN</text>
    <text x="60" y="685" font-family="Arial, sans-serif" font-size="14" fill="#334155">Energy Charges (245 Units @ Tier Rates)</text>
    <text x="650" y="685" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">₹ 1,570.00</text>
    <text x="60" y="715" font-family="Arial, sans-serif" font-size="14" fill="#334155">Fixed Monthly Charges</text>
    <text x="650" y="715" font-family="Arial, sans-serif" font-size="14" fill="#0f172a">₹ 120.00</text>
    <text x="60" y="745" font-family="Arial, sans-serif" font-size="14" fill="#334155">Electricity Duty &amp; Taxes</text>
    <text x="650" y="745" font-family="Arial, sans-serif" font-size="14" fill="#0f172a">₹ 155.00</text>
    <line x1="60" y1="765" x2="740" y2="765" stroke="#cbd5e1" stroke-dasharray="4"/>
    <text x="60" y="790" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#0f172a">Late Payment Penalty Surcharge (if paid after 15th)</text>
    <text x="650" y="790" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#dc2626">+ ₹ 150.00</text>

    <!-- Footer Instructions -->
    <rect x="40" y="830" width="720" height="120" fill="#f8fafc" stroke="#e2e8f0" rx="6"/>
    <text x="60" y="860" font-family="Arial, sans-serif" font-weight="bold" font-size="13" fill="#334155">PAYMENT INSTRUCTIONS:</text>
    <text x="60" y="885" font-family="Arial, sans-serif" font-size="12" fill="#64748b">1. Pay online at www.tangedco.gov.in using UPI/Debit Card or TANGEDCO Mobile App.</text>
    <text x="60" y="905" font-family="Arial, sans-serif" font-size="12" fill="#64748b">2. Quote Consumer Service Number 03-124-889-410 during payment.</text>
    <text x="60" y="925" font-family="Arial, sans-serif" font-size="12" fill="#dc2626">3. If payment is delayed past 20 OCT 2026, power connection will be temporarily suspended.</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// 2. Kovai City Multi-Speciality Hospital Prescription & Discharge Summary
function createSampleMedicalSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
    <rect width="800" height="1000" fill="#ffffff"/>
    <rect x="20" y="20" width="760" height="960" fill="#f0fdf4" stroke="#a7f3d0" stroke-width="2" rx="8"/>
    
    <!-- Hospital Header -->
    <rect x="40" y="40" width="720" height="95" fill="#047857" rx="6"/>
    <text x="60" y="78" font-family="Arial, sans-serif" font-weight="bold" font-size="24" fill="#ffffff">KOVAI MEDICAL CENTER &amp; CLINIC</text>
    <text x="60" y="105" font-family="Arial, sans-serif" font-size="15" fill="#a7f3d0">Avinashi Road, Peelamedu, Coimbatore - 641014 | Phone: 0422-2627000</text>
    
    <!-- Doctor & Patient Details -->
    <rect x="40" y="150" width="720" height="110" fill="#ffffff" stroke="#cbd5e1" rx="6"/>
    <text x="60" y="180" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="#0f172a">PATIENT: S. MEENAKSHI (Age: 54 / Female)</text>
    <text x="60" y="205" font-family="Arial, sans-serif" font-size="14" fill="#475569">Consultant: <tspan font-weight="bold" fill="#047857">Dr. V. ANAND, MD (General Medicine)</tspan></text>
    <text x="60" y="230" font-family="Arial, sans-serif" font-size="14" fill="#475569">Prescription Date: <tspan font-weight="bold" fill="#0f172a">05 OCT 2026</tspan> | Reg ID: <tspan font-weight="bold">KMC-2026-9812</tspan></text>
    
    <!-- Diagnosis Box -->
    <rect x="40" y="280" width="720" height="70" fill="#fef2f2" stroke="#fca5a5" rx="6"/>
    <text x="60" y="310" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#991b1b">DIAGNOSIS / CLINICAL FINDINGS:</text>
    <text x="60" y="333" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="#7f1d1d">Acute Bronchitis &amp; Type 2 Diabetes Mellitus (Routine Follow-up)</text>

    <!-- Medication Table Header -->
    <rect x="40" y="370" width="720" height="40" fill="#065f46" rx="4"/>
    <text x="60" y="395" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#ffffff">MEDICINE NAME</text>
    <text x="320" y="395" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#ffffff">DOSAGE</text>
    <text x="460" y="395" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#ffffff">TIMING &amp; INSTRUCTIONS</text>
    
    <!-- Med Row 1 -->
    <rect x="40" y="415" width="720" height="55" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="60" y="445" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#0f172a">1. Tab. Amoxicillin 500mg</text>
    <text x="320" y="445" font-family="Arial, sans-serif" font-size="14" fill="#334155">1 tablet (1-0-1)</text>
    <text x="460" y="445" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#047857">After Food (5 Days)</text>

    <!-- Med Row 2 -->
    <rect x="40" y="470" width="720" height="55" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="60" y="500" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#0f172a">2. Tab. Metformin 500mg SR</text>
    <text x="320" y="500" font-family="Arial, sans-serif" font-size="14" fill="#334155">1 tablet (1-0-1)</text>
    <text x="460" y="500" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#047857">Before Food (30 Days)</text>

    <!-- Med Row 3 -->
    <rect x="40" y="525" width="720" height="55" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="60" y="555" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#0f172a">3. Syrup Acebrophylline 100mg</text>
    <text x="320" y="555" font-family="Arial, sans-serif" font-size="14" fill="#334155">10 ml (0-0-1)</text>
    <text x="460" y="555" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#047857">At Bedtime (7 Days)</text>

    <!-- Critical Care Instructions -->
    <rect x="40" y="600" width="720" height="150" fill="#fffbe6" stroke="#fde047" stroke-width="2" rx="6"/>
    <text x="60" y="630" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#854d0e">⚠️ CRITICAL PATIENT CARE INSTRUCTIONS:</text>
    <text x="60" y="660" font-family="Arial, sans-serif" font-size="14" fill="#713f12">• Drink plenty of warm water. Avoid cold drinks, ice cream, and fried foods.</text>
    <text x="60" y="685" font-family="Arial, sans-serif" font-size="14" fill="#713f12">• Monitor blood sugar levels fasting and post-prandial twice weekly.</text>
    <text x="60" y="710" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#b45309">• Complete the full 5-day antibiotic course even if cough subsides.</text>
    <text x="60" y="735" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#dc2626">• Seek immediate ER if severe breathlessness or chest pain develops.</text>

    <!-- Follow Up Box -->
    <rect x="40" y="770" width="720" height="100" fill="#eff6ff" stroke="#3b82f6" rx="6"/>
    <text x="60" y="800" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="#1e40af">NEXT FOLLOW-UP VISIT DATE:</text>
    <text x="60" y="845" font-family="Arial, sans-serif" font-weight="bold" font-size="28" fill="#1d4ed8">18 OCT 2026 (Sunday, 10:00 AM)</text>

    <text x="550" y="930" font-family="Arial, sans-serif" font-style="italic" font-size="14" fill="#475569">Dr. V. Anand (Reg # 64512)</text>
    <line x1="530" y1="940" x2="740" y2="940" stroke="#94a3b8"/>
    <text x="570" y="955" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Authorized Medical Officer</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// 3. Traffic Violation e-Challan Notice Sample
function createSampleChallanSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
    <rect width="800" height="1000" fill="#ffffff"/>
    <rect x="20" y="20" width="760" height="960" fill="#fafafa" stroke="#d4d4d8" stroke-width="2" rx="8"/>
    
    <!-- Traffic Police Header -->
    <rect x="40" y="40" width="720" height="90" fill="#991b1b" rx="6"/>
    <text x="60" y="80" font-family="Arial, sans-serif" font-weight="bold" font-size="22" fill="#ffffff">COIMBATORE CITY TRAFFIC POLICE</text>
    <text x="60" y="108" font-family="Arial, sans-serif" font-size="15" fill="#fecaca">OFFICIAL E-CHALLAN TRAFFIC VIOLATION NOTICE</text>
    <text x="610" y="85" font-family="Arial, sans-serif" font-weight="bold" font-size="13" fill="#fef08a">NOTICE NO.</text>
    <text x="610" y="105" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#ffffff">TN-CBE-99412</text>
    
    <!-- Offender & Vehicle Info -->
    <rect x="40" y="150" width="720" height="120" fill="#ffffff" stroke="#e4e4e7" rx="6"/>
    <text x="60" y="180" font-family="Arial, sans-serif" font-size="13" fill="#71717a">VEHICLE REGISTRATION NO.</text>
    <text x="60" y="210" font-family="Arial, sans-serif" font-weight="bold" font-size="22" fill="#18181b">TN 37 CZ 4981</text>
    <text x="60" y="235" font-family="Arial, sans-serif" font-size="14" fill="#3f3f46">Owner Name: <tspan font-weight="bold">S. PRAKASH</tspan></text>
    
    <text x="420" y="180" font-family="Arial, sans-serif" font-size="13" fill="#71717a">OFFENCE DATE &amp; TIME</text>
    <text x="420" y="205" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="#18181b">28 SEP 2026 | 11:42 AM</text>
    <text x="420" y="235" font-family="Arial, sans-serif" font-size="14" fill="#3f3f46">Location: <tspan font-weight="bold">Gandhipuram Signal 4</tspan></text>

    <!-- Violation Details -->
    <rect x="40" y="290" width="720" height="130" fill="#fef2f2" stroke="#fca5a5" stroke-width="1.5" rx="6"/>
    <text x="60" y="325" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#991b1b">TRAFFIC OFFENCE CHARGED:</text>
    <text x="60" y="355" font-family="Arial, sans-serif" font-weight="bold" font-size="18" fill="#7f1d1d">Signal Jumping (Red Light Violation) &amp; Riding Without Helmet</text>
    <text x="60" y="385" font-family="Arial, sans-serif" font-size="14" fill="#991b1b">Motor Vehicles Act Section: <tspan font-weight="bold">Sec 177 / Sec 184 MV Act</tspan></text>

    <!-- Fine Amount & Deadline -->
    <rect x="40" y="440" width="720" height="150" fill="#fff1f2" stroke="#e11d48" stroke-width="2" rx="8"/>
    <text x="70" y="480" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="#9f1239">TOTAL FINE PENALTY AMOUNT</text>
    <text x="70" y="535" font-family="Arial, sans-serif" font-weight="bold" font-size="44" fill="#be123c">₹ 1,500.00</text>
    <line x1="420" y1="460" x2="420" y2="570" stroke="#fecdd3" stroke-width="2"/>
    <text x="450" y="480" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="#9f1239">LAST DATE TO PAY FINE</text>
    <text x="450" y="525" font-family="Arial, sans-serif" font-weight="bold" font-size="32" fill="#be123c">12 OCT 2026</text>
    <text x="450" y="560" font-family="Arial, sans-serif" font-weight="bold" font-size="13" fill="#991b1b">⚠️ Court Summons if unpaid by deadline</text>

    <!-- Court & Consequences Warnings -->
    <rect x="40" y="610" width="720" height="170" fill="#ffffff" stroke="#cbd5e1" rx="6"/>
    <text x="60" y="640" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="#0f172a">LEGAL CONSEQUENCES OF NON-PAYMENT:</text>
    <text x="60" y="670" font-family="Arial, sans-serif" font-size="14" fill="#334155">1. Failure to pay by 12 OCT 2026 will result in direct referral to the Virtual Traffic Court.</text>
    <text x="60" y="695" font-family="Arial, sans-serif" font-size="14" fill="#334155">2. Driving License suspension proceeding may be initiated under MV Act Sec 19.</text>
    <text x="60" y="720" font-family="Arial, sans-serif" font-size="14" fill="#334155">3. Vehicle fitness certificate &amp; ownership transfer services will be blocked in Vahan portal.</text>
    <text x="60" y="745" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#b91c1c">4. Additional late penalty of ₹ 50 per day after deadline.</text>

    <!-- Payment Portal -->
    <rect x="40" y="800" width="720" height="150" fill="#f4f4f5" stroke="#e4e4e7" rx="6"/>
    <text x="60" y="830" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#18181b">PAYMENT METHODS:</text>
    <text x="60" y="855" font-family="Arial, sans-serif" font-size="13" fill="#52525b">• Pay Online: https://echallan.parivahan.gov.in (Official Govt Portal)</text>
    <text x="60" y="880" font-family="Arial, sans-serif" font-size="13" fill="#52525b">• Pay at any e-Seva Center or Traffic Police Station Cash Counter</text>
    <text x="60" y="905" font-family="Arial, sans-serif" font-weight="bold" font-size="13" fill="#18181b">• Quote Notice No: TN-CBE-99412 &amp; Reg No: TN 37 CZ 4981</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

export const SAMPLE_DOCUMENTS = [
  {
    id: 'sample-eb-bill',
    title: 'TANGEDCO Electricity Bill',
    category: 'Electricity Bill',
    badge: 'Bill',
    description: 'Electricity consumer bill with due date, net amount ₹1,845, and disconnection warnings.',
    image: createSampleBillSvg()
  },
  {
    id: 'sample-medical-prescription',
    title: 'Medical Discharge & Prescription',
    category: 'Medical Prescription',
    badge: 'Medical',
    description: 'Hospital prescription with dosage (Amoxicillin, Metformin), dietary warnings & follow-up date.',
    image: createSampleMedicalSvg()
  },
  {
    id: 'sample-traffic-challan',
    title: 'Traffic E-Challan Notice',
    category: 'Traffic Challan',
    badge: 'Notice',
    description: 'Official traffic fine of ₹1,500, deadline Oct 12, and court summons warnings.',
    image: createSampleChallanSvg()
  }
];
