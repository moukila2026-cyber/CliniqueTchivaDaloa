# Clinique Tchiva · Démarrage Neon + Vercel

## Le guide à suivre

Ouvrez **GUIDE-NEON-VERCEL.md** : il remplace les anciennes instructions de proxy Vercel/SQLite.

1. Importez le projet complet dans GitHub en conservant les dossiers, surtout **static/**, qui manque actuellement dans le dépôt inspecté.
2. Remplacez **static/logo.png** par votre logo officiel. Le PNG fourni reste provisoire.
3. Créez une base PostgreSQL Neon et copiez sa connexion poolée/TLS dans les variables privées Vercel.
4. Sur votre appareil, exécutez `python manage.py generate-secrets`. Gardez les clés dans votre coffre et copiez **ENCRYPTION_KEY** et **SETUP_KEY** dans les variables Vercel, jamais dans GitHub ou les logs de build.
5. Déployez Vercel depuis **la racine contenant app.py**, preset FastAPI, sans ancien dossier `deploy/vercel` ni Output Directory `public`.
6. Configurez `COOKIE_SECURE=1`, `TZ=Africa/Abidjan` et `PUBLIC_URL` avec le domaine final. Redéployez après modification.
7. Ouvrez **/gestion** et créez votre compte avec votre propre e-mail, mot de passe et la valeur privée **SETUP_KEY**. En mode Neon, aucun fichier `data/setup.key` n’est créé.

**Ne partagez ni DATABASE_URL ni ENCRYPTION_KEY ni ADMIN_PASSWORD. Ne changez pas ENCRYPTION_KEY après les premières données.**

## Les informations à renseigner

Dans Paramètres : téléphone, WhatsApp, horaires officiels, présentation, point de carte validé et contact pour la confidentialité. Ajoutez les services et médecins réellement proposés, puis publiez uniquement les informations vérifiées.

L’adresse fournie est déjà intégrée : **Tazibouo, en face du Collège La Paix, Daloa**.

## La prise en main

Le menu **Guide de prise en main** propose un parcours de 15 minutes : mise à jour du site, demande/confirmation de rendez-vous, consultation et encaissement, dépense, mouvement de stock et export CSV.

Les rappels WhatsApp restent **manuels avec consentement**. Le montant encaissé d’une consultation est ajouté automatiquement aux recettes : ne le ressaisissez pas dans Finances.

## Avant toute donnée réelle

Validez l’hébergement et les traitements de données de santé, les mentions légales, la conservation, les rôles, les sauvegardes et une restauration. Utilisez une base de test distincte pour les essais et les previews.

Cette version ouvre une nouvelle base vide ; elle ne migre pas automatiquement une ancienne base SQLite. Si vous avez des données existantes, faites préparer une migration dédiée et sauvegardée avant de remplacer l’ancienne installation.

**Livrable testé sur PostgreSQL local, mais pas connecté à votre compte Neon et pas déployé sur votre compte Vercel. Aucun push GitHub n’a été effectué.**
