# Guide de Développement - Gameplay Complet

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture des rôles](#architecture-des-rôles)
3. [Flux de navigation](#flux-de-navigation)
4. [Événements Socket.IO](#événements-socketio)
5. [Interfaces TypeScript](#interfaces-typescript)
6. [Gestion des sessions](#gestion-des-sessions)
7. [Validations et règles métier](#validations-et-règles-métier)

---

## Vue d'ensemble

**Leaving Box Mobile** est un jeu de déminage de bombe en temps réel où :
- **1 Agent** crée une session et gère le timer
- **1 ou plusieurs Opérateurs** rejoignent la session et consultent les manuels pour résoudre les modules

### Objectif du jeu
L'agent et les opérateurs doivent collaborer pour désamorcer une bombe avant que le temps ne s'écoule.

### Difficultés et durées
- **Easy** : 1200 secondes (20 minutes)
- **Medium** : 900 secondes (15 minutes)
- **Hard** : 600 secondes (10 minutes)

### Modes de jeu
Le système supporte deux modes de distribution des modules et solutions :

1. **`ONE_OPERATOR_ONE_MODULE`** (par défaut)
   - Chaque opérateur reçoit des modules complets avec toutes leurs solutions
   - Distribution équitable selon le nombre d'opérateurs

2. **`RANDOM_ONE_MODULE_SPLIT`**
   - Tous les opérateurs voient tous les modules
   - Les solutions de chaque module sont réparties en round-robin entre les opérateurs

---

## Architecture des rôles

### Règles de rôles
- **1 seul Agent** par session (créateur de la session)
- **1 ou plusieurs Opérateurs** peuvent rejoindre la même session
- La session se ferme automatiquement si :
  - Il n'y a plus d'agent (moins de 1 agent)
  - Il n'y a plus d'opérateur (moins de 1 opérateur)
  - Les conditions de validation ne sont plus remplies

### Validation côté serveur
Le serveur doit vérifier à chaque action que :
- Il reste au moins **1 agent** dans la session
- Il reste au moins **1 opérateur** dans la session
- Si ces conditions ne sont plus remplies → fermeture automatique de la session

---

## Flux de navigation

### Agent (Créateur de session)

```
Home (/) 
  → Agent Difficulty (/agent/dificulty)
    → Join Game (/agent/joinGame) [Création session]
      → Waiting Room (/agent/waitingRoom)
        → Timer Page (/agent/timerPage) [Jeu en cours]
```

### Opérateur (Rejoint une session)

```
Home (/)
  → Join Game (/operator/joinGame) [Saisie code]
    → Waiting Room (/agent/waitingRoom)
      → Manual (/operator/manual) [Jeu en cours]
```

### Points de sortie
- Tous les écrans peuvent retourner à la home via `sessionClosed`
- Retour en arrière depuis `waitingRoom` ou `manual` → retour à l'écran précédent
- Fermeture de session → retour automatique à la home (`/`)

---

## Événements Socket.IO

### Configuration Socket

**Fichier :** `core/api/session.api.tsx`

```typescript
Socket = io(process.env.EXPO_PUBLIC_WEBSOCKET_URL, {
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  autoConnect: false,
})
```

---

### Événements émis (Front → Back)

#### 1. `createSession`
**Émis par :** Agent (`app/agent/joinGame.tsx`)

**Données envoyées :**
```typescript
{
  difficulty: string,  // "Easy" | "Medium" | "Hard"
  gameMode?: string,   // Optionnel : "ONE_OPERATOR_ONE_MODULE" | "RANDOM_ONE_MODULE_SPLIT"
                       // Défaut : "ONE_OPERATOR_ONE_MODULE"
  role: "agent"        // Rôle explicite (OBLIGATOIRE)
}
```

**Réponse attendue :** `sessionCreated`
```typescript
{
  id: string,
  code: string,           // Code à 6 caractères (ex: "A9FA70")
  agentId: string,        // Socket.id de l'agent
  maxTime: number,        // Temps en secondes selon difficulté :
                          // - Easy: 1200s (20 min)
                          // - Medium: 900s (15 min)
                          // - Hard: 600s (10 min)
  operatorIds: string[],  // Tableau vide initialement
  players: Array<{
    id: string,
    label: string,
    role: "agent" | "operator"
  }>,
  createdAt: Date,
  remainingTime: number,
  started: boolean,
  timerStarted: boolean,
  difficulty: "Easy" | "Medium" | "Hard",  // NOUVEAU
  gameMode: "ONE_OPERATOR_ONE_MODULE" | "RANDOM_ONE_MODULE_SPLIT"  // NOUVEAU
}
```

**Comportement :**
- Crée une nouvelle session
- L'agent devient automatiquement l'agent de cette session
- Génère un code unique à 6 caractères
- Calcule `maxTime` selon la difficulté :
  - **Easy** : 1200 secondes (20 minutes)
  - **Medium** : 900 secondes (15 minutes)
  - **Hard** : 600 secondes (10 minutes)
- Enregistre le `gameMode` (défaut : `ONE_OPERATOR_ONE_MODULE`)

---

#### 2. `getSession`
**Émis par :** Opérateur (`app/operator/joinGame.tsx`) et Waiting Room (polling)

**Données envoyées :**
```typescript
{
  sessionCode: string,  // Code de la session (ex: "A9FA70")
  role?: string         // Optionnel : "agent" | "operator"
}
```

**Réponse attendue :** `currentSession` (callback ou événement)
```typescript
{
  id: string,
  code: string,
  agentId: string,
  maxTime: number,
  operatorIds: string[],
  players: Array<{
    id: string,
    label: string,
    role: "agent" | "operator"
  }>,
  connectedClients?: Array<any>,  // Fallback (ancienne structure)
  started: boolean,
  timerStarted: boolean,
  remainingTime: number
}
```

**Comportement :**
- Vérifie si la session existe
- Retourne les informations de la session
- Utilisé pour le polling dans `waitingRoom` (toutes les 1 seconde)

---

#### 3. `joinSession`
**Émis par :** Opérateur (`app/operator/joinGame.tsx`)

**Données envoyées :**
```typescript
{
  sessionCode: string,    // Code de la session
  player: "Operator",     // Type de joueur
  role: "operator"        // Rôle explicite
}
```

**Réponse attendue :** `playerJoined`
```typescript
// Pas de données, juste confirmation
```

**Comportement :**
- Ajoute l'opérateur à la session
- Émet `operatorBackNavigation` à l'agent si nécessaire
- Notifie tous les clients de la session

---

#### 4. `startGame`
**Émis par :** Agent (`app/agent/waitingRoom.tsx`)

**Données envoyées :**
```typescript
{
  sessionCode: string,
  role: "agent"  // Rôle de celui qui démarre (doit être agent)
}
```

**Réponse attendue :** Callback
```typescript
{
  success: boolean,
  message?: string
}
```

**Événement émis par le serveur :** `gameStarted`
```typescript
{
  session: Session,  // Session complète avec difficulty et gameMode
  moduleManuals: Array<{
    _id?: string,
    moduleId?: string,
    name: string,
    description: string,
    rules?: string[],
    imgUrl: string
    // Note: Les solutions ne sont PAS dans moduleManuals
    // Elles sont dans solutionsByOperator
  }>,
  solutionsDistribution: Array<{
    moduleId: string,
    operatorId: string,
    solutions: string[]
  }>,
  solutionsByOperator: {
    [operatorId: string]: Array<{
      moduleId: string,
      solutions: string[]
    }>
  }
}
```

**Distribution des solutions selon le mode :**

**Mode `ONE_OPERATOR_ONE_MODULE` (par défaut) :**
- **Sélection de modules** :
  - Si ≤ 4 modules disponibles → Tous les modules sont affichés
  - Si > 4 modules → 4 modules sélectionnés aléatoirement
- **Distribution** :
  - **2 opérateurs** : Module 1-2 → Op1 (toutes solutions), Module 3-4 → Op2 (toutes solutions)
  - **3 opérateurs** : Module 1→Op1 (toutes), Module 2→Op2 (toutes), Module 3→Op3 (toutes), Module 4→tous (toutes)
  - **4+ opérateurs** : Round-robin sur les modules

**Mode `RANDOM_ONE_MODULE_SPLIT` :**
- **Sélection de modules** : Même logique que le mode 1 (≤4 ou 4 aléatoires)
- **Distribution** :
  - Tous les opérateurs voient tous les modules sélectionnés
  - Les solutions de chaque module sont réparties en round-robin entre tous les opérateurs
  - Exemple avec 3 opérateurs et Module A (9 solutions) :
    - Opérateur 1 : Solutions 1, 4, 7
    - Opérateur 2 : Solutions 2, 5, 8
    - Opérateur 3 : Solutions 3, 6, 9

**Comportement :**
- Démarre la partie
- Génère les modules selon la difficulté
- Envoie les manuels à tous les opérateurs
- L'agent navigue vers `timerPage`
- Les opérateurs naviguent vers `manual`

---

#### 5. `startTimer`
**Émis par :** Agent (`app/agent/timerPage.tsx`)

**Données envoyées :**
```typescript
{
  sessionCode: string,
  role: "agent"  // Rôle de celui qui démarre le timer
}
```

**Réponse attendue :** `timerUpdate` (événement continu)
```typescript
{
  remaining: number  // Temps restant en secondes
}
```

**Comportement :**
- Démarre le compte à rebours
- Envoie des mises à jour régulières du temps restant
- S'arrête automatiquement si la session se ferme

---

#### 6. `back`
**Émis par :** Agent et Opérateur (tous les écrans)

**Données envoyées :**
```typescript
{
  sessionCode: string,
  role: "agent" | "operator"  // Rôle de celui qui fait retour en arrière
}
```

**Réponse attendue :** Aucune (événement unidirectionnel)

**Comportement :**
- Notifie le serveur qu'un joueur fait retour en arrière
- Pour les opérateurs : émet `operatorBackNavigation` à l'agent
- Ne ferme pas la session, juste une notification

---

#### 7. `clearSession`
**Émis par :** Agent (`app/agent/joinGame.tsx`, `app/agent/timerPage.tsx`)

**Données envoyées :**
```typescript
{
  sessionCode: string,
  role: "agent" | "operator"  // Rôle de celui qui ferme la session
}
```

**Réponse attendue :** Callback
```typescript
{
  success: boolean,
  message?: string
}
```

**Comportement :**
- Ferme complètement la session
- Déconnecte tous les joueurs
- Émet `sessionCleared` à tous les clients
- Nettoie les données côté serveur

---

#### 8. `leaveSession`
**Émis par :** Opérateur (`app/operator/joinGame.tsx`)

**Données envoyées :**
```typescript
{
  sessionCode: string,
  player: "Operator"
}
```

**Réponse attendue :** Aucune (événement unidirectionnel)

**Comportement :**
- Retire l'opérateur de la session
- Vérifie si la session doit être fermée (validation)
- Si conditions non remplies → fermeture automatique

---

### Événements reçus (Back → Front)

#### 1. `sessionCreated`
**Reçu par :** Agent (`app/agent/joinGame.tsx`)

**Données reçues :**
```typescript
{
  id: string,
  code: string,
  agentId: string,
  maxTime: number,
  operatorIds: string[],
  players: Array<{
    id: string,
    label: string,
    role: "agent" | "operator"
  }>,
  createdAt: Date,
  remainingTime: number,
  started: boolean,
  timerStarted: boolean
}
```

**Action :**
- Affiche le code de session
- Affiche le temps maximum formaté (MM:SS)
- Permet la navigation vers la salle d'attente

---

#### 2. `currentSession`
**Reçu par :** Waiting Room (polling toutes les 1 seconde)

**Données reçues :**
```typescript
{
  id: string,
  code: string,
  agentId: string,
  maxTime: number,
  operatorIds: string[],
  players: Array<{
    id: string,
    label: string,
    role: "agent" | "operator"
  }>,
  connectedClients?: Array<any>,  // Fallback
  started: boolean,
  timerStarted: boolean,
  remainingTime: number
}
```

**Action :**
- Met à jour la liste des joueurs connectés
- Affiche l'agent (1 seul) et tous les opérateurs
- Permet de voir qui est connecté en temps réel

---

#### 3. `playerJoined`
**Reçu par :** Opérateur (`app/operator/joinGame.tsx`)

**Données reçues :**
```typescript
{
  playerId?: string,        // Socket.id de l'opérateur
  playerLabel?: string,      // Label du joueur (ex: "operator 1")
  playerRole?: string,       // Rôle du joueur (OBLIGATOIRE - Le serveur envoie "playerRole")
  role?: string,             // Fallback si le serveur envoie "role" au lieu de "playerRole"
  session?: Session          // Session complète
}
```

**Action :**
- Confirme que l'opérateur a rejoint la session
- **Valide que le rôle est présent et égal à "operator"** (sinon affiche une erreur)
- Navigue vers la salle d'attente avec les paramètres de session

**Validation stricte :**
- ⚠️ **Le serveur DOIT obligatoirement envoyer `playerRole: "operator"` (ou `role: "operator"`) dans les données**
- Le client cherche d'abord dans `data.playerRole`, puis dans `data.role` (fallback)
- Si le rôle est manquant → Erreur serveur affichée, navigation annulée
- Si le rôle n'est pas "operator" → Erreur serveur affichée, navigation annulée

**Note importante :**
Le serveur envoie actuellement `playerRole` au lieu de `role`. Le client gère les deux formats pour compatibilité.

---

#### 4. `gameStarted`
**Reçu par :** Waiting Room (`app/agent/waitingRoom.tsx`)

**Données reçues :**
```typescript
{
  session: {
    id: string,
    code: string,
    difficulty: "Easy" | "Medium" | "Hard",
    gameMode: "ONE_OPERATOR_ONE_MODULE" | "RANDOM_ONE_MODULE_SPLIT",
    // ... autres propriétés de Session
  },
  moduleManuals: Array<{
    _id?: string,
    moduleId?: string,
    name: string,
    description: string,
    rules?: string[],
    imgUrl: string
    // IMPORTANT: Pas de solutions ici, elles sont dans solutionsByOperator
  }>,
  solutionsDistribution: Array<{
    moduleId: string,
    operatorId: string,
    solutions: string[]
  }>,
  solutionsByOperator: {
    [operatorId: string]: Array<{
      moduleId: string,
      solutions: string[]
    }>
  }
}
```

**Action :**
- **Agent :** Stocke les manuels (pour réutilisation si opérateur revient)
- **Opérateur :** 
  - Navigue vers `/operator/manual` avec les manuels sérialisés
  - Reçoit ses solutions spécifiques via `solutionsByOperator[socket.id]`
  - Les solutions sont fusionnées avec les manuels pour affichage
- Les manuels sont stockés dans l'état pour permettre le retour

**Exemple d'utilisation côté opérateur :**
```typescript
Socket.on("gameStarted", (data) => {
  // Récupérer les solutions de cet opérateur
  const mySolutions = data.solutionsByOperator[Socket.id] || [];
  // mySolutions = [
  //   { moduleId: "module-1", solutions: ["Étape 1", "Étape 2"] },
  //   { moduleId: "module-2", solutions: ["Étape 3"] }
  // ]
  
  // Fusionner les solutions avec les manuels
  const manualsWithSolutions = data.moduleManuals.map(manual => {
    const manualId = manual._id || manual.moduleId || manual.name;
    const matchedSolutions = mySolutions.find(
      sol => sol.moduleId === manualId || sol.moduleId === manual._id || sol.moduleId === manual.moduleId
    );
    
    return {
      ...manual,
      solutions: matchedSolutions?.solutions || []
    };
  });
  
  // Utiliser manualsWithSolutions pour l'affichage
});
```

**Note importante :**
- Les `moduleManuals` ne contiennent **pas** de solutions (visibles par tous)
- Les solutions sont dans `solutionsByOperator[operatorId]`
- Il faut fusionner manuellement les solutions avec les manuels pour chaque opérateur
- Le code dans `waitingRoom.tsx` fait cette fusion automatiquement

---

#### 5. `timerUpdate`
**Reçu par :** Agent (`app/agent/timerPage.tsx`)

**Données reçues :**
```typescript
{
  remaining: number  // Temps restant en secondes
}
```

**Action :**
- Met à jour l'affichage du timer (MM:SS)
- Formatage automatique en minutes:secondes

---

#### 6. `gameOver`
**Reçu par :** Agent (`app/agent/timerPage.tsx`) et Opérateur (`app/operator/manual.tsx`)

**Données reçues :**
```typescript
{
  message: string  // Message de fin de partie (ex: "Temps écoulé" ou "Bombe désamorcée")
}
```

**Action :**
- Affiche une alerte avec le message
- Nettoie la session locale
- Déconnecte le socket
- Redirige vers la home (`/`)

---

#### 7. `sessionCleared`
**Reçu par :** Tous les composants actifs

**Données reçues :**
```typescript
{
  message?: string  // Message optionnel expliquant la fermeture
}
```

**Action :**
- Affiche une alerte avec le message
- Nettoie la session locale
- Déconnecte le socket
- Redirige vers la home (`/`)

**Déclenché quand :**
- L'agent ferme la session manuellement
- Les conditions de validation ne sont plus remplies
- Moins de 1 agent ou moins de 1 opérateur

---

#### 8. `sessionClosed`
**Reçu par :** Tous les composants actifs

**Données reçues :**
```typescript
{
  // Structure à définir selon le backend
  // Peut contenir des informations sur la raison de la fermeture
}
```

**Action :**
- Nettoie automatiquement la session locale
- Déconnecte le socket
- Redirige vers la home (`/`)
- **Pas d'alerte** (fermeture silencieuse)

**Déclenché quand :**
- Fin de partie (win ou lose)
- Fermeture automatique par le serveur
- Session expirée

---

#### 9. `operatorBackNavigation`
**Reçu par :** Agent (`app/agent/waitingRoom.tsx`)

**Données reçues :**
```typescript
{
  operatorId: string,
  operatorLabel: string,  // ex: "operator 1"
  sessionCode: string,
  timestamp: string
}
```

**Action :**
- Log pour information
- Permet à l'agent de savoir qu'un opérateur a fait retour en arrière
- Peut être utilisé pour afficher une notification

---

## Interfaces TypeScript

### Session
**Fichier :** `core/interface/sesssion.interface.tsx`

```typescript
export interface Session {
  id: string;
  code: string;              // Code à 6 caractères
  agentId: string;           // Socket.id de l'agent
  maxTime: number;           // Temps maximum en secondes
  operatorIds: string[];    // Tableau des Socket.id des opérateurs
  createdAt: Date;
  difficulty?: "Easy" | "Medium" | "Hard";  // NOUVEAU
  gameMode?: "ONE_OPERATOR_ONE_MODULE" | "RANDOM_ONE_MODULE_SPLIT";  // NOUVEAU
}
```

### ModuleManual
**Fichier :** `core/interface/module.interface.tsx`

```typescript
export interface ModuleManual {
  name: string;              // Nom du module
  description: string;       // Description du module
  rules?: string[];          // Règles optionnelles (tableau de strings)
  imgUrl: string;            // URL de l'image du module
  _id?: string;              // ID MongoDB optionnel
  moduleId?: string;         // ID du module optionnel
  solutions?: string[];      // Solutions optionnelles
}
```

---

## Gestion des sessions

### Stockage local
**Fichier :** `core/service/session.service.tsx`

**Fonctions disponibles :**

#### `saveSession(session: Session)`
Sauvegarde une session dans AsyncStorage.
- **Clé :** `"current_session"`
- **Format :** JSON stringifié

#### `getSession()`
Récupère la session depuis AsyncStorage.
- **Retourne :** `Session | null`

#### `clearSession()`
Supprime la session du stockage local.
- **Utilisé lors de :**
  - Fermeture de session
  - Fin de partie
  - Déconnexion
  - Retour à la home

---

## Validations et règles métier

### Validation des rôles

**Côté serveur :**
- Vérifier qu'il n'y a qu'**1 seul agent** par session
- Permettre **plusieurs opérateurs** par session
- Valider que chaque action inclut le `role` correct

**Côté client :**
- Toujours envoyer le `role` dans les événements Socket
- Vérifier le rôle avant certaines actions (ex: seul l'agent peut `startGame`)

### Validation de session

**Conditions de fermeture automatique :**
- Moins de 1 agent dans la session
- Moins de 1 opérateur dans la session
- Session expirée (si applicable)

**Actions déclenchées :**
1. Émission de `sessionCleared` à tous les clients
2. Nettoyage des données côté serveur
3. Déconnexion de tous les sockets de la session

### Gestion du timer

**Règles :**
- Le timer ne démarre que si la session est valide (1 agent + 1+ opérateurs)
- Le timer s'arrête automatiquement si :
  - La session est fermée
  - Le temps atteint 0
  - Les conditions de validation ne sont plus remplies

**Événements :**
- `startTimer` : Démarre le compte à rebours
- `timerUpdate` : Mise à jour régulière du temps restant
- `gameOver` : Fin de partie (temps écoulé ou bombe désamorcée)

---

## Flux détaillé par scénario

### Scénario 1 : Création et démarrage d'une partie

1. **Agent sélectionne difficulté** (`/agent/dificulty`)
   - Sélection : "Easy" | "Medium" | "Hard"
   - Navigation vers `/agent/joinGame` avec `difficulty` en paramètre

2. **Agent crée la session** (`/agent/joinGame`)
   - `Socket.emit("createSession", { difficulty, role: "agent" })`
   - Optionnel : `Socket.emit("createSession", { difficulty, gameMode: "RANDOM_ONE_MODULE_SPLIT", role: "agent" })`
   - Réception : `sessionCreated` avec code, maxTime, difficulty et gameMode
   - Affichage du code et du temps
   - Navigation vers `/agent/waitingRoom`

3. **Opérateur rejoint** (`/operator/joinGame`)
   - Saisie du code de session
   - `Socket.emit("getSession", { sessionCode })` → Vérification
   - `Socket.emit("joinSession", { sessionCode, player: "Operator", role: "operator" })`
   - Réception : `playerJoined`
   - Navigation vers `/agent/waitingRoom`

4. **Salle d'attente** (`/agent/waitingRoom`)
   - **Agent :** Voit les opérateurs connectés, peut lancer la partie
   - **Opérateur :** Voit l'agent et les autres opérateurs, peut rejoindre quand le jeu démarre
   - Polling : `getSession` toutes les 1 seconde
   - Affichage des joueurs : 1 agent + N opérateurs

5. **Agent lance la partie**
   - `Socket.emit("startGame", { sessionCode, role: "agent" })`
   - Réception : `gameStarted` avec :
     - `moduleManuals` : Modules sans solutions (visibles par tous)
     - `solutionsByOperator` : Solutions assignées à chaque opérateur
     - `solutionsDistribution` : Distribution complète
   - **Agent :** Navigation vers `/agent/timerPage`
   - **Opérateurs :** 
     - Navigation vers `/operator/manual`
     - Fusion des solutions avec les manuels pour affichage
     - Chaque opérateur voit uniquement ses solutions assignées

---

### Scénario 2 : Pendant le jeu

1. **Agent - Timer Page** (`/agent/timerPage`)
   - `Socket.emit("startTimer", { sessionCode, role: "agent" })`
   - Réception : `timerUpdate` régulier avec `remaining`
   - Affichage du compte à rebours en temps réel
   - Possibilité de quitter (ferme la session)

2. **Opérateur - Manual** (`/operator/manual`)
   - Affichage des manuels reçus via `gameStarted`
   - Consultation des règles et instructions
   - Affichage des solutions assignées via `solutionsByOperator[socket.id]`
   - Fusion des solutions avec les manuels pour affichage complet
   - Possibilité de retourner à la salle d'attente (sans fermer la session)

---

### Scénario 3 : Fin de partie

1. **Temps écoulé ou bombe désamorcée**
   - Serveur émet `gameOver` avec message
   - Tous les clients reçoivent l'événement
   - Alerte affichée
   - Nettoyage de la session
   - Redirection vers `/`

2. **Fermeture de session**
   - Serveur émet `sessionClosed`
   - Tous les clients reçoivent l'événement
   - Nettoyage automatique
   - Redirection vers `/`

---

### Scénario 4 : Retour en arrière

1. **Opérateur fait retour depuis Manual**
   - `Socket.emit("back", { sessionCode, role: "operator" })`
   - Serveur émet `operatorBackNavigation` à l'agent
   - Navigation vers `/agent/waitingRoom`
   - L'opérateur peut rejoindre à nouveau via "Rejoindre la partie"

2. **Agent fait retour depuis Timer**
   - `Socket.emit("back", { sessionCode, role: "agent" })`
   - `Socket.emit("clearSession", { sessionCode, role: "agent" })`
   - Fermeture de la session
   - Tous les clients reçoivent `sessionCleared`
   - Redirection vers `/`

---

## Structure des données attendues

### Réponse `sessionCreated`
```typescript
{
  id: "uuid",
  code: "A9FA70",              // 6 caractères alphanumériques
  agentId: "socket-id-agent",
  maxTime: 1200,               // En secondes selon difficulté :
                                // - Easy: 1200s (20 min)
                                // - Medium: 900s (15 min)
                                // - Hard: 600s (10 min)
  operatorIds: [],             // Vide au départ
  players: [
    {
      id: "socket-id-agent",
      label: "agent",
      role: "agent"
    }
  ],
  createdAt: "2026-01-21T12:05:00.609Z",
  remainingTime: 1200,
  started: false,
  timerStarted: false,
  difficulty: "Easy",          // NOUVEAU
  gameMode: "ONE_OPERATOR_ONE_MODULE"  // NOUVEAU
}
```

### Réponse `currentSession`
```typescript
{
  id: "uuid",
  code: "A9FA70",
  agentId: "socket-id-agent",
  maxTime: 600,
  operatorIds: ["socket-id-op1", "socket-id-op2"],
  players: [
    {
      id: "socket-id-agent",
      label: "agent",
      role: "agent"
    },
    {
      id: "socket-id-op1",
      label: "operator 1",
      role: "operator"
    },
    {
      id: "socket-id-op2",
      label: "operator 2",
      role: "operator"
    }
  ],
  started: true,
  timerStarted: true,
  remainingTime: 450
}
```

### Réponse `gameStarted`
```typescript
{
  session: {
    id: "uuid",
    code: "A9FA70",
    difficulty: "Medium",
    gameMode: "ONE_OPERATOR_ONE_MODULE",
    // ... autres propriétés
  },
  moduleManuals: [
    {
      _id: "module-id-1",
      moduleId: "module-id-1",
      name: "Module Wires",
      description: "Découpez les bons fils",
      rules: [
        "Si la bombe n'a pas d'indicateur allumé, coupez le fil rouge",
        "Si la bombe a 2+ piles, coupez le fil jaune"
      ],
      imgUrl: "https://example.com/wires.png"
      // IMPORTANT: Pas de solutions ici
    },
    {
      _id: "module-id-2",
      moduleId: "module-id-2",
      name: "Module Button",
      description: "Appuyez sur le bouton",
      rules: ["Appuyez et maintenez", "Relâchez quand le timer affiche 5"],
      imgUrl: "https://example.com/button.png"
    }
  ],
  solutionsDistribution: [
    {
      moduleId: "module-id-1",
      operatorId: "socket-id-op1",
      solutions: ["rouge", "jaune"]
    },
    {
      moduleId: "module-id-2",
      operatorId: "socket-id-op2",
      solutions: ["appuyer", "maintenir", "relâcher à 5"]
    }
  ],
  solutionsByOperator: {
    "socket-id-op1": [
      {
        moduleId: "module-id-1",
        solutions: ["rouge", "jaune"]
      }
    ],
    "socket-id-op2": [
      {
        moduleId: "module-id-2",
        solutions: ["appuyer", "maintenir", "relâcher à 5"]
      }
    ]
  }
}
```

**Note importante :** 
- `moduleManuals` contient les modules **sans solutions** (visibles par tous)
- `solutionsByOperator` contient les solutions **assignées à chaque opérateur**
- Pour afficher les solutions à un opérateur, utiliser `solutionsByOperator[socket.id]`

---

## Modes de jeu détaillés

### Mode 1 : `ONE_OPERATOR_ONE_MODULE` (par défaut)

**Logique de sélection :**
- Si ≤ 4 modules disponibles → Tous les modules sont utilisés
- Si > 4 modules → 4 modules sélectionnés aléatoirement

**Distribution avec 2 opérateurs :**
```
Module 1 → Opérateur 1 (toutes les solutions)
Module 2 → Opérateur 1 (toutes les solutions)
Module 3 → Opérateur 2 (toutes les solutions)
Module 4 → Opérateur 2 (toutes les solutions)
```

**Distribution avec 3 opérateurs :**
```
Module 1 → Opérateur 1 (toutes les solutions)
Module 2 → Opérateur 2 (toutes les solutions)
Module 3 → Opérateur 3 (toutes les solutions)
Module 4 → Tous les opérateurs (toutes les solutions à chacun)
```

**Distribution avec 4+ opérateurs :**
- Round-robin : Module 1→Op1, Module 2→Op2, Module 3→Op3, Module 4→Op4, Module 1→Op5, etc.

### Mode 2 : `RANDOM_ONE_MODULE_SPLIT`

**Logique de sélection :**
- Même logique que le mode 1 (≤4 ou 4 aléatoires)

**Distribution :**
- Tous les opérateurs voient tous les modules sélectionnés
- Les solutions de chaque module sont réparties en round-robin

**Exemple avec 3 opérateurs et Module A (9 solutions) :**
```
Opérateur 1 : Solutions [1, 4, 7]
Opérateur 2 : Solutions [2, 5, 8]
Opérateur 3 : Solutions [3, 6, 9]
```

**Exemple avec 2 opérateurs et Module B (5 solutions) :**
```
Opérateur 1 : Solutions [1, 3, 5]
Opérateur 2 : Solutions [2, 4]
```

---

## Points d'attention pour le développement

### 1. Gestion des erreurs
- Toujours vérifier `res.success` dans les callbacks
- Gérer les cas où `sessionCode` est `undefined`
- Vérifier que `moduleManuals` existe et est valide avant parsing
- Vérifier que `solutionsByOperator` existe avant d'accéder aux solutions

### 2. Nettoyage des listeners
- Toujours utiliser `Socket.off()` dans les cleanup de `useEffect`
- Éviter les fuites mémoire avec les listeners multiples

### 3. Navigation
- Utiliser `router.replace("/")` pour la home (empêche le retour)
- Utiliser `router.navigate()` pour la navigation normale
- Utiliser `router.back()` pour le retour simple

### 4. Stockage local
- Toujours nettoyer avec `clearSession()` avant redirection
- Vérifier que la session existe avant d'accéder à `session.code`

### 5. Rôles
- Toujours envoyer le `role` dans les événements Socket
- Vérifier le rôle côté client avant certaines actions
- Le serveur doit valider les rôles pour la sécurité

---

## Améliorations futures possibles

1. **Gestion des reconnexions**
   - Détecter les déconnexions réseau
   - Permettre la reconnexion à une session existante

2. **Statistiques de partie**
   - Temps de résolution
   - Nombre de modules résolus
   - Score final

3. **Chat en temps réel**
   - Communication entre agent et opérateurs
   - Indices et conseils

4. **Historique des sessions**
   - Sauvegarder les parties terminées
   - Rejouer les parties

5. **Système de progression**
   - Déblocage de difficultés
   - Achievements

---

## Notes techniques

### Variables d'environnement
- `EXPO_PUBLIC_WEBSOCKET_URL` : URL du serveur Socket.IO

### Dépendances principales
- `socket.io-client` : Client Socket.IO
- `@react-native-async-storage/async-storage` : Stockage local
- `expo-router` : Navigation
- `expo-clipboard` : Copie du code de session

### Performance
- Polling `getSession` : 1 seconde (à optimiser si nécessaire)
- Timeout pour `clearSession` : 5 secondes
- Reconnexion automatique : 5 tentatives max

---

---

## Guide rapide - Modes de jeu

### Créer une session avec mode personnalisé

```typescript
// Mode par défaut (ONE_OPERATOR_ONE_MODULE)
Socket.emit("createSession", {
  difficulty: "Medium",
  role: "agent"  // OBLIGATOIRE
});

// Mode split (RANDOM_ONE_MODULE_SPLIT)
Socket.emit("createSession", {
  difficulty: "Hard",
  gameMode: "RANDOM_ONE_MODULE_SPLIT",
  role: "agent"  // OBLIGATOIRE
});
```

### Récupérer les solutions d'un opérateur

```typescript
Socket.on("gameStarted", (data) => {
  // Pour l'opérateur actuel
  const mySolutions = data.solutionsByOperator[Socket.id];
  
  // Fusionner avec les manuels
  const manualsWithSolutions = data.moduleManuals.map(manual => {
    const matched = mySolutions?.find(s => 
      s.moduleId === manual._id || s.moduleId === manual.moduleId
    );
    return {
      ...manual,
      solutions: matched?.solutions || []
    };
  });
});
```

---

**Dernière mise à jour :** 2026-01-21
**Version :** 2.0.0 (Ajout modes de jeu et difficultés)
