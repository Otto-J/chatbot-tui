// TODO: 接入 SQLite 进行持久化存储
// import Database from 'better-sqlite3';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export class ChatManager {
  private sessions: Map<string, Session> = new Map();
  private activeSessionId: string | null = null;

  constructor() {
    // Constructor should be clean
    // TODO: Load sessions from SQLite here in the future
  }

  public initialize() {
    // Create a default session if none exist
    if (this.sessions.size === 0) {
      const initialSession = this.createNewSession('默认会话');
      this.addMessage(initialSession.id, { role: 'assistant', content: '你好！有什么可以帮你的吗？' });
    }
  }

  createNewSession(title?: string): Session {
    const id = `sid_${Date.now()}`;
    const newSession: Session = {
      id,
      title: title || `会话 ${this.sessions.size + 1}`,
      messages: [],
      createdAt: new Date(),
    };
    this.sessions.set(id, newSession);
    this.activeSessionId = id;
    // TODO: 将新会话存入 SQLite
    return newSession;
  }

  addMessage(sessionId: string, message: Message) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push(message);
      // TODO: 更新 SQLite 中的会话
    }
  }

  getSessions() {
    return Array.from(this.sessions.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  setActiveSession(sessionId: string) {
    if (this.sessions.has(sessionId)) {
      this.activeSessionId = sessionId;
    }
  }

  getActiveSession(): Session | undefined {
    if (!this.activeSessionId) return undefined;
    return this.sessions.get(this.activeSessionId);
  }
}
