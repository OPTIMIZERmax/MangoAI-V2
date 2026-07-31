import HealthCheckTask from "./HealthCheckTask.js";
import SessionStatusTask from "./SessionStatusTask.js";
import SiteInfoTask from "./SiteInfoTask.js";
import LoginPageTask from "./LoginPageTask.js";
import SchoolSelectionTask from "./SchoolSelectionTask.js";

export class TaskRunner {
  constructor(client, sessionManager) {
    this.tasks = {
      healthcheck: new HealthCheckTask(client),
      "session-status": new SessionStatusTask(sessionManager),
      "site-info": new SiteInfoTask(client),
      "login-page": new LoginPageTask(client),
      "school-selection": new SchoolSelectionTask(client)
    };
  }

  async execute(taskPayload) {
    const task = this.tasks[taskPayload.action];

    if (!task) {
      return {
        success: false,
        error: `Unknown task '${taskPayload.action}'`
      };
    }

    return await task.execute(taskPayload);
  }
}

export default TaskRunner;