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
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Nouvelle vente</h1>
        <div className="flex gap-2">
          {['PARTICULIER', 'PROFESSIONNEL', 'GROSSISTE'].map(type => (
            <button
              key={type}
              onClick={() => setClientType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                clientType === type ? 'bg-lcg-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type === 'PARTICULIER' ? 'Particulier' : type === 'PROFESSIONNEL' ? 'Professionnel' : 'Grossiste'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <input
              type="text"
              className="input-field text-lg"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="card hover:shadow-md transition-shadow text-left cursor-pointer p-3"
                disabled={getPrice(product) === 0}
              >
                <p className="font-medium text-sm">{product.name}</p>
                <p className="text-lcg-500 font-bold mt-1">{formatCurrency(getPrice(product))}</p>
                <p className="text-xs text-gray-400">{product.unit}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-3">Panier ({cart.length} articles)</h3>
            {cart.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Panier vide</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.productName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-sm">-</button>
                        <span className="text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-sm">+</button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(item.total)}</p>
                      <button onClick={() => removeFromCart(item.productId)} className="text-xs text-red-500">Retirer</button>
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
            <h3 className="font-semibold mb-3">Paiement</h3>
            <select
              className="input-field mb-3"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="ESPÈCES">Espèces</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CARTE_BANCAIRE">Carte bancaire</option>
              <option value="VIREMENT">Virement</option>
            </select>
            <button
              onClick={handleSubmit}
              disabled={loading || cart.length === 0}
              className="btn-primary w-full py-3 text-lg"
            >
              {loading ? 'Enregistrement...' : `Encaisser ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
