import HealthCheckTask from "./HealthCheckTask.js";
import SessionStatusTask from "./SessionStatusTask.js";
import SiteInfoTask from "./SiteInfoTask.js";
import LoginPageTask from "./LoginPageTask.js";
import SchoolSelectionTask from "./SchoolSelectionTask.js";
import LoginInspectTask from "./LoginInspectTask.js";
import LoginTask from "./LoginTask.js";
import HomeworkInspectTask from "./HomeworkInspectTask.js";
import HomeworkOpenTask from "./HomeworkOpenTask.js";
import HomeworkTaskInspectTask from "./HomeworkTaskInspectTask.js";
import HomeworkTaskElementInspectTask from "./HomeworkTaskElementInspectTask.js";
import PersonalPracticeInspectTask from "./PersonalPracticeInspectTask.js";
import PersonalPracticeStartInspectTask from "./PersonalPracticeStartInspectTask.js";
import QuestionInspectTask from "./QuestionInspectTask.js";
import AnswerInterfaceInspectTask from "./AnswerInterfaceInspectTask.js";
import AnswerFieldInspectTask from "./AnswerFieldInspectTask.js";
import AnswerKeypadInspectTask from "./AnswerKeypadInspectTask.js";
import AnswerFieldInteractionInspectTask from "./AnswerFieldInteractionInspectTask.js";
import AnswerFieldStructureInspectTask from "./AnswerFieldStructureInspectTask.js";
import PersonalPracticeQuestionInspectTask from "./PersonalPracticeQuestionInspectTask.js";

export class TaskRunner {
  constructor(client, sessionManager) {
    this.tasks = {
      healthcheck: new HealthCheckTask(client),
      "session-status": new SessionStatusTask(sessionManager),
      "site-info": new SiteInfoTask(client),
      "login-inspect": new LoginInspectTask(client),
      "login-page": new LoginPageTask(client),
      login: new LoginTask(client, sessionManager),

      // Preferred name
      "select-school": new SchoolSelectionTask(client),

      // Backwards compatibility
      "school-selection": new SchoolSelectionTask(client),
      "homework-inspect": new HomeworkInspectTask(client),
      "homework-open": new HomeworkOpenTask(client),
      "homework-task-inspect": new HomeworkTaskInspectTask(client),
      "homework-task-element-inspect": new HomeworkTaskElementInspectTask(client),
      "personal-practice-inspect": new PersonalPracticeInspectTask(client),
      "personal-practice-start-inspect": new PersonalPracticeStartInspectTask(client),
      "question-inspect": new QuestionInspectTask(client),
      "answer-interface-inspect": new AnswerInterfaceInspectTask(client),
      "answer-field-inspect": new AnswerFieldInspectTask(client),
      "answer-keypad-inspect": new AnswerKeypadInspectTask(client),
      "answer-field-interaction-inspect": new AnswerFieldInteractionInspectTask(client),
      "personal-practice-question-inspect": new PersonalPracticeQuestionInspectTask(client),
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

