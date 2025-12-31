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

export function loadGoogleFont(fontName: string): void {
  if (loadedFonts.has(fontName)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";

  // Check if this font is on CDNFonts
  if (cdnFontsMap[fontName]) {
    link.href = `https://fonts.cdnfonts.com/css/${cdnFontsMap[fontName]}`;
  } else {
    // Default to Google Fonts
    const fontNameForUrl = fontName.replace(/ /g, "+");
    link.href = `https://fonts.googleapis.com/css2?family=${fontNameForUrl}:wght@400;500;600;700&display=swap`;
  }

  document.head.appendChild(link);

  loadedFonts.add(fontName);
}

export function isFontLoaded(fontName: string): boolean {
  return loadedFonts.has(fontName);
}
