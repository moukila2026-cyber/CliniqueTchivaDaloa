# Améliorations du parcours patient — Clinique Tchiva

## Comparaison documentaire — 16 octobre 2026

Sites européens utilisés comme références d’ergonomie, et non comme concurrents
locaux directs. Analyse des contenus publics indexés : pas d’audit visuel,
de mesure de performance ni de test de leur réservation.

| Référence | Observation | Adaptation pour Tchiva |
| --- | --- | --- |
| [ELSAN, Saint-Martin](https://www.elsan.care/fr/hopital-prive-saint-martin) | Spécialités accompagnées de liens « En savoir plus » et « Prendre rendez-vous ». | Cinq services visibles sur l’accueil, fiches détaillées et demande préremplie par service. |
| [Ramsay, livret Croix du Sud](https://clinique-croix-du-sud-toulouse.ramsaysante.fr/sites/default/files/biblio/domaines/clinique_la_croix_du_sud/SEJOUR.pdf) | Préparation avant hospitalisation, documents à apporter et démarches administratives. | Guide de visite en trois étapes et documents utiles, sans reprendre les formalités françaises. |
| [Hirslanden, Grangettes](https://www.hirslanden.ch/fr/clinique-des-grangettes/contact.html) | Réception, urgences et contacts par type de demande distingués. | Conserver la distinction accueil/urgences et rappeler que le formulaire n’est pas un canal d’urgence. |
| [Hirslanden, médecins et soins](https://www.hirslanden.ch/fr/corporate/medecins-et-soins.html) | Recherche de médecin et présentation du personnel médical. | Publier uniquement les profils réellement vérifiés par la clinique. |

## Livré dans cette PR

- Restauration unique du catalogue sur les anciennes configurations vides ;
  conservation des descriptions existantes et des brouillons.
- Médecine générale, ophtalmologie, ORL, laboratoire et chirurgie :
  prestations et préparation visibles sur l’accueil et dans les fiches.
- Guide « Votre visite, en trois étapes » sur l’accueil et la page Services :
  demande, documents, arrivée ; liens assurances, contact et itinéraire.
- Libellés de demande de rendez-vous cohérents avec la confirmation manuelle.
- Consignes de laboratoire à confirmer individuellement plutôt qu’un jeûne
  uniforme imposé à tous les patients.
- Aucun nouveau traceur, formulaire, transfert de document ou donnée médicale.

## Prochaines améliorations recommandées

1. **Confiance — priorité haute :** obtenir des photos réelles autorisées,
   noms et qualifications des praticiens, horaires par service et validation
   médicale des actes affichés. Ne pas inventer de certifications ou d’avis.
2. **Transparence — priorité haute :** faire valider les tarifs et conditions
   d’assurance par la direction avant de les publier ; pas de montants fictifs.
3. **Accessibilité et réseau mobile — priorité haute :** audit clavier,
   lecteur d’écran, contrastes, zoom et performance sur connexion limitée.
   Mesurer avant d’annoncer des scores ou un niveau de conformité.
4. **Suivi administratif — priorité moyenne :** envisager un suivi sécurisé
   par référence après étude de confidentialité, contrôle d’accès et politique
   de conservation. Pas de dossier médical public ni d’envoi de documents
   sensibles par WhatsApp.
5. **Contenus utiles — priorité moyenne :** FAQ par service et informations
   pour accompagnants, rédigées et validées par la clinique.

## Vérifications

Tests de migration SQLite isolée, génération HTML des cinq fiches/cartes et
du guide, contrôle syntaxique JavaScript/Python et cohérence des deux copies
JavaScript. Le déploiement de production et une recette visuelle mobile
restent à vérifier après fusion.
