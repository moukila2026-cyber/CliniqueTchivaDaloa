# Clinique Tchiva · Daloa

Site public et application de gestion en français, préparés pour un déploiement mono-instance. **Ce livrable n’est pas une certification de conformité, ni un dossier patient informatisé complet.** N’introduisez aucune donnée réelle avant la validation de l’hébergement, des accès, des sauvegardes et des obligations applicables aux données de santé en Côte d’Ivoire.

## 1. Ce qui est livré

### Site public
- Accueil professionnel, pages Clinique, Services, Équipe, Contact et Rendez-vous.
- Affichage responsive, testé sur 320 px, 390 px et ordinateur.
- Adresse : **Tazibouo, en face du Collège La Paix, Daloa**.
- Informations essentielles modifiables depuis l’espace de gestion.
- Bouton WhatsApp opérationnel une fois le numéro officiel renseigné. Sans numéro, aucun faux lien : une explication et une alternative sont affichées.
- Recherche d’itinéraire Google Maps ; carte Google intégrable après validation de son point exact. Le schéma par défaut est clairement non géographique.
- Métadonnées, balisage local JSON-LD `MedicalClinic`, `robots.txt`, sitemap et canoniques après configuration du domaine.
- Pages de confidentialité et mentions légales à valider/compléter.

### Gestion avec serveur et base persistante
- Installation initiale avec code privé, comptes individuels et rôles.
- Rendez-vous en attente, confirmation, déplacement, annulation et calendrier mensuel.
- Plages hebdomadaires de disponibilité et suggestions de créneaux dans le formulaire.
- Refus de deux confirmations au même horaire pour un même praticien. Le personnel reste responsable de la durée réelle, des chevauchements, des congés et des urgences.
- Consentement aux rappels facultatif, retrait/accord manuel tracé par le personnel.
- Préparation des rappels WhatsApp **manuels**, vérification du consentement et du statut confirmé. Le message n’est pas envoyé automatiquement et sa livraison n’est pas vérifiée.
- Registre administratif des consultations, montants dus et encaissements ; complément de paiement ; inscription transactionnelle automatique dans les recettes.
- Recettes, dépenses et solde de trésorerie en FCFA ; filtre mensuel ; rapports par période et export CSV.
- Consommables, quantités, seuils d’alerte et mouvements ; refus des stocks négatifs.
- Journal d’activité et guide de prise en main d’environ 15 minutes.

**Aucun médecin, diplôme, horaire, numéro de téléphone, avis de patient ni service clinique n’a été inventé.** Le visuel principal est généré par IA et identifié comme tel. Le monogramme est une proposition graphique provisoire, non un logo officiel fourni par la clinique.

## 2. Démarrage local

Python 3.13 recommandé. Aucun Node.js ni outil de compilation n’est nécessaire pour exploiter le site.

```bash
cd clinique-tchiva
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
TZ=Africa/Abidjan uvicorn app:app --host 0.0.0.0 --port 8000 --workers 1
```

Ouvrir `http://localhost:8000` dans le navigateur local. Pour un serveur distant, utiliser son domaine ou son adresse réelle, pas `localhost` dans les liens destinés aux utilisateurs.

### Premier accès administrateur
1. Ouvrir `/gestion` depuis le site, lien « Espace personnel » ou « Espace de gestion ».
2. Lire le code sur le serveur : `cat data/setup.key` (ou la valeur de `SETUP_KEY` si configurée).
3. Créer le compte avec votre nom, votre e-mail et un mot de passe d’au moins 12 caractères.
4. L’installation se ferme dès que le premier compte existe. Aucun compte partagé ni mot de passe par défaut n’est livré.
5. Dans **Paramètres**, renseigner les informations officielles puis créer les comptes du personnel.

Dans l’espace Arena de ce livrable, le fichier se trouve dans `clinique-tchiva/data/setup.key`. Il est privé et n’est jamais servi par l’application. Ne communiquez pas ce code au public. Le paquet ZIP de distribution n’inclut **ni base ni clés** ; elles sont créées sur la nouvelle installation.

### Accès par rôle
| Rôle | Accès |
|---|---|
| Administrateur | Tous les modules, publication, comptes, suppressions de demandes non liées |
| Accueil | Rendez-vous, calendrier, consentements, rappels manuels et consommables |
| Équipe médicale | Rendez-vous, calendrier, consultations, encaissements liés et consommables |
| Comptabilité | Finances, rapports, consommables, sans accès aux noms et téléphones des patients |

Un utilisateur peut changer son mot de passe depuis l’icône cadenas. La modification ferme ses sessions. Un administrateur peut désactiver les comptes ; cette action ferme leurs sessions.

## 3. Formation courte · 15 minutes

Un guide interactif est disponible dans **Espace de gestion → Guide de prise en main**.

1. **3 min — Informations** : modifier téléphone, WhatsApp, horaires et présentation dans Paramètres. Enregistrer puis vérifier la page Contact.
2. **4 min — Rendez-vous** : ouvrir une demande, renseigner l’heure/praticien, confirmer et prévenir le patient. Vérifier le calendrier. Préparer un rappel uniquement avec consentement ; envoyer manuellement dans WhatsApp.
3. **3 min — Consultation** : créer une consultation et la lier éventuellement au rendez-vous ; saisir montant dû et encaissé. Vérifier la recette automatique ; ne pas la ressaisir dans Finances. Ajouter un complément depuis le solde restant.
4. **3 min — Finances/stock** : enregistrer une dépense ; créer un consommable ; faire une entrée ou sortie avec un motif ; exporter un CSV dans Rapports.
5. **2 min — Sécurité** : un compte par personne, déconnexion en fin de poste, désactivation des départs, aucune information clinique dans les libellés, traitement des retraits de consentement.

Effectuer ce parcours avec des données fictives **sur une base de test séparée** avant la prise de poste. Le guide est un support ; une séance humaine doit être organisée si une formation accompagnée est souhaitée.

## 4. Mise en ligne à préparer

### Variables d’environnement
Le fichier `.env.example` est un modèle : il **n’est pas chargé automatiquement**. Exporter les variables via le gestionnaire de processus ou Docker.

| Variable | Usage |
|---|---|
| `PUBLIC_URL` | Domaine HTTPS final, sans slash final ; canoniques, sitemap et validation d’origine |
| `COOKIE_SECURE=1` | Obligatoire sur le site réel en HTTPS ; valeur locale par défaut : 0 |
| `DATA_DIR` | Répertoire persistant privé, hors des fichiers statiques |
| `TZ=Africa/Abidjan` | Fuseau de fonctionnement UTC ; définir avant le lancement |
| `ENCRYPTION_KEY` | Facultatif : clé Fernet via gestionnaire de secrets ; sinon fichier privé `data/encryption.key` |
| `SETUP_KEY` | Facultatif : code d’installation via gestionnaire de secrets ; sinon fichier privé `data/setup.key` |
| `BACKUP_KEY` | Clé Fernet indépendante pour les sauvegardes, pas pour le serveur web |

**Ne perdez jamais la clé de chiffrement des patients.** Changer cette clé sans migrer les données rend les noms et téléphones existants illisibles.

### Hébergement
- Utiliser un hébergement approprié aux données de santé et validé par la direction/conseil compétent, avec stockage persistant et responsabilités contractuelles définies.
- Un seul processus applicatif (`--workers 1`) et un seul volume SQLite. Ne pas répartir cette version sur plusieurs instances. Pour une clinique à forte concurrence, prévoir une migration PostgreSQL, une file de tâches et un audit de sécurité.
- Placer l’application derrière Caddy/Nginx avec HTTPS ; un exemple Caddy est fourni. Limiter les requêtes à 128 Ko et ajouter une protection antispam au niveau du proxy. Ne pas exposer directement Uvicorn au public.
- N’autoriser les en-têtes proxy que depuis les adresses de proxy de confiance (`--proxy-headers --forwarded-allow-ips=ADRESSE_PROXY`). Ne pas mettre `*` sur un port publiquement accessible. Les limites applicatives sont en mémoire et par IP ; elles doivent être complétées par une protection en bordure.
- Définir `PUBLIC_URL`, `COOKIE_SECURE=1`, `TZ`. Restreindre le port 8000 au proxy et les permissions du répertoire de données (0700).
- En production, remplacer la politique `frame-ancestors` permissive de l’aperçu par `frame-ancestors 'none'` au proxy (voir exemple). Le code utilise encore des gestionnaires d’événements intégrés ; un durcissement CSP sans `unsafe-inline` nécessite leur refactorisation.
- Mettre à jour et surveiller les dépendances, journaliser les incidents, tester une restauration et réaliser une revue de sécurité indépendante avant ouverture.

### Docker, exemple
```bash
docker build -t clinique-tchiva .
docker volume create tchiva-data
docker run -d --name tchiva --restart unless-stopped \
  -p 127.0.0.1:8000:8000 \
  -e PUBLIC_URL=https://votre-domaine.ci -e COOKIE_SECURE=1 \
  -v tchiva-data:/app/data clinique-tchiva

docker exec tchiva cat /app/data/setup.key
```
Ce conteneur ne fournit pas lui-même HTTPS. Mettre un proxy devant le port privé. Configurer l’adresse de proxy de confiance pour obtenir une limitation par véritable IP client.

### Google local
Le code seul ne crée pas de fiche Google et ne garantit pas un classement. À faire par la clinique :
1. Valider la raison sociale, les coordonnées cohérentes et le point GPS exact.
2. Créer/revendiquer et vérifier la fiche Google Business Profile.
3. Configurer le domaine `PUBLIC_URL`, vérifier `/sitemap.xml`, inscrire le domaine dans Search Console puis soumettre le sitemap.
4. Faire relire les services et qualifications par la direction. Les pages fonctionnent avec JavaScript ; pour une stratégie SEO plus avancée, compléter par un rendu serveur complet du contenu et une campagne locale de contenu validé.

## 5. Sauvegardes et reprise

Le fichier SQLite contient aussi des informations opérationnelles non chiffrées par champ. Le chiffrement des noms et téléphones ne chiffre pas l’intégralité de la base ni le disque. La clé doit idéalement être séparée du disque de données en exploitation.

L’outil utilise l’API SQLite Backup pour obtenir une copie cohérente, puis chiffre l’archive contenant la base et la clé patient avec une **clé de sauvegarde indépendante**.

```bash
# Générer une clé de sauvegarde et la conserver dans un coffre distinct.
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Exporter BACKUP_KEY dans le processus via un gestionnaire de secrets, puis :
python manage.py backup --output /chemin-prive/tchiva-2026-10-14.fernet
```

Automatiser une sauvegarde quotidienne, copie hors serveur, accès restreint et rotation validée. Ne pas stocker `BACKUP_KEY` avec les archives. L’outil n’installe pas de tâche planifiée.

**Restauration :** sur un environnement isolé, déchiffrer avec `Fernet(BACKUP_KEY).decrypt(...)`, décompresser l’archive, arrêter l’application cible, restaurer `tchiva.sqlite3` et la clé patient (ou la même `ENCRYPTION_KEY`), restreindre les permissions, supprimer les sessions restaurées (`DELETE FROM sessions`) puis relancer. Vérifier les lectures et les totaux avant remise en service. Ne pas écraser une production active sans plan de reprise validé.

Mot de passe perdu (accès serveur requis) :
```bash
python manage.py reset-password --email utilisateur@domaine.ci
```

## 6. Périmètre et limites à connaître

- Les services, médecins, contacts, horaires, carte exacte, informations juridiques et politique de conservation restent à renseigner/valider.
- Les demandes en ligne sont non urgentes, sans diagnostic ni motif médical libre. L’application est un registre administratif, pas un dossier de soins, un outil de prescription ou un dispositif de décision médicale.
- Les rappels sont manuels, pas de fournisseur SMS/WhatsApp API, pas d’e-mail transactionnel et pas de tâche automatique de rappel. Aucun message n’est envoyé simplement en enregistrant un rendez-vous.
- Le calendrier n’intègre pas les jours fériés, congés ou fermetures exceptionnelles ; le personnel confirme individuellement les demandes. La contrainte de collision porte sur une heure exacte, pas sur la durée réelle d’un acte.
- Le stock ne gère pas les lots, médicaments, dates de péremption ni fournisseurs.
- Pas de facturation fiscale, reçu réglementaire numéroté, paiement en ligne, rapprochement bancaire ou certification comptable. Le solde de trésorerie n’est pas un résultat comptable. Faire valider les besoins légaux avant de remplacer un outil de facturation existant.
- Les écritures sont conservées et auditées ; pas de suppression financière depuis l’interface. Les ajustements doivent être documentés.
- Les listes affichent les 2 000 rendez-vous/consultations et 5 000 transactions les plus récents. Les indicateurs de listes et graphiques peuvent donc être partiels au-delà ; le CSV couvre toutes les écritures de la période. Faire évoluer vers une pagination/agrégation serveur avant ces volumes.
- Les demandes non liées peuvent être supprimées par un administrateur. Les durées de conservation sont des objectifs indicatifs ; aucune purge automatique ni procédure complète d’anonymisation médicale/comptable n’est mise en place. La direction doit définir et appliquer le traitement des droits et les obligations de conservation.
- Pas de double authentification ni de portail patient. Mot de passe oublié : outil serveur sécurisé ou administrateur technique, pas de lien public de réinitialisation.
- Les comptes utilisent bcrypt ; sessions 8 h côté serveur avec cookie HttpOnly/SameSite, CSRF et contrôle des rôles. Ces mesures ne remplacent pas un audit ou des procédures organisationnelles.

## 7. Tests

```bash
pytest -q tests/test_app.py
```
Neuf tests d’intégration couvrent les accès, l’installation, CSRF/origine, la validation et le chiffrement des coordonnées, les collisions de créneaux, le consentement/retrait, les encaissements transactionnels et leurs plafonds, le stock négatif, les exports CSV, les brouillons, les rôles et les limites de requêtes. Les tests utilisent une base temporaire séparée.

Recette navigateur (Playwright, uniquement sur base jetable) : voir `tests/browser_smoke.py`. Ne pas exécuter ce script sur la base réelle.

## 8. Structure
```
app.py                 API FastAPI, authentification, données et pages
manage.py              sauvegarde chiffrée et récupération de compte
static/                interface, polices locales, icônes, visuel
requirements.txt       dépendances verrouillées
Dockerfile             image non-root, volume de données externe
Caddyfile.example      exemple de frontal HTTPS à adapter
tests/                 tests API et recette navigateur
DATA_DIR/              base, clé de chiffrement, code d’installation (privé)
```

Les polices DM Sans et DM Serif Display sont embarquées localement (licences OFL dans `static/`). Aucun CDN, outil publicitaire ni mesure d’audience n’est chargé. Google Maps ne s’intègre que si configuré ; les autres liens externes sont actionnés par l’utilisateur.
