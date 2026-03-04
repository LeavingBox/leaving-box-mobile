# Parcours Agent

## Sélection de difficulté

- Fichier : `app/agent/dificulty.tsx`
- Choix Easy/Medium/Hard avec animation; stockage local `selectedDifficulty`.
- Bouton "Suivant" connecte le socket (`Socket.connect()`) et navigue vers `/agent/joinGame` avec le paramètre `difficulty`.

## Création de session

- Fichier : `app/agent/joinGame.tsx`
- Au montage : `Socket.emit("createSession", { difficulty })` puis écoute `sessionCreated` pour récupérer le code, le timer `maxTime` et afficher un skeleton en attendant.
- Affiche le code (`CodeGame`), un texte d’intro (`Description`) et un bouton pour ouvrir le manuel (`ManualScreen`).
- Formate le timer en MM:SS et le rend en lecture seule.
- Bouton "Retour" → `clearSession` (ferme la session côté serveur), supprime les listeners, déconnecte le socket et renvoie sur `/agent/dificulty`.
- Bouton "Voir la salle d'attente" → navigate `/agent/waitingRoom` avec `{ sessionCode, maxTime, role: "agent" }`.

## Salle d'attente (agent)

- Fichier : `app/agent/waitingRoom.tsx`
- Polling : `Socket.emit("getSession", { sessionCode })` toutes les 1s; `currentSession` met à jour l’état d’attente.
- Bouton "Lancer la partie" (agent uniquement) → `Socket.emit("startGame", { sessionCode })` puis navigation timer.
- Écoutes :
  - `gameStarted` (si rôle agent : affiche log; si rôle opérateur : logique distincte décrite dans doc analyst)
  - `sessionCleared` → alerte + retour.
- Actions : bouton "Quitter" déconnecte (si rôle analyst) ou `router.back()` sinon.

## Timer in-game

- Fichier : `app/agent/timerPage.tsx`
- Initialisation depuis `maxTime` (params) puis `Socket.emit("startTimer", { sessionCode })`.
- Écoutes : `timerUpdate` (met à jour MM:SS) et `gameOver` (alerte + retour menu via `handleBack`).
- Bouton "Quitter" → `clearSession`, déconnexion socket, navigation vers `/agent/dificulty`.
