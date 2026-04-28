# 🚀 QUICKSTART — pour la correction (3 minutes chrono)

> **Pré-requis sur la machine du correcteur :**
> - **Docker Desktop** (ou Docker Engine + Compose)
> - **Node.js 20+** & **npm**

---

## ⚡ Étape 1 — Lancer Keycloak (1 commande)

Depuis ce dossier :

```bash
docker compose up -d
```

Au premier lancement, Docker pull l'image (~600 MB) puis Keycloak importe le realm `efrei-iam` automatiquement. Patientez ~45 secondes.

**Vérification que c'est prêt** (ouvrir dans le navigateur ou en CLI) :

```
http://localhost:8080/realms/efrei-iam/.well-known/openid-configuration
```

→ doit renvoyer un JSON OIDC (pas une 404).

> **Variante sans Docker** (si Docker pas dispo mais Java 17+ oui) : voir `docs/DOCUMENTATION.md` § 1.B — il suffit de télécharger la distribution standalone Keycloak et lancer `kc.bat start-dev --import-realm`.

---

## ⚡ Étape 2 — Lancer la SPA (2 commandes)

```bash
npm install
npm run dev
```

Vite affiche `Local: http://localhost:5173/` → ouvre cette URL.

---

## ⚡ Étape 3 — Tester

Sur **http://localhost:5173/**, login avec :

| Username | Password    |
|----------|-------------|
| `demo`   | `demo`      |
| `ilyes`  | `ilyes2026` |

Tu dois voir :
- ✅ La session authentifiée avec avatar
- ✅ Le **JWT brut** affiché en couleurs (header rouge / payload violet / signature bleu)
- ✅ Le **tableau HTML formaté** du payload décodé (claims, types, dates lisibles)
- ✅ Boutons **Logout**, **Copy access token**, **Open in jwt.io**

---

## 🧪 Tester la cURL de la slide 397 (optionnel)

```bash
curl -X POST "http://localhost:8080/realms/efrei-iam/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=react-spa" \
  -d "username=demo" \
  -d "password=demo" \
  -d "grant_type=password" \
  -d "scope=openid profile email"
```

Sur Windows PowerShell, le projet inclut **`get-token.ps1`** qui fait la même chose et décode le payload :

```powershell
.\get-token.ps1
```

---

## 🧹 Étape finale — Tout arrêter

```bash
docker compose down
```

Et `Ctrl+C` dans le terminal Vite.

---

## 📚 Documentation complète

👉 [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md) — guide pas à pas avec **21 screenshots** couvrant chaque étape (Keycloak admin, capability config, jwt.io, SPA, sécurité…).

## 🆘 Dépannage rapide

| Symptôme                                                        | Cause / Fix                                                                                                                           |
|------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `unauthorized_client` quand on fait la curl                      | Le toggle **Direct access grants** doit être ON dans le client `react-spa` (déjà ON dans le realm export — vérifier l'import).        |
| **CORS error** dans la console du navigateur quand on clique « Sign in » | Le client `react-spa` doit avoir `http://localhost:5173` dans **Web Origins** (déjà configuré dans le realm export).                  |
| Port 8080 déjà occupé                                            | Soit on libère le port, soit on change `8080:8080` en `9090:8080` dans `docker-compose.yml` ET on adapte `src/config.js` (`serverUrl`). |
| `Failed to fetch` au login                                       | Keycloak n'est pas encore démarré, attendre ~45 s ou voir les logs : `docker compose logs -f keycloak`.                              |
| Page blanche sur la SPA                                          | Vérifier `node --version` ≥ 20, refaire `npm install`, vérifier la console du navigateur.                                           |
