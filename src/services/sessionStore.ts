import { ConversationMessage } from "../types/genkit";

/**
 * Interface cho session data
 */
export interface SessionData {
  id: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

/**
 * Interface cho session store
 */
export interface SessionStore {
  get(sessionId: string): Promise<SessionData | undefined>;
  save(sessionId: string, sessionData: SessionData): Promise<void>;
  delete(sessionId: string): Promise<void>;
  list(): Promise<string[]>;
}

/**
 * In-memory session store implementation
 * Lưu trữ sessions trong memory, phù hợp cho development
 */
export class MemorySessionStore implements SessionStore {
  private sessions = new Map<string, SessionData>();

  async get(sessionId: string): Promise<SessionData | undefined> {
    return this.sessions.get(sessionId);
  }

  async save(sessionId: string, sessionData: SessionData): Promise<void> {
    this.sessions.set(sessionId, {
      ...sessionData,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async list(): Promise<string[]> {
    return Array.from(this.sessions.keys());
  }

  /**
   * Xóa tất cả sessions
   */
  async clear(): Promise<void> {
    this.sessions.clear();
  }

  /**
   * Lấy số lượng sessions
   */
  size(): number {
    return this.sessions.size;
  }
}

/**
 * File-based session store implementation
 * Lưu trữ sessions trong files JSON, phù hợp cho production nhỏ
 */
export class FileSessionStore implements SessionStore {
  private basePath: string;

  constructor(basePath: string = "./sessions") {
    this.basePath = basePath;
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    const fs = require("fs");
    const path = require("path");

    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  private getFilePath(sessionId: string): string {
    const path = require("path");
    return path.join(this.basePath, `${sessionId}.json`);
  }

  async get(sessionId: string): Promise<SessionData | undefined> {
    try {
      const fs = require("fs").promises;
      const filePath = this.getFilePath(sessionId);
      const data = await fs.readFile(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      // File không tồn tại hoặc lỗi đọc file
      return undefined;
    }
  }

  async save(sessionId: string, sessionData: SessionData): Promise<void> {
    try {
      const fs = require("fs").promises;
      const filePath = this.getFilePath(sessionId);
      const dataToSave = {
        ...sessionData,
        updatedAt: new Date().toISOString(),
      };
      await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2), "utf8");
    } catch (error) {
      console.error(`Lỗi lưu session ${sessionId}:`, error);
      throw new Error(`Không thể lưu session: ${error}`);
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      const fs = require("fs").promises;
      const filePath = this.getFilePath(sessionId);
      await fs.unlink(filePath);
    } catch (error) {
      // File không tồn tại, không cần làm gì
    }
  }

  async list(): Promise<string[]> {
    try {
      const fs = require("fs").promises;
      const files = await fs.readdir(this.basePath);
      return files
        .filter((file: string) => file.endsWith(".json"))
        .map((file: string) => file.replace(".json", ""));
    } catch (error) {
      return [];
    }
  }

  /**
   * Xóa tất cả sessions
   */
  async clear(): Promise<void> {
    try {
      const fs = require("fs").promises;
      const files = await this.list();
      await Promise.all(files.map((sessionId) => this.delete(sessionId)));
    } catch (error) {
      console.error("Lỗi xóa tất cả sessions:", error);
    }
  }
}

/**
 * Session manager để quản lý sessions
 */
export class SessionManager {
  private static instance: SessionManager;
  private store: SessionStore;

  private constructor(store?: SessionStore) {
    // Mặc định sử dụng MemorySessionStore cho development
    this.store = store || new MemorySessionStore();
  }

  public static getInstance(store?: SessionStore): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(store);
    }
    return SessionManager.instance;
  }

  /**
   * Tạo session mới
   */
  async createSession(sessionId?: string): Promise<SessionData> {
    const id = sessionId || this.generateSessionId();
    const sessionData: SessionData = {
      id,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.store.save(id, sessionData);
    return sessionData;
  }

  /**
   * Lấy session theo ID
   */
  async getSession(sessionId: string): Promise<SessionData | undefined> {
    return await this.store.get(sessionId);
  }

  /**
   * Thêm tin nhắn vào session
   */
  async addMessage(
    sessionId: string,
    message: ConversationMessage
  ): Promise<void> {
    let session = await this.store.get(sessionId);

    if (!session) {
      // Tạo session mới nếu chưa tồn tại
      session = await this.createSession(sessionId);
    }

    session.messages.push(message);

    // Giới hạn số lượng tin nhắn (giữ 50 tin nhắn gần nhất)
    if (session.messages.length > 50) {
      session.messages = session.messages.slice(-50);
    }

    await this.store.save(sessionId, session);
  }

  /**
   * Lấy lịch sử tin nhắn của session
   */
  async getMessages(
    sessionId: string,
    limit?: number
  ): Promise<ConversationMessage[]> {
    const session = await this.store.get(sessionId);
    if (!session) {
      return [];
    }

    const messages = session.messages;
    return limit ? messages.slice(-limit) : messages;
  }

  /**
   * Xóa session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.store.delete(sessionId);
  }

  /**
   * Liệt kê tất cả sessions
   */
  async listSessions(): Promise<string[]> {
    return await this.store.list();
  }

  /**
   * Xóa tất cả sessions
   */
  async clearAllSessions(): Promise<void> {
    if (
      this.store instanceof MemorySessionStore ||
      this.store instanceof FileSessionStore
    ) {
      await this.store.clear();
    } else {
      // Fallback cho các store khác
      const sessions = await this.store.list();
      await Promise.all(sessions.map((id) => this.store.delete(id)));
    }
  }

  /**
   * Tạo session ID mới
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
  }

  /**
   * Thay đổi store backend
   */
  setStore(store: SessionStore): void {
    this.store = store;
  }
}
