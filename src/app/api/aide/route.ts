import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

const KNOWLEDGE_BASE = `
LCG Management est un logiciel de gestion pour La Congolaise des Glaçons (LCG), entreprise de production et commercialisation de glace à Brazzaville, Congo.

RÔLES UTILISATEURS:
- ADMIN: Accès complet, gestion des utilisateurs
- DIRECTION: Trésorerie, statistiques, rapports, opérations
- RESPONSABLE_STOCK: Stocks, inventaires, dépôts, livraisons
- RESPONSABLE_PRODUCTION: Production, distribution
- CAISSIER: Ventes, caisse, clients, réservations, commandes

MODULES:
1. Dashboard: Vue d'ensemble (CA du jour/semaine/mois, alertes stocks, graphiques)
2. Ventes: Nouvelle vente (sélection client, produits, paiement) + Historique + Facture PDF + Export Excel
3. Produits: Catalogue avec 3 paliers de prix (Particulier/Professionnel/Grossiste)
4. Stocks: Stock actuel par emplacement, mouvements, inventaire, alertes ruptures
5. Caisse: Sessions ouverture/fermeture, suivi écart de caisse
6. Production: Enregistrement lots (produit, quantité, pertes, dépôt destination)
7. Distribution: Acheminement dépôt → points de vente avec validation
8. Livraisons: Bons de livraison (statuts: En préparation → En transit → Livré), réception avec écarts, PDF
9. Réservations: Réservation client pour retrait futur
10. Commandes: Commande client avec workflow (En attente → Confirmée → En préparation → Livrée)
11. Clients: Répertoire (Particulier/Professionnel/Grossiste), crédits
12. Créances: Suivi et recouvrement des dettes clients
13. Dépôts: Entrepôts de stockage
14. Trésorerie: Flux financiers (encaissements - dépenses), périodes
15. Statistiques: Graphiques CA, ventes par produit/point de vente, tendances
16. Rapports: Génération PDF/Excel/CSV (Ventes, Caisse, Stock, Production, Distribution, Clients)
17. Dépenses: Suivi des dépenses par catégorie
18. Points de vente: Gestion avec vue carte Leaflet
19. Messagerie: Messagerie interne entre utilisateurs
20. Connexions: Historique des tentatives de connexion
21. Administration/Gestion utilisateurs: CRUD utilisateurs, activation, reset mot de passe

WORKFLOW: Production (usine) → Dépôt stockage → Distribution → Point de vente → Vente client

RÈGLES MÉTIER:
- 3 prix selon type client
- Ventes: COMPTANT/CREDIT/PARTIEL
- Stock déduit automatiquement à la vente
- Session caisse doit être ouverte avant les ventes
- Écart de caisse calculé à la fermeture
- Alertes stock bas automatiques
- Toutes les actions sont tracées (AuditLog)
- Abonnements clients: livraison hebdomadaire/bi-mensuelle/mensuelle

IDENTIFIANTS TEST:
- admin / admin123 (ADMIN)
- directeur / admin123 (DIRECTION)
- stock1 / password123 (RESPONSABLE_STOCK)
- prod1 / password123 (RESPONSABLE_PRODUCTION)
- caissier1 / password123 (CAISSIER)

SITE: https://gcaisse-704.netlify.app
`

function searchManual(query: string): string {
  const q = query.toLowerCase()
  const sections = KNOWLEDGE_BASE.split('\n\n')
  const relevant = sections.filter(s => s.toLowerCase().includes(q))
  if (relevant.length === 0) return ''
  return relevant.slice(0, 3).join('\n\n')
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { message } = await request.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    }

    const context = searchManual(message)
    const systemPrompt = `Tu es un assistant IA pour l'application LCG Management (La Congolaise des Glaçons). 
Réponds en français de façon claire et concise. Utilise les informations suivantes pour répondre.
Si tu ne sais pas, dis que tu vas rechercher et propose de consulter le manuel utilisateur.

Connaissances de l'application:
${KNOWLEDGE_BASE}`

    const prompt = context
      ? `${systemPrompt}\n\nQuestion: ${message}\n\nContexte pertinent:\n${context}\n\nRéponds à la question en français:`
      : `${systemPrompt}\n\nQuestion: ${message}\n\nRéponds en français:`

    try {
      const hfRes = await fetch(
        'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { max_new_tokens: 512, temperature: 0.3, top_p: 0.9 },
          }),
        }
      )

      if (hfRes.ok) {
        const data = await hfRes.json()
        const text = Array.isArray(data) ? data[0]?.generated_text || '' : data.generated_text || ''
        const answer = text.replace(prompt, '').trim()
        return NextResponse.json({ response: answer || 'Je n\'ai pas trouvé de réponse.' })
      }

      const errText = await hfRes.text()
      console.error('HF API error:', hfRes.status, errText)

      if (hfRes.status === 503) {
        return NextResponse.json({
          response: 'Le modèle IA est en cours de chargement... Réessaie dans quelques secondes.',
          loading: true,
        })
      }
    } catch (e) {
      console.error('HF fetch error:', e)
    }

    if (context) {
      const lines = context.split('\n').filter(l => l.trim())
      const clean = lines.slice(0, 6).join('\n')
      return NextResponse.json({
        response: `Voici ce que j'ai trouvé dans le manuel :\n\n${clean}\n\nConsulte le manuel complet pour plus de détails.`,
        source: 'manuel',
      })
    }

    return NextResponse.json({
      response: `Je n'ai pas trouvé d'information spécifique sur "${message}". Consulte le manuel utilisateur ou contacte l'administrateur.`,
    })
  } catch (error) {
    console.error('Aide API error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
