# Rapport d'audit de sécurité — Clinique Tchiva Daloa

**Date** : 2026-10-16  
**Portée** : code source frontend (app.js, static/app.js, style.css, vivant.css), backend (app.py, database.py), configuration de déploiement (vercel.json, Dockerfile, .env.example, .gitignore)  
**Environnement** : tests locaux avec base SQLite temporaire ; aucun test intrusif sur la production.

---

## 1. Bouton Shopin30 — vérifications

| Élément | Vérifié | Résultat |
|---|---|---|
| Titre, bouton et numéro affichés dans le pied de page | ✅ | Correctement intégrés avant la barre de bas de page |
| Lien `https://wa.me/2250501303343` avec message pré-rempli | ✅ | Message encodé via `encodeURIComponent`, aucune donnée patient |
| `target="_blank"` + `rel="noopener noreferrer"` | ✅ | Présent dans le HTML |
| Libellé accessible (`aria-label`) | ✅ | Rôle `complementary`, libellé explicite |
| Indépendance vis-à-vis de la clinique mentionnée | ✅ | Note juridique ajoutée |
| Aucune donnée patient transmise | ✅ | Le message est générique et ne contient que la référence au site |
| `app.js` et `static/app.js` synchronisés | ✅ | Identiques après modification (test automatisé) |
| CSS responsive | ✅ | Media queries pour ≤ 700 px, bouton pleine largeur sur mobile |

---

## 2. Endpoints publics — données exposées

| Endpoint | Vérifié | Résultat |
|---|---|---|
| `GET /api/public` | ✅ | Ne renvoie plus le marqueur interne `_services_catalog_v1` ; les praticiens non publiés sont filtrés des plages horaires |
| `GET /api/availability` | ✅ | Ne retourne que des créneaux horaires, aucun nom de patient |
| `POST /api/appointments` | ✅ | Ne renvoie que la référence et un message de confirmation, pas les données du patient |
| `GET /robots.txt` | ✅ | `/api/` et `/gestion` interdits à l'indexation |

**Correction appliquée** : filtrage des attributs internes (`_services_catalog_v1`) et des plages horaires associées à des praticiens non publiés dans `/api/public`.

---

## 3. Authentification et autorisations

| Vérification | Résultat |
|---|---|
| Tous les endpoints `/api/admin/*` exigent une session valide | ✅ 401 sans cookie de session |
| Rôles : `admin`, `reception`, `medical`, `accounting` | ✅ Contrôle par rôle vérifié |
| Création de compte public désactivée (`/api/setup`) | ✅ HTTP 410 permanent |
| Hash bcrypt avec minimum 12 caractères | ✅ |
| Session 8 heures, cookie `httponly`, `samesite=lax`, `secure` configurable | ✅ |
| Déconnexion supprime la session serveur + cookie | ✅ |
| Changement de mot de passe invalide toutes les sessions | ✅ |

**Aucun correctif nécessaire** sur ces points.

---

## 4. Protection CSRF

| Vérification | Résultat |
|---|---|
| Token CSRF requis pour POST/PATCH/PUT/DELETE authentifiés | ✅ Vérifié par test |
| Vérification par `secrets.compare_digest` (timing-safe) | ✅ |
| Origine vérifiée en middleware pour les mutations | ✅ |

---

## 5. Rate limiting

| Endpoint | Limite | Vérifié |
|---|---|---|
| `POST /api/login` | 8 tentatives / 15 min par IP | ✅ |
| `POST /api/appointments` | 8 tentatives / heure par IP | ✅ |

**Remarque** : Le rate limiting utilise le pseudonymage HMAC de l'IP. Sur Vercel, l'IP provient de `x-vercel-forwarded-for` (ajouté par la plateforme). En local, `request.client.host` est utilisé.

---

## 6. En-têtes de sécurité

| En-tête | Avant | Après | Vérifié |
|---|---|---|---|
| `X-Content-Type-Options` | `nosniff` | `nosniff` | ✅ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | `strict-origin-when-cross-origin` | ✅ |
| `Permissions-Policy` | caméra, micro, géoloc désactivés | idem | ✅ |
| `Content-Security-Policy` | Présent, avec `unsafe-inline` (nécessaire pour l'architecture SPA) | inchangé | ✅ |
| `Cross-Origin-Opener-Policy` | — | `same-origin` | ✅ **Ajouté** |
| `Cross-Origin-Resource-Policy` | — | `same-origin` | ✅ **Ajouté** |
| `Strict-Transport-Security` | Présent si `SECURE=1` | inchangé | ✅ |
| `X-Frame-Options` | `DENY` en serverless | inchangé | ✅ |

---

## 7. Chiffrement et données patient

| Élément | Vérifié | Résultat |
|---|---|---|
| Noms et téléphones chiffrés (Fernet) dans la base | ✅ | `enc()` / `dec()` appliqués |
| Clé Fernet depuis variable d'env ou fichier local (mode 0o600) | ✅ | |
| En production PostgreSQL, `ENCRYPTION_KEY` obligatoire | ✅ | Erreur au démarrage sinon |

**Limite** : le chiffrement est symétrique ; si la clé est compromise, toutes les données le sont. La rotation de clé nécessite un chiffrement par clé maître distincte (non implémenté).

---

## 8. Exports CSV

| Vérification | Résultat |
|---|---|
| Protection contre les formules malveillantes (`=`, `+`, `-`, `@`) | ✅ Préfixe par `'` |
| Export accessible uniquement aux rôles `accounting` et `admin` | ✅ |
| Paramètres de période validés (format ISO date) | ✅ |

---

## 9. Secrets dans le code et l'historique Git

| Vérification | Résultat |
|---|---|
| Aucun secret dans les fichiers suivis | ✅ Vérifié par `git log` et `.gitignore` |
| `.env` ignoré | ✅ |
| `.env.example` sans valeur réelle | ✅ |
| Historique Git : aucun fichier de clé ou `.env` trouvé | ✅ |

**Recommandation** : si des secrets ont été exposés dans le passé sur une autre branche ou un fork, les révoquer/rotationner systématiquement.

---

## 10. Dépendances

| Package | Version | Observations |
|---|---|---|
| `fastapi` | 0.143.0 | À jour |
| `bcrypt` | 5.0.0 | À jour |
| `cryptography` | 50.0.2 | À jour |
| `psycopg[binary]` | 3.3.6 | À jour |

**Aucune vulnérabilité connue applicable** sur ces versions au moment de l'audit. Les dépendances sont minimales et le serveur (uvicorn) n'est exposé que derrière un reverse proxy (Vercel/Caddy).

---

## 11. Données envoyées aux services externes

| Service | Données transmises | Vérifié |
|---|---|---|
| WhatsApp (wa.me) | Nom, téléphone, service, date/heure (uniquement si l'utilisateur clique et envoie) | ✅ Pas de données chiffrées ou médicales |
| Google Maps | Adresse GPS (coordonnées publiques de la clinique) | ✅ Aucune donnée patient |
| Shopin30 (wa.me) | Message générique pré-rempli uniquement | ✅ Aucune donnée patient |

---

## 12. Risques résiduels (non bloquants, à évaluer en production)

1. **CSP `unsafe-inline` pour les scripts** : nécessaire pour l'architecture SPA actuelle. Une migration vers un hachage ou nonce CSP renforcera la protection XSS.
2. **Suppression automatique des données** : aucune purge automatique des rendez-vous expirés. Dépend de la politique de conservation validée par la clinique.
3. **Rotation de clé Fernet** : non automatisée. Nécessite une procédure manuelle.
4. **Hébergement et HTTPS** : la configuration TLS réelle dépend de la plateforme (Vercel/Caddy). Non vérifiable dans ce contexte.
5. **Site en production non accessible** depuis cet environnement : les tests de pénétration actifs n'ont pas été réalisés.

---

## 13. Tests de régression

**42 tests de sécurité** ajoutés dans `tests/test_security.py`, couvrant :
- Endpoints publics : aucune donnée sensible
- Authentification : 401 sans session
- Autorisations par rôle
- Protection CSRF
- En-têtes de sécurité
- Validation des entrées
- Gestion des erreurs sans fuite technique
- Correctness du bloc Shopin30

**3 tests existants** (migration services) inchangés et toujours passants.

**Total : 45 tests, tous passants.**

---

## Résumé des modifications

1. **Bouton Shopin30** ajouté dans le pied de page public (app.js, static/app.js, vivant.css)
2. **Filtrage `/api/public`** : suppression des attributs internes et des praticiens non publiés dans les plages horaires
3. **En-têtes Cross-Origin** ajoutés (COOP, CORP)
4. **42 tests de sécurité** ajoutés
