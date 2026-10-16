# Clinique Tchiva · Démarrage Neon + Vercel

## Le guide à suivre

Ouvrez **GUIDE-NEON-VERCEL.md** : il remplace les anciennes instructions de proxy Vercel/SQLite.

1. Importez le projet complet dans GitHub en conservant les dossiers, surtout **static/**, qui manque actuellement dans le dépôt inspecté.
2. Remplacez **static/logo.png** par votre logo officiel. Le PNG fourni reste provisoire.
3. Créez une base PostgreSQL Neon et copiez sa connexion poolée/TLS dans les variables privées Vercel.
4. Sur votre appareil, exécutez `python manage.py generate-secrets`. Gardez les clés dans votre coffre et copiez **ENCRYPTION_KEY** dans les variables Vercel, jamais dans GitHub ni les logs de build. `SETUP_KEY` n’est plus utilisée par l’application.
5. Déployez Vercel depuis **la racine contenant app.py**, preset FastAPI, sans ancien dossier `deploy/vercel` ni Output Directory `public`.
6. Configurez `COOKIE_SECURE=1`, `TZ=Africa/Abidjan` et `PUBLIC_URL` avec le domaine final. Redéployez après modification.
7. Ajoutez les quatre variables de votre compte administrateur : **ADMIN_NOM** (votre nom), **ADMIN_PRENOM** (vos prénoms), **ADMIN_TEL** (votre téléphone, **sans espaces**, ex. `+2250707995414`) et **ADMIN_PASSWORD** (votre code personnel, 12 caractères minimum). `ADMIN_EMAIL` et `SETUP_KEY` ne sont plus lues : supprimez-les de vos variables.
8. Ouvrez **/gestion** : votre compte administrateur est **créé automatiquement** au premier accès à la base, depuis ces quatre variables. Connectez-vous avec **nom + prénom + téléphone + code personnel**. Cliquez sur l’icône **œil 👁** à droite du champ pour afficher ou masquer le code saisi. En mode Neon, aucun fichier `data/setup.key` n’est créé et aucune inscription publique n’est ouverte.

Le téléphone saisi est normalisé : `07 07 99 54 14` comme `+225 07 07 99 54 14` sont acceptés.

**Ne partagez ni DATABASE_URL ni ENCRYPTION_KEY ni ADMIN_PASSWORD. Ne changez pas ENCRYPTION_KEY après les premières données.**

## Si « Identifiants incorrects » s’affiche

Les comptes administrateur créés avant le passage au téléphone (ancien système e-mail + mot de passe) n’avaient pas de téléphone en base. Une synchronisation automatique s’exécute désormais au démarrage : elle aligne le compte administrateur sans téléphone sur `ADMIN_TEL`, `ADMIN_NOM`, `ADMIN_PRENOM` et `ADMIN_PASSWORD`, puis ferme toutes les sessions.

**Aucune requête SQL manuelle dans Neon n’est nécessaire** : redéployez simplement. Si le message persiste, vérifiez que `ADMIN_TEL` est défini sans espaces, que `ADMIN_PASSWORD` fait au moins 12 caractères, relancez un **Redeploy** dans Vercel puis videz le cache du navigateur (Ctrl+Maj+Suppr).

La synchronisation ne modifie jamais un compte déjà pourvu d’un téléphone, ni les comptes du personnel.

## Connexion du personnel

La direction crée les comptes depuis **/gestion → Paramètres → Comptes du personnel → Créer un compte**. Chaque membre se connecte ensuite avec nom + prénom + téléphone + code personnel (12 caractères minimum). La direction peut remettre un nouveau code à tout moment (bouton « Code »), ce qui ferme les sessions du membre concerné.

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
