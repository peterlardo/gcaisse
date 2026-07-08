const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seed de la base de données LCG...')

  const adminPassword = await bcrypt.hash('admin123', 10)
  const password = await bcrypt.hash('password123', 10)

  const users = [
    { username: 'admin', email: 'admin@lcg.cg', password: adminPassword, firstName: 'Admin', lastName: 'Système', role: 'ADMIN' },
    { username: 'directeur', email: 'direction@lcg.cg', password: adminPassword, firstName: 'Jean', lastName: 'Nkounkou', role: 'DIRECTION' },
    { username: 'stock1', email: 'stock@lcg.cg', password, firstName: 'Paul', lastName: 'Moukoko', role: 'RESPONSABLE_STOCK' },
    { username: 'prod1', email: 'production@lcg.cg', password, firstName: 'Marie', lastName: 'Bouanga', role: 'RESPONSABLE_PRODUCTION' },
    { username: 'caissier1', email: 'caissier1@lcg.cg', password, firstName: 'Alain', lastName: 'Mbemba', role: 'CAISSIER' },
    { username: 'caissier2', email: 'caissier2@lcg.cg', password, firstName: 'Rose', lastName: 'Makosso', role: 'CAISSIER' },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: user,
    })
  }
  console.log('✅ Utilisateurs créés')

  const categories = [
    { name: 'Cubes Standards', slug: 'cubes-standards' },
    { name: 'Glaçons Cylindriques', slug: 'gla-cylindriques' },
    { name: 'Glaçons Sphériques', slug: 'gla-spheriques' },
    { name: 'Glace Pilée', slug: 'glace-pilee' },
    { name: 'Blocs de Glace', slug: 'blocs-glace' },
    { name: 'Conditionnement Pro', slug: 'conditionnement-pro' },
    { name: 'Autres Produits', slug: 'autres' },
  ]

  for (const cat of categories) {
    await prisma.productCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }
  console.log('✅ Catégories créées')

  const products = [
    { name: 'Sac de glaçons cubes 5kg', slug: 'sac-glacons-cubes-5kg', type: 'CUBES_STANDARDS', categorySlug: 'cubes-standards', unit: 'sac', priceParticulier: 1500, priceProfessionnel: 1200, priceGrossiste: 1000, minStockLevel: 50, conservationDuration: 48 },
    { name: 'Sac de glaçons cubes 10kg', slug: 'sac-glacons-cubes-10kg', type: 'CUBES_STANDARDS', categorySlug: 'cubes-standards', unit: 'sac', priceParticulier: 2500, priceProfessionnel: 2000, priceGrossiste: 1800, minStockLevel: 30, conservationDuration: 48 },
    { name: 'Sac de glaçons cylindriques 5kg', slug: 'sac-glacons-cylindriques-5kg', type: 'GLA_CYLINDRIQUES', categorySlug: 'gla-cylindriques', unit: 'sac', priceParticulier: 1800, priceProfessionnel: 1500, priceGrossiste: 1300, minStockLevel: 40, conservationDuration: 48 },
    { name: 'Sac de glaçons sphériques 3kg', slug: 'sac-glacons-spheriques-3kg', type: 'GLA_SPHERIQUES', categorySlug: 'gla-spheriques', unit: 'sac', priceParticulier: 2000, priceProfessionnel: 1700, priceGrossiste: 1500, minStockLevel: 20, conservationDuration: 48 },
    { name: 'Sachet glace pilée 2kg', slug: 'sachet-glace-pilee-2kg', type: 'GLACE_PILEE', categorySlug: 'glace-pilee', unit: 'sachet', priceParticulier: 1000, priceProfessionnel: 800, priceGrossiste: 700, minStockLevel: 50, conservationDuration: 24 },
    { name: 'Bloc de glace 25kg', slug: 'bloc-glace-25kg', type: 'BLOCS_GLACE', categorySlug: 'blocs-glace', unit: 'bloc', priceParticulier: 5000, priceProfessionnel: 4500, priceGrossiste: 4000, minStockLevel: 10, conservationDuration: 72 },
    { name: 'Pack pro glaçons 50kg', slug: 'pack-pro-glacons-50kg', type: 'CONDITIONNEMENT_PRO', categorySlug: 'conditionnement-pro', unit: 'pack', priceParticulier: 0, priceProfessionnel: 10000, priceGrossiste: 8500, minStockLevel: 5, conservationDuration: 48 },
  ]

  for (const prod of products) {
    const category = await prisma.productCategory.findUnique({ where: { slug: prod.categorySlug } })
    if (!category) continue
    const { categorySlug, ...prodData } = prod
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: { ...prodData, categoryId: category.id },
    })
  }
  console.log('✅ Produits créés')

  const pointsOfSale = [
    { name: 'Point de vente principal - Centre Ville', code: 'PV-001', address: 'Avenue de la Liberté, Centre Ville', phone: '+242 06 900 00 01' },
    { name: 'Dépôt vente - Bacongo', code: 'PV-002', address: 'Bacongo, Rue du Commerce', phone: '+242 06 900 00 02' },
    { name: 'Dépôt vente - Makelekele', code: 'PV-003', address: 'Makelekele, Marché Central', phone: '+242 06 900 00 03' },
  ]

  for (const pv of pointsOfSale) {
    await prisma.pointOfSale.upsert({
      where: { code: pv.code },
      update: {},
      create: pv,
    })
  }
  console.log('✅ Points de vente créés')

  const depots = [
    { name: 'Usine de production - Centre', code: 'DEP-001', address: 'Zone Industrielle, Brazzaville' },
    { name: 'Entrepôt frigorifique - Bacongo', code: 'DEP-002', address: 'Bacongo, Rue du Frigorifique' },
  ]

  for (const depot of depots) {
    await prisma.depot.upsert({
      where: { code: depot.code },
      update: {},
      create: depot,
    })
  }
  console.log('✅ Dépôts créés')

  const pv1 = await prisma.pointOfSale.findUnique({ where: { code: 'PV-001' } })
  const pv2 = await prisma.pointOfSale.findUnique({ where: { code: 'PV-002' } })
  const pv3 = await prisma.pointOfSale.findUnique({ where: { code: 'PV-003' } })

  if (pv1) {
    await prisma.caisse.upsert({ where: { code: 'CAISSE-001' }, update: {}, create: { name: 'Caisse principale - Centre Ville', code: 'CAISSE-001', pointOfSaleId: pv1.id } })
    await prisma.caisse.upsert({ where: { code: 'CAISSE-002' }, update: {}, create: { name: 'Caisse secondaire - Centre Ville', code: 'CAISSE-002', pointOfSaleId: pv1.id } })
  }
  if (pv2) {
    await prisma.caisse.upsert({ where: { code: 'CAISSE-003' }, update: {}, create: { name: 'Caisse - Bacongo', code: 'CAISSE-003', pointOfSaleId: pv2.id } })
  }
  if (pv3) {
    await prisma.caisse.upsert({ where: { code: 'CAISSE-004' }, update: {}, create: { name: 'Caisse - Makelekele', code: 'CAISSE-004', pointOfSaleId: pv3.id } })
  }
  console.log('✅ Caisses créées')

  const settings = [
    { key: 'company_name', value: 'LCG - La Congolaise des Glaçons', group: 'general' },
    { key: 'company_address', value: 'Zone Industrielle, Brazzaville, Congo', group: 'general' },
    { key: 'company_phone', value: '+242 06 900 00 00', group: 'general' },
    { key: 'company_email', value: 'contact@lcg.cg', group: 'general' },
    { key: 'currency', value: 'XAF', group: 'general' },
    { key: 'tax_rate', value: '0', group: 'general' },
    { key: 'low_stock_threshold', value: '10', group: 'alerts' },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({ where: { key: setting.key }, update: {}, create: setting })
  }
  console.log('✅ Paramètres créés')

  const products_all = await prisma.product.findMany()
  const pointsOfSale_all = await prisma.pointOfSale.findMany()
  const depots_all = await prisma.depot.findMany()

  for (const product of products_all) {
    for (const pv of pointsOfSale_all) {
      try {
        await prisma.stockAtLocation.create({
          data: { productId: product.id, pointOfSaleId: pv.id, quantity: 100 },
        })
      } catch (e) {}
    }
    for (const depot of depots_all) {
      try {
        await prisma.stockAtLocation.create({
          data: { productId: product.id, depotId: depot.id, quantity: 200 },
        })
      } catch (e) {}
    }
  }
  console.log('✅ Stock initial créé')

  console.log('\n🎉 Seed terminé avec succès!')
  console.log('📧 Identifiants de connexion:')
  console.log('   Admin:      admin / admin123')
  console.log('   Direction:  directeur / admin123')
  console.log('   Stock:      stock1 / password123')
  console.log('   Production: prod1 / password123')
  console.log('   Caissier:   caissier1 / password123')
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
