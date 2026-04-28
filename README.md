# 🔐 Keycloak SSO + JWT Decoder — Single Page React App

> Devoir EFREI · *Open Source IAM solutions and Cloud Computing*
> **Ilyes SADADOU** · **IAM M1-CSM 2026** · Pr. Issiaka KONÉ
> Date : **28/04/2026**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Keycloak](https://img.shields.io/badge/Keycloak-26.0.1-008AAA?logo=keycloak&logoColor=white)](https://www.keycloak.org)
[![OAuth 2.0](https://img.shields.io/badge/OAuth%202.0-ROPC-orange)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.3)
[![License](https://img.shields.io/badge/license-Educational-blue)](#)

---

## 📖 Sommaire

- [Aperçu](#-aperçu)
- [Démarrage rapide](#-démarrage-rapide-3-commandes)
- [Architecture](#-architecture)
- [Captures d'écran](#-captures-décran)
- [Documentation complète](#-documentation-complète)
- [Structure du projet](#-structure-du-projet)
- [Stack technique](#-stack-technique)
- [Sécurité](#-sécurité)

---

## 🎯 Aperçu

Single Page App **React + Vite** qui démontre un flux OAuth 2.0 / OpenID Connect complet contre **Keycloak 26** :

1. L'utilisateur se connecte via le formulaire (flow *Resource Owner Password Credentials* de la slide 397)
2. Keycloak renvoie un **JWT signé en RS256**
3. La SPA **décode le payload côté client** (sans dépendance externe)
4. Le résultat est affiché dans un **tableau HTML stylisé** avec descriptions des claims, types et conversions de timestamps

> Ce projet répond aux exigences de la slide 396 du cours :
> *Deploy Keycloak via Docker → Create App + user → curl JWT → Decode online → React SPA with login + JWT + HTML table.*

---

## 🚀 Démarrage rapide (3 commandes)

> **Pré-requis :** Docker Desktop + Node.js 20+

```bash
# 1. Lancer Keycloak (avec le realm efrei-iam pré-importé)
docker compose up -d
# → patienter ~45 s, puis vérifier : http://localhost:8080/realms/efrei-iam/.well-known/openid-configuration

# 2. Lancer la SPA
npm install
npm run dev

# 3. Login dans la SPA
# → http://localhost:5173/   credentials :  demo / demo
```

**Variante sans Docker** (Java 17+ requis) : voir [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md) § 1.B.

**Variante PowerShell** pour reproduire la cURL de la slide :

```powershell
.\get-token.ps1                                    # demo / demo
.\get-token.ps1 -Username ilyes -Password ilyes2026
```

---

## 🏗 Architecture

```
┌─────────────────────────┐                     ┌──────────────────────────┐
│  React SPA (Vite)       │   1. POST /token    │   Keycloak 26.0.1        │
│  http://localhost:5173  │ ──────────────────▶ │   http://localhost:8080  │
│                         │  username+password  │                          │
│  • login form           │                     │   Realm: efrei-iam       │
│  • JWT decoder          │ ◀────────────────── │   Client: react-spa      │
│  • HTML table view      │   2. JWT (RS256)    │   User: demo / demo      │
└─────────────────────────┘                     └──────────────────────────┘
        │ 3. décode le payload localement
        ▼
┌─────────────────────────┐
│  Tableau HTML stylé     │
│  iss / sub / exp / ...  │
└─────────────────────────┘
```

**Flow utilisé : Resource Owner Password Credentials** (`grant_type=password`) — imposé par la slide 397, déprécié en prod (cf. § Sécurité).

---

## 📸 Captures d'écran

### 1. SPA — formulaire de login
![SPA login](docs/screenshots/01-spa-login.png)

### 2. SPA — session authentifiée (JWT brut color-coded)
![SPA authenticated](docs/screenshots/10-spa-authenticated.png)

### 3. SPA — tableau HTML du payload décodé ⭐ *(cœur du livrable)*
![Decoded payload table](docs/screenshots/11-spa-payload-table.png)

### 4. Keycloak admin — Direct Access Grants ON ✅
![Capability config](docs/screenshots/06b-client-capability.png)

### 5. Terminal — cURL de la slide 397 + payload décodé
![curl JWT](docs/screenshots/08-curl-jwt.png)

### 6. jwt.io — vérification du token
![jwt.io decoded](docs/screenshots/09-jwt-io-decoded.png)

> 15 autres screenshots disponibles dans [`docs/screenshots/`](docs/screenshots/).

---

## 📚 Documentation complète

📝 **[`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md)** — documentation Markdown navigable :
1. Objectif du livrable
2. Architecture générale
3. Prérequis
4. Étape 1 — Déploiement de Keycloak (Docker + Java standalone)
5. Étape 2 — Realm, client et utilisateur
6. Étape 3 — Obtention d'un JWT via cURL
7. Étape 4 — Décodage sur jwt.io
8. Étape 5 — SPA React (login + payload table)
9. Lancement complet
10. Sécurité — limites et bonnes pratiques

⚡ **[`QUICKSTART.md`](QUICKSTART.md)** — démarrage en 3 minutes pour le correcteur.

---

## 📂 Structure du projet

```
.
├── README.md                        ← ce fichier
├── QUICKSTART.md                    ← démarrage 3 minutes
│
├── docker-compose.yml               ← Keycloak + import auto du realm
├── keycloak-realm-export.json       ← realm + client + 2 users pré-configurés
├── start-keycloak.ps1               ← variante PowerShell
├── get-token.ps1                    ← reproduit la cURL slide 397
│
├── package.json / vite.config.js / index.html
├── src/
│   ├── App.jsx                      ← composant principal (form + table)
│   ├── main.jsx                     ← point d'entrée React
│   ├── jwt.js                       ← décodeur JWT base64url (~30 LoC)
│   ├── config.js                    ← endpoints + descriptions des claims
│   └── index.css                    ← design system (dark + glass)
├── public/
└── docs/
    ├── DOCUMENTATION.md
    └── screenshots/                 ← 21 PNG
```

---

## 🛠 Stack technique

| Couche       | Choix                              | Pourquoi                                              |
|--------------|------------------------------------|-------------------------------------------------------|
| UI           | **React 18** (hooks, StrictMode)   | Standard de l'industrie pour les SPA                  |
| Build        | **Vite 5**                         | HMR < 100ms, build < 2s                               |
| Auth         | **`fetch` direct vers `/token`**   | 0 dépendance, montre le protocole brut (slide 397)    |
| Decode JWT   | **Maison** (`src/jwt.js`)          | ~30 lignes, sans `jsonwebtoken` ni `jwt-decode`       |
| Backend IdP  | **Keycloak 26 / OIDC**             | Imposé par le cours                                   |
| Container    | **Docker Compose**                 | 1 commande pour le correcteur                         |

**Comptes de test** (réalm `efrei-iam`) :

| Username | Password    | Rôles                  |
|----------|-------------|------------------------|
| `demo`   | `demo`      | `user`                 |
| `ilyes`  | `ilyes2026` | `user`, `admin-iam`    |

---

## 🔒 Sécurité

| Choix démo                           | Limite                                              | Recommandé en prod                              |
|--------------------------------------|-----------------------------------------------------|--------------------------------------------------|
| `grant_type=password` (ROPC)         | Mot de passe visible côté JS                        | **Authorization Code + PKCE**                    |
| `start-dev` / HTTP                   | Tokens en clair sur le réseau                       | TLS via reverse proxy (nginx/Traefik)            |
| Token en `sessionStorage`            | Vulnérable à XSS                                    | Cookies `HttpOnly` + `SameSite=Strict` + CSP     |
| Pas de signature vérifiée côté SPA   | OK car la décision d'auth est **côté serveur**      | Toujours valider la signature côté API           |
| Admin admin/admin                    | Mot de passe trivial                                | Mot de passe fort + 2FA + IP allowlist           |

---

© 2026 Ilyes SADADOU · EFREI Paris · Devoir IAM M1-CSM
