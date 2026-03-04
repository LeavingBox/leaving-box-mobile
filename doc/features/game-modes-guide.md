# Guide Rapide - Modes de Jeu et Difficultés

## Vue d'ensemble

Le système de gameplay a été refactorisé pour gérer les difficultés et les modes de jeu de manière modulaire.

## Changements principaux

### 1. Nouveau paramètre `gameMode` lors de la création de session

Lors de la création d'une session, vous devez maintenant spécifier :
- `difficulty` : `'Easy' | 'Medium' | 'Hard'`
- `gameMode` : `'ONE_OPERATOR_ONE_MODULE' | 'RANDOM_ONE_MODULE_SPLIT'` (optionnel, défaut: `'ONE_OPERATOR_ONE_MODULE'`)
- `role` : `'agent'` (OBLIGATOIRE)

### 2. Durées par difficulté

- **Easy** : 1200 secondes (20 minutes)
- **Medium** : 900 secondes (15 minutes)
- **Hard** : 600 secondes (10 minutes)

### 3. Modes de jeu

#### Mode 1 : `ONE_OPERATOR_ONE_MODULE` (par défaut)

**Sélection de modules** :
- Si 4 modules ou moins disponibles → Affiche tous les modules
- Si plus de 4 modules → Sélectionne 4 modules aléatoirement

**Distribution** :
- **2 opérateurs** : 2 modules chacun (Module 1-2 → Op1, Module 3-4 → Op2)
- **3 opérateurs** : 3 modules individuels + 1 module partagé (Module 1→Op1, Module 2→Op2, Module 3→Op3, Module 4→tous)
- **4+ opérateurs** : Round-robin sur les modules

#### Mode 2 : `RANDOM_ONE_MODULE_SPLIT`

**Sélection de modules** : Même logique que le mode 1

**Distribution** : Les solutions de chaque module sont réparties en round-robin entre tous les opérateurs

---

## Fonctions à appeler

### 1. Créer une session (Agent)

```typescript
socket.emit('createSession', {
  difficulty: 'Medium', // 'Easy' | 'Medium' | 'Hard'
  gameMode: 'ONE_OPERATOR_ONE_MODULE', // Optionnel, défaut: 'ONE_OPERATOR_ONE_MODULE'
  role: 'agent' // OBLIGATOIRE - doit être 'agent' pour créer une session
});

// Écouter la réponse
socket.on('sessionCreated', (session) => {
  console.log('Session créée:', session.code);
  console.log('Difficulté:', session.difficulty);
  console.log('Mode de jeu:', session.gameMode);
  console.log('Temps maximum:', session.maxTime, 'secondes');
  // session = { id, code, agentId, maxTime, remainingTime, difficulty, gameMode, ... }
});
```

### 2. Rejoindre une session (Opérateur)

```typescript
socket.emit('joinSession', {
  sessionCode: 'A1B2C3',
  player: 'Operator',
  role: 'operator' // OBLIGATOIRE
});

socket.on('playerJoined', (data) => {
  console.log('Vous êtes:', data.playerLabel); // "operator 1", "operator 2", etc.
});
```

### 3. Démarrer le jeu (Agent)

```typescript
socket.emit('startGame', {
  sessionCode: 'A1B2C3',
  role: 'agent' // OBLIGATOIRE
});

socket.on('gameStarted', (data) => {
  // Tous les modules (sans solutions) - visibles par tous
  console.log('Modules:', data.moduleManuals);
  
  // Solutions assignées à cet opérateur
  const mySolutions = data.solutionsByOperator[socket.id];
  console.log('Mes solutions:', mySolutions);
  
  // Structure de mySolutions :
  // [
  //   { moduleId: "module-id-1", solutions: ["Étape 1", "Étape 2"] },
  //   { moduleId: "module-id-2", solutions: ["Étape 3"] }
  // ]
  
  // Fusionner les solutions avec les manuels
  const manualsWithSolutions = data.moduleManuals.map(manual => {
    const manualId = manual._id || manual.moduleId || manual.name;
    const matched = mySolutions?.find(s => 
      s.moduleId === manualId || s.moduleId === manual._id || s.moduleId === manual.moduleId
    );
    return {
      ...manual,
      solutions: matched?.solutions || []
    };
  });
});
```

### 4. Démarrer le timer (Agent)

```typescript
socket.emit('startTimer', {
  sessionCode: 'A1B2C3',
  role: 'agent' // OBLIGATOIRE
});

socket.on('timerUpdate', (data) => {
  console.log('Temps restant:', data.remaining, 'secondes');
});
```

---

## Exemples complets

### Exemple 1 : Session Easy avec mode par défaut

```typescript
// Agent crée une session
socket.emit('createSession', {
  difficulty: 'Easy',
  gameMode: 'ONE_OPERATOR_ONE_MODULE', // Optionnel
  role: 'agent' // OBLIGATOIRE
});

socket.on('sessionCreated', async (session) => {
  const sessionCode = session.code; // Ex: "A1B2C3"
  console.log('Temps maximum:', session.maxTime); // 1200 secondes
  
  // Attendre que des opérateurs rejoignent...
  
  // Démarrer le jeu
  socket.emit('startGame', { sessionCode, role: 'agent' });
});

socket.on('gameStarted', (data) => {
  // Avec 2 opérateurs et 4 modules :
  // - Opérateur 1 reçoit : Module 1 (toutes solutions) + Module 2 (toutes solutions)
  // - Opérateur 2 reçoit : Module 3 (toutes solutions) + Module 4 (toutes solutions)
});
```

### Exemple 2 : Session Hard avec mode split

```typescript
// Agent crée une session
socket.emit('createSession', {
  difficulty: 'Hard',
  gameMode: 'RANDOM_ONE_MODULE_SPLIT',
  role: 'agent' // OBLIGATOIRE
});

socket.on('gameStarted', (data) => {
  // Avec 3 opérateurs et 4 modules :
  // - Tous les opérateurs voient les 4 modules
  // - Les solutions de chaque module sont réparties en round-robin
  //   Exemple Module A (9 solutions) :
  //     - Opérateur 1 : Solutions 1, 4, 7
  //     - Opérateur 2 : Solutions 2, 5, 8
  //     - Opérateur 3 : Solutions 3, 6, 9
});
```

### Exemple 3 : Session avec 3 opérateurs (mode par défaut)

```typescript
socket.emit('createSession', {
  difficulty: 'Medium',
  gameMode: 'ONE_OPERATOR_ONE_MODULE',
  role: 'agent' // OBLIGATOIRE
});

socket.on('gameStarted', (data) => {
  // Distribution avec 3 opérateurs :
  // - Opérateur 1 : Module 1 (toutes les solutions)
  // - Opérateur 2 : Module 2 (toutes les solutions)
  // - Opérateur 3 : Module 3 (toutes les solutions)
  // - Tous : Module 4 (toutes les solutions à chacun)
});
```

---

## Structure des données

### Session

```typescript
interface Session {
  id: string;
  code: string;
  agentId: string;
  maxTime: number; // Selon la difficulté (Easy: 1200, Medium: 900, Hard: 600)
  remainingTime: number;
  timerStarted: boolean;
  createdAt: Date;
  players: Player[];
  started: boolean;
  operatorActions?: OperatorAction[];
  difficulty: 'Easy' | 'Medium' | 'Hard'; // NOUVEAU
  gameMode: 'ONE_OPERATOR_ONE_MODULE' | 'RANDOM_ONE_MODULE_SPLIT'; // NOUVEAU
}
```

### Réponse `gameStarted`

```typescript
{
  session: Session;
  moduleManuals: Module[]; // Modules sans solutions (visibles par tous)
  solutionsDistribution: SolutionsDistribution[];
  solutionsByOperator: {
    [operatorId: string]: Array<{
      moduleId: string;
      solutions: string[];
    }>;
  };
}
```

---

## Migration depuis l'ancien système

### Ancien code

```typescript
// ❌ Ancien code
socket.emit('createSession', {
  difficulty: 'Medium'
});
```

### Nouveau code

```typescript
// ✅ Nouveau code
socket.emit('createSession', {
  difficulty: 'Medium',
  gameMode: 'ONE_OPERATOR_ONE_MODULE', // Optionnel, valeur par défaut
  role: 'agent' // OBLIGATOIRE
});
```

**Note** : Les sessions existantes sont automatiquement migrées avec `gameMode: 'ONE_OPERATOR_ONE_MODULE'` par défaut.

---

## Points importants

1. **Sélection de modules** :
   - Si vous avez exactement 4 modules → tous sont affichés
   - Si vous avez plus de 4 modules → 4 sont sélectionnés aléatoirement

2. **Mode `ONE_OPERATOR_ONE_MODULE` avec 3 opérateurs** :
   - Les 3 premiers modules sont assignés individuellement
   - Le 4ème module est partagé (toutes les solutions à tous)

3. **Mode `RANDOM_ONE_MODULE_SPLIT`** :
   - Même sélection de modules que le mode 1
   - Mais les solutions sont réparties en round-robin

4. **Compatibilité** :
   - Si `gameMode` n'est pas fourni → `ONE_OPERATOR_ONE_MODULE` par défaut
   - Les anciennes sessions sont automatiquement migrées

5. **Fusion des solutions** :
   - Les `moduleManuals` ne contiennent **pas** de solutions
   - Les solutions sont dans `solutionsByOperator[operatorId]`
   - Il faut fusionner manuellement pour l'affichage
   - Le code dans `waitingRoom.tsx` fait cette fusion automatiquement

---

## Résumé des événements WebSocket

### Client → Serveur

| Événement | Paramètres | Description |
|-----------|------------|-------------|
| `createSession` | `{ difficulty, gameMode?, role }` | Crée une session (Agent) - `role` obligatoire |
| `joinSession` | `{ sessionCode, player, role }` | Rejoint une session (Opérateur) - `role` obligatoire |
| `startGame` | `{ sessionCode, role }` | Démarre le jeu (Agent) - `role` obligatoire |
| `startTimer` | `{ sessionCode, role }` | Démarre le timer (Agent) - `role` obligatoire |
| `stopTimer` | `{ sessionCode }` | Arrête le timer (Agent) |
| `clearSession` | `{ sessionCode, role }` | Supprime la session (Agent) - `role` obligatoire |
| `back` | `{ sessionCode, role }` | Retour en arrière - `role` obligatoire |

### Serveur → Client

| Événement | Données | Description |
|-----------|---------|-------------|
| `sessionCreated` | `Session` | Session créée avec `difficulty`, `gameMode`, `maxTime` |
| `playerJoined` | `{ playerId, playerLabel, session }` | Joueur rejoint |
| `gameStarted` | `{ session, moduleManuals, solutionsDistribution, solutionsByOperator }` | Jeu démarré |
| `timerUpdate` | `{ remaining }` | Mise à jour du timer |
| `gameOver` | `{ message }` | Fin du jeu |
| `sessionCleared` | `{ message? }` | Session fermée |
| `sessionClosed` | `any` | Session fermée (fin de partie) |
| `operatorBackNavigation` | `{ operatorId, operatorLabel, sessionCode, timestamp }` | Opérateur fait retour |

---

## Fichiers de configuration

- **Difficultés** : `src/session/gameplay/config/difficulty.config.ts` (côté serveur)
- **Types** : `src/session/gameplay/types/gameplay.types.ts` (côté serveur)
- **Stratégies** : `src/session/gameplay/strategies/` (côté serveur)

Pour modifier les durées ou ajouter des modes, consultez ces fichiers côté serveur.

---

**Dernière mise à jour :** 2026-01-21
**Version :** 1.0.0
