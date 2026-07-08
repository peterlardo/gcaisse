export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function generateReference(prefix: string): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${date}-${random}`
}

export function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function getTodayRange(): { start: Date; end: Date } {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function getMonthRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export function getClientTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PARTICULIER: 'Particulier',
    PROFESSIONNEL: 'Professionnel',
    GROSSISTE: 'Grossiste',
  }
  return labels[type] || type
}

export function getProductTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    CUBES_STANDARDS: 'Cubes Standards',
    GLA_CYLINDRIQUES: 'Glaçons Cylindriques',
    GLA_SPHERIQUES: 'Glaçons Sphériques',
    GLACE_PILEE: 'Glace Pilée',
    BLOCS_GLACE: 'Blocs de Glace',
    CONDITIONNEMENT_PRO: 'Conditionnement Professionnel',
    AUTRE: 'Autre',
  }
  return labels[type] || type
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    EN_ATTENTE: 'En attente',
    CONFIRMEE: 'Confirmée',
    EN_PREPARATION: 'En préparation',
    LIVREE: 'Livrée',
    RETIREE: 'Retirée',
    ANNULEE: 'Annulée',
  }
  return labels[status] || status
}

export function getReservationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    EN_ATTENTE: 'En attente',
    CONFIRMEE: 'Confirmée',
    RETIREE: 'Retirée',
    ANNULEE: 'Annulée',
  }
  return labels[status] || status
}

export function getDistributionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    EN_PREPARATION: 'En préparation',
    EN_TRANSIT: 'En transit',
    LIVRE: 'Livré',
    ANNULE: 'Annulé',
  }
  return labels[status] || status
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    ESPECES: 'Espèces',
    MOBILE_MONEY: 'Mobile Money',
    CARTE_BANCAIRE: 'Carte bancaire',
    VIREMENT: 'Virement',
  }
  return labels[method] || method
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
    CONFIRMEE: 'bg-blue-100 text-blue-800',
    CONFIRMÉE: 'bg-blue-100 text-blue-800',
    EN_PREPARATION: 'bg-indigo-100 text-indigo-800',
    EN_PRÉPARATION: 'bg-indigo-100 text-indigo-800',
    LIVREE: 'bg-green-100 text-green-800',
    LIVRÉE: 'bg-green-100 text-green-800',
    LIVRE: 'bg-green-100 text-green-800',
    LIVRÉ: 'bg-green-100 text-green-800',
    RETIREE: 'bg-green-100 text-green-800',
    RETIRÉE: 'bg-green-100 text-green-800',
    ANNULEE: 'bg-red-100 text-red-800',
    ANNULÉE: 'bg-red-100 text-red-800',
    ANNULE: 'bg-red-100 text-red-800',
    ANNULÉ: 'bg-red-100 text-red-800',
    EN_TRANSIT: 'bg-purple-100 text-purple-800',
    OUVERTE: 'bg-green-100 text-green-800',
    FERMEE: 'bg-gray-100 text-gray-800',
    FERMÉE: 'bg-gray-100 text-gray-800',
    COMPTANT: 'bg-green-100 text-green-800',
    CREDIT: 'bg-yellow-100 text-yellow-800',
    PARTIEL: 'bg-blue-100 text-blue-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
