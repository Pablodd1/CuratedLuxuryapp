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
