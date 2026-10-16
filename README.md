# Clinique Tchiva · Daloa — Neon + Vercel

Site professionnel et gestion administrative en français. Adresse : **Tazibouo, en face du Collège La Paix, Daloa**.

## Commencer ici

**GUIDE-NEON-VERCEL.md** contient la procédure détaillée pour corriger le dépôt GitHub, ajouter le logo, créer la base Neon et configurer Vercel.

Cette version remplace l’ancien montage Vercel en proxy devant SQLite. **Vercel déploie directement l’application FastAPI depuis la racine du projet ; Neon héberge PostgreSQL. Ne choisissez plus `deploy/vercel` comme Root Directory.**

Le dépôt inspecté `moukila2026-cyber/CliniqueTchivaDaloa` manquait de `static/`. Importez le projet complet en conservant les dossiers, pas seulement les fichiers à la racine.

## Fonctions incluses

### Site public
- Accueil, clinique, services, équipe, contact/accès et demande de rendez-vous.
- Responsive, polices locales, pas de CDN publicitaire.
- Logo centralisé dans **`static/logo.png`**, avec adaptation carré/horizontal.
- Numéros (standard, urgences 24h/24, accueil), WhatsApp, horaires, présentation, coordonnées GPS, Plus Code et assurances conventionnées modifiables depuis Paramètres.
- Bandeau d’urgence 24h/24, menu de choix d’appel, sélecteur de motif WhatsApp, fiches pratiques des cinq services et section assurances & mutuelles.
- Carte Google Maps interactive réelle, centrée sur le point GPS exact 6.90645, -6.43381 (Tazibouo, en face du Collège La Paix, Plus Code WH48+HFJ Daloa) et bouton d’itinéraire direct. Aucun schéma de remplacement n’est affiché.
- Accueil : carte réelle + Plus Code + GPS + itinéraire face au texte « Une attention sincère. Une relation de confiance. », chiffres animés, accès rapides (urgences, WhatsApp, itinéraire), bandeau des spécialités, tuiles services menant chacune à sa fiche (`/services#service-N`).
- WhatsApp : la fenêtre propose **d’abord** l’appel d’urgence (+225 07 88 97 55 16), puis trois motifs pré-remplis (renseignement général, tarifs laboratoire, rendez-vous spécialiste).
- Rendez-vous : le bouton principal enregistre la demande dans la gestion **puis** ouvre WhatsApp vers le +225 07 88 97 55 16 avec un message pré-rempli (nom, téléphone, service, date, heure, précisions, référence) ; bouton secondaire « Enregistrer sans WhatsApp » et bouton de renvoi après envoi. Les précisions ne sont pas stockées en base.
- Pied de page « Plan du site » (8 pages, services, informations pratiques, encart urgences) ; page 404 conviviale (statut HTTP 404).
- Couche visuelle `static/vivant.css` / `static/vivant.js` : apparitions au défilement, parallaxe légère du héros, compteurs, bouton haut de page ; tout est désactivé avec `prefers-reduced-motion`.
- Images en deux tailles (`*-720.jpg` pour mobile, `srcset`), chargement différé hors écran et cache long côté serveur.
- Métadonnées par page (titre + description), JSON-LD `MedicalClinic`, sitemap/canoniques avec `PUBLIC_URL`.
- Politique de confidentialité et mentions légales à compléter.

### Espace protégé
- Comptes individuels, rôles, bcrypt, sessions serveur 8 h, cookie HttpOnly/SameSite, CSRF, contrôle d’origine.
- Demandes, confirmation, modification, annulation, calendrier et plages récurrentes.
- Consentement facultatif aux rappels, retrait/accord tracés et préparation WhatsApp **manuelle**.
- Consultations administratives, montants dus/encaissés, paiements complémentaires.
- Recettes liées automatiquement aux consultations, dépenses, solde de trésorerie et export CSV.
- Consommables, seuils d’alerte et mouvements de stock, sans quantité négative.
- Journal d’activité et guide de prise en main de 15 minutes.

Aucun numéro, horaire, service médical, médecin, diplôme ou témoignage n’a été inventé. Les 12 visuels de `static/img/` (accueil, façade, urgences, salle d’attente, cinq services, accueil assurances, équipe, préparation de visite, accueil rendez-vous) sont des illustrations IA, pas l’équipe ni les locaux réels. Le PNG fourni est toujours un symbole provisoire à remplacer par le logo officiel.

## Configuration PostgreSQL/Neon

Le mode PostgreSQL est activé quand `DATABASE_URL` est défini.

| Variable | Fonction |
|---|---|
| `DATABASE_URL` | Connexion privée PostgreSQL/Neon, poolée avec TLS |
| `ENCRYPTION_KEY` | Clé Fernet stable pour les noms/téléphones patients |
| `SETUP_KEY` | Code privé d’au moins 24 caractères pour le premier compte |
| `COOKIE_SECURE=1` | Cookie sécurisé, obligatoire sur le site HTTPS réel |
| `PUBLIC_URL` | Domaine public final sans slash final |
| `TZ=Africa/Abidjan` | Fuseau prévu, les dates serveur utilisent UTC/Abidjan explicitement |

Générez les secrets **sur votre appareil**, puis copiez-les dans les variables privées Vercel et votre coffre :

```bash
python manage.py generate-secrets
```

Pas de secret dans GitHub, dans une capture ou dans les logs de build. Le fichier `.env.example` est un modèle et n’est pas chargé automatiquement. **Ne régénérez jamais ENCRYPTION_KEY pour une base existante sans migration contrôlée.**

En mode PostgreSQL : aucune clé ni base n’est écrite sur disque par le serveur web. Les tables sont initialisées au premier accès aux données, pas pendant l’import/build. Les sessions et limites de requêtes sont partagées en base ; les adresses IP des compteurs sont pseudonymisées par HMAC. Les mutations critiques utilisent un verrou transactionnel inter-instance.

Sur Vercel (`VERCEL=1`), une absence de `DATABASE_URL` ou une connexion sans TLS provoque une erreur de configuration explicite plutôt qu’un stockage temporaire local.

## Déploiement Vercel

- Importer le dépôt GitHub contenant le projet complet.
- Root Directory : **`.`**, ou le véritable sous-dossier contenant `app.py` si vous avez volontairement imbriqué le projet.
- Preset FastAPI/détection automatique ; conserver les réglages de build et d’output par défaut.
- Ne pas utiliser les anciens overrides `Output Directory=public` ou le fichier de proxy `deploy/vercel/vercel.json`.
- Ajouter les variables privées, déployer, renseigner le domaine final dans `PUBLIC_URL` et redéployer.
- Le compte administrateur se crée à `/gestion`, avec **SETUP_KEY**, pas un fichier `data/setup.key` en mode Neon.
- Prévoir des bases/secrets de test distincts pour Preview ; ne pas exposer la base des patients aux previews.

Le code et le JSON ont été préparés selon la documentation FastAPI/Python de Vercel. **Aucun déploiement Vercel réel, aucune connexion à votre Neon et aucun push GitHub n’ont été effectués depuis cette conversation.**

## Développement local

Python 3.13 recommandé.

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

Sans `DATABASE_URL` et hors Vercel, le développement utilise SQLite dans `data/`, comme auparavant. Des clés locales sont alors créées dans `data/encryption.key` et `data/setup.key`. Ce mode n’est pas le déploiement Neon/Vercel.

Pour tester PostgreSQL local ou une base Neon **de test** : définir `DATABASE_URL`, `ENCRYPTION_KEY`, `SETUP_KEY` et les variables requises avant le lancement. Ne jamais tester des mutations sur la base des vrais patients.

La transition vers Neon **n’importe pas les anciennes données SQLite**. Si vous avez des données existantes, sauvegarder et organiser une migration dédiée avec conservation de la clé patient. Ne pas lancer une nouvelle base vide en supposant que les données ont été déplacées.

## Rôles

| Rôle | Accès |
|---|---|
| Administrateur | Tous les modules, publication, paramètres, comptes et suppressions autorisées |
| Accueil | Rendez-vous, calendrier, consentements/rappels et consommables |
| Équipe médicale | Rendez-vous, consultations, encaissements liés et consommables |
| Comptabilité | Finances, rapports et consommables, sans noms/téléphones des patients |

Un compte par personne. Le changement du mot de passe ferme les sessions du compte ; la désactivation d’un compte ferme ses sessions. L’installation initiale se ferme après le premier compte, avec protection contre deux créations simultanées.

## Maintenance et sauvegardes

Exécuter les outils sur un poste privé, avec les variables de la base concernée, **pas comme route web ou commande de build Vercel**.

```bash
python manage.py init-db
python manage.py reset-password --email utilisateur@votre-domaine.ci
python manage.py backup --output /chemin-prive/sauvegarde.fernet
```

- `backup` requiert **BACKUP_KEY** indépendante et conservée hors des archives.
- PostgreSQL : installer un `pg_dump` compatible ; une connexion directe peut être définie dans `DATABASE_URL_UNPOOLED` pour la maintenance.
- SQLite local : l’outil utilise SQLite Backup.
- L’archive est chiffrée et contient la base/dump et la clé de chiffrement des patients.
- Aucune tâche planifiée n’est installée. Définir fréquence, rotation, stockage hors application, accès, responsabilités et restauration testée.
- Les fonctions d’un plan Neon ne doivent pas être présumées couvrir toutes les obligations : vérifier les capacités du plan choisi.
- Pour restaurer : déchiffrer sur un environnement isolé, restaurer dans une base vide avec les outils adaptés, utiliser la même ENCRYPTION_KEY, fermer les sessions restaurées, puis vérifier données et totaux. Ne pas écraser une base active sans plan de reprise.

## Tests

```bash
# SQLite local temporaire
pytest -q tests/test_app.py

# PostgreSQL temporaire exclusivement — la fixture SUPPRIME les données de test
TCHIVA_TEST_DB_CONFIRM=DELETE_TEST_DATA TEST_DATABASE_URL='votre-connexion-privee-de-test' pytest -q tests/test_app.py
```

**TEST_DATABASE_URL doit viser une base jetable vide, jamais une base contenant des patients.**

13 tests ont réussi avec SQLite et avec PostgreSQL 17 local : installation, rôles, auth/CSRF/origine, coordonnées chiffrées, consentement/retrait, collisions de créneaux, consultations/paiements, stocks, CSV, métadonnées/logo, demandes limitées entre clients, concurrence de paiements et mouvements, absence de fichiers ou de connexion à l’import en mode Vercel.

Une recette navigateur est fournie dans `tests/browser_smoke.py` pour une application de test initialement vide sur le port 8001. Elle nécessite Playwright/Chromium et ne doit pas viser une application réelle.

Ces tests ne constituent pas une certification de sécurité ou de conformité et ne remplacent pas la recette sur votre projet Neon/Vercel.

## Limites avant usage réel

- **Données de santé :** validation de la localisation/résidence et des transferts, contrats, formalités en Côte d’Ivoire, confidentialité, conservation et procédures d’accès/suppression indispensables avant de saisir de vraies informations. La disponibilité technique de Neon/Vercel n’est pas une approbation réglementaire.
- **Registre administratif :** pas de dossier médical, diagnostic, prescription, résultat d’analyse, outil d’aide à la décision ou service d’urgence.
- **Rappels :** manuels avec consentement, pas de fournisseur automatique SMS/WhatsApp Business API, pas de vérification de livraison.
- **Calendrier :** les plages sont indicatives ; pas de congés, jours fériés ou fermetures exceptionnelles. La collision est contrôlée sur une heure exacte pour un praticien, pas sur la durée réelle de l’acte.
- **Stocks :** quantités de consommables uniquement, pas de lots, péremptions, pharmacie ou prescriptions.
- **Finances :** pas de facturation fiscale certifiée, reçus réglementaires numérotés, paiement en ligne ou rapprochement bancaire. Le solde de trésorerie n’est pas un bénéfice. Les écritures ne sont pas supprimables depuis l’interface ; les ajustements doivent être documentés.
- **Volumes :** listes limitées à 2 000 rendez-vous/consultations et 5 000 transactions récentes ; les statistiques des listes peuvent être partielles au-delà, contrairement au CSV qui exporte la période entière. Prévoir pagination et agrégations serveur avant ces volumes.
- **Conservation :** durée cible paramétrable mais aucune purge automatique. Les demandes non liées peuvent être supprimées par l’administrateur ; une procédure complète d’anonymisation médicale/comptable et de traitement des droits doit être définie.
- **Sécurité :** pas de MFA ni de portail patient. La limitation partagée ne remplace pas un WAF/antispam. Les scripts utilisent encore des gestionnaires intégrés et la CSP autorise `unsafe-inline` ; prévoir un durcissement et une revue indépendante.
- **Privilèges et migrations :** l’initialisation automatique utilise des droits DDL ; séparer les migrations du rôle applicatif est une amélioration à préparer pour un durcissement de production. Les prochains changements de schéma nécessiteront des migrations versionnées.
- **Google :** la fiche Google Business Profile et Search Console restent à créer/vérifier par la clinique. Aucun classement garanti.

## Structure

```text
app.py                    API, authentification et pages
app.js / static/app.js    Interface (les deux fichiers doivent rester strictement identiques)
database.py               Transactions, schéma PostgreSQL/SQLite et compatibilité
manage.py                 Outils privés et génération locale des secrets
vercel.json               Réglages de cache de l’API/gestion, sans proxy externe
.python-version           Python 3.13
.vercelignore             Exclusion des données et secrets des déploiements
requirements.txt          Dépendances d’exploitation dont psycopg
requirements-dev.txt      Dépendances de test
static/                   Logo, interface, images, polices et licences
tests/                    Tests API et recette navigateur
GUIDE-NEON-VERCEL.md       Procédure pas à pas adaptée au dépôt de la clinique
```

Le `Dockerfile` et `Caddyfile.example` restent des options pour un hébergement Python classique ; ils ne sont pas requis pour le déploiement direct sur Vercel. Les polices DM Sans et DM Serif Display sont locales et leurs licences OFL sont incluses.
