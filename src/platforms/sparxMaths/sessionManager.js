export class SparxSessionManager {

  constructor() {
    this.sessions = new Map();
  }


  createSession(userId, data) {
    this.sessions.set(userId, {
      ...data,
      createdAt: Date.now()
    });

    return this.sessions.get(userId);
  }


  getSession(userId) {
    return this.sessions.get(userId);
  }


  removeSession(userId) {
    this.sessions.delete(userId);
  }

}

export default SparxSessionManager;