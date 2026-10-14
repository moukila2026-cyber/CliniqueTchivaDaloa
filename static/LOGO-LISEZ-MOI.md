# Votre logo officiel

Le fichier attendu est **static/logo.png** (minuscules).

Le PNG présent est le logo récupéré dans votre dépôt GitHub (fichier logo.png placé initialement à la racine). Il a été copié ici sans modification graphique.

1. Importez le dossier **static/** complet dans le dépôt si ce dossier manque encore : il contient aussi les styles, scripts, images et polices nécessaires.
2. Dans GitHub, ouvrez `static`, puis **Add file → Upload files**.
3. Téléversez le logo officiel nommé exactement `logo.png`, en remplaçant le fichier existant.
4. Validez le commit puis redéployez Vercel (ou attendez le déploiement automatique s’il est configuré).
5. Vérifiez `/static/logo.png` sur le domaine déployé et rechargez la page sans cache.

Emplacements partagés : en-tête, pied de page, présentation de la clinique, connexion, barre latérale de gestion, icône de navigateur et icône mobile. Lorsque PUBLIC_URL est configuré, le logo est aussi déclaré pour le partage social et le balisage local.

Le site conserve les proportions ; un logo horizontal masque le nom adjacent. Pour un logo carré, environ 512 × 512 px ou plus convient. Pour un logo horizontal, privilégiez une largeur d’environ 800 px ou plus, sans grandes marges transparentes. Une icône carrée distincte pourra être préparée si le logo complet devient illisible dans l’onglet.

Voir **GUIDE-NEON-VERCEL.md** pour le nouveau montage direct FastAPI + Neon. Il remplace la procédure précédente de proxy vers un serveur SQLite.
