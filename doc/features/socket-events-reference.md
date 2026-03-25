# Référence Rapide - Événements Socket.IO

## Événements émis (Front → Back)

| Événement | Émis par | Données | Réponse attendue |
|-----------|----------|---------|------------------|
| `createSession` | Agent (`joinGame.tsx`) | `{ difficulty: "Easy"\|"Medium"\|"Hard", gameMode?: "ONE_OPERATOR_ONE_MODULE"\|"RANDOM_ONE_MODULE_SPLIT", role: "agent" }` | `sessionCreated` |
| `getSession` | Opérateur (`joinGame.tsx`), Waiting Room (polling) | `{ sessionCode: string, role?: string }` | `currentSession` |
| `joinSession` | Opérateur (`joinGame.tsx`) | `{ sessionCode: string, player: "Operator", role: "operator" }` | `playerJoined` |
| `startGame` | Agent (`waitingRoom.tsx`) | `{ sessionCode: string, role: "agent" }` | Callback `{ success: boolean }` + `gameStarted` |
| `startTimer` | Agent (`timerPage.tsx`) | `{ sessionCode: string, role: "agent" }` | `timerUpdate` (continu) |
| `back` | Tous | `{ sessionCode: string, role: "agent" \| "operator" }` | Aucune (unidirectionnel) |
| `clearSession` | Agent (`joinGame.tsx`, `timerPage.tsx`) | `{ sessionCode: string, role: "agent" }` | Callback `{ success: boolean }` |
| `leaveSession` | Opérateur (`joinGame.tsx`) | `{ sessionCode: string, player: "Operator" }` | Aucune (unidirectionnel) |

## Événements reçus (Back → Front)

| Événement | Reçu par | Données | Action |
|-----------|----------|---------|--------|
| `sessionCreated` | Agent (`joinGame.tsx`) | `Session` complète avec `difficulty`, `gameMode`, `maxTime` | Affiche code et temps, navigation |
| `currentSession` | Waiting Room (polling) | `Session` avec `players` | Met à jour liste joueurs |
| `playerJoined` | Opérateur (`joinGame.tsx`) | `{ playerId?, playerLabel?, session?, role }` (role OBLIGATOIRE) | Navigation vers waiting room |
| `gameStarted` | Waiting Room | `{ session, moduleManuals, solutionsDistribution, solutionsByOperator }` | Navigation agent→timer, opérateur→manual avec solutions |
| `timerUpdate` | Agent (`timerPage.tsx`) | `{ remaining: number }` | Met à jour affichage timer |
| `gameOver` | Agent, Opérateur | `{ message: string }` | Alerte + nettoyage + home |
| `sessionCleared` | Tous | `{ message?: string }` | Alerte + nettoyage + home |
| `sessionClosed` | Tous | `any` | Nettoyage silencieux + home |
| `operatorBackNavigation` | Agent (`waitingRoom.tsx`) | `{ operatorId, operatorLabel, sessionCode, timestamp }` | Log pour information |

## Structure des données clés

### Session
```typescript
{
  id: string,
  code: string,              // 6 caractères
  agentId: string,
  maxTime: number,           // secondes (Easy: 1200, Medium: 900, Hard: 600)
  operatorIds: string[],
  players: Array<{
    id: string,
    label: string,
    role: "agent" | "operator"
  }>,
  difficulty: "Easy" | "Medium" | "Hard",  // NOUVEAU
  gameMode: "ONE_OPERATOR_ONE_MODULE" | "RANDOM_ONE_MODULE_SPLIT"  // NOUVEAU
}
```

### ModuleManual (dans gameStarted)
```typescript
{
  name: string,
  description: string,
  rules?: string[],
  imgUrl: string,
  _id?: string,
  moduleId?: string
  // IMPORTANT: Pas de solutions ici dans gameStarted
  // Les solutions sont dans solutionsByOperator
}
```

### solutionsByOperator
```typescript
{
  [operatorId: string]: Array<{
    moduleId: string,
    solutions: string[]
  }>
}
// Exemple:
// {
//   "socket-id-op1": [
//     { moduleId: "module-1", solutions: ["Étape 1", "Étape 2"] },
//     { moduleId: "module-2", solutions: ["Étape 3"] }
//   ],
//   "socket-id-op2": [
//     { moduleId: "module-3", solutions: ["Étape 4", "Étape 5"] }
//   ]
// }
```

## Règles de validation

- **1 agent** par session (créateur)
- **1+ opérateurs** par session
- Session fermée si < 1 agent OU < 1 opérateur
- Tous les événements doivent inclure `role`

## Difficultés et durées

- **Easy** : 1200 secondes (20 minutes)
- **Medium** : 900 secondes (15 minutes)
- **Hard** : 600 secondes (10 minutes)

## Modes de jeu

### `ONE_OPERATOR_ONE_MODULE` (par défaut)
- Chaque opérateur reçoit des modules complets avec toutes leurs solutions
- Distribution équitable selon le nombre d'opérateurs

### `RANDOM_ONE_MODULE_SPLIT`
- Tous les opérateurs voient tous les modules
- Solutions réparties en round-robin entre les opérateurs

## Navigation

```
Agent:   / → /agent/dificulty → /agent/joinGame → /agent/waitingRoom → /agent/timerPage
Opérateur: / → /operator/joinGame → /agent/waitingRoom → /operator/manual
```

## Nettoyage

Toujours appeler avant redirection vers `/` :
1. `await clearSession()` - Nettoyer stockage local
2. `Socket.removeAllListeners()` - Nettoyer listeners
3. `Socket.disconnect()` - Déconnecter socket
4. `router.replace("/")` - Navigation vers home
