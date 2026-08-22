export interface WatchCatalogItem {
  id: string
  category: 'Watches' | 'Handbags' | 'Fine Jewelry' | 'Luxury Vehicles' | 'Art & Collectibles'
  brand: string
  model: string
  referenceNumber: string
  caseMaterial?: string
  caseSizeMm?: number
  movement?: string
  braceletType?: string
  leatherType?: string
  hardware?: string
  bagSize?: string
  metalPurity?: string
  baselineMarketValueUSD: number
  keywords: string[]
  forensicIndicators: {
    logoFontKerning: string
    rehautAlignment: string
    cyclopsMagnification: string
    hallmarks: string
  }
}

export const LUXURY_CATALOG: WatchCatalogItem[] = [
  // ── ROLEX ────────────────────────────────────────────────────────────────
  {
    id: 'rol-126610ln',
    category: 'Watches',
    brand: 'Rolex',
    model: 'Submariner Date 41mm',
    referenceNumber: '126610LN',
    caseMaterial: 'Steel',
    caseSizeMm: 41,
    movement: 'Automatic',
    braceletType: 'Oyster',
    baselineMarketValueUSD: 14200,
    keywords: ['rolex', 'submariner', '126610ln', 'sub', 'black', 'oystersteel', 'cerachrom'],
    forensicIndicators: {
      logoFontKerning: 'Rolex coronet 5-point symmetry, sharp laser etch',
      rehautAlignment: 'Double ROLEX engraving aligns precisely with minute track',
      cyclopsMagnification: '2.5x magnification with anti-reflective blue tint',
      hallmarks: 'Oystersteel 904L brushed finish on lugs, polished case flanks'
    }
  },
  {
    id: 'rol-126610lv',
    category: 'Watches',
    brand: 'Rolex',
    model: 'Submariner Date "Kermit/Starbucks"',
    referenceNumber: '126610LV',
    caseMaterial: 'Steel',
    caseSizeMm: 41,
    movement: 'Automatic',
    braceletType: 'Oyster',
    baselineMarketValueUSD: 15800,
    keywords: ['rolex', 'submariner', '126610lv', 'kermit', 'starbucks', 'green'],
    forensicIndicators: {
      logoFontKerning: 'Green Cerachrom bezel insert with platinum PVD numerals',
      rehautAlignment: 'Engraved serial number at 6 oclock rehaut position',
      cyclopsMagnification: '2.5x cyclops over date window',
      hallmarks: 'Glidelock extension clasp with micro-adjust notches'
    }
  },
  {
    id: 'rol-126500ln',
    category: 'Watches',
    brand: 'Rolex',
    model: 'Cosmograph Daytona White Dial',
    referenceNumber: '126500LN',
    caseMaterial: 'Steel',
    caseSizeMm: 40,
    movement: 'Automatic',
    braceletType: 'Oyster',
    baselineMarketValueUSD: 34800,
    keywords: ['rolex', 'daytona', '126500ln', 'cosmograph', 'panda', 'white'],
    forensicIndicators: {
      logoFontKerning: 'Tri-compax sub-dials with thin metal rings (Calibre 4131)',
      rehautAlignment: 'Rolex crown at 12 oclock rehaut',
      cyclopsMagnification: 'N/A (No date)',
      hallmarks: 'Monobloc Cerachrom bezel with metal border edge'
    }
  },
  {
    id: 'rol-126710blro',
    category: 'Watches',
    brand: 'Rolex',
    model: 'GMT-Master II "Pepsi"',
    referenceNumber: '126710BLRO',
    caseMaterial: 'Steel',
    caseSizeMm: 40,
    movement: 'Automatic',
    braceletType: 'Jubilee',
    baselineMarketValueUSD: 21500,
    keywords: ['rolex', 'gmt', 'pepsi', '126710blro', 'blro', 'jubilee'],
    forensicIndicators: {
      logoFontKerning: 'Red and blue bi-color Cerachrom insert seamless transition',
      rehautAlignment: 'Laser-etched crown inside sapphire crystal at 6 oclock',
      cyclopsMagnification: '2.5x date magnification',
      hallmarks: '5-link Jubilee bracelet with Easylink 5mm comfort extension'
    }
  },
  {
    id: 'rol-228238',
    category: 'Watches',
    brand: 'Rolex',
    model: 'Day-Date 40 Yellow Gold Champagne Dial',
    referenceNumber: '228238',
    caseMaterial: 'Yellow Gold',
    caseSizeMm: 40,
    movement: 'Automatic',
    braceletType: 'President',
    baselineMarketValueUSD: 44000,
    keywords: ['rolex', 'daydate', 'day-date', '228238', 'president', 'gold'],
    forensicIndicators: {
      logoFontKerning: 'Full day of week at 12 oclock in 26 available languages',
      rehautAlignment: 'Solid 18k yellow gold case rehaut engraving',
      cyclopsMagnification: '2.5x date cyclops at 3 oclock',
      hallmarks: 'St. Bernard dog head 18k gold hallmark on lug underside'
    }
  },

  // ── PATEK PHILIPPE ───────────────────────────────────────────────────────
  {
    id: 'pat-5711-1a',
    category: 'Watches',
    brand: 'Patek Philippe',
    model: 'Nautilus Blue Dial',
    referenceNumber: '5711/1A-010',
    caseMaterial: 'Steel',
    caseSizeMm: 40,
    movement: 'Automatic',
    braceletType: 'Oyster',
    baselineMarketValueUSD: 115000,
    keywords: ['patek', 'philippe', 'nautilus', '5711', '5711/1a', 'blue'],
    forensicIndicators: {
      logoFontKerning: 'Patek Philippe Geneve horizontal gradient dial emboss',
      rehautAlignment: 'Integrated porthole case geometry with lateral ear hinges',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Patek Philippe Seal hallmark on Calibre 26-330 S C rotor'
    }
  },
  {
    id: 'pat-5811-1g',
    category: 'Watches',
    brand: 'Patek Philippe',
    model: 'Nautilus White Gold',
    referenceNumber: '5811/1G-001',
    caseMaterial: 'White Gold',
    caseSizeMm: 41,
    movement: 'Automatic',
    braceletType: 'Oyster',
    baselineMarketValueUSD: 145000,
    keywords: ['patek', 'philippe', 'nautilus', '5811', '5811/1g', 'white gold'],
    forensicIndicators: {
      logoFontKerning: 'Sunburst blue dial with black-gradient rim transition',
      rehautAlignment: 'Two-part case construction with pull-out piece lever system',
      cyclopsMagnification: 'N/A',
      hallmarks: '750 White Gold balance seal hallmark on clasp'
    }
  },
  {
    id: 'pat-5167a',
    category: 'Watches',
    brand: 'Patek Philippe',
    model: 'Aquanaut Extra Large',
    referenceNumber: '5167A-001',
    caseMaterial: 'Steel',
    caseSizeMm: 40.8,
    movement: 'Automatic',
    braceletType: 'Rubber',
    baselineMarketValueUSD: 48500,
    keywords: ['patek', 'aquanaut', '5167a', '5167', 'tropical', 'rubber'],
    forensicIndicators: {
      logoFontKerning: 'Geosphere grid embossed pattern dial',
      rehautAlignment: 'Satin-brushed rounded octagonal bezel',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Composite Tropical strap with fold-over clasp'
    }
  },

  // ── AUDEMARS PIGUET ──────────────────────────────────────────────────────
  {
    id: 'ap-16202st',
    category: 'Watches',
    brand: 'Audemars Piguet',
    model: 'Royal Oak "Jumbo" Extra-Thin',
    referenceNumber: '16202ST.OO.1240ST.01',
    caseMaterial: 'Steel',
    caseSizeMm: 39,
    movement: 'Automatic',
    braceletType: 'Oyster',
    baselineMarketValueUSD: 68000,
    keywords: ['audemars', 'piguet', 'royal oak', '16202', '16202st', 'jumbo'],
    forensicIndicators: {
      logoFontKerning: 'Bleu Nuit Nuage 50 Petite Tapisserie pattern dial',
      rehautAlignment: '8 hexagonal white gold exposed bezel screws aligned seamlessly',
      cyclopsMagnification: 'N/A',
      hallmarks: 'AP initials logo printed at 6 oclock position'
    }
  },
  {
    id: 'ap-15500st',
    category: 'Watches',
    brand: 'Audemars Piguet',
    model: 'Royal Oak Selfwinding 41mm',
    referenceNumber: '15500ST.OO.1220ST.01',
    caseMaterial: 'Steel',
    caseSizeMm: 41,
    movement: 'Automatic',
    braceletType: 'Oyster',
    baselineMarketValueUSD: 42000,
    keywords: ['audemars', 'piguet', 'royal oak', '15500', '15500st', '41mm'],
    forensicIndicators: {
      logoFontKerning: 'Grande Tapisserie pattern with wider date window positioning',
      rehautAlignment: 'Bevelled case edges hand-finished with satin brushing',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Calibre 4302 22k gold openworked oscillating weight'
    }
  },

  // ── RICHARD MILLE ────────────────────────────────────────────────────────
  {
    id: 'rm-11-03',
    category: 'Watches',
    brand: 'Richard Mille',
    model: 'RM 11-03 Automatic Flyback Chronograph Titanium',
    referenceNumber: 'RM11-03 TI',
    caseMaterial: 'Titanium',
    caseSizeMm: 44,
    movement: 'Automatic',
    braceletType: 'Rubber',
    baselineMarketValueUSD: 220000,
    keywords: ['richard', 'mille', 'rm11-03', 'rm1103', 'titanium', 'skeleton'],
    forensicIndicators: {
      logoFontKerning: 'Skeletonized dial with sapphire crystal anti-glare coating',
      rehautAlignment: 'Tripartite tonneau case with grade 5 titanium spline screws',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Variable-geometry rotorRMAC3 caliber engraving'
    }
  },

  // ── CARTIER ──────────────────────────────────────────────────────────────
  {
    id: 'car-santos-large',
    category: 'Watches',
    brand: 'Cartier',
    model: 'Santos de Cartier Large',
    referenceNumber: 'WSSA0018',
    caseMaterial: 'Steel',
    caseSizeMm: 39.8,
    movement: 'Automatic',
    braceletType: 'Oyster',
    baselineMarketValueUSD: 7200,
    keywords: ['cartier', 'santos', 'wssa0018', 'large', 'steel'],
    forensicIndicators: {
      logoFontKerning: 'Hidden CARTIER signature inside 7 oclock Roman numeral VII',
      rehautAlignment: 'Square bezel with 8 exposed screws',
      cyclopsMagnification: 'N/A',
      hallmarks: 'SmartLink bracelet resizing mechanism & QuickSwitch system'
    }
  },
  {
    id: 'car-love-bracelet',
    category: 'Fine Jewelry',
    brand: 'Cartier',
    model: 'Love Bracelet 18K Yellow Gold',
    referenceNumber: 'B6035517',
    metalPurity: '18K',
    baselineMarketValueUSD: 7800,
    keywords: ['cartier', 'love', 'bracelet', 'b6035517', 'gold', '18k'],
    forensicIndicators: {
      logoFontKerning: 'Cartier script hallmark + 750 + unique 6-digit serial engraving',
      rehautAlignment: 'Screw motif alignment and precise hinge closure tolerance',
      cyclopsMagnification: 'N/A',
      hallmarks: '18k 750 eagle head French hallmark stamp'
    }
  },

  // ── HERMÈS ───────────────────────────────────────────────────────────────
  {
    id: 'her-birkin-30',
    category: 'Handbags',
    brand: 'Hermès',
    model: 'Birkin 30 Black Epsom Gold Hardware',
    referenceNumber: 'HER-BIR-30-EPS',
    leatherType: 'Epsom',
    hardware: 'Gold (GHW)',
    bagSize: '30',
    baselineMarketValueUSD: 24500,
    keywords: ['hermes', 'hermès', 'birkin', 'birkin 30', 'epsom', 'black', 'ghw'],
    forensicIndicators: {
      logoFontKerning: 'Hermès Paris Made in France gold foil heat stamp depth',
      rehautAlignment: 'Sangles turn-lock plate with clean blind stamp date letter',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Guilloché pattern engraving on turn-lock touret'
    }
  },
  {
    id: 'her-kelly-25',
    category: 'Handbags',
    brand: 'Hermès',
    model: 'Kelly 25 Sellier Crocodile Porosus',
    referenceNumber: 'HER-KEL-25-CRO',
    leatherType: 'Crocodile',
    hardware: 'Gold (GHW)',
    bagSize: '25',
    baselineMarketValueUSD: 68000,
    keywords: ['hermes', 'hermès', 'kelly', 'kelly 25', 'sellier', 'crocodile', 'porosus'],
    forensicIndicators: {
      logoFontKerning: 'Caret symbol (^) indicating Porosus crocodile skin origin',
      rehautAlignment: 'Rigid Sellier external stitching precision and edge paint coating',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Solid brass gold-plated padlock with matching key numbers'
    }
  },
  {
    id: 'her-birkin-25-togo',
    category: 'Handbags',
    brand: 'Hermès',
    model: 'Birkin 25 Togo Gold Hardware',
    referenceNumber: 'B25-TOGO-GHW',
    leatherType: 'Togo Leather',
    hardware: 'Gold (GHW)',
    bagSize: '25',
    baselineMarketValueUSD: 28500,
    keywords: ['hermes', 'hermès', 'birkin', 'birkin 25', 'togo', 'quota bag', 'ghw'],
    forensicIndicators: {
      logoFontKerning: 'HERMÈS PARIS MADE IN FRANCE heat stamp centered below front flap seam',
      rehautAlignment: 'Hand-sewn saddle stitch (sellier) with signature 18-degree diagonal slant',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Blind stamp code on interior left strap arm (e.g. W for 2024, B for 2023); no serial card'
    }
  },
  {
    id: 'her-kelly-25-epsom',
    category: 'Handbags',
    brand: 'Hermès',
    model: 'Kelly 25 Sellier Epsom Palladium Hardware',
    referenceNumber: 'K25-EPSOM-PHW',
    leatherType: 'Epsom Calfskin',
    hardware: 'Palladium (PHW)',
    bagSize: '25',
    baselineMarketValueUSD: 26000,
    keywords: ['hermes', 'hermès', 'kelly', 'kelly 25', 'sellier', 'epsom', 'phw', 'palladium'],
    forensicIndicators: {
      logoFontKerning: 'Foil heat stamp cleanly embossed into Epsom grain without bleeding',
      rehautAlignment: 'Clasp touret turn-lock operates with smooth continuous resistance',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Matching key and padlock serial numbers engraved on bottom face'
    }
  },

  // ── CHANEL ───────────────────────────────────────────────────────────────
  {
    id: 'cha-classic-medium',
    category: 'Handbags',
    brand: 'Chanel',
    model: 'Classic Medium Double Flap Caviar',
    referenceNumber: 'A01112-CAVIAR',
    leatherType: 'Pebbled Caviar Leather',
    hardware: 'Light Gold Hardware (LGHW)',
    bagSize: '25.5',
    baselineMarketValueUSD: 9500,
    keywords: ['chanel', 'classic flap', 'double flap', 'caviar', 'medium flap', 'lghw'],
    forensicIndicators: {
      logoFontKerning: 'CC turn-lock right C overlaps left C at top, left C overlaps right at bottom',
      rehautAlignment: 'Diamond quilting stitches align seamlessly across back patch pocket and flap',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Post-2021 interior metal NFC microchip plaque with random 8-char code'
    }
  },

  // ── VAN CLEEF & ARPELS ──────────────────────────────────────────────────
  {
    id: 'vca-alhambra-5',
    category: 'Fine Jewelry',
    brand: 'Van Cleef & Arpels',
    model: 'Vintage Alhambra 5 Motifs Yellow Gold Onyx',
    referenceNumber: 'VCARA41300',
    metalPurity: '18K Yellow Gold & Onyx',
    baselineMarketValueUSD: 4900,
    keywords: ['van cleef', 'vca', 'alhambra', 'onyx', 'vintage alhambra', 'vcara41300'],
    forensicIndicators: {
      logoFontKerning: 'Stamped VCA or Van Cleef & Arpels (never just Van Cleef)',
      rehautAlignment: 'Beaded perlee border beads are symmetrical around every clover motif',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Au750 stamp and individual serial number engraved on lobster clasp tag'
    }
  },

  // ── LUXURY VEHICLES ──────────────────────────────────────────────────────
  {
    id: 'fer-sf90-xx',
    category: 'Luxury Vehicles',
    brand: 'Ferrari',
    model: 'SF90 XX Stradale',
    referenceNumber: 'FER-SF90-XX-2025',
    baselineMarketValueUSD: 980000,
    keywords: ['ferrari', 'sf90', 'sf90 xx', 'stradale', 'v8', 'hybrid'],
    forensicIndicators: {
      logoFontKerning: 'Prancing Horse emblem 3D enamel badge',
      rehautAlignment: 'Fixed carbon fiber rear wing downforce geometry',
      cyclopsMagnification: 'N/A',
      hallmarks: '17-digit VIN etched on windshield base & chassis plate'
    }
  },
  {
    id: 'por-911-gt3-rs',
    category: 'Luxury Vehicles',
    brand: 'Porsche',
    model: '911 GT3 RS (992 Gen) 4.0L',
    referenceNumber: '992-GT3RS',
    baselineMarketValueUSD: 485000,
    keywords: ['porsche', '911', 'gt3 rs', 'gt3rs', '992', 'weissach', 'flat-6', 'naturally aspirated'],
    forensicIndicators: {
      logoFontKerning: 'PORSCHE rear light bar lettering and GT3 RS side graphics',
      rehautAlignment: 'Active DRS swan-neck rear wing and front diffuser air vanes',
      cyclopsMagnification: 'N/A',
      hallmarks: '4.0L NA Flat-6 engine (518 hp, 9000 RPM redline), carbon fiber hood and doors'
    }
  },
  {
    id: 'bug-chiron-w16',
    category: 'Luxury Vehicles',
    brand: 'Bugatti',
    model: 'Chiron 8.0L W16 Quad-Turbo',
    referenceNumber: 'CHIRON-W16',
    baselineMarketValueUSD: 3600000,
    keywords: ['bugatti', 'chiron', 'w16', 'quad-turbo', 'molsheim', 'hypercar'],
    forensicIndicators: {
      logoFontKerning: 'Solid enamel Macaron badge on horseshoe grille',
      rehautAlignment: 'Signature C-line side curve separating duo-tone carbon body panels',
      cyclopsMagnification: 'N/A',
      hallmarks: '8.0L Quad-Turbo W16 engine (1479 hp), top speed limited to 420 km/h'
    }
  },

  // ── EXPANSION BATCH 1 — Watches: Rolex depth ─────────────────────────────
  {
    id: 'rol-124060',
    category: 'Watches',
    brand: 'Rolex',
    model: 'Submariner No Date 41mm',
    referenceNumber: '124060',
    caseMaterial: 'Oystersteel',
    caseSizeMm: 41,
    movement: 'Automatic',
    braceletType: 'Oyster',
    baselineMarketValueUSD: 10500,
    keywords: ['rolex', 'submariner', 'no date', 'nodate', '124060', 'black'],
    forensicIndicators: {
      logoFontKerning: 'Rolex coronet 5-point symmetry, sharp laser etch',
      rehautAlignment: 'Double ROLEX engraving; X aligns with right minute markers, coronet at 12',
      cyclopsMagnification: 'N/A (No date window)',
      hallmarks: 'Oystersteel 904L brushed lugs, polished flanks, laser coronet at 6 on crystal'
    }
  },
  {
    id: 'rol-126234',
    category: 'Watches',
    brand: 'Rolex',
    model: 'Datejust 36 Steel/White Gold Blue Dial',
    referenceNumber: '126234',
    caseMaterial: 'Steel and White Gold',
    caseSizeMm: 36,
    movement: 'Automatic',
    braceletType: 'Jubilee',
    baselineMarketValueUSD: 12500,
    keywords: ['rolex', 'datejust', '126234', 'jubilee', 'blue', 'fluted'],
    forensicIndicators: {
      logoFontKerning: 'Fluted white gold bezel with precise 60-flute geometry',
      rehautAlignment: 'Engraved ROLEXROLEX rehaut with crown at 12',
      cyclopsMagnification: '2.5x cyclops with underside AR coating',
      hallmarks: 'Jubilee 5-link bracelet with concealed Crownclasp'
    }
  },
  {
    id: 'rol-126720vtnr',
    category: 'Watches',
    brand: 'Rolex',
    model: 'GMT-Master II "Bruce Wayne" Grey/Black',
    referenceNumber: '126720VTNR',
    caseMaterial: 'Oystersteel',
    caseSizeMm: 40,
    movement: 'Automatic',
    braceletType: 'Oyster',
    baselineMarketValueUSD: 12500,
    keywords: ['rolex', 'gmt', 'bruce wayne', '126720vtnr', 'grey', 'black', 'lefty'],
    forensicIndicators: {
      logoFontKerning: 'Grey/black Cerachrom bezel with platinum PVD numerals',
      rehautAlignment: 'Crown on LEFT side (destro configuration)',
      cyclopsMagnification: '2.5x date cyclops',
      hallmarks: 'Calibre 3285 with Chronergy escapement, 70h reserve'
    }
  },
  {
    id: 'rol-m126506',
    category: 'Watches',
    brand: 'Rolex',
    model: 'Cosmograph Daytona Platinum Ice Blue',
    referenceNumber: '126506',
    caseMaterial: 'Platinum',
    caseSizeMm: 40,
    movement: 'Automatic',
    braceletType: 'Oyster',
    baselineMarketValueUSD: 75000,
    keywords: ['rolex', 'daytona', 'platinum', '126506', 'ice blue', 'cerachrom'],
    forensicIndicators: {
      logoFontKerning: 'Ice blue dial exclusive to platinum models',
      rehautAlignment: 'Solid 950 platinum case, heaviest Daytona variant',
      cyclopsMagnification: 'N/A (No date)',
      hallmarks: 'Chestnut brown Cerachrom monobloc bezel'
    }
  },
  {
    id: 'rol-m228206',
    category: 'Watches',
    brand: 'Rolex',
    model: 'Day-Date 40 Platinum Ice Blue',
    referenceNumber: '228206',
    caseMaterial: 'Platinum',
    caseSizeMm: 40,
    movement: 'Automatic',
    braceletType: 'President',
    baselineMarketValueUSD: 62000,
    keywords: ['rolex', 'day-date', 'president', 'platinum', '228206', 'ice blue'],
    forensicIndicators: {
      logoFontKerning: 'Ice blue dial with applied roman or baton markers',
      rehautAlignment: 'Solid 950 platinum President bracelet',
      cyclopsMagnification: '2.5x cyclops, double instant day/date change at midnight',
      hallmarks: 'Concealed Crownclasp with polished links'
    }
  },
  {
    id: 'rol-m326934',
    category: 'Watches',
    brand: 'Rolex',
    model: 'Sky-Dweller Steel White Gold Black Dial',
    referenceNumber: '326934',
    caseMaterial: 'Steel and White Gold',
    caseSizeMm: 42,
    movement: 'Automatic',
    braceletType: 'Oyster',
    baselineMarketValueUSD: 18500,
    keywords: ['rolex', 'sky-dweller', '326934', 'annual calendar', 'ring command'],
    forensicIndicators: {
      logoFontKerning: 'Off-centre annual calendar month apertures around dial edge',
      rehautAlignment: 'Ring Command fluted rotatable bezel controls functions',
      cyclopsMagnification: '2.5x cyclops on date at 3',
      hallmarks: 'Calibre 9001, dual time zone with 24h disc'
    }
  },

  // ── EXPANSION BATCH 1 — Watches: Omega / Cartier / Hublot / Panerai / IWC ─
  {
    id: 'ome-smp-300',
    category: 'Watches',
    brand: 'Omega',
    model: 'Seamaster Diver 300M Steel Black',
    referenceNumber: '210.30.42.20.01.001',
    caseMaterial: 'Steel',
    caseSizeMm: 42,
    movement: 'Automatic',
    braceletType: 'Steel integrated',
    baselineMarketValueUSD: 4200,
    keywords: ['omega', 'seamaster', 'diver 300m', 'smp', 'wave dial', 'hevalite'],
    forensicIndicators: {
      logoFontKerning: 'Ω Omega logo and wave-pattern dial texture',
      rehautAlignment: 'Ceramic bezel with white enamel diving scale',
      cyclopsMagnification: 'N/A (No cyclops)',
      hallmarks: 'Master Chronometer METAS certified Calibre 8800, 15,000 gauss antimagnetic'
    }
  },
  {
    id: 'ome-speedy-pro',
    category: 'Watches',
    brand: 'Omega',
    model: 'Speedmaster Professional Moonwatch',
    referenceNumber: '310.30.42.50.01.001',
    caseMaterial: 'Steel',
    caseSizeMm: 42,
    movement: 'Manual Wind',
    braceletType: 'Steel integrated',
    baselineMarketValueUSD: 6500,
    keywords: ['omega', 'speedmaster', 'moonwatch', 'speedy', 'professional', 'hesalite'],
    forensicIndicators: {
      logoFontKerning: 'Dot over 90 on bezel (DO90), step dial',
      rehautAlignment: 'Hesalite crystal with small Ω center emblem',
      cyclopsMagnification: 'N/A (No cyclops)',
      hallmarks: 'Calibre 3861, Co-Axial Master Chronometer, NASA flight-qualified'
    }
  },
  {
    id: 'car-tank-must',
    category: 'Watches',
    brand: 'Cartier',
    model: 'Tank Must Large Steel',
    referenceNumber: 'WSTA0041',
    caseMaterial: 'Steel',
    caseSizeMm: 33.7,
    movement: 'Quartz',
    braceletType: 'Leather strap',
    baselineMarketValueUSD: 2800,
    keywords: ['cartier', 'tank', 'must', 'wsta0041', 'blue hands'],
    forensicIndicators: {
      logoFontKerning: 'CARTIER in serif print, hidden CARTIER in VII numeral',
      rehautAlignment: 'Rectangular case with brancards (side bars) aligned to lugs',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Blued sword-shaped hands, cabochon sapphire crown'
    }
  },
  {
    id: 'hub-bigbang-unico',
    category: 'Watches',
    brand: 'Hublot',
    model: 'Big Bang Unico Titanium 42mm',
    referenceNumber: '441.NX.1177.RX',
    caseMaterial: 'Titanium',
    caseSizeMm: 42,
    movement: 'Automatic',
    braceletType: 'Rubber/lined alligator',
    baselineMarketValueUSD: 15500,
    keywords: ['hublot', 'big bang', 'unico', '441.nx', 'titanium', 'skeleton'],
    forensicIndicators: {
      logoFontKerning: 'HUBLOT block lettering, porthole design (hublot = French for porthole)',
      rehautAlignment: 'Sandwich case construction with 6 H-shaped titanium screws',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Unico MHUB1280 flyback chronograph column wheel visible at 6'
    }
  },
  {
    id: 'pan-luminor-1950',
    category: 'Watches',
    brand: 'Panerai',
    model: 'Luminor Marina 44mm Steel',
    referenceNumber: 'PAM01312',
    caseMaterial: 'AISI 316L Steel',
    caseSizeMm: 44,
    movement: 'Automatic',
    braceletType: 'Leather strap',
    baselineMarketValueUSD: 6500,
    keywords: ['panerai', 'luminor', 'marina', 'pam01312', 'pam1312', 'sandwich dial'],
    forensicIndicators: {
      logoFontKerning: 'OP (Officine Panerai) logo above 6 with arrow',
      rehautAlignment: 'Signature crown guard lever mechanism',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Sandwich dial construction with luminous layer beneath'
    }
  },
  {
    id: 'iwc-portugieser-chrono',
    category: 'Watches',
    brand: 'IWC',
    model: 'Portugieser Chronograph Steel White Dial',
    referenceNumber: 'IW371617',
    caseMaterial: 'Steel',
    caseSizeMm: 41,
    movement: 'Automatic',
    braceletType: 'Leather strap',
    baselineMarketValueUSD: 7200,
    keywords: ['iwc', 'portugieser', 'chronograph', 'iw371617', 'white dial'],
    forensicIndicators: {
      logoFontKerning: 'IWC Schaffhausen in serif font at 12',
      rehautAlignment: 'Feuille (leaf-shaped) hands, railroad minute track',
      cyclopsMagnification: 'N/A',
      hallmarks: 'In-house Calibre 69355,30-min and 12-hr subdials symmetric at 12/6'
    }
  },

  // ── EXPANSION BATCH 1 — Handbags: LV / Dior / Gucci / Goyard / YSL ──────
  {
    id: 'lv-neverfull-mm',
    category: 'Handbags',
    brand: 'Louis Vuitton',
    model: 'Neverfull MM Monogram',
    referenceNumber: 'M40995',
    leatherType: 'Coated Canvas',
    hardware: 'Gold',
    bagSize: 'MM',
    baselineMarketValueUSD: 2200,
    keywords: ['louis vuitton', 'lv', 'neverfull', 'm40995', 'monogram', 'damier'],
    forensicIndicators: {
      logoFontKerning: 'LOUIS VUITTON heat stamp: rounded O, short-tailed N, tight T overlap',
      rehautAlignment: 'Symmetrical monogram placement across seams (mirrored left-right)',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Date code/sp Microchip (post-2021) inside seam; LV engraved on D-ring'
    }
  },
  {
    id: 'lv-alma-bb',
    category: 'Handbags',
    brand: 'Louis Vuitton',
    model: 'Alma BB Monogram',
    referenceNumber: 'M45920',
    leatherType: 'Coated Canvas',
    hardware: 'Gold',
    bagSize: 'BB',
    baselineMarketValueUSD: 1800,
    keywords: ['louis vuitton', 'alma', 'bb', 'm45920', 'monogram'],
    forensicIndicators: {
      logoFontKerning: 'Symmetric monogram on structured Alma body',
      rehautAlignment: 'Double zip pull with leather pull tabs',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Vachetta leather trim patina, Toron handles'
    }
  },
  {
    id: 'dio-lady-dior-mini',
    category: 'Handbags',
    brand: 'Dior',
    model: 'Lady Dior Mini Cannage Lambskin',
    referenceNumber: 'M0545',
    leatherType: 'Lambskin',
    hardware: 'Gold (GHW)',
    bagSize: 'Mini',
    baselineMarketValueUSD: 5900,
    keywords: ['dior', 'lady dior', 'cannage', 'lambskin', 'mini'],
    forensicIndicators: {
      logoFontKerning: 'DIOR charms hanging from handles, letter spacing uniform',
      rehautAlignment: 'Cannage stitching quilting pattern symmetric on all panels',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Lambskin texture, gold hardware engraved DIOR, made in italy stamp'
    }
  },
  {
    id: 'guc-horsebit-1955',
    category: 'Handbags',
    brand: 'Gucci',
    model: 'Horsebit 1955 Shoulder Bag',
    referenceNumber: '628274',
    leatherType: 'Coated Canvas/Leather',
    hardware: 'Gold',
    bagSize: 'Shoulder',
    baselineMarketValueUSD: 3200,
    keywords: ['gucci', 'horsebit 1955', '628274', 'gg canvas', 'shoulder'],
    forensicIndicators: {
      logoFontKerning: 'GG Supreme monogram canvas symmetric interlocking pattern',
      rehautAlignment: 'Horsebit hardware with engraved GUCCI',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Serial tag with ®, heat stamp GUCCI made in italy'
    }
  },
  {
    id: 'ysl-loulou-small',
    category: 'Handbags',
    brand: 'Saint Laurent',
    model: 'LouLou Small Quilted Leather',
    referenceNumber: '628274-YS',
    leatherType: 'Calfskin',
    hardware: 'Silver',
    bagSize: 'Small',
    baselineMarketValueUSD: 2950,
    keywords: ['saint laurent', 'ysl', 'loulou', 'quilted', 'small', 'calfskin'],
    forensicIndicators: {
      logoFontKerning: 'YSL interlocking Cassandre logo hardware on front',
      rehautAlignment: 'Chevron/quilted leather pattern symmetric alignment',
      cyclopsMagnification: 'N/A',
      hallmarks: 'SAINT LAURENT PARIS heat stamp inside, made in italy'
    }
  },

  // ── EXPANSION BATCH 1 — Jewelry: Tiffany / Bvlgari ──────────────────────
  {
    id: 'tiff-t-wire-bracelet',
    category: 'Fine Jewelry',
    brand: 'Tiffany & Co.',
    model: 'T Wire Bracelet Sterling Silver',
    referenceNumber: 'TTF026',
    metalPurity: 'Sterling Silver 925',
    baselineMarketValueUSD: 750,
    keywords: ['tiffany', 't wire', 'bracelet', 'sterling', 'silver', 'ttf026'],
    forensicIndicators: {
      logoFontKerning: 'Tiffany & Co. engraved logo in fine serif',
      rehautAlignment: 'T motif sculpture with clean seamless weld',
      cyclopsMagnification: 'N/A',
      hallmarks: 'T&CO. 925 sterling stamp, maker marks'
    }
  },
  {
    id: 'bul-bzero1-ring',
    category: 'Fine Jewelry',
    brand: 'Bvlgari',
    model: 'B.zero1 Rock 18K White Gold Band',
    referenceNumber: '354723',
    metalPurity: '18K White Gold',
    baselineMarketValueUSD: 3400,
    keywords: ['bvlgari', 'bulgari', 'bzero1', 'b.zero1', 'ring', 'white gold', '354723'],
    forensicIndicators: {
      logoFontKerning: 'BVLGARI engraved in Roman V style lettering on band profile',
      rehautAlignment: 'Central band spiral inscription BVLGARI BVLGARI',
      cyclopsMagnification: 'N/A',
      hallmarks: '750 hallmark, ring band with spring effect design'
    }
  },

  // ── EXPANSION BATCH 1 — Vehicles: Lamborghini / Rolls-Royce / Bentley ────
  {
    id: 'lam-huracan-evo',
    category: 'Luxury Vehicles',
    brand: 'Lamborghini',
    model: 'Huracán EVO 5.2L V10',
    referenceNumber: 'LAM-HUR-EVO',
    baselineMarketValueUSD: 265000,
    keywords: ['lamborghini', 'huracan', 'huracán', 'evo', 'v10', 'spyder'],
    forensicIndicators: {
      logoFontKerning: 'Gold bull shield emblem on front/rear',
      rehautAlignment: 'Hexagonal design language, Y-shaped LED signatures',
      cyclopsMagnification: 'N/A',
      hallmarks: '5.2L NA V10 (631 hp), 7-speed LDF dual-clutch'
    }
  },
  {
    id: 'rr-ghost-ii',
    category: 'Luxury Vehicles',
    brand: 'Rolls-Royce',
    model: 'Ghost Series II 6.75L V12',
    referenceNumber: 'RR-GHOST-II',
    baselineMarketValueUSD: 380000,
    keywords: ['rolls-royce', 'ghost', 'series ii', 'v12', 'starlight'],
    forensicIndicators: {
      logoFontKerning: 'Spirit of Ecstasy hood ornament, retractable',
      rehautAlignment: 'Pantheon grille hand-finished, no visible welds',
      cyclopsMagnification: 'N/A',
      hallmarks: '6.75L Twin-Turbo V12, Planar suspension, Starlight headliner optional'
    }
  },
  {
    id: 'ben-continental-gt',
    category: 'Luxury Vehicles',
    brand: 'Bentley',
    model: 'Continental GT Speed 6.0L W12',
    referenceNumber: 'BEN-CONT-GT-SPEED',
    baselineMarketValueUSD: 300000,
    keywords: ['bentley', 'continental gt', 'speed', 'w12', 'mulliner'],
    forensicIndicators: {
      logoFontKerning: 'Winged B emblem with retractable variant',
      rehautAlignment: 'Diamond-knurled surfaces, rotating center display',
      cyclopsMagnification: 'N/A',
      hallmarks: '6.0L Twin-Turbo W12 (650 hp), all-wheel drive'
    }
  },

  // ── EXPANSION BATCH 2 — high-traded gaps: Tudor / VC / JLC / GS + Rolex depth ─
  {
    id: 'tud-bb58-79030n',
    category: 'Watches',
    brand: 'Tudor',
    model: 'Black Bay Fifty-Eight 39mm Black',
    referenceNumber: '79030N',
    caseMaterial: 'Steel',
    caseSizeMm: 39,
    movement: 'Automatic',
    braceletType: 'Steel riveted',
    baselineMarketValueUSD: 3600,
    keywords: ['tudor', 'black bay', 'bb58', 'fifty-eight', '79030n', 'black', 'snowflake'],
    forensicIndicators: {
      logoFontKerning: 'Tudor shield logo (post-2018); snowflake hour hand distinctive to Tudor divers',
      rehautAlignment: 'Domed black aluminium bezel insert, gilt accents',
      cyclopsMagnification: 'N/A (No date)',
      hallmarks: 'Manufacture Calibre MT5402, COSC certified, 70h reserve; riveted-style steel bracelet'
    }
  },
  {
    id: 'tud-bb58-79030b',
    category: 'Watches',
    brand: 'Tudor',
    model: 'Black Bay Fifty-Eight 39mm Navy Blue',
    referenceNumber: '79030B',
    caseMaterial: 'Steel',
    caseSizeMm: 39,
    movement: 'Automatic',
    braceletType: 'Steel riveted',
    baselineMarketValueUSD: 3800,
    keywords: ['tudor', 'black bay', 'bb58', 'fifty-eight', '79030b', 'navy', 'blue'],
    forensicIndicators: {
      logoFontKerning: 'Tudor shield logo; snowflake hand; navy blue matte dial and bezel',
      rehautAlignment: 'Domed navy aluminium bezel insert with gilt scale',
      cyclopsMagnification: 'N/A (No date)',
      hallmarks: 'Calibre MT5402 COSC; gilt "Black Bay" script on dial'
    }
  },
  {
    id: 'tud-pelagos-25600tn',
    category: 'Watches',
    brand: 'Tudor',
    model: 'Pelagos 42mm Titanium',
    referenceNumber: '25600TN',
    caseMaterial: 'Titanium',
    caseSizeMm: 42,
    movement: 'Automatic',
    braceletType: 'Titanium',
    baselineMarketValueUSD: 4200,
    keywords: ['tudor', 'pelagos', '25600tn', 'titanium', 'black', 'diver'],
    forensicIndicators: {
      logoFontKerning: 'Tudor shield logo; matte black ceramic bezel; applied square markers',
      rehautAlignment: 'Ceramic bezel insert with lume-filled graduations',
      cyclopsMagnification: 'N/A (No cyclops, snowflake hands)',
      hallmarks: 'Titanium case+bracelet with spring-loaded auto-adjust clasp; MT5612 COSC, helium valve'
    }
  },
  {
    id: 'vc-overseas-4500v',
    category: 'Watches',
    brand: 'Vacheron Constantin',
    model: 'Overseas Automatic Blue Dial',
    referenceNumber: '4500V/110A-B128',
    caseMaterial: 'Steel',
    caseSizeMm: 41,
    movement: 'Automatic',
    braceletType: 'Steel integrated',
    baselineMarketValueUSD: 32000,
    keywords: ['vacheron', 'constantin', 'overseas', '4500v', 'blue', 'integrated'],
    forensicIndicators: {
      logoFontKerning: 'Maltese cross emblem at 12; VC logo crisp applied',
      rehautAlignment: 'Six-sided bezel echoing the Maltese cross; half-Maltese-cross bracelet links',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Hallmark of Geneva (Poinçon de Genève); interchangeable quick-release bracelet/strap system'
    }
  },
  {
    id: 'jlc-reverso-classic',
    category: 'Watches',
    brand: 'Jaeger-LeCoultre',
    model: 'Reverso Classic Medium Thin',
    referenceNumber: 'Q2548520',
    caseMaterial: 'Steel',
    caseSizeMm: 40,
    movement: 'Manual Wind',
    braceletType: 'Leather',
    baselineMarketValueUSD: 6500,
    keywords: ['jaeger', 'lecoultre', 'jlc', 'reverso', 'q2548520', 'art deco', 'rectangular'],
    forensicIndicators: {
      logoFontKerning: 'Art Deco gadroons (three parallel lines) top and bottom of the reversible case',
      rehautAlignment: 'Case fully reverses on its cradle to protect the dial',
      cyclopsMagnification: 'N/A',
      hallmarks: 'JLC 1000 Hours Control certification; blank caseback for engraving'
    }
  },
  {
    id: 'gs-snowflake-sbga211',
    category: 'Watches',
    brand: 'Grand Seiko',
    model: 'Snowflake Spring Drive Titanium',
    referenceNumber: 'SBGA211',
    caseMaterial: 'Titanium',
    caseSizeMm: 41,
    movement: 'Spring Drive',
    braceletType: 'Titanium',
    baselineMarketValueUSD: 5200,
    keywords: ['grand seiko', 'snowflake', 'sbga211', 'spring drive', 'titanium', 'white'],
    forensicIndicators: {
      logoFontKerning: 'Applied GS logo at 12; textured "snowflake" dial finish',
      rehautAlignment: 'Zaratsu-polished distortion-free bezel and case flanks',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Spring Drive Calibre 9R65 with gliding (non-ticking) seconds hand; power reserve at 8'
    }
  },
  {
    id: 'rol-224270',
    category: 'Watches',
    brand: 'Rolex',
    model: 'Explorer 36mm Black Dial',
    referenceNumber: '224270',
    caseMaterial: 'Oystersteel',
    caseSizeMm: 36,
    movement: 'Automatic',
    braceletType: 'Oyster',
    baselineMarketValueUSD: 8200,
    keywords: ['rolex', 'explorer', '224270', 'black', '36mm', '3-6-9'],
    forensicIndicators: {
      logoFontKerning: 'Iconic 3-6-9 Arabic numerals with Chromalight lume',
      rehautAlignment: 'Engraved ROLEXROLEX rehaut, coronet at 12',
      cyclopsMagnification: 'N/A (No date)',
      hallmarks: 'Calibre 3230 with Chronergy escapement, 70h reserve; smooth polished bezel'
    }
  },
  {
    id: 'rol-126622',
    category: 'Watches',
    brand: 'Rolex',
    model: 'Yacht-Master 40 Rhodium Dial',
    referenceNumber: '126622',
    caseMaterial: 'Steel and Platinum',
    caseSizeMm: 40,
    movement: 'Automatic',
    braceletType: 'Oyster',
    baselineMarketValueUSD: 14500,
    keywords: ['rolex', 'yacht-master', 'yachtmaster', '126622', 'rhodium', 'platinum bezel'],
    forensicIndicators: {
      logoFontKerning: 'Sandblasted 950 platinum bidirectional rotatable bezel with raised polished numerals',
      rehautAlignment: 'Engraved rehaut, crown at 12',
      cyclopsMagnification: '2.5x date cyclops',
      hallmarks: 'Rolesium (steel + platinum) construction; Calibre 3235'
    }
  },
  {
    id: 'car-panthere-medium',
    category: 'Watches',
    brand: 'Cartier',
    model: 'Panthère de Cartier Medium Steel',
    referenceNumber: 'WSPN0007',
    caseMaterial: 'Steel',
    caseSizeMm: 27,
    movement: 'Quartz',
    braceletType: 'Steel link',
    baselineMarketValueUSD: 5400,
    keywords: ['cartier', 'panthere', 'panthère', 'wspn0007', 'medium', 'steel', 'quartz'],
    forensicIndicators: {
      logoFontKerning: 'Hidden CARTIER signature inside a Roman numeral; blue-steel sword hands',
      rehautAlignment: 'Square case with rounded lugs; beaded crown with blue synthetic spinel cabochon',
      cyclopsMagnification: 'N/A',
      hallmarks: 'Signature soft flexible articulated bracelet links; Swiss quartz movement'
    }
  }
]

export function searchWatchCatalog(query: string, categoryFilter?: string): WatchCatalogItem[] {
  if (!query || query.trim().length === 0) return []
  const q = query.toLowerCase().trim()
  const terms = q.split(/\s+/)

  return LUXURY_CATALOG.filter(item => {
    if (categoryFilter && categoryFilter !== 'all' && item.category.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false
    }

    const targetText = `${item.brand} ${item.model} ${item.referenceNumber} ${item.keywords.join(' ')}`.toLowerCase()
    
    // Exact reference match gets highest priority
    if (item.referenceNumber.toLowerCase().includes(q)) return true

    // All terms match somewhere
    return terms.every(term => targetText.includes(term))
  }).slice(0, 8)
}
