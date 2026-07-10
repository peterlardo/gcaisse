import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

interface InvoiceItem {
  name: string
  quantity: number
  unitPrice: number
  total: number
}

interface InvoiceData {
  reference: string
  date: Date
  clientName?: string
  clientPhone?: string
  clientAddress?: string
  pointOfSale: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  discountLabel?: string
  total: number
  paidAmount: number
  status: string
  cashier: string
}

interface DeliveryNoteItem {
  name: string
  quantity: number
  quantityReceived?: number | null
  difference?: number
}

interface DeliveryNoteData {
  reference: string
  date: Date
  sourceDepot: string
  destinationName: string
  clientName?: string
  clientPhone?: string
  clientAddress?: string
  notes?: string
  items: DeliveryNoteItem[]
  status: string
  createdBy: string
  receivedBy?: string
  receivedAt?: Date
}

export function generateInvoicePDF(data: InvoiceData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('LA CONGOLAISE DES GLAÇONS', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('SOCIETE AU CAPITAL DE 10 000 000 FCFA - RC: CG-BZV-2020-A-12345', pageWidth / 2, 26, { align: 'center' })
  doc.text('Avenue de la Liberation, Brazzaville - Tel: +242 05 555 55 55', pageWidth / 2, 31, { align: 'center' })

  doc.setDrawColor(0, 100, 180)
  doc.line(14, 34, pageWidth - 14, 34)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE', pageWidth / 2, 42, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const leftCol = `Réf: ${data.reference}\nDate: ${data.date.toLocaleDateString('fr-FR')}\nPoint de vente: ${data.pointOfSale}`
  const rightCol = data.clientName
    ? `Client: ${data.clientName}\nTél: ${data.clientPhone || '—'}\nAdresse: ${data.clientAddress || '—'}`
    : 'Client: Particulier'

  doc.text(leftCol, 14, 50)
  doc.text(rightCol, pageWidth / 2 + 10, 50)

  const tableData = data.items.map(item => [
    item.name,
    String(item.quantity),
    item.unitPrice.toLocaleString('fr-FR') + ' FCFA',
    item.total.toLocaleString('fr-FR') + ' FCFA',
  ])

  ;(doc as any).autoTable({
    startY: 70,
    head: [['Produit', 'Qté', 'Prix unitaire', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 100, 180], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 10

  const totalsY = finalY
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Sous-total:', pageWidth - 90, totalsY)
  doc.text(data.subtotal.toLocaleString('fr-FR') + ' FCFA', pageWidth - 14, totalsY, { align: 'right' })

  if (data.discount > 0) {
    doc.text(`Remise (${data.discountLabel || '-'}):`, pageWidth - 90, totalsY + 6)
    doc.text(`-${data.discount.toLocaleString('fr-FR')} FCFA`, pageWidth - 14, totalsY + 6, { align: 'right' })
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL:', pageWidth - 90, totalsY + 14)
  doc.text(data.total.toLocaleString('fr-FR') + ' FCFA', pageWidth - 14, totalsY + 14, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Payé: ${data.paidAmount.toLocaleString('fr-FR')} FCFA`, pageWidth - 90, totalsY + 22)
  doc.text(`Statut: ${data.status === 'COMPTANT' ? 'Comptant' : data.status === 'CREDIT' ? 'Crédit' : 'Paiement partiel'}`, pageWidth - 14, totalsY + 22, { align: 'right' })

  if (data.status !== 'COMPTANT') {
    const reste = data.total - data.paidAmount
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`Reste à payer: ${reste.toLocaleString('fr-FR')} FCFA`, pageWidth - 14, totalsY + 30, { align: 'right' })
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(`Caissier: ${data.cashier}`, 14, totalsY + 30)
  doc.text(`Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 14, totalsY + 36)

  doc.setDrawColor(200, 200, 200)
  doc.line(14, totalsY + 40, pageWidth - 14, totalsY + 40)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  doc.text('Merci de votre confiance !', pageWidth / 2, totalsY + 46, { align: 'center' })
  doc.text('La Congolaise des Glaçons - Votre partenaire glace à Brazzaville', pageWidth / 2, totalsY + 51, { align: 'center' })

  const filename = `facture-${data.reference}.pdf`
  doc.save(filename)
}

export function generateDeliveryNotePDF(data: DeliveryNoteData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('LA CONGOLAISE DES GLAÇONS', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('SOCIETE AU CAPITAL DE 10 000 000 FCFA - RC: CG-BZV-2020-A-12345', pageWidth / 2, 26, { align: 'center' })
  doc.text('Avenue de la Liberation, Brazzaville - Tel: +242 05 555 55 55', pageWidth / 2, 31, { align: 'center' })

  doc.setDrawColor(0, 100, 180)
  doc.line(14, 34, pageWidth - 14, 34)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('BON DE LIVRAISON', pageWidth / 2, 42, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const statusLabel: Record<string, string> = {
    'EN_PRÉPARATION': 'En préparation',
    'EN_TRANSIT': 'En transit',
    'LIVRÉ': 'Livré',
    'ANNULÉ': 'Annulé',
  }

  const statusText = statusLabel[data.status] || data.status

  const leftCol = [
    `Réf: ${data.reference}`,
    `Date: ${data.date.toLocaleDateString('fr-FR')}`,
    `Dépôt source: ${data.sourceDepot}`,
    `Statut: ${statusText}`,
  ].join('\n')

  const rightLines = [`Destination: ${data.destinationName}`]
  if (data.clientName) {
    rightLines.push(`Client: ${data.clientName}`)
    if (data.clientPhone) rightLines.push(`Tél: ${data.clientPhone}`)
    if (data.clientAddress) rightLines.push(`Adresse: ${data.clientAddress}`)
  }
  const rightCol = rightLines.join('\n')

  doc.text(leftCol, 14, 52)
  doc.text(rightCol, pageWidth / 2 + 10, 52)

  const tableData = data.items.map(item => {
    const row = [item.name, String(item.quantity)]
    if (data.status === 'LIVRÉ') {
      row.push(String(item.quantityReceived ?? '—'))
      row.push(item.difference && item.difference !== 0 ? (item.difference > 0 ? `+${item.difference}` : String(item.difference)) : '—')
    }
    return row
  })

  const headRow = ['Produit', 'Qté envoyée']
  if (data.status === 'LIVRÉ') {
    headRow.push('Qté reçue', 'Diff.')
  }

  ;(doc as any).autoTable({
    startY: 75,
    head: [headRow],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 100, 180], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: data.status === 'LIVRÉ' ? 50 : 70 },
      1: { cellWidth: 30, halign: 'center' },
    },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 10

  if (data.notes) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text(`Notes: ${data.notes}`, 14, finalY)
  }

  const footerY = data.notes ? finalY + 10 : finalY

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Créé par: ${data.createdBy}`, 14, footerY)

  if (data.receivedBy && data.receivedAt) {
    doc.text(`Réceptionné par: ${data.receivedBy} le ${data.receivedAt.toLocaleDateString('fr-FR')} à ${data.receivedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 14, footerY + 5)
  }

  doc.setFontSize(7)
  doc.text(`Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 14, footerY + 12)

  doc.setDrawColor(200, 200, 200)
  doc.line(14, footerY + 16, pageWidth - 14, footerY + 16)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  doc.text('Merci de votre confiance !', pageWidth / 2, footerY + 22, { align: 'center' })
  doc.text('La Congolaise des Glaçons - Votre partenaire glace à Brazzaville', pageWidth / 2, footerY + 27, { align: 'center' })

  const filename = `bon-livraison-${data.reference}.pdf`
  doc.save(filename)
}
