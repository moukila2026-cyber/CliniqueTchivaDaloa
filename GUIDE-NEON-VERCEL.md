# Clinique Tchiva · Corriger GitHub, ajouter le logo, déployer sur Neon + Vercel

## 1. Ce qui manque actuellement dans votre dépôt

Dépôt vérifié le 14 octobre 2026 :
https://github.com/moukila2026-cyber/CliniqueTchivaDaloa

La branche `main` inspectée contenait 10 fichiers à la racine (`app.py`, `requirements.txt`, guides, etc.), **mais aucun dossier `static/`**. L’arborescence publique a été vérifiée :
https://api.github.com/repos/moukila2026-cyber/CliniqueTchivaDaloa/git/trees/main?recursive=1

Le dossier du logo manque donc réellement, ainsi que les styles, scripts, polices et images. Créer uniquement un dossier vide ou ajouter le logo seul ne rétablirait pas le site complet.

L’archive **Clinique-Tchiva-Neon-Vercel.zip** fournit le projet complet et une nouvelle version compatible PostgreSQL. Aucun changement n’a été envoyé dans votre dépôt par l’assistant, aucun service Neon n’a été créé et aucune chaîne de connexion réelle n’a été utilisée.

## 2. Mettre les fichiers complets dans GitHub

1. Téléchargez **Clinique-Tchiva-Neon-Vercel.zip**.
2. Décompressez l’archive sur votre ordinateur. Vous obtenez le dossier `clinique-tchiva-neon`.
3. Ouvrez ce dossier : vous devez voir `app.py`, `database.py`, `requirements.txt`, `vercel.json` et le dossier `static`.
4. **Ne téléversez pas seulement le fichier ZIP.** GitHub ne décompresse pas automatiquement une archive pour construire le site.

### Méthode avec le navigateur

Ouvrez :
https://github.com/moukila2026-cyber/CliniqueTchivaDaloa/upload/main

- Glissez le **dossier `static` entier** depuis votre explorateur de fichiers vers la zone de dépôt de la page GitHub. Son nom et ses sous-chemins doivent être conservés.
- Glissez également les fichiers à la racine du projet, notamment `app.py`, `database.py`, `requirements.txt`, `vercel.json`, `.python-version`, `.vercelignore`, `.gitignore`, `.env.example`, `manage.py` et les nouveaux guides. Les fichiers existants doivent être mis à jour, pas simplement conservés dans leur ancienne version.
- Vous pouvez aussi inclure `tests/` et `requirements-dev.txt` ; ils servent à la recette, pas aux données patients.
- Vérifiez l’aperçu des chemins, puis validez **Commit changes**.

**Important :** si vous ouvrez le dossier `static` sur votre ordinateur puis sélectionnez ses fichiers un par un pour les envoyer à la racine GitHub, vous risquez de perdre le préfixe `static/`. Il faut préserver l’arborescence.

### Si le navigateur n’importe pas correctement les dossiers

Utilisez GitHub Desktop : clonez votre dépôt, copiez **le contenu** du dossier extrait à la racine du dépôt local en conservant les dossiers, validez les changements, puis faites **Push origin**. Ne copiez pas uniquement les fichiers isolés et n’imbriquez pas accidentellement une deuxième racine.

### Structure attendue après correction

```text
CliniqueTchivaDaloa/
├── app.py
├── database.py                 # Nouveau : PostgreSQL/Neon + SQLite local
├── requirements.txt            # Mis à jour avec psycopg
├── requirements-dev.txt
├── vercel.json                 # Nouvelle configuration directe FastAPI
├── .python-version
├── .vercelignore
├── .gitignore
├── .env.example                # Modèle, sans secret réel
├── manage.py
├── GUIDE-NEON-VERCEL.md
├── static/
│   ├── logo.png                # Votre logo officiel à remplacer ici
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── fonts.css
│   ├── favicon.svg             # Symbole de secours
│   ├── hero-clinic.jpg
│   └── autres fichiers fournis (polices, licences)
└── tests/
```

**N’envoyez jamais** : dossier `data/`, fichier `.env` réel, clé de chiffrement, code d’installation, sauvegarde ou base contenant des patients. Le `.gitignore` ne protège pas d’un envoi manuel via le navigateur. L’archive livrée ne contient aucun de ces secrets.

## 3. Ajouter votre logo

Le PNG livré reste un **symbole provisoire**, pas votre logo officiel.

Après l’import complet, ouvrez le dossier :
https://github.com/moukila2026-cyber/CliniqueTchivaDaloa/tree/main/static

Ce lien ne fonctionnera qu’une fois le dossier effectivement ajouté.

1. Cliquez **Add file → Upload files** dans `static`.
2. Envoyez votre logo nommé exactement **`logo.png`**, en minuscules.
3. Remplacez le fichier provisoire et faites **Commit changes**.
4. Après la configuration Vercel, redéployez ce commit (ou attendez son déploiement automatique si activé).

Le logo sera utilisé pour l’en-tête, le pied de page, les blocs de présentation, la connexion, la barre latérale de gestion, le favicon et l’icône mobile. Le balisage local et le partage social l’utilisent lorsque `PUBLIC_URL` est renseigné. Les caches des réseaux sociaux peuvent retarder leur mise à jour.

Format conseillé : PNG transparent, sans grande marge vide, environ 512 px ou plus pour un symbole carré, 800 px de large ou plus pour un logo horizontal. Le site conserve les proportions et masque le nom adjacent pour un logo très horizontal. Pour un favicon optimal, un symbole carré séparé pourra être ajouté si nécessaire.

## 4. Architecture de cette nouvelle version

```text
Patient / personnel
        │ HTTPS
        ▼
Vercel : application FastAPI + site et fichiers statiques
        │ connexion PostgreSQL chiffrée TLS
        ▼
Neon : base PostgreSQL persistante
```

**Il n’y a plus besoin d’un serveur SQLite séparé ni du dossier `deploy/vercel` pour ce montage.** Cette procédure remplace l’ancien guide utilisant Vercel comme simple proxy.

Le code :
- Se connecte à PostgreSQL lorsque `DATABASE_URL` est défini.
- Utilise psycopg, avec paramètres SQL et transactions.
- Conserve comptes, sessions, demandes, consentements, consultations, encaissements, stocks et journal en base.
- Stocke aussi les compteurs de limitation des requêtes en base pour les partager entre fonctions.
- N’écrit aucun fichier de clé ou de base locale en mode PostgreSQL.
- Refuse de démarrer sur Vercel si `DATABASE_URL` manque ; il ne crée pas une base SQLite temporaire de secours.
- Ne contacte pas la base à l’import du module ; le schéma est initialisé de façon idempotente au premier accès aux données, avec verrou entre instances.
- Garde le mode SQLite pour le développement local, hors Vercel.

Vercel documente le déploiement direct des applications FastAPI exposant `app` dans `app.py`, ainsi que les fichiers statiques montés avec `StaticFiles` :
https://vercel.com/docs/frameworks/backend/fastapi

**Cette version initialise une nouvelle base vide. Elle ne transfère pas automatiquement une ancienne base SQLite. Si vous avez déjà enregistré de vraies données dans l’ancienne version, arrêtez-vous et préparez une migration sauvegardée et vérifiée avant de changer de base.**

## 5. Créer votre base Neon

Depuis votre propre compte Neon :

1. Créez un projet PostgreSQL pour la clinique.
2. Choisissez la région et les conditions d’hébergement après validation des contraintes de confidentialité, résidence/transfert des données et obligations applicables aux données de santé en Côte d’Ivoire. La compatibilité technique de Neon ne constitue pas une certification juridique de ce projet.
3. Ouvrez la fenêtre **Connect** du projet/de la branche voulue.
4. Copiez la chaîne de connexion PostgreSQL avec **connection pooling** activé. Le nom de serveur comporte généralement `-pooler`.
5. Conservez les paramètres de sécurité fournis, notamment `sslmode=require` et, si présent, `channel_binding=require`.

Neon documente l’URL poolée et ses paramètres : [3](https://neon.com/docs/cli/connection-string).

La vraie chaîne contient un mot de passe : **ne la mettez ni dans GitHub, ni dans un message, ni dans une capture d’écran publique**. Elle sera ajoutée uniquement aux variables privées Vercel.

Le schéma sera créé automatiquement au premier accès. Le rôle utilisé pour l’initialisation doit avoir les permissions nécessaires. Pour une exploitation plus durcie, prévoyez une séparation entre migrations administratives et rôle applicatif, avec revue des privilèges.

## 6. Générer les secrets sur votre appareil

Sur votre ordinateur, ouvrez un terminal dans le dossier du projet et exécutez :

```bash
python manage.py generate-secrets
```

Cette commande utilise uniquement la bibliothèque standard Python. Elle n’a pas besoin de se connecter à Neon.

Elle produit :
- **ENCRYPTION_KEY** : clé Fernet, pour les noms et téléphones des patients.
- **SETUP_KEY** : code privé pour créer le premier compte administrateur.
- **BACKUP_KEY** : clé indépendante de chiffrement des sauvegardes, à garder dans un coffre séparé ; inutile pour le serveur web lui-même.

Conservez ces valeurs dans un gestionnaire de mots de passe. **N’exécutez pas cette commande comme Build Command Vercel : cela exposerait les secrets dans les logs.**

Ne régénérez pas `ENCRYPTION_KEY` après les premières données. Changer ou perdre cette clé sans migration rend les coordonnées chiffrées illisibles. Elle doit rester identique entre les déploiements du même environnement.

Si vous migrez un jour une ancienne base chiffrée, il faudra conserver sa clé d’origine ; ne remplacez pas cette clé par une nouvelle valeur sans procédure.

## 7. Importer et configurer le projet Vercel

### Réglages du projet

1. Dans Vercel, importez le dépôt **moukila2026-cyber/CliniqueTchivaDaloa**.
2. **Root Directory : la racine du dépôt (`.`)**, là où se trouvent `app.py`, `database.py` et `requirements.txt`.
3. Utilisez le preset **FastAPI** s’il est proposé/détecté, avec les paramètres de construction par défaut.
4. Ne définissez pas `public` ou `static` comme Output Directory. Ce n’est pas un déploiement de site statique uniquement.
5. Ne mettez pas `uvicorn ...` comme Build Command. Le runtime Vercel charge directement l’application `app`.
6. Le fichier `.python-version` fourni indique Python 3.13.

Vercel documente la détection des dépendances et des points d’entrée Python : [1](https://vercel.com/docs/functions/runtimes/python).

**Si vous aviez déjà configuré l’ancienne version :** changez Root Directory de `deploy/vercel` vers la racine et retirez les anciens overrides de build/install/output. Utilisez le nouveau `vercel.json`, qui ne réécrit plus vers un autre serveur.

### Variables d’environnement Vercel

Dans **Settings → Environment Variables**, ajoutez pour **Production** :

| Nom | Valeur à fournir | Obligatoire |
|---|---|---|
| `DATABASE_URL` | La vraie chaîne PostgreSQL poolée de Neon, avec TLS | Oui |
| `ENCRYPTION_KEY` | La clé Fernet générée sur votre appareil | Oui |
| `SETUP_KEY` | Votre code privé d’au moins 24 caractères | Oui |
| `COOKIE_SECURE` | `1` | Oui pour HTTPS |
| `PUBLIC_URL` | Le domaine public final, ex. `https://votre-projet.vercel.app`, sans slash final | À renseigner dès que l’URL est connue |
| `TZ` | `Africa/Abidjan` | Conseillé ; les comparaisons serveur sont déjà en UTC |

Le projet ne charge pas automatiquement `.env.example`. Les secrets doivent être définis dans les réglages privés Vercel, pas copiés dans un fichier committé.

Vous pouvez faire un premier déploiement avec les trois secrets obligatoires et `COOKIE_SECURE=1`, puis copier l’URL de production réelle dans `PUBLIC_URL` et **redéployer**. Cela finalise aussi les URL canoniques, le sitemap et le logo de partage.

Ne recopiez pas aveuglément des URL d’exemple : elles ne désignent pas vos ressources réelles.

### Séparer Production et Preview

Ne donnez pas automatiquement aux previews l’URL de la base des vrais patients. Utilisez une branche/base Neon de test distincte, sans données personnelles réelles, et des secrets distincts pour Preview. Sans variables de test complètes, un déploiement de preview pourra échouer volontairement plutôt que basculer vers une base locale.

Une clé différente n’anonymise pas une copie de production : ne clonez pas des données patients dans un environnement de test sans procédure appropriée.

## 8. Déployer et installer la clinique

1. Lancez le déploiement Vercel et vérifiez les logs, sans publier les valeurs des variables.
2. Ouvrez le domaine de production, puis **`/api/public`** : vous devez obtenir un JSON sans secret. Le premier accès initialise le schéma si nécessaire.
3. Ouvrez **`/gestion`**.
4. Créez votre propre compte administrateur : nom, e-mail, mot de passe d’au moins 12 caractères, et valeur de **`SETUP_KEY`**.
5. Une fois le premier compte créé, l’installation initiale est bloquée. Il n’y a pas de mot de passe partagé fourni.
6. Complétez les coordonnées, horaires, services et médecins vérifiés dans Paramètres.
7. Créez les comptes du personnel depuis /gestion → Paramètres → Comptes du personnel → Créer un compte (nom, prénom, téléphone, code de 12 caractères minimum). Transmettez le code par un canal distinct.

Sur Neon/Vercel, **aucun fichier `data/setup.key` n’est à chercher** : votre code d’installation est la variable privée `SETUP_KEY`.

Les demandes en ligne restent à confirmer. Les rappels WhatsApp sont manuels et nécessitent le consentement du patient ; aucun message automatique n’a été ajouté par cette adaptation.

## 9. Recette avant de vrais patients

Sur une base Neon de test distincte :

- [ ] Le dépôt contient bien `static/` et `database.py`.
- [ ] `/static/logo.png` affiche votre logo officiel après déploiement.
- [ ] Le site s’affiche sur smartphone et ordinateur.
- [ ] L’installation et la connexion fonctionnent.
- [ ] Une demande fictive est enregistrée, confirmée et visible au calendrier.
- [ ] Le consentement aux rappels est respecté et son retrait bloque la préparation d’un rappel.
- [ ] Un paiement partiel puis un complément sont ajoutés une seule fois aux recettes.
- [ ] Une sortie dépassant le stock est refusée.
- [ ] Le CSV se télécharge après connexion.
- [ ] Après un redéploiement Vercel, le même compte et les données fictives sont encore disponibles dans Neon.
- [ ] Vous avez une politique de sauvegarde/restauration vérifiée, incluant la clé de chiffrement.
- [ ] Les informations légales, droits d’accès, formalités, prestataires et traitements de données de santé ont été validés.

### Tests réalisés sur le livrable

13 tests d’intégration ont réussi en SQLite local **et** en PostgreSQL 17 local, dont encaissements et sorties de stock concurrents, limite partagée entre clients, chiffrement, rôles, consentement, CSV et absence de fichiers/connexion au démarrage en mode Vercel.

Il s’agit d’une validation PostgreSQL locale, **pas d’une connexion à votre projet Neon ni d’un déploiement Vercel réel**. Ceux-ci devront être vérifiés avec vos propres comptes et paramètres.

## 10. Sauvegardes et récupération

- Vérifiez les capacités et durées de restauration de votre offre Neon et configurez une stratégie adaptée ; ne supposez pas que votre plan couvre toutes vos obligations.
- Conservez `ENCRYPTION_KEY` hors du dépôt et dans votre coffre, avec une procédure d’accès contrôlée. Une sauvegarde de la base seule ne suffit pas pour lire les coordonnées sans cette clé.
- L’outil `manage.py backup` peut créer une archive chiffrée, avec `BACKUP_KEY`, depuis votre ordinateur/serveur de maintenance. En mode PostgreSQL, un client `pg_dump` compatible doit être installé.
- Si nécessaire, fournissez `DATABASE_URL_UNPOOLED` pour ce travail de maintenance (connexion directe Neon), uniquement dans les variables privées locales du poste de maintenance.
- Ce travail ne doit pas être exécuté dans une fonction web ou dans les logs de build. Aucune tâche de sauvegarde automatique n’est installée.

```bash
# Avec les variables privées déjà configurées sur le poste de maintenance :
python manage.py backup --output /chemin-prive/tchiva-sauvegarde.fernet
python manage.py reset-password --phone '+2250707995414'
```

La réinitialisation ferme toutes les sessions du compte. Elle nécessite un accès privé aux mêmes variables de base/chiffrement. N’exposez jamais ces outils comme des routes web.

Pour restaurer, déchiffrez l’archive avec `BACKUP_KEY` sur un poste isolé, restaurez le dump avec `pg_restore` dans une base de test vide compatible, définissez la même `ENCRYPTION_KEY`, supprimez les sessions restaurées puis vérifiez les lectures et totaux avant toute reprise. Faites valider cette procédure par l’administrateur ; ne restaurez pas sans sauvegarde sur une base active.

## Dépannage

| Problème | Vérification |
|---|---|
| Pas de dossier logo dans GitHub | Importez **tout le dossier `static/`**, pas uniquement les fichiers à la racine |
| Le logo n’a pas changé | Vérifiez le nom en minuscules `static/logo.png`, le commit Vercel déployé, puis rechargez sans cache |
| Échec de build : `static` introuvable | Dossier manquant dans GitHub ou Root Directory mal choisi |
| Échec au démarrage : `DATABASE_URL` obligatoire | Ajoutez la vraie chaîne privée Neon dans l’environnement Vercel utilisé puis redéployez |
| Erreur de clé | `ENCRYPTION_KEY` doit être une clé Fernet valide ; `SETUP_KEY` doit faire au moins 24 caractères |
| Erreur TLS | Conservez `sslmode=require` dans la chaîne Neon, sans guillemets parasites |
| 503 à `/api/public` | Vérifiez les accès Neon, la base/branche, le rôle, les permissions de création et les logs privés ; ne partagez pas la chaîne complète |
| Erreur d’origine sur un formulaire | Vérifiez le domaine réellement utilisé, `PUBLIC_URL`, le Root Directory et l’absence de l’ancien proxy |
| Données anciennes illisibles | Même base mais clé changée : restaurer la bonne clé ; ne pas en générer une autre |
| Données absentes | Vérifiez la branche Neon et l’environnement Vercel ; cette version n’importe pas automatiquement les anciennes données SQLite |
| Le déploiement vise toujours l’ancien serveur | Retirez l’ancien fichier de réécritures ; utilisez le nouveau `vercel.json` à la racine |

## Références officielles

- FastAPI sur Vercel : https://vercel.com/docs/frameworks/backend/fastapi
- Runtime Python : [1](https://vercel.com/docs/functions/runtimes/python)
- Chaînes Neon poolées/TLS : [3](https://neon.com/docs/cli/connection-string)
- Adresses client fournies par Vercel : https://vercel.com/docs/headers/request-headers
