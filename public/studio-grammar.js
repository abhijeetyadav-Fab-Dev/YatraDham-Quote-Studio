/* Deterministic travel spelling corrections shared by the editor and regression tests. */
const FIX = {
  // Gujarat & variants
  guarat: 'Gujarat',
  gujrat: 'Gujarat',
  gujarath: 'Gujarat',
  gujrath: 'Gujarat',
  gujurat: 'Gujarat',
  gujjrat: 'Gujarat',
  guajarat: 'Gujarat',
  gujart: 'Gujarat',
  gujaratt: 'Gujarat',
  gujarat: 'Gujarat',

  // Gujarat Cities & Pilgrimage Sites
  stewell: 'stepwell',
  kakaria: 'Kankaria',
  kankaria: 'Kankaria',
  kankariya: 'Kankaria',
  kankria: 'Kankaria',
  kankaira: 'Kankaria',
  sibabarmati: 'Sabarmati',
  sabarmathi: 'Sabarmati',
  sabarmti: 'Sabarmati',
  sabermati: 'Sabarmati',
  sabarmat: 'Sabarmati',
  adadalaj: 'Adalaj',
  adlaj: 'Adalaj',
  adalej: 'Adalaj',
  addalaj: 'Adalaj',
  akshardam: 'Akshardham',
  akshardhaam: 'Akshardham',
  aksardham: 'Akshardham',
  gandhinager: 'Gandhinagar',
  gandinagar: 'Gandhinagar',
  modhera: 'Modhera',
  patan: 'Patan',
  ranikivav: 'Rani ki Vav',
  statueofunity: 'Statue of Unity',
  kevadiya: 'Kevadia',
  kevadia: 'Kevadia',
  nageshwar: 'Nageshwar',
  nageswar: 'Nageshwar',
  betdwarka: 'Bet Dwarka',
  bet_dwarka: 'Bet Dwarka',
  beytdwarka: 'Bet Dwarka',
  porbander: 'Porbandar',
  porbandar: 'Porbandar',
  ahmedabd: 'Ahmedabad',
  ahimedabad: 'Ahmedabad',
  amedabad: 'Ahmedabad',
  ahmdabad: 'Ahmedabad',
  ahmedaad: 'Ahmedabad',
  ahamedbad: 'Ahmedabad',
  amdavad: 'Ahmedabad',
  ahamedabad: 'Ahmedabad',
  ahmadabad: 'Ahmedabad',
  ahemdabad: 'Ahmedabad',
  ahmedbad: 'Ahmedabad',
  dwaraka: 'Dwarka',
  dwarika: 'Dwarka',
  somanath: 'Somnath',
  somnat: 'Somnath',
  somnath: 'Somnath',
  sasangir: 'Sasan Gir',
  junagarh: 'Junagadh',
  junagad: 'Junagadh',
  junagadh: 'Junagadh',
  vadodra: 'Vadodara',
  baroda: 'Vadodara',
  rajkot: 'Rajkot',
  bhuj: 'Bhuj',
  kutch: 'Kutch',
  kachchh: 'Kachchh',
  ambaji: 'Ambaji',
  ambajee: 'Ambaji',
  palitana: 'Palitana',
  dakor: 'Dakor',
  pavagadh: 'Pavagadh',
  pavagarh: 'Pavagadh',
  champaner: 'Champaner',
  saputara: 'Saputara',
  mandvi: 'Mandvi',
  dholavira: 'Dholavira',

  // Other India States & Cities
  rajsthan: 'Rajasthan',
  rajasthan: 'Rajasthan',
  rajashthan: 'Rajasthan',
  jaipur: 'Jaipur',
  jaipure: 'Jaipur',
  udaipur: 'Udaipur',
  udaipure: 'Udaipur',
  jodhpur: 'Jodhpur',
  jaisalmer: 'Jaisalmer',
  pushkar: 'Pushkar',
  maharastra: 'Maharashtra',
  maharashrta: 'Maharashtra',
  maharashtra: 'Maharashtra',
  mumbai: 'Mumbai',
  bombay: 'Mumbai',
  shirdi: 'Shirdi',
  sirdi: 'Shirdi',
  shiridi: 'Shirdi',
  nasik: 'Nashik',
  nashik: 'Nashik',
  trimbakeshwar: 'Trimbakeshwar',
  uttarakhand: 'Uttarakhand',
  uttrakhand: 'Uttarakhand',
  uttaranchal: 'Uttarakhand',
  haridwaar: 'Haridwar',
  hardwar: 'Haridwar',
  haridwar: 'Haridwar',
  rishikesh: 'Rishikesh',
  rishikes: 'Rishikesh',
  kedarnth: 'Kedarnath',
  kedharnath: 'Kedarnath',
  kedarnath: 'Kedarnath',
  badrinth: 'Badrinath',
  badhrinath: 'Badrinath',
  badrinath: 'Badrinath',
  gangotri: 'Gangotri',
  yamunotri: 'Yamunotri',
  varanasi: 'Varanasi',
  banaras: 'Varanasi',
  benaras: 'Varanasi',
  kashi: 'Kashi',
  ayodhya: 'Ayodhya',
  ayodhaya: 'Ayodhya',
  ayodya: 'Ayodhya',
  prayagraj: 'Prayagraj',
  allahabad: 'Prayagraj',
  mathura: 'Mathura',
  vrindavan: 'Vrindavan',
  brindavan: 'Vrindavan',
  tirupathi: 'Tirupati',
  tirupati: 'Tirupati',
  rameshwaram: 'Rameswaram',
  rameswaram: 'Rameswaram',
  kanyakumari: 'Kanyakumari',
  madurai: 'Madurai',
  shimla: 'Shimla',
  shimala: 'Shimla',
  manalli: 'Manali',
  manali: 'Manali',
  dharamshala: 'Dharamshala',
  dehradoon: 'Dehradun',
  dehradun: 'Dehradun',
  amritsar: 'Amritsar',
  amritser: 'Amritsar',
  kolkatta: 'Kolkata',
  calcutta: 'Kolkata',
  kolkata: 'Kolkata',
  banglore: 'Bengaluru',
  bangalore: 'Bengaluru',
  bengaluru: 'Bengaluru',
  delhi: 'Delhi',
  dilli: 'Delhi',
  keral: 'Kerala',
  kairala: 'Kerala',
  kerala: 'Kerala',
  munnar: 'Munnar',
  alleppey: 'Alleppey',
  alappuzha: 'Alappuzha',
  kochi: 'Kochi',
  cochin: 'Kochi',

  // Common Travel Spellings
  accomodation: 'accommodation',
  accomadation: 'accommodation',
  acommodation: 'accommodation',
  transfered: 'transferred',
  transfering: 'transferring',
  seperate: 'separate',
  recieve: 'receive',
  recieved: 'received',
  sightseing: 'sightseeing',
  sight_seeing: 'sightseeing',
  itenary: 'itinerary',
  itinary: 'itinerary',
  iternary: 'itinerary',
  breakfst: 'breakfast',
  brekfast: 'breakfast',
  includs: 'includes',
  incldues: 'includes',
  excludes: 'excludes',
  excluding: 'excluding',
  arival: 'arrival',
  arrivel: 'arrival',
  departue: 'departure',
  depature: 'departure',
  complimentry: 'complimentary',
  complementary: 'complimentary',
  vehical: 'vehicle',
  vechicle: 'vehicle',
  vechile: 'vehicle',
  guarenteed: 'guaranteed',
  garanteed: 'guaranteed',
  occassion: 'occasion',
  definately: 'definitely',
  untill: 'until',
  hotell: 'hotel',
  teh: 'the',
  adn: 'and',
  hygenic: 'hygienic',
  darshn: 'darshan',
  darsan: 'darshan',
  passanger: 'passenger',
  passangers: 'passengers',
  cancallation: 'cancellation',
  cancllation: 'cancellation'
};

const PHRASES = [
  [/\bGuarat\b/gi, 'Gujarat'],
  [/\bGujrat\b/gi, 'Gujarat'],
  [/\bGujarath\b/gi, 'Gujarat'],
  [/\bGujrath\b/gi, 'Gujarat'],
  [/\bGujurat\b/gi, 'Gujarat'],
  [/\bRajsthan\b/gi, 'Rajasthan'],
  [/\bMaharastra\b/gi, 'Maharashtra'],
  [/\bStatue of unity\b/gi, 'Statue of Unity'],
  [/\bRani ki vav\b/gi, 'Rani ki Vav'],
  [/\bBet dwarka\b/gi, 'Bet Dwarka'],
  [/\bBeyt dwarka\b/gi, 'Bet Dwarka'],
  [/\bSasan gir\b/gi, 'Sasan Gir'],
  [/\bsight[- ]seeing\b/gi, 'sightseeing'],
  [/\bcheck[- ]?in\b/gi, 'check-in'],
  [/\bcheck[- ]?out\b/gi, 'check-out'],
  [/\bover[- ]?night\b/gi, 'overnight'],
  [/\ben[- ]route\b/gi, 'en route'],
  [/[ \t]{2,}/g, ' '],
  [/\s+([,.;:!?])/g, '$1']
];

const CANONICAL = [
  'Ahmedabad', 'Gujarat', 'Maharashtra', 'Uttarakhand', 'Rajasthan', 'Dwarka', 'Somnath',
  'Junagadh', 'Porbandar', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Sabarmati', 'Akshardham',
  'Kankaria', 'Nageshwar', 'Trimbakeshwar', 'Bhimashankar', 'Grishneshwar', 'Shingnapur',
  'Haridwar', 'Rishikesh', 'Kedarnath', 'Badrinath', 'Gangotri', 'Yamunotri', 'Varanasi',
  'Prayagraj', 'Ayodhya', 'Vrindavan', 'Mathura', 'Tirupati', 'Rameswaram', 'Kanyakumari',
  'Madurai', 'Amritsar', 'Dehradun', 'Bengaluru', 'Alappuzha', 'accommodation',
  'sightseeing', 'itinerary', 'cancellation', 'breakfast'
];
const CANON_SET = new Set(CANONICAL.map(w => w.toLowerCase()));

function osa(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

function fuzzyMatch(wl) {
  if (wl.length < 6 || CANON_SET.has(wl)) return null;
  const maxD = wl.length >= 8 ? 2 : 1;
  let best = null, bestD = maxD + 1, tied = false;
  for (const c of CANONICAL) {
    const cl = c.toLowerCase();
    if (cl[0] !== wl[0]) continue;
    const d = osa(wl, cl);
    if (d < bestD) { best = c; bestD = d; tied = false; }
    else if (d === bestD && best !== c) { tied = true; }
  }
  return !tied && bestD <= maxD ? best : null;
}

export const localFix = t => {
  if (typeof t !== 'string' || !t) return t;
  let out = t.replace(/[A-Za-z_]+/g, w => {
    const wl = w.toLowerCase();
    const r = FIX[wl] || fuzzyMatch(wl);
    if (!r || (r.toLowerCase() === wl && r === w)) return w;
    if (w === w.toUpperCase() && w.length > 1) return r.toUpperCase();
    if (w[0] === w[0].toLowerCase() && r[0] === r[0].toLowerCase()) return r;
    return w[0] === w[0].toUpperCase() ? r[0].toUpperCase() + r.slice(1) : r;
  });
  for (const [re, rep] of PHRASES) {
    out = out.replace(re, rep);
  }
  return out;
};
