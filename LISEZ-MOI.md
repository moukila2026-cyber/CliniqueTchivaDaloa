# Activer la connexion sans SETUP_KEY

Clinique Tchiva de Daloa · Mise à jour du 14 octobre 2026

**Cette procédure remplace les anciennes instructions de création du premier compte avec SETUP_KEY.** Le site existe déjà : https://clinique-tchiva-daloa.vercel.app. Le dossier static et votre logo sont déjà présents dans GitHub : il ne faut pas les recréer.

La mise à jour a été préparée et testée localement, mais n’a pas été envoyée dans votre dépôt ou déployée par l’assistant. N’envoyez pas vos mots de passe dans la conversation.

## 1. Remplacer deux fichiers dans GitHub

Téléchargez et décompressez **Mise-a-jour-connexion-sans-code.zip**. Le petit ZIP est volontairement sans sous-dossier pour faciliter l’envoi depuis le navigateur. Il contient app.py, app.js et ce guide.

| Fichier extrait | Emplacement exact dans le dépôt |
|---|---|
| app.py | app.py, à la racine |
| app.js | static/app.js, dans le dossier static existant |

### Remplacer app.py

1. Ouvrez https://github.com/moukila2026-cyber/CliniqueTchivaDaloa/upload/main
2. Envoyez uniquement le nouveau **app.py**.
3. Cliquez **Commit changes** pour remplacer l’ancien fichier.

### Remplacer static/app.js

1. Ouvrez https://github.com/moukila2026-cyber/CliniqueTchivaDaloa/tree/main/static
2. Dans ce dossier, choisissez **Add file → Upload files**.
3. Envoyez le nouveau **app.js**, puis cliquez **Commit changes**.
4. Vérifiez que son chemin est **static/app.js**, pas app.js à la racine.

Ne téléversez pas le ZIP lui-même dans GitHub : GitHub ne le décompresse pas pour le site. Aucun changement à database.py, à Neon ou au logo n’est nécessaire pour cette mise à jour.

## 2. Enregistrer votre premier compte dans Vercel

Ouvrez votre projet Vercel → **Settings → Environment Variables**. Ajoutez ces quatre variables pour **Production**, avec vos informations personnelles :

| Nom exact de la variable | Valeur à saisir en privé |
|---|---|
| ADMIN_NOM | Votre nom |
| ADMIN_PRENOM | Votre ou vos prénoms |
| ADMIN_EMAIL | L’adresse e-mail que vous utiliserez pour vous connecter |
| ADMIN_PASSWORD | Votre mot de passe personnel, d’au moins 12 caractères |

Les prénoms peuvent contenir plusieurs mots. Le nom affiché réunit prénoms et nom (100 caractères au total au maximum). Le code personnel accepte au maximum 72 octets UTF-8 : les lettres accentuées et émojis peuvent occuper plusieurs octets. Un code long et unique conservé dans un gestionnaire de mots de passe est recommandé.

**Ne saisissez pas les exemples du guide comme identifiants réels.** Ne mettez pas de guillemets autour des valeurs. Enregistrez chaque variable. Gardez ces informations hors du dépôt GitHub, des captures d’écran et des logs.

Conservez sans changement :
- **DATABASE_URL** : votre connexion privée Neon existante ;
- **ENCRYPTION_KEY** : votre clé actuelle, exactement identique ;
- **COOKIE_SECURE** : 1 ;
- **PUBLIC_URL** : https://clinique-tchiva-daloa.vercel.app.

N’ajoutez pas TZ dans Vercel : ce nom y est réservé et UTC correspond déjà à l’heure d’Abidjan. Le nouveau code ignore SETUP_KEY ; attendez que le nouveau déploiement fonctionne avant de supprimer cette ancienne variable.

## 3. Redéployer le dernier commit

1. Dans Vercel → **Deployments**, ouvrez le déploiement du **dernier commit**, celui comprenant les deux fichiers remplacés.
2. Si ce déploiement a commencé avant l’enregistrement des variables, cliquez **Redeploy**, avec les nouvelles variables de Production.
3. Attendez le statut **Ready** et vérifiez que ce déploiement dessert votre domaine de production. Ne redéployez pas un ancien commit contenant encore l’ancien app.py.
4. Ouvrez https://clinique-tchiva-daloa.vercel.app/gestion
5. Connectez-vous avec **votre e-mail et votre mot de passe**. Aucun code supplémentaire n’est demandé.

Le premier compte est créé automatiquement, dans Neon, au premier accès à la base après le redéploiement. Son code personnel est enregistré sous forme de hash bcrypt, et non en clair en base. Les nom, prénom et téléphone sont fournis une seule fois dans la configuration privée, pas à chaque connexion.

Si un compte existe déjà, la mise à jour le conserve tel quel : les quatre variables ne remplacent pas ses informations ou son code. Utilisez alors ses identifiants existants. Un marqueur en base ferme définitivement cette initialisation après le premier compte ; supprimer manuellement un compte ne réouvre pas la création initiale.

## 4. Nettoyer après la première connexion réussie

- Supprimez **SETUP_KEY** des variables Vercel : elle n’est plus utilisée par la nouvelle version.
- Supprimez **ADMIN_PASSWORD** des variables Vercel après avoir confirmé que votre compte fonctionne. Vous pouvez aussi retirer ADMIN_NOM, ADMIN_PRENOM et ADMIN_TEL.
- Redéployez le dernier commit. Le compte et son mot de passe restent en base ; les variables ne sont pas nécessaires aux connexions suivantes.
- Ne supprimez ni DATABASE_URL ni ENCRYPTION_KEY. Changer ENCRYPTION_KEY empêcherait de déchiffrer les données existantes.

Pour récupérer ultérieurement un compte, il faut une intervention privée de maintenance ; changer ADMIN_PASSWORD ne réinitialise pas le compte. Les autres comptes du personnel se créent depuis la gestion par un administrateur connecté, jamais depuis une inscription publique.

## Si l’ancienne page apparaît encore

Vérifiez que les deux nouveaux fichiers sont au bon endroit et que le dernier commit est déployé en Production. Rechargez avec Ctrl+F5 ou ouvrez une fenêtre privée. Si la page réclame toujours un code, une ancienne version de l’interface est encore servie.

Si la page indique qu’aucun compte n’est activé : vérifiez les quatre noms de variables, leur environnement Production, l’e-mail, la longueur du mot de passe et le redéploiement. Ne publiez pas leurs valeurs pour demander de l’aide.

## Vérifications effectuées

- 20 tests automatisés réussis sur SQLite.
- Les mêmes 20 tests réussis sur PostgreSQL 17 local, dans une base jetable distincte.
- Connexion sans code, modification du site, rendez-vous, consultation/paiement, finances, stock et CSV validés dans Chromium avec des données fictives.
- Absence d’erreur JavaScript et absence de débordement horizontal sur les pages testées en 320 et 390 pixels.
- Inscription administrateur publique désactivée, même via l’ancienne API ; aucun compte existant écrasé ; protection contre les créations concurrentes et la recréation après suppression.

Ces vérifications n’ont pas utilisé votre base Neon de production. Elles ne constituent pas une certification de conformité ou de sécurité. Avant toute donnée réelle de patient, validez hébergement, confidentialité, droits, sauvegardes et restauration.
