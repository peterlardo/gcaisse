import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const defaultAccounts = [
  { code: '1', name: 'Comptes de capitaux', type: 'PASSIF', nature: 'CREDIT' },
  { code: '101', name: 'Capital social', type: 'PASSIF', nature: 'CREDIT', parentCode: '1' },
  { code: '106', name: 'Réserves', type: 'PASSIF', nature: 'CREDIT', parentCode: '1' },
  { code: '12', name: 'Résultat net', type: 'PASSIF', nature: 'CREDIT', parentCode: '1' },
  { code: '2', name: 'Comptes d\'actif', type: 'ACTIF', nature: 'DEBIT' },
  { code: '201', name: 'Frais d\'établissement', type: 'ACTIF', nature: 'DEBIT', parentCode: '2' },
  { code: '21', name: 'Immobilisations', type: 'ACTIF', nature: 'DEBIT', parentCode: '2' },
  { code: '211', name: 'Terrains', type: 'ACTIF', nature: 'DEBIT', parentCode: '21' },
  { code: '212', name: 'Bâtiments', type: 'ACTIF', nature: 'DEBIT', parentCode: '21' },
  { code: '213', name: 'Matériel et outillage', type: 'ACTIF', nature: 'DEBIT', parentCode: '21' },
  { code: '214', name: 'Matériel de transport', type: 'ACTIF', nature: 'DEBIT', parentCode: '21' },
  { code: '215', name: 'Mobilier de bureau', type: 'ACTIF', nature: 'DEBIT', parentCode: '21' },
  { code: '218', name: 'Aménagements divers', type: 'ACTIF', nature: 'DEBIT', parentCode: '21' },
  { code: '3', name: 'Comptes de stocks', type: 'ACTIF', nature: 'DEBIT' },
  { code: '31', name: 'Matières premières', type: 'ACTIF', nature: 'DEBIT', parentCode: '3' },
  { code: '32', name: 'Produits finis', type: 'ACTIF', nature: 'DEBIT', parentCode: '3' },
  { code: '35', name: 'Stocks de marchandises', type: 'ACTIF', nature: 'DEBIT', parentCode: '3' },
  { code: '4', name: 'Comptes de tiers', type: 'ACTIF', nature: 'DEBIT' },
  { code: '41', name: 'Clients', type: 'ACTIF', nature: 'DEBIT', parentCode: '4' },
  { code: '411', name: 'Clients - ventes', type: 'ACTIF', nature: 'DEBIT', parentCode: '41' },
  { code: '416', name: 'Créances douteuses', type: 'ACTIF', nature: 'DEBIT', parentCode: '41' },
  { code: '42', name: 'Personnel', type: 'PASSIF', nature: 'CREDIT', parentCode: '4' },
  { code: '43', name: 'Sécurité sociale', type: 'PASSIF', nature: 'CREDIT', parentCode: '4' },
  { code: '44', name: 'État', type: 'PASSIF', nature: 'CREDIT', parentCode: '4' },
  { code: '45', name: 'Fournisseurs', type: 'PASSIF', nature: 'CREDIT', parentCode: '4' },
  { code: '5', name: 'Comptes de trésorerie', type: 'ACTIF', nature: 'DEBIT' },
  { code: '51', name: 'Banques', type: 'ACTIF', nature: 'DEBIT', parentCode: '5' },
  { code: '511', name: 'Banque - compte courant', type: 'ACTIF', nature: 'DEBIT', parentCode: '51' },
  { code: '53', name: 'Caisse', type: 'ACTIF', nature: 'DEBIT', parentCode: '5' },
  { code: '531', name: 'Caisse principale', type: 'ACTIF', nature: 'DEBIT', parentCode: '53' },
  { code: '532', name: 'Caisse secondaire', type: 'ACTIF', nature: 'DEBIT', parentCode: '53' },
  { code: '58', name: 'Virements internes', type: 'ACTIF', nature: 'DEBIT', parentCode: '5' },
  { code: '6', name: 'Comptes de charges', type: 'CHARGE', nature: 'DEBIT' },
  { code: '60', name: 'Achats', type: 'CHARGE', nature: 'DEBIT', parentCode: '6' },
  { code: '601', name: 'Achats matières premières', type: 'CHARGE', nature: 'DEBIT', parentCode: '60' },
  { code: '602', name: 'Achats fournitures', type: 'CHARGE', nature: 'DEBIT', parentCode: '60' },
  { code: '61', name: 'Services extérieurs', type: 'CHARGE', nature: 'DEBIT', parentCode: '6' },
  { code: '611', name: 'Électricité', type: 'CHARGE', nature: 'DEBIT', parentCode: '61' },
  { code: '612', name: 'Eau', type: 'CHARGE', nature: 'DEBIT', parentCode: '61' },
  { code: '613', name: 'Télécommunications', type: 'CHARGE', nature: 'DEBIT', parentCode: '61' },
  { code: '62', name: 'Transports', type: 'CHARGE', nature: 'DEBIT', parentCode: '6' },
  { code: '63', name: 'Frais de personnel', type: 'CHARGE', nature: 'DEBIT', parentCode: '6' },
  { code: '631', name: 'Salaires', type: 'CHARGE', nature: 'DEBIT', parentCode: '63' },
  { code: '633', name: 'Charges sociales', type: 'CHARGE', nature: 'DEBIT', parentCode: '63' },
  { code: '64', name: 'Impôts et taxes', type: 'CHARGE', nature: 'DEBIT', parentCode: '6' },
  { code: '65', name: 'Autres charges', type: 'CHARGE', nature: 'DEBIT', parentCode: '6' },
  { code: '66', name: 'Charges financières', type: 'CHARGE', nature: 'DEBIT', parentCode: '6' },
  { code: '661', name: 'Intérêts bancaires', type: 'CHARGE', nature: 'DEBIT', parentCode: '66' },
  { code: '68', name: 'Dotations amortissements', type: 'CHARGE', nature: 'DEBIT', parentCode: '6' },
  { code: '7', name: 'Comptes de produits', type: 'PRODUIT', nature: 'CREDIT' },
  { code: '70', name: 'Ventes', type: 'PRODUIT', nature: 'CREDIT', parentCode: '7' },
  { code: '701', name: 'Ventes de produits finis', type: 'PRODUIT', nature: 'CREDIT', parentCode: '70' },
  { code: '702', name: 'Ventes de marchandises', type: 'PRODUIT', nature: 'CREDIT', parentCode: '70' },
  { code: '706', name: 'Prestations de services', type: 'PRODUIT', nature: 'CREDIT', parentCode: '70' },
  { code: '75', name: 'Autres produits', type: 'PRODUIT', nature: 'CREDIT', parentCode: '7' },
  { code: '76', name: 'Produits financiers', type: 'PRODUIT', nature: 'CREDIT', parentCode: '7' },
  { code: '78', name: 'Reprises amortissements', type: 'PRODUIT', nature: 'CREDIT', parentCode: '7' },
]

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const existing = await prisma.accountingAccount.count()
    if (existing > 0) {
      return NextResponse.json({ error: 'Le plan comptable existe déjà' }, { status: 409 })
    }

    const created: any[] = []
    for (const acc of defaultAccounts) {
      let parentId: number | null = null
      if (acc.parentCode) {
        const parent = created.find((c: any) => c.code === acc.parentCode)
        if (parent) parentId = parent.id
      }
      const record = await prisma.accountingAccount.create({
        data: { code: acc.code, name: acc.name, type: acc.type, nature: acc.nature, parentId },
      })
      created.push(record)
    }

    return NextResponse.json({ count: created.length, message: 'Plan comptable créé' })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
