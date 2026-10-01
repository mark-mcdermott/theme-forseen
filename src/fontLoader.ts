const loadedFonts = new Set<string>();

// Fonts hosted on CDNFonts instead of Google Fonts
// Maps font name to CDNFonts URL slug
const cdnFontsMap: Record<string, string> = {
  // Sans-Serif (not on Google Fonts or better on CDNFonts)
  'Bebas Neue': 'bebas-neue',
  // Sci-Fi / Futuristic (Typodermic)
  'Ethnocentric': 'ethnocentric',
  'Conthrax': 'conthrax',
  'Nasalization': 'nasalization-2',
  'Nulshock': 'nulshock',
  'Dune Rise': 'dune-rise',
  'Good Timing': 'good-timing',
  'Venus Rising': 'venus-rising',
  'Future Earth': 'future-earth',
  'Zeroes One': 'zeroes-one',
  'UFO Hunter': 'ufo-hunter',
  'ZOOMING track': 'zooming-track',
  'Technofosiano': 'technofosiano',
  'Subatomic Tsoonami': 'subatomic-tsoonami',
  'Sagan': 'sagan',
  'Masterforce': 'masterforce',
  'Young Techs': 'young-techs',
  'New English': 'new-english',
  'Abyssopelagic': 'abyssopelagic',
  // Display / Decorative
  'Blanka': 'blanka',
  'VAG Primer': 'vag-primer',
  'Braile Font': 'braile-font',
  'Globoface-Gothic-Display-2001': 'globoface-gothic-display-2001-2',
  'REM': 'rem',
  'Grafeno St': 'grafeno-st',
  'Tender Goliath Small-Caps': 'tender-goliath-small-caps',
  'Fat Wandals': 'fat-wandals-personal-use',
  'Soloist Halftone': 'soloist-halftone',
  'Aspex': 'aspex',
  'The Blood Shack': 'the-blood-shack',
  'Cokelines': 'cokelines',
  'Deacon Blues': 'deacon-blues',
  'Eagle GT II': 'eagle-gt-ii',
  'e-Pececito': 'e-pececito',
  'Oval Black': 'oval-black',
  'Pocket Calculator': 'pocket-calculator',
  'ROBLOX Display': 'roblox-display',
  'Nexa': 'nexa',
  'Nikoleta': 'nikoleta',
  'THUNDERBLACK DEMO': 'thunderblack-demo',
  'Nagaro': 'nagaro',
  'g Gemos': 'g-gemos',
  'B-TEAM': 'b-team',
  'Incheon Nights': 'incheon-nights',
  // Pixel / Bitmap
  'Neon Pixel-7': 'neon-pixel-7',
  'Monster Friend Back': 'monster-friend-back',
  'Aux DotBitC': 'aux-dotbitc',
  // Script / Handwriting
  'Breaking Road': 'breaking-road',
  'Homework': 'homework',
  'Wisdom Merry': 'wisdom-merry',
  'Interval': 'interval',
  'junita script': 'junita-script',
  'Hariston': 'hariston',
  // Additional Sci-Fi/Tech
  'Nuixyber Pro': 'nuixyber-pro',
  'Mechsuit': 'mechsuit',
  'SF Planetary Orbiter': 'sf-planetary-orbiter',
  'Speedeasy Speedy': 'speedeasy-speedy',
  'SPIDER': 'spider',
  'Flexsteel': 'flexsteel',
  'Rezzzistor4F': 'rezzzistor4f',
  'Tidy Curve TV': 'tidy-curve-tv',
  'Led Panel Station Off': 'led-panel-station-off',
  // Additional Display
  'Alba': 'alba',
  'Brose': 'brose',
  'Sebaldus-Gotisch': 'sebaldus-gotisch',
  'Jelmiroz': 'jelmiroz',
  'Micro N55': 'micro-n55',
  'China Fad': 'china-fad',
  'Red October': 'red-october',
  'Wide awake Black': 'wide-awake-black',
  'Suissnord': 'suissnord',
  'Crox': 'crox',
  'g Gelem': 'g-gelem',
  // Additional CDN Fonts
  'Amuse-Bouche': 'amuse-bouche',
  'LED BOARD': 'led-board',
  'Moonracer': 'moonracer',
  'Dragrace': 'dragrace',
  'THREELIE': 'threelie',
  'GreekBearTinyE': 'greek-bear-tiny-e',
  'Hustle': 'hustle',
  'Montreal Thin': 'montreal-thin',
  'Slick Strontium': 'slick-strontium',
  'REAl BrEakerz': 'real-breakerz',
  'LETRERA CAPS': 'letrera-caps',
  'Robot Monster': 'robot-monster',
  'Upheaval TT (BRK)': 'upheaval',
  'Justov': 'justov',
  'Roses are FF0000': 'roses-are-ff0000',
  'Yunyun Trial': 'yunyun-trial',
  'InFormal Style Bold': 'informal-style-bold',
  'Greenwich Mean': 'greenwich-mean',
  'Fascinate Inline': 'fascinate-inline',
  'Establo': 'establo',
  'Gondrin': 'gondrin',
  'Square Raising': 'square-raising',
  'vtks Rude Metal shadow': 'vtks-rude-metal-shadow',
  'Autografia PERSONAL USE ONLY': 'autografia-personal-use-only',
  'Abstract': 'abstract',
  // More CDN Fonts
  'VEGANO': 'vegano',
  'Seventies Sunrise Trial': 'seventies-sunrise-trial',
  'Sembilu Script': 'sembilu-script',
  'UCT Found Receipt': 'found-receipt',
  'picablo fentier': 'picablo-fentier',
  'Belvedere': 'belvedere',
  'Fatsans': 'fatsans',
  'Milestone One': 'milestone-one',
  'Oxbot': 'oxbot',
  'BatikDayakFont': 'batik-dayak-font',
  'LED BOARD REVERSED': 'led-board-reversed',
  'Legacy Cyborg': 'legacy-cyborg',
  'Crush': 'crush',
  'Kasparovsky': 'kasparovsky',
  'Weaponeer': 'weaponeer',
  'Peg Holes': 'peg-holes',
  'Superfly': 'superfly',
  'Chlorenuf': 'chlorenuf',
  'Bim eroded': 'bim-eroded',
  'Challans': 'challans',
  'Offerings': 'offerings',
  'AZARO': 'azaro',
  'Dish Out': 'dish-out',
};

// A page that declares a family with @font-face has its own files for it
function isDeclaredByPage(fontName: string): boolean {
  let declared = false;
  document.fonts.forEach((face) => {
    if (face.family.replace(/^["']|["']$/g, "") === fontName) declared = true;
  });
  return declared;
}

/**
 * Faces are registered with the page through the font loading API, not by
 * adding the hosts' stylesheets to it. A stylesheet that carries @font-face
 * rules makes the browser rebuild every face the page has declared, and for
 * a frame the page's own text is drawn in its fallbacks: a flash of the whole
 * page each time a face is asked for. Faces added through the API leave the
 * page's own alone.
 */
const FONT_FACE_RULE = /@font-face\s*{([^}]*)}/g;

function descriptor(rule: string, name: string): string | undefined {
  return rule.match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`))?.[1].trim();
}

function registerFaces(css: string): void {
  for (const [, rule] of css.matchAll(FONT_FACE_RULE)) {
    const family = descriptor(rule, "font-family")?.replace(/^["']|["']$/g, "");
    const source = descriptor(rule, "src");
    if (!family || !source) continue;

    document.fonts.add(
      new FontFace(family, source, {
        style: descriptor(rule, "font-style") ?? "normal",
        weight: descriptor(rule, "font-weight") ?? "400",
        stretch: descriptor(rule, "font-stretch") ?? "normal",
        unicodeRange: descriptor(rule, "unicode-range") ?? "U+0-10FFFF",
        display: "swap",
      })
    );
  }
}

// What the page did before the API: the host's stylesheet, for where its CSS cannot be fetched
function appendStylesheet(href: string): void {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

/** Fetches a host's CSS and registers its faces. Says whether the host answered with them. */
async function loadFaces(href: string): Promise<boolean> {
  let response: Response;
  try {
    response = await fetch(href);
  } catch {
    // The page may not be allowed to fetch from the host, though it may link to it
    appendStylesheet(href);
    return true;
  }

  if (!response.ok) return false;
  registerFaces(await response.text());
  return true;
}

const googleFontsUrl = (families: string[]) =>
  `https://fonts.googleapis.com/css2?${families
    .map((family) => `family=${family.replace(/ /g, "+")}:wght@400;500;600;700`)
    .join("&")}&display=swap`;

/** Families waiting to be asked for together */
let waiting: string[] = [];
const FAMILIES_PER_REQUEST = 16;

// The faces a moment calls for, such as a screenful of rows, are asked for in one request
function requestWaiting(): void {
  const families = waiting;
  waiting = [];

  for (let i = 0; i < families.length; i += FAMILIES_PER_REQUEST) {
    const batch = families.slice(i, i + FAMILIES_PER_REQUEST);

    loadFaces(googleFontsUrl(batch)).then((answered) => {
      // One family Google does not have fails the whole request, so each is asked for on its own
      if (!answered && batch.length > 1) batch.forEach((family) => loadFaces(googleFontsUrl([family])));
    });
  }
}

export function loadGoogleFont(fontName: string): void {
  if (loadedFonts.has(fontName)) {
    return;
  }
  loadedFonts.add(fontName);

  if (isDeclaredByPage(fontName)) {
    return;
  }

  // Fonts hosted on CDNFonts come one to a request
  if (cdnFontsMap[fontName]) {
    loadFaces(`https://fonts.cdnfonts.com/css/${cdnFontsMap[fontName]}`);
    return;
  }

  if (waiting.length === 0) queueMicrotask(requestWaiting);
  waiting.push(fontName);
}

export function isFontLoaded(fontName: string): boolean {
  return loadedFonts.has(fontName);
}
