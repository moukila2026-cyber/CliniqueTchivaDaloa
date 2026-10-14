# Clinique Tchiva · Votre site et votre espace de gestion

## Découvrir le site

Ouvrez l’aperçu **« Clinique Tchiva — Site et gestion »** de cette conversation.

Vous trouverez : l’accueil, la présentation de la clinique, les services, l’équipe, les informations d’accès et le formulaire de demande de rendez-vous. Le site s’adapte aux smartphones.

**Adresse intégrée :** Tazibouo, en face du Collège La Paix, Daloa.

Les horaires, numéros, spécialités et médecins restent à renseigner : aucun n’a été inventé. Le visuel d’accueil est une illustration IA, pas une photographie de l’équipe.

## Ouvrir votre espace de gestion

1. Cliquez sur **Espace personnel** en haut du site, ou **Espace de gestion** en bas.
2. À la première ouverture, créez votre compte administrateur avec votre e-mail et votre propre mot de passe (12 caractères minimum).
3. Le formulaire demande un **code d’installation privé** : ouvrez le fichier `clinique-tchiva/data/setup.key` dans les fichiers de cette conversation et recopiez son contenu. Ne partagez pas ce code publiquement.
4. Une fois le compte créé, connectez-vous avec vos identifiants. Aucun compte ou mot de passe partagé n’est livré.

Lors d’une nouvelle installation depuis le ZIP, le serveur crée un **nouveau** code dans `data/setup.key`. Les données et clés privées de l’aperçu ne sont pas incluses dans le ZIP.

## Renseigner vos informations

Dans **Paramètres → Informations**, indiquez :
- Téléphone officiel et numéro WhatsApp (avec +225).
- Horaires validés.
- Présentation de la clinique.
- Contact pour les données personnelles.
- Si disponible, l’URL Google Maps de la carte intégrée, après vérification du point exact.

Enregistrez puis contrôlez la page Contact du site public.

Dans **Services & équipe**, ajoutez vos spécialités et praticiens. Cochez « Publier » uniquement après vérification des informations et autorisation des personnes concernées. Sans cette case, le contenu reste en brouillon.

Dans **Disponibilités**, ajoutez vos plages hebdomadaires de consultation.

## Utiliser les modules

| Module | Utilisation |
|---|---|
| Rendez-vous | Lire une demande, choisir une heure et un praticien, confirmer ou annuler |
| Calendrier | Visualiser le planning mensuel et ouvrir un rendez-vous |
| Consultations | Enregistrer une consultation, le montant dû et le montant encaissé |
| Finances | Suivre les recettes automatiques des consultations et saisir les dépenses |
| Stocks | Créer les consommables et tracer les entrées/sorties avec seuils d’alerte |
| Rapports | Choisir une période, lire les totaux et exporter le CSV pour Excel |
| Paramètres | Modifier le site et gérer les comptes selon les responsabilités |
| Guide de prise en main | Parcours de formation courte d’environ 15 minutes |

**Important :** un encaissement de consultation est ajouté automatiquement aux recettes. Ne l’enregistrez pas une deuxième fois dans Finances.

## WhatsApp et rappels

- Le bouton de renseignements fonctionne après enregistrement du numéro officiel de la clinique.
- Les rappels de rendez-vous sont **manuels** et réservés aux patients ayant accepté de les recevoir.
- Pour un rendez-vous confirmé, la cloche prépare le message ; vous devez vérifier le destinataire et effectuer l’envoi dans WhatsApp.
- Un retrait de consentement peut être enregistré dans la demande ; il bloque la préparation de futurs rappels.
- Aucun SMS, e-mail ou message WhatsApp automatique n’est activé.

## Avant de recevoir de vraies données

Cette application dispose d’un serveur et d’une base persistante ; ce n’est pas une simple maquette. Néanmoins, l’aperçu de conversation **ne remplace pas un hébergement de production validé**.

Avant l’ouverture :
1. Compléter les informations officielles, mentions légales et politique de confidentialité.
2. Faire valider l’hébergement et les obligations relatives aux données de santé.
3. Configurer un domaine, HTTPS, cookies sécurisés, sauvegardes chiffrées et surveillance.
4. Créer les comptes individuels, former le personnel et tester une restauration.
5. Vérifier la fiche Google Business Profile et l’itinéraire. Le site prépare le référencement, sans garantir un positionnement Google.

La liste technique complète, les limites et les instructions de déploiement figurent dans **README.md**.

## Tests réalisés

- 9 tests d’intégration API réussis.
- Parcours navigateur complet : installation, modification des informations, demande/confirmation, rappel consenti, consultation, paiement complémentaire, dépense, stock et export CSV.
- Contrôle d’affichage sur 320 px et 390 px, ainsi que sur ordinateur.
- Vérification de création et de déchiffrement d’une sauvegarde.
- Tous les essais ont utilisé des bases de test séparées. L’aperçu livré ne contient aucun patient fictif ni compte de test.
