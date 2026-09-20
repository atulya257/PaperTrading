import { PAISE_PER_RUPEE } from '../../../config/constants.js'

const stock = (symbol, name, sector, priceRupees, marketCapCr, pe, dailyVol, beta, sectorLoad, description) => ({
  symbol,
  name,
  sector,
  exchange: 'NSE',
  basePrice: priceRupees * PAISE_PER_RUPEE,
  marketCapCr,
  pe,
  description,
  sim: { beta, sectorLoad, dailyVol },
})

export const STOCKS = [
  stock('RELIANCE', 'Reliance Industries', 'Energy', 2890, 1950000, 27, 0.0135, 1.0, 1.0,
    'Diversified conglomerate with interests in refining, petrochemicals, retail and digital services.'),
  stock('ONGC', 'Oil & Natural Gas Corporation', 'Energy', 265, 333000, 8, 0.0165, 1.0, 1.1,
    'State-owned explorer and producer of crude oil and natural gas.'),
  stock('NTPC', 'NTPC Limited', 'Energy', 355, 344000, 17, 0.015, 0.9, 1.1,
    'Large power generation utility operating thermal and renewable capacity.'),

  stock('TCS', 'Tata Consultancy Services', 'IT', 3950, 1430000, 30, 0.0115, 0.75, 1.1,
    'Global IT services, consulting and business solutions provider.'),
  stock('INFY', 'Infosys', 'IT', 1620, 673000, 25, 0.013, 0.85, 1.1,
    'Technology services and digital transformation company.'),
  stock('WIPRO', 'Wipro', 'IT', 480, 251000, 22, 0.014, 0.9, 1.0,
    'IT services and consulting company with a global delivery footprint.'),
  stock('HCLTECH', 'HCL Technologies', 'IT', 1580, 429000, 24, 0.0135, 0.85, 1.05,
    'Engineering, software and IT services group.'),

  stock('HDFCBANK', 'HDFC Bank', 'Banking', 1690, 1290000, 19, 0.012, 1.0, 1.0,
    'Large private-sector bank with a broad retail and corporate franchise.'),
  stock('ICICIBANK', 'ICICI Bank', 'Banking', 1210, 850000, 18, 0.013, 1.1, 1.0,
    'Private-sector bank offering retail, SME and corporate banking.'),
  stock('SBIN', 'State Bank of India', 'Banking', 815, 727000, 10, 0.016, 1.25, 1.1,
    'Largest public-sector bank by assets, with a nationwide branch network.'),
  stock('AXISBANK', 'Axis Bank', 'Banking', 1120, 347000, 13, 0.0155, 1.2, 1.0,
    'Private-sector bank with strong presence in corporate and retail lending.'),
  stock('KOTAKBANK', 'Kotak Mahindra Bank', 'Banking', 1780, 354000, 20, 0.013, 1.0, 1.0,
    'Private-sector bank with allied asset management and insurance businesses.'),

  stock('ITC', 'ITC Limited', 'FMCG', 465, 582000, 26, 0.011, 0.6, 0.9,
    'Consumer goods group spanning cigarettes, foods, hotels and paperboards.'),
  stock('HINDUNILVR', 'Hindustan Unilever', 'FMCG', 2420, 568000, 55, 0.0105, 0.55, 1.0,
    'Household and personal-care products company.'),
  stock('NESTLEIND', 'Nestlé India', 'FMCG', 2510, 242000, 70, 0.011, 0.55, 1.0,
    'Packaged foods and beverages maker.'),

  stock('TATAMOTORS', 'Tata Motors', 'Auto', 940, 346000, 9, 0.0185, 1.35, 1.1,
    'Automobile manufacturer of passenger and commercial vehicles.'),
  stock('MARUTI', 'Maruti Suzuki India', 'Auto', 12400, 390000, 26, 0.013, 0.95, 1.0,
    'Leading passenger car manufacturer in India.'),
  stock('M&M', 'Mahindra & Mahindra', 'Auto', 2850, 354000, 28, 0.015, 1.1, 1.0,
    'Utility vehicles, tractors and farm equipment maker.'),

  stock('SUNPHARMA', 'Sun Pharmaceutical Industries', 'Pharma', 1720, 413000, 36, 0.0125, 0.7, 1.0,
    'Specialty and generic pharmaceutical company.'),
  stock('DRREDDY', "Dr. Reddy's Laboratories", 'Pharma', 6250, 104000, 20, 0.0125, 0.65, 1.0,
    'Global generics and pharmaceutical services company.'),

  stock('LT', 'Larsen & Toubro', 'Infrastructure', 3580, 492000, 32, 0.0135, 1.05, 1.0,
    'Engineering, construction and technology conglomerate.'),
  stock('BHARTIARTL', 'Bharti Airtel', 'Telecom', 1540, 920000, 60, 0.0125, 0.8, 1.0,
    'Telecommunications operator with mobile, broadband and enterprise services.'),

  stock('TITAN', 'Titan Company', 'Consumer', 3420, 304000, 90, 0.015, 1.0, 1.0,
    'Jewellery, watches and eyewear retailer.'),
  stock('ASIANPAINT', 'Asian Paints', 'Consumer', 2780, 267000, 55, 0.013, 0.75, 1.0,
    'Decorative paints and home-improvement products company.'),

  stock('ADANIENT', 'Adani Enterprises', 'Conglomerate', 2980, 343000, 70, 0.021, 1.3, 1.0,
    'Business incubator with interests in mining, airports and infrastructure.'),

  stock('TATASTEEL', 'Tata Steel', 'Metals', 155, 193000, 45, 0.0175, 1.3, 1.1,
    'Integrated steel producer with global operations.'),
  stock('JSWSTEEL', 'JSW Steel', 'Metals', 920, 225000, 28, 0.0165, 1.2, 1.1,
    'Steel manufacturer with a large domestic capacity.'),
]

export const SECTORS = [...new Set(STOCKS.map((s) => s.sector))].sort()

export function toPublicStock({ sim: _sim, basePrice: _basePrice, marketCapCr, ...rest }) {
  return { ...rest, marketCap: marketCapCr * 1e7 }
}
