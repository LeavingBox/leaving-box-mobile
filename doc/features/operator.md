# Parcours Opérateur

## Rejoindre une partie
- Fichier : `app/operator/joinGame.tsx`
- Saisie du code session puis `Socket.connect()`.
- `getSession` vérifie l’existence; si OK → `joinSession` avec player "Operator".
- Écoute `playerJoined`, puis navigation vers `/agent/waitingRoom` avec `{ sessionCode, role: "operator" }`.
- Bouton "Retour" : retire les listeners, `leaveSession`, retour accueil.

## Salle d'attente (opérateur)
- Fichier : `app/agent/waitingRoom.tsx` (même écran partagé, rôle déterminé par params).
- Polling `getSession`/`currentSession` pour suivre les connectés.
- Sur `gameStarted`, récupère `moduleManuals` et `solutionsByOperator` ; filtre avec `Socket.id`, fusionne les solutions sur chaque module, puis sérialise et navigue vers `/operator/manual`.
- Écoutes supplémentaires : `sessionCleared` (alerte + retour), `gameOver` (alerte).

## Consultation des manuels
- Fichier : `app/operator/manual.tsx`
- Reçoit via params : `moduleManuals` enrichis, `sessionCode`, `maxTime`, `role`.
- Liste latérale (`ManualsNav`) pour sélectionner un module ; contenu principal affiche `ModuleInstructions`.
- Écoute `sessionCleared` et `gameOver` pour alerter et revenir au menu.

## Affichage des instructions/solutions
- Fichiers :
  - `components/manual/ManualsNav.tsx` : navigation entre modules, met à jour `selectedManual`.
  - `components/manual/ModuleInstructions.tsx` : rend `name`, `description`, bloc "Règles" et bloc "Solutions". Normalise string/array et accepte les solutions injectées depuis `waitingRoom`.
- Type des modules : `core/interface/module.interface.tsx` avec `_id`/`moduleId`, `rules`, `solutions`, `imgUrl`.

