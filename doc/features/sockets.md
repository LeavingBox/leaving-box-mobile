# Socket & Session

## Client Socket.IO
- Fichier : `core/api/session.api.tsx`
- Connexion sur `EXPO_PUBLIC_WEBSOCKET_URL`, transport websocket, reconnexions gérées.
- Logs `connect`, `connect_error`, `error`, `disconnect`.

## Événements principaux
- `createSession` → réponse `sessionCreated` (code, maxTime, modules) côté agent (`app/agent/joinGame.tsx`).
- `clearSession` : fermeture serveur, utilisé au retour ou quit (agent/joinGame, agent/timerPage).
- `getSession` : polling d’état salle d’attente (agent/waitingRoom) et vérif code côté opérateur (`app/operator/joinGame.tsx`).
- `joinSession` : opérateur rejoint une session existante; `playerJoined` confirme puis navigation.
- `startGame` : déclenché par l’agent en salle d’attente, le serveur renvoie `gameStarted`.
- `gameStarted` : payload `{ moduleManuals, solutionsByOperator }`; côté opérateur, on filtre avec `Socket.id` et on fusionne les solutions avant d’ouvrir l’écran manuel.
- `startTimer` : lancé sur l’écran `agent/timerPage`; `timerUpdate` met à jour le compte à rebours.
- `gameOver` : fin de partie, alerte sur les écrans concernés.
- `sessionCleared` : si l’hôte quitte, tous les clients sont notifiés et reviennent au menu.

## Persistance locale
- Fichier : `core/service/session.service.tsx`
- Helpers AsyncStorage : `saveSession`, `getSession`, `clearSession` pour stocker/retirer une session (`SESSION_KEY = "current_session"`).
