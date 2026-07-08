export const seedCategories = [
  { name: 'Cubes Standards', slug: 'cubes-standards' },
  { name: 'Glaçons Cylindriques', slug: 'glaçons-cylindriques' },
  { name: 'Glaçons Sphériques', slug: 'glaçons-spheriques' },
  { name: 'Glace Pilée', slug: 'glace-pilee' },
  { name: 'Blocs de Glace', slug: 'blocs-glace' },
  { name: 'Conditionnement Professionnel', slug: 'conditionnement-pro' },
  { name: 'Autres Produits', slug: 'autres' },
]

export const seedProducts = [
  {
    name: 'Sac de glaçons cubes 5kg',
    slug: 'sac-glacons-cubes-5kg',
    type: 'CUBES_STANDARDS',
    categorySlug: 'cubes-standards',
    unit: 'sac',
    priceParticulier: 1500,
    priceProfessionnel: 1200,
    priceGrossiste: 1000,
    minStockLevel: 50,
    conservationDuration: 48,
  },
  {
    name: 'Sac de glaçons cubes 10kg',
    slug: 'sac-glacons-cubes-10kg',
    type: 'CUBES_STANDARDS',
    categorySlug: 'cubes-standards',
    unit: 'sac',
    priceParticulier: 2500,
    priceProfessionnel: 2000,
    priceGrossiste: 1800,
    minStockLevel: 30,
    conservationDuration: 48,
  },
  {
    name: 'Sac de glaçons cylindriques 5kg',
    slug: 'sac-glacons-cylindriques-5kg',
    type: 'GLAÇONS_CYLINDRIQUES',
    categorySlug: 'glaçons-cylindriques',
    unit: 'sac',
    priceParticulier: 1800,
    priceProfessionnel: 1500,
    priceGrossiste: 1300,
    minStockLevel: 40,
    conservationDuration: 48,
  },
  {
    name: 'Sac de glaçons sphériques 3kg',
    slug: 'sac-glacons-spheriques-3kg',
    type: 'GLAÇONS_SPHÉRIQUES',
    categorySlug: 'glaçons-spheriques',
    unit: 'sac',
    priceParticulier: 2000,
    priceProfessionnel: 1700,
    priceGrossiste: 1500,
    minStockLevel: 20,
    conservationDuration: 48,
  },
  {
    name: 'Sachet glace pilée 2kg',
    slug: 'sachet-glace-pilee-2kg',
    type: 'GLACE_PILÉE',
    categorySlug: 'glace-pilee',
    unit: 'sachet',
    priceParticulier: 1000,
    priceProfessionnel: 800,
    priceGrossiste: 700,
    minStockLevel: 50,
    conservationDuration: 24,
  },
  {
    name: 'Bloc de glace 25kg',
    slug: 'bloc-glace-25kg',
    type: 'BLOCS_GLACE',
    categorySlug: 'blocs-glace',
    unit: 'bloc',
    priceParticulier: 5000,
    priceProfessionnel: 4500,
    priceGrossiste: 4000,
    minStockLevel: 10,
    conservationDuration: 72,
  },
  {
    name: 'Pack professionnel glaçons 50kg',
    slug: 'pack-pro-glacons-50kg',
    type: 'CONDITIONNEMENT_PROFESSIONNEL',
    categorySlug: 'conditionnement-pro',
    unit: 'pack',
    priceParticulier: 0,
    priceProfessionnel: 10000,
    priceGrossiste: 8500,
    minStockLevel: 5,
    conservationDuration: 48,
  },
]

export const seedPointOfSale = [
  {
    name: 'Point de vente principal - Centre Ville',
    code: 'PV-001',
    address: 'Avenue de la Liberté, Centre Ville',
    phone: '+242 06 900 00 01',
  },
  {
    name: 'Dépôt - Bacongo',
    code: 'PV-002',
    address: 'Bacongo, Rue du Commerce',
    phone: '+242 06 900 00 02',
  },
  {
    name: 'Dépôt - Makelekele',
    code: 'PV-003',
    address: 'Makelekele, Marché Central',
    phone: '+242 06 900 00 03',
  },
]

export const seedDepots = [
  {
    name: 'Usine de production - Centre',
    code: 'DEP-001',
    address: 'Zone Industrielle, Brazzaville',
  },
  {
    name: 'Entrepôt frigorifique - Bacongo',
    code: 'DEP-002',
    address: 'Bacongo, Rue du Frigorifique',
  },
]

export const seedCaisses = [
  { name: 'Caisse principale - Centre Ville', code: 'CAISSE-001', pointOfSaleCode: 'PV-001' },
  { name: 'Caisse secondaire - Centre Ville', code: 'CAISSE-002', pointOfSaleCode: 'PV-001' },
  { name: 'Caisse - Bacongo', code: 'CAISSE-003', pointOfSaleCode: 'PV-002' },
  { name: 'Caisse - Makelekele', code: 'CAISSE-004', pointOfSaleCode: 'PV-003' },
]

export const seedSettings = [
  { key: 'company_name', value: 'LCG - La Congolaise des Glaçons', group: 'general' },
  { key: 'company_address', value: 'Zone Industrielle, Brazzaville, Congo', group: 'general' },
  { key: 'company_phone', value: '+242 06 900 00 00', group: 'general' },
  { key: 'company_email', value: 'contact@lcg.cg', group: 'general' },
  { key: 'currency', value: 'XAF', group: 'general' },
  { key: 'tax_rate', value: '0', group: 'general' },
  { key: 'low_stock_threshold', value: '10', group: 'alerts' },
  { key: 'auto_backup', value: 'true', group: 'system' },
]
