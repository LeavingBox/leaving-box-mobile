export type PlayerRole = "agent" | "analyste";

export type Player = {
  id?: string;
  role: PlayerRole;
};

export type Session = {
  id: string;
  code: string;
  agentId: string;
  maxTime: number;
  analystIds: string[];
  createdAt: Date;
  /** Liste des joueurs connectés (structure recommandée) */
  players?: Player[];
  /** Fallback : ancienne structure */
  connectedClients?: unknown[];
  difficulty?: string;
  gameMode?: string;
};

export type SessionResponse = {
  session: Session;
  message: string;
};
