# Gestion des Inscriptions

> Application **desktop** de gestion des inscriptions aux activités : enregistrement des participants, suivi des paiements, statistiques et export Excel. Fonctionne **100 % en local**, sans serveur ni connexion internet.

**Application locale (Tauri 2)** — installée via un simple `.msi`/`.exe` sous Windows. Les données restent sur le poste, dans une base **SQLite** embarquée.

---

## Aperçu

Pensée pour un usage de terrain (associations, structures de formation, événements), l'application n'a besoin d'aucune infrastructure : pas de Node, pas de serveur, pas de base distante. Tout est embarqué dans un binaire unique.

```
Inscription → SQLite locale (APPDATA) → Liste / recherche / filtres → Export Excel
                     │
                     └── Sauvegarde / restauration du fichier .db
```

---

## Fonctionnalités

### Inscriptions
- **Formulaire d'inscription** des participants
- Mode de paiement **Wave** (mobile money) ou **Espèces**
- **Liste** avec recherche, filtres et suppression
- **Import** d'inscriptions existantes
- **Export Excel** (`.xlsx`) des inscriptions filtrées

### Activités & statistiques
- Gestion des **activités**
- **Statistiques** et graphiques (`recharts`)
- **Journal d'audit** des opérations

### Sécurité & données
- **Verrouillage par mot de passe** + codes de récupération
- **Sauvegarde / restauration** de la base (`.db`)
- **Mise à jour automatique** de l'application (auto-updater)
- Préférences utilisateur

---

## Stack technique

| Couche | Technologie |
|---|---|
| Shell desktop | Tauri 2 (Rust) |
| Frontend | React 18 + Vite + TypeScript |
| Routage | React Router |
| UI | Tailwind CSS + `lucide-react` |
| Données | SQLite (`tauri-plugin-sql`) |
| Export | `xlsx` (SheetJS) |
| Graphiques | `recharts` |
| Build / release | GitHub Actions (Windows `.msi` + `.exe`) |

---

## Démarrage

### Prérequis
- Node.js 18+
- Rust (toolchain stable) + dépendances Tauri ([prérequis Tauri](https://v2.tauri.app/start/prerequisites/))

### Développement

```bash
npm install

npm run tauri:dev    # Vite + fenêtre Tauri (accès SQLite, hot reload)
npm run dev          # Vite seul (UI uniquement, pas d'accès à la base)
npm run lint         # ESLint
```

> En mode `npm run dev` (navigateur), la base SQLite n'est pas accessible : utile uniquement pour itérer sur l'UI.

### Build (installeurs)

```bash
npm run tauri:build  # → src-tauri/target/release/bundle/
```

Sous Windows, produit un `.msi` (WiX) et un `.exe` (NSIS). Le workflow [`build-windows.yml`](.github/workflows/build-windows.yml) génère automatiquement ces installeurs à chaque push sur `main` et les attache à une Release sur les tags `v*`.

---

## Démo en ligne (données fictives)

L'application est locale par nature, mais le **même code** peut être déployé en démo web (Vercel) avec un jeu de **données fictives**, sans SQLite ni serveur.

Activer le mode démo via une variable d'environnement :

```bash
VITE_DEMO_MODE=true npm run build
```

En mode démo :
- la couche de données est servie depuis des fixtures en mémoire ([`src/utils/demo.ts`](src/utils/demo.ts)) ;
- l'écran de verrouillage est désactivé ;
- un bandeau « Mode démonstration » s'affiche ;
- les écritures restent en mémoire (non persistées) et l'export/import de base `.db` est désactivé.

Le déploiement Vercel est préconfiguré ([`vercel.json`](vercel.json) force `VITE_DEMO_MODE=true` et le routage SPA).

---

## Données

- Base SQLite : `%APPDATA%/com.badstephane.gestion-inscription/inscriptions.db` (créée au premier lancement)
- Schéma géré par **migrations Rust** ([`src-tauri/src/lib.rs`](src-tauri/src/lib.rs)) — append-only et versionnées
- Sauvegarde/restauration via copie du fichier `.db`

---

## Structure

```
src/
├── pages/         # Home, Activités, Statistiques, Audit
├── components/    # formulaire & liste d'inscriptions, modales (auth, activités, import…)
├── utils/         # db, storage, sauvegarde, export Excel
└── types/         # type Registration
src-tauri/         # shell Rust, migrations SQLite, configuration & permissions
```

---

## Statut

Application interne, **destinée à un usage local** — pas de déploiement public. UI entièrement en français.

**Auteur** : [@badStephane](https://github.com/badStephane)
