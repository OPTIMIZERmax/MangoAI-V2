import fs from "node:fs/promises";
import path from "node:path";

export default class SavedAccountManager {
  constructor(filePath = "data/sessions/savedAccounts.json") {
    this.filePath = path.resolve(filePath);
  }

  async ensureFile() {
    await fs.mkdir(path.dirname(this.filePath), {
      recursive: true
    });

    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(
        this.filePath,
        "{}",
        "utf8"
      );
    }
  }

  async load() {
    await this.ensureFile();

    const raw = await fs.readFile(this.filePath, "utf8");

    if (!raw.trim()) {
      return {};
    }

    return JSON.parse(raw);
  }

  async save(data) {
    await this.ensureFile();

    await fs.writeFile(
      this.filePath,
      JSON.stringify(data, null, 2),
      "utf8"
    );
  }

  async getUserAccounts(discordUserId) {
    const data = await this.load();

    return data[discordUserId]?.accounts ?? [];
  }

  async getAccount(discordUserId, accountId) {
    const accounts = await this.getUserAccounts(discordUserId);

    return accounts.find(account => account.id === accountId) ?? null;
  }

  async addAccount(discordUserId, account) {
    const data = await this.load();

    if (!data[discordUserId]) {
      data[discordUserId] = {
        accounts: []
      };
    }

    data[discordUserId].accounts.push(account);

    await this.save(data);

    return account;
  }

  async deleteAccount(discordUserId, accountId) {
    const data = await this.load();

    const user = data[discordUserId];

    if (!user) {
      return false;
    }

    const originalLength = user.accounts.length;

    user.accounts = user.accounts.filter(
      account => account.id !== accountId
    );

    if (user.accounts.length === originalLength) {
      return false;
    }

    if (user.accounts.length === 0) {
      delete data[discordUserId];
    }

    await this.save(data);

    return true;
  }
}