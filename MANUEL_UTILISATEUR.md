# Manuel de l'Utilisateur — LCG Management

## La Congolaise des Glaçons — Système de Gestion

---

## 1. Présentation

LCG Management est une application web de gestion pour **La Congolaise des Glaçons (LCG)**, une entreprise de production et de commercialisation de glace basée à Brazzaville, au Congo.

L'application couvre l'ensemble du cycle d'activité :
- **Production** en usine
- **Stockage** en dépôts
- **Distribution** vers les points de vente
- **Vente** aux clients (particuliers, professionnels, grossistes)
- **Gestion financière** (trésorerie, dépenses, créances)
- **Gestion administrative** (utilisateurs, messagerie, rapports)

**Accès à l'application :** https://gcaisse-704.netlify.app

---

## 2. Connexion & Rôles

### 2.1 Se connecter

1. Ouvrez https://gcaisse-704.netlify.app/login
2. Saisissez votre **nom d'utilisateur** et **mot de passe**
3. Cliquez sur **Se connecter**

### 2.2 Rôles utilisateurs

| Rôle | Accès principal |
|------|----------------|
| **Admin** | Accès complet à tous les modules et à la gestion des utilisateurs |
| **Direction** | Accès stratégique : trésorerie, statistiques, rapports, toutes les opérations |
| **Responsable Stock** | Gestion des stocks, inventaires, dépôts, livraisons, rapports |
| **Responsable Production** | Enregistrement de la production, distribution |
| **Caissier** | Ventes, caisse, clients, réservations, commandes, messagerie |

### 2.3 Identifiants de test

| Utilisateur | Mot de passe | Rôle |
|-------------|-------------|------|
| `admin` | `admin123` | Admin |
| `directeur` | `admin123` | Direction |
| `stock1` | `password123` | Responsable Stock |
| `prod1` | `password123` | Responsable Production |
| `caissier1` | `password123` | Caissier |

---

## 3. Navigation

L'application dispose d'une barre latérale (sidebar) organisée en sections :

- **Principal** : Dashboard, Ventes, Produits, Stocks, Caisse
- **Opérations** : Production, Distribution, Livraisons, Réservations, Commandes
- **Données** : Clients, Crédits, Dépôts, Points de vente, Statistiques, Rapports
- **Finance** : Trésorerie, Dépenses
- **Système** : Messagerie, Connexions, Administration

En haut à droite se trouvent une cloche de notifications et le nom de l'utilisateur connecté.

---

## 4. Modules fonctionnels

### 4.1 Dashboard (Tableau de bord)

Accessible à tous les utilisateurs.

Le tableau de bord offre une vue d'ensemble de l'activité :
- **Chiffre d'affaires** du jour, de la semaine et du mois
- **Nombre de ventes** du jour
- **Alertes de stock** (produits en rupture ou en dessous du seuil minimum)
- **Commandes en attente**
- **Production du jour**
- **Dernières ventes** (liste des 10 dernières transactions)
- **Graphiques** : produits les plus vendus (barres), répartition des ventes (camembert)
- **Alertes** : produits en stock faible

---

### 4.2 Ventes

#### Nouvelle vente

Rôle : Admin, Direction, Caissier

1. Cliquez sur **Ventes > Nouvelle vente**
2. Sélectionnez le **type de client** (Particulier / Professionnel / Grossiste) — le prix s'ajuste automatiquement
3. **Recherchez un produit** ou cliquez sur un produit dans la grille
4. Ajustez la **quantité** avec les boutons +/-
5. Dans la section **Paiement** :
   - Sélectionnez un client (optionnel — client anonyme possible)
   - Choisissez le **statut** : Comptant / Crédit / Partiel
   - Choisissez le **mode de paiement** : Espèces / Mobile Money / Carte Bancaire / Virement
   - Saisissez le **montant reçu**
6. Cliquez sur **Confirmer la vente**
7. Un **reçu imprimable** s'ouvre dans un nouvel onglet

> Le stock est automatiquement déduit lors de la vente.

#### Historique des ventes

Rôle : Admin, Direction, Caissier

- Liste des ventes avec filtre par date
- Chaque vente affiche : référence, date, client, caissier, point de vente, total, statut
- **Actions** :
  - Détail de la vente (produits, quantités, totaux)
  - **Télécharger la facture PDF**
  - **Exporter en Excel**

---

### 4.3 Produits

Rôle : Admin, Direction, Responsable Stock, Caissier

**Consultation :** Liste de tous les produits avec nom, type, catégorie, prix à trois niveaux (Particulier / Professionnel / Grossiste), unité et seuil minimum.

**Création / Modification (Admin) :**
1. Cliquez sur **Nouveau produit**
2. Remplissez le formulaire : nom, type, catégorie, prix, unité, seuil minimum
3. Enregistrez

**Prix par type de client :**
- **Particulier** : prix public
- **Professionnel** : tarif professionnel (réduit)
- **Grossiste** : tarif gros volume (le plus bas)

---

### 4.4 Stocks

Rôle : Admin, Direction, Responsable Stock

#### Stock actuel

Visualisation des niveaux de stock par produit et par emplacement (point de vente ou dépôt).

- Statut par produit : **OK** (vert), **Faible** (orange), **Rupture** (rouge)
- Filtrer par type de produit ou par emplacement

#### Mouvements de stock

Enregistrement des entrées, sorties, pertes et ajustements.

1. Cliquez sur **Nouveau mouvement**
2. Sélectionnez : produit, type (Entrée / Sortie / Perte / Ajustement), quantité, emplacement
3. Ajoutez un motif (optionnel)
4. Validez

#### Inventaire

Le module d'inventaire permet de comparer le stock théorique avec le stock réel.

---

### 4.5 Caisse

Rôle : Admin, Direction, Caissier

Gestion des sessions de caisse.

#### Ouvrir une session

1. Cliquez sur **Ouvrir une session**
2. Sélectionnez la **caisse**
3. Saisissez le **fonds de caisse** (montant d'ouverture)
4. Validez

#### Fermer une session

1. Cliquez sur **Fermer** à côté de la session active
2. Saisissez le **solde de clôture** (montant réel dans la caisse)
3. Le système calcule l'écart entre le solde attendu et le solde réel
4. Validez

> Un espace s'affiche en haut de l'écran tant qu'une session est ouverte.

---

### 4.6 Production

Rôle : Admin, Direction, Responsable Production

Enregistrement des lots de production.

1. Cliquez sur **Nouvelle production**
2. Sélectionnez le **produit**
3. Saisissez la **quantité produite**
4. Saisissez les **pertes** éventuelles
5. Sélectionnez le **dépôt de destination**
6. Ajoutez des notes (optionnel)
7. Validez

> La production augmente automatiquement le stock au dépôt de destination.

---

### 4.7 Distribution

Rôle : Admin, Direction, Responsable Production, Responsable Stock

Acheminement des produits des dépôts vers les points de vente.

#### Créer une distribution

1. Cliquez sur **Nouvelle distribution**
2. Sélectionnez le **dépôt source**
3. Sélectionnez les **produits** et leurs **quantités**
4. Ajoutez des notes
5. Créez la distribution (statut : En préparation)

#### Valider une distribution

1. Dans la liste, cliquez sur **Valider** pour une distribution en préparation
2. La distribution passe au statut **Livré**
3. Le stock est mis à jour automatiquement

---

### 4.8 Livraisons

Rôle : Admin, Direction, Responsable Stock

Gestion des bons de livraison entre dépôts et/ou clients.

#### Créer un bon de livraison

1. Cliquez sur **Nouvelle livraison**
2. Sélectionnez le **dépôt source**
3. Sélectionnez la **destination** : dépôt ou client direct
4. Ajoutez les **produits** et leurs **quantités**
5. Créez le bon

#### Suivi des statuts

- **En préparation** → **En transit** → **Livré** (ou **Annulé**)
- À chaque changement de statut, cliquez sur le bouton correspondant

#### Réceptionner une livraison

Lorsqu'une livraison arrive à destination :
1. Ouvrez le détail de la livraison
2. Saisissez les **quantités réellement reçues**
3. Le système calcule les **écarts**

---

### 4.9 Réservations

Rôle : Admin, Direction, Caissier

Gestion des réservations clients pour un retrait futur.

1. Cliquez sur **Nouvelle réservation**
2. Sélectionnez le **client**
3. Choisissez la **date et l'heure** prévues
4. Sélectionnez les **produits** et **quantités**
5. Validez

---

### 4.10 Commandes

Rôle : Admin, Direction, Caissier

Gestion des commandes clients avec suivi de statut.

#### Créer une commande

1. Cliquez sur **Nouvelle commande**
2. Sélectionnez le **client**
3. Renseignez l'**adresse de livraison** et la **date de livraison** souhaitée
4. Ajoutez les **produits** avec leurs **quantités**
5. Validez

#### Workflow des statuts

- **En attente** → **Confirmée** → **En préparation** → **Livrée**
- Possibilité d'**annuler** à tout moment

---

### 4.11 Clients

Rôle : Admin, Direction, Caissier

Gestion du répertoire clients.

1. Recherchez un client par nom ou téléphone
2. Créez un nouveau client : nom, type (Particulier / Professionnel / Grossiste), téléphone, email, adresse

---

### 4.12 Créances (Crédits)

Rôle : Admin, Direction

Suivi et recouvrement des créances clients.

- **Résumé** : solde total des crédits, nombre de clients endettés, solde moyen
- **Liste des clients** avec leur solde impayé
- Cliquez sur un client pour voir ses ventes à crédit
- **Enregistrer un paiement** pour réduire le solde du client

---

### 4.13 Dépôts

Rôle : Admin, Direction, Responsable Stock

Gestion des dépôts (entrepôts de stockage).

- Création, modification, activation/désactivation des dépôts
- Chaque dépôt a un nom, code, adresse, ville

---

### 4.14 Points de vente

Rôle : Admin, Direction, Responsable Stock

Gestion des points de vente physiques.

- **Vue carte** : carte interactive avec marqueurs pour chaque point de vente
  - Cliquez sur un marqueur pour voir les informations (nom, adresse, téléphone, responsable)
- **Vue liste** : tableau avec nom, code, adresse, responsable, nombre de caisses
- Création / modification : formulaire complet avec coordonnées GPS

---

### 4.15 Trésorerie

Rôle : Admin, Direction

Vue d'ensemble des flux financiers.

- Sélectionnez une **période** (Aujourd'hui / Cette semaine / Ce mois / Cette année)
- **Total encaissé** (ventes)
- **Total dépensé** (dépenses)
- **Solde net** (encaissé - dépensé)
- **Répartition par mode de paiement** (graphique à barres)
- **Dernières ventes** et **dernières dépenses**

---

### 4.16 Statistiques

Rôle : Admin, Direction

Analyses visuelles de l'activité.

- **Indicateurs clés** : revenu total, nombre de ventes, produits vendus, meilleure vente
- **Ventes par produit** (graphique à barres)
- **Ventes par point de vente** (graphique camembert)
- **Top 10 des produits** (classement)
- **Tendance mensuelle** (courbe d'évolution)
- **Classement des vendeurs**

---

### 4.17 Rapports

Rôle : Admin, Direction, Responsable Stock, Responsable Production

Génération de rapports exportables.

1. Sélectionnez le **type de rapport** : Ventes / Caisse / Stock / Production / Distribution / Clients / Performance commerciale
2. Choisissez la **période**
3. Cliquez sur **Générer**
4. **Exportez** en PDF, Excel ou CSV

---

### 4.18 Dépenses

Rôle : Admin, Direction

Enregistrement et suivi des dépenses.

1. Cliquez sur **Nouvelle dépense**
2. Sélectionnez la **catégorie** (ou ajoutez-en une nouvelle)
3. Remplissez : description, montant, mode de paiement, date
4. Validez

> Export possible en Excel.

---

### 4.19 Administration

#### Messagerie interne

Accessible à tous les utilisateurs.

Système de messagerie interne entre collaborateurs :
- **Boîte de réception** : messages reçus (messages non lus en gras)
- **Messages envoyés** : historique des messages envoyés
- **Composer** : sélectionnez le destinataire, sujet, message
- **Pièce jointe** : possible (fichier jusqu'à 10 Mo)
- **Répondre** : répondre à un message (sujet préfixé par "Re:")
- **Supprimer** : supprimer un message

#### Historique des connexions

Rôle : Admin uniquement.

Tableau des tentatives de connexion : date/heure, utilisateur, email, rôle, adresse IP, succès/échec.

#### Gestion des utilisateurs

Rôle : Admin uniquement.

- **Liste des utilisateurs** : nom, email, rôle, point de vente, statut actif, dernière connexion
- **Créer un utilisateur** : formulaire complet (nom d'utilisateur, email, nom, prénom, mot de passe, rôle, téléphone, point de vente)
- **Activer / Désactiver** un utilisateur
- **Réinitialiser le mot de passe**

---

## 5. Workflow métier complet

```
PRODUCTION (Usine)
    ↓ Enregistrement d'un lot de production
    ↓ Le stock augmente au dépôt de destination
DÉPÔT DE STOCKAGE
    ↓ Création d'une distribution ou d'un bon de livraison
    ↓ Validation et expédition
POINT DE VENTE
    ↓ Réception des marchandises
    ↓ Mise en stock
VENTE AU CLIENT
    ↓ Session de caisse ouverte
    ↓ Création de la vente (1 clic sur produits)
    ↓ Encaissement (espèces, mobile money, carte, virement)
    ↓ Remise du reçu / facture
    ↓ Stock déduit automatiquement
```

**Cas particuliers :**
- **Vente à crédit** : le solde client augmente → recouvrement via le module Créances
- **Réservation** : le client réserve pour venir chercher plus tard
- **Commande** : le client commande pour une livraison à date ultérieure
- **Abonnement** : livraison régulière (hebdomadaire, bi-mensuelle, mensuelle)

---

## 6. Conseils d'utilisation

- **Ouvrez toujours votre session de caisse** avant d'effectuer des ventes
- **Fermez votre caisse** en fin de journée pour éviter les écarts
- **Vérifiez les alertes de stock** régulièrement pour éviter les ruptures
- **Utilisez la messagerie interne** pour communiquer avec l'équipe
- **Exportez les rapports** régulièrement pour le suivi comptable

---

## 7. Dépannage

| Problème | Solution |
|----------|----------|
| Mot de passe oublié | Contactez l'administrateur (module Gestion des utilisateurs) |
| Session de caisse bloquée | L'administrateur peut forcer la fermeture |
| Produit en rupture de stock | Prévoyez une production ou une distribution depuis le dépôt |
| Différence de caisse | Vérifiez les ventes du jour et les mouvements de caisse |
| Impossible de se connecter | Vérifiez que votre compte est actif (statut) |

---

*Document généré depuis la plateforme LCG Management (gcaisse-704)*
