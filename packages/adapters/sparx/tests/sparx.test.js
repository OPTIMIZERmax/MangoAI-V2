import test from "node:test";
import assert from "node:assert/strict";

import { LoginTask } from "../src/tasks/LoginTask.js";
import { SparxClient } from "../src/services/SparxClient.js";

test("LoginTask returns success when the helper flow completes", async () => {
  const calls = [];
  const client = {
    async goToLogin() {
      calls.push("goToLogin");
      return { success: true };
    },
    async searchSchool(schoolName) {
      calls.push(`searchSchool:${schoolName}`);
    },
    async selectSchool() {
      calls.push("selectSchool");
    },
    async enterUsername(username) {
      calls.push(`enterUsername:${username}`);
    },
    async enterPassword(password) {
      calls.push(`enterPassword:${password}`);
    },
    async submitLogin() {
      calls.push("submitLogin");
    },
    async isLoggedIn() {
      calls.push("isLoggedIn");
      return true;
    }
  };

  const task = new LoginTask(client);
  const result = await task.execute({
    school: "Test School",
    username: "student",
    password: "secret"
  });

  assert.deepEqual(result, {
    success: true,
    loggedIn: true
  });

  assert.deepEqual(calls, [
    "goToLogin",
    "searchSchool:Test School",
    "selectSchool",
    "enterUsername:student",
    "enterPassword:secret",
    "submitLogin",
    "isLoggedIn"
  ]);
});

test("LoginTask reports invalid credentials when the session is not established", async () => {
  const client = {
    async goToLogin() {
      return { success: true };
    },
    async searchSchool() {
      return { success: true };
    },
    async selectSchool() {
      return { success: true };
    },
    async enterUsername() {
      return { success: true };
    },
    async enterPassword() {
      return { success: true };
    },
    async submitLogin() {
      return { success: true };
    },
    async isLoggedIn() {
      return false;
    }
  };

  const task = new LoginTask(client);
  const result = await task.execute({
    school: "Test School",
    username: "student",
    password: "wrong"
  });

  assert.deepEqual(result, {
    success: false,
    error: "Invalid credentials"
  });
});

test("SparxClient selectSchool works without requiring a school argument", async () => {
  const page = {
    async waitForLoadState() {},
    async waitForTimeout() {},
    getByText() {
      return {
        first: () => ({
          count: async () => 1,
          click: async () => {}
        })
      };
    },
    getByRole() {
      return {
        count: async () => 1,
        click: async () => {}
      };
    }
  };

  const client = new SparxClient({
    getPage: () => page
  });

  const result = await client.selectSchool();

  assert.deepEqual(result, {
    success: true
  });
});
