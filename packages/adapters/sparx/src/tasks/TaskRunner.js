import HealthCheckTask from "./HealthCheckTask.js";
import SessionStatusTask from "./SessionStatusTask.js";
import SiteInfoTask from "./SiteInfoTask.js";
import LoginPageTask from "./LoginPageTask.js";
import SchoolSelectionTask from "./SchoolSelectionTask.js";
import LoginInspectTask from "./LoginInspectTask.js";
import LoginTask from "./LoginTask.js";

export class TaskRunner {
  constructor(client, sessionManager) {
    this.tasks = {
      healthcheck: new HealthCheckTask(client),

      "session-status": new SessionStatusTask(sessionManager),

      "site-info": new SiteInfoTask(client),

      "login-inspect": new LoginInspectTask(client),

      "login-page": new LoginPageTask(client),

      login: new LoginTask(client),

      // Preferred name
      "select-school": new SchoolSelectionTask(client),

      // Backwards compatibility
      "school-selection": new SchoolSelectionTask(client)
    };
  }

  async execute(taskPayload, context) {
    const task = this.tasks[taskPayload.action];

    if (!task) {
      return {
        success: false,
        error: `Unknown task '${taskPayload.action}'`
      };
    }

    return await task.execute(taskPayload, context);
  }
}

export default TaskRunner;