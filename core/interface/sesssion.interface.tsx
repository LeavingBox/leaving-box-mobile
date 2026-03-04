export interface Session {
  id: string;
  code: string;
  agentId: string;
  maxTime: number;
  analystIds: string[];
  createdAt: Date;
}

export interface SessionResponse {
  session: Session;
  message: string;
}
