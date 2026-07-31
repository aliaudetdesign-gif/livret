# Livret — Cartographie du parcours utilisateur

Document de référence pour transformer la maquette en plateforme fonctionnelle. Basé sur l'analyse des mockups existants et des sketches de recherche (persona Client / Designer).

## 1. Le produit en une phrase

Livret est une plateforme où une agence de design gère les livrets de marque de ses clients (logos, couleurs, typographies, moodboard) et où chaque client consulte et suit son propre livret, avec une messagerie intégrée entre les deux.

Deux rôles, deux espaces séparés, un même compte agence peut gérer plusieurs clients, chaque client ne voit que son propre espace.

## 2. Les deux personas

### Agence (Designer / AB.Design)

Besoins identifiés dans les sketches : centraliser les offres, automatiser le travail répétitif, suivre l'ensemble de ses clients, intégrer l'explication du livret directement dans la plateforme plutôt que de tout réexpliquer à chaque fois.

Objets dont elle a besoin : administratif, dashboard, projets clients, importation de fichiers, paramètres, messagerie.

### Client

Besoins identifiés : suivre l'avancement de son projet, développer son branding, avoir un contact direct avec l'agence, disposer d'un espace organisé plutôt que des fichiers dispersés.

Objets dont il a besoin : administratif, brief, messagerie, logos, couleurs, typographies, moodboard.

## 3. Cartographie des écrans

### 3.1 Espace Agence (admin)

| Écran | État | Notes |
|---|---|---|
| Connexion | Manquant | Authentification agence, mot de passe oublié |
| Dashboard | Fait | Compteurs (projets actifs, en attente, en cours, clients totaux), liste des projets actifs avec statut, section archives |
| Création d'un nouveau projet client | Manquant | Formulaire déclenché par "+ Nouveau projet" / "+ Créer un espace client" : nom, secteur, ville, contact |
| Projets clients — liste | Fait | Visible via la sidebar |
| Projets clients — fiche détail | Fait | Onglets Infos / Logos / Typographies / Motif / Moodboard / Ajouter une section |
| Fiche détail — ajout/édition de contenu | Manquant | Comment l'agence uploade un logo, ajoute une couleur, une typo, une image moodboard |
| Administratif | Manquant | Contenu de la section (mentionnée en sidebar, badge notifications) |
| Importer des fichiers | Manquant | Contenu et comportement de l'import |
| Paramètres | Manquant | Contenu de la section |
| Messagerie — liste conversations | Fait | Visible en sidebar avec aperçu du dernier message |
| Messagerie — vue conversation | Manquant | Fil de discussion avec un client |
| Mon profil | Manquant | Visible en sidebar bas, contenu à définir |
| États vides / erreurs | Manquant | Aucun projet, aucun message, erreurs de formulaire |

### 3.2 Espace Client

| Écran | État | Notes |
|---|---|---|
| Connexion | Manquant | Comment le client accède à son espace (invitation par email probablement) |
| Dashboard identité de marque | Fait | Résumé de marque + compteurs Logos/Couleurs/Typographies/Visuels + dernières mises à jour |
| Logos | Fait (aperçu) | Palette existante, page dédiée logos à détailler (variantes, téléchargement) |
| Couleurs | Fait | Palette primaires/secondaires, clic pour copier le code hex |
| Typographies | Manquant (aperçu sidebar seulement) | Détail à concevoir |
| Moodboard | Manquant (aperçu sidebar seulement) | Grille d'images à concevoir |
| Administratif | Manquant | Contenu de la section (badge notifications visible) |
| Messagerie | Manquant | Fil de discussion avec l'agence |
| Mon compte | Manquant | Contenu à définir |
| États vides / premier accès | Manquant | Que voit un client avant que l'agence ait rempli son livret |

## 4. Flux critiques à cartographier en détail

1. **Onboarding agence** : inscription ou connexion, premier accès au dashboard vide ou peuplé.
2. **Création d'un client** : l'agence crée un nouvel espace, remplit les infos générales (secteur, ville, contact, brief), le projet apparaît dans "Projets actifs".
3. **Remplissage du livret** : l'agence ajoute logos, couleurs, typographies, moodboard sur la fiche du client.
4. **Invitation et premier accès du client** : comment le client reçoit ses identifiants et découvre son espace pour la première fois.
5. **Consultation et téléchargement des assets** par le client (formats de fichiers exportés).
6. **Messagerie bidirectionnelle** : envoi, réception, notifications (badges déjà visibles dans les maquettes).
7. **Suivi d'avancement** : changement de statut d'un projet (En cours → Attente de validation → Livré).
8. **Archivage** : un projet livré passe en section Archives côté agence.

## 5. Prochaine étape suggérée

Prioriser la conception des écrans manquants qui bloquent un parcours de bout en bout minimal viable : connexion (agence + client), création de projet, ajout de contenu par l'agence, et vue détaillée Typographies/Moodboard côté client. Le reste (paramètres, administratif détaillé, profil) peut suivre une fois le cœur du parcours validé.
