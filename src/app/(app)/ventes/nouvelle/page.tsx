'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Product {
  id: number; name: string; unit: string
  priceParticulier: number; priceProfessionnel: number; priceGrossiste: number
}

interface CartItem {
  productId: number; productName: string; quantity: number; unitPrice: number; total: number
}

export default function NouvelleVentePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [clientType, setClientType] = useState('PARTICULIER')
  const [clientId, setClientId] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('ESPÈCES')
  const [paidAmount, setPaidAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const res = await fetch('/api/products?active=true')
    const data = await res.json()
    setProducts(data.products || [])
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPrice = (product: Product) => {
    if (clientType === 'GROSSISTE') return product.priceGrossiste
    if (clientType === 'PROFESSIONNEL') return product.priceProfessionnel
    return product.priceParticulier
  }

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id)
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
          : item
      ))
    } else {
      const unitPrice = getPrice(product)
      setCart([...cart, { productId: product.id, productName: product.name, quantity: 1, unitPrice, total: unitPrice }])
    }
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const updateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) { removeFromCart(productId); return }
    setCart(cart.map(item =>
      item.productId === productId ? { ...item, quantity: qty, total: qty * item.unitPrice } : item
    ))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal

  const handleSubmit = async () => {
    if (cart.length === 0) { toast.error('Ajoutez des produits au panier'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice })),
          clientType,
          clientId,
          paymentMethod,
          paidAmount: total,
          status: 'COMPTANT',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Vente enregistrée avec succès')
        const receiptWindow = window.open('', '_blank')
        if (receiptWindow) {
          receiptWindow.document.write(generateReceipt(data.sale))
          receiptWindow.document.close()
        }
        setCart([])
        setPaidAmount('')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (err) {
      toast.error('Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  const generateReceipt = (sale: any) => {
    return `
      <html><head><meta charset="utf-8"><title>Ticket de caisse</title>
      <style>body{font-family:monospace;font-size:12px;max-width:300px;margin:0 auto;padding:20px}
      h1{text-align:center;font-size:16px}h2{text-align:center;font-size:14px}
      table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:4px 0}
      .total{font-weight:bold;font-size:14px;border-top:2px solid #000;padding-top:8px}
      .footer{text-align:center;margin-top:20px;font-size:10px;color:#666}
      @media print{body{max-width:80mm;padding:0}}</style></head><body>
      <h1>LCG - La Congolaise des Glaçons</h1>
      <h2>TICKET DE CAISSE</h2>
      <p>Réf: ${sale.reference}<br>Date: ${new Date(sale.createdAt).toLocaleDateString('fr-FR')}</p>
      <hr>
      <table><tr><th>Produit</th><th>Qté</th><th>Prix</th><th>Total</th></tr>
      ${sale.items?.map((item: any) => `
        <tr><td>${item.product.name}</td><td>${item.quantity}</td><td>${formatCurrency(item.unitPrice)}</td><td>${formatCurrency(item.total)}</td></tr>
      `).join('') || ''}
      </table>
      <hr>
      <p class="total">Total: ${formatCurrency(sale.total)}</p>
      <p>Paiement: ${sale.payments?.[0]?.method || 'ESPÈCES'}</p>
      <p>Merci de votre visite!</p>
      <div class="footer">LCG - La Congolaise des Glaçons<br>Brazzaville, Congo</div>
      <script>window.print()</script>
      </body></html>
    `
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Nouvelle vente</h1>
        <div className="tabs">
          {(['PARTICULIER', 'PROFESSIONNEL', 'GROSSISTE'] as const).map(type => (
            <button
              key={type}
              onClick={() => setClientType(type)}
              className={clientType === type ? 'tab-active' : 'tab'}
            >
              {type === 'PARTICULIER' ? 'Particulier' : type === 'PROFESSIONNEL' ? 'Professionnel' : 'Grossiste'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="input-field pl-10 text-lg"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="card">
              <div className="empty-state py-8">
                <div className="empty-state-icon">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="empty-state-text">Aucun produit trouvé</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="card-hover text-left cursor-pointer p-3"
                  disabled={getPrice(product) === 0}
                >
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-lcg-500 font-bold mt-1">{formatCurrency(getPrice(product))}</p>
                  <p className="text-xs text-gray-400">{product.unit}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Panier ({cart.length} articles)</h3>
            {cart.length === 0 ? (
              <div className="empty-state py-8">
                <div className="empty-state-icon">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </div>
                <p className="empty-state-text">Panier vide</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-sm hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-sm hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-bold">{formatCurrency(item.total)}</p>
                      <button onClick={() => removeFromCart(item.productId)} className="text-xs text-red-500 hover:underline mt-0.5">
                        <svg className="w-3.5 h-3.5 inline mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t mt-3 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="text-xl font-bold text-lcg-500">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Paiement</h3>
            <div className="space-y-3">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <select
                  className="input-field pl-10"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="ESPÈCES">Espèces</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="CARTE_BANCAIRE">Carte bancaire</option>
                  <option value="VIREMENT">Virement</option>
                </select>
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading || cart.length === 0}
                className="btn-primary w-full py-3 text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enregistrement...
                  </span>
                ) : `Encaisser ${formatCurrency(total)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
