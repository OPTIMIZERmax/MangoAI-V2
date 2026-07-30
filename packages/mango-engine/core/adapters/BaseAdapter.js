export const AdapterLifecycleState = Object.freeze({
  UNINITIALIZED: "UNINITIALIZED",
  INITIALIZING: "INITIALIZING",
  READY: "READY",
  EXECUTING: "EXECUTING",
  DRAINING: "DRAINING",
  STOPPED: "STOPPED",
  FAILED: "FAILED"
});

export class BaseAdapter {
  constructor() {
    this.state = AdapterLifecycleState.UNINITIALIZED;
  }

  get metadata() {
    throw new Error("Adapter subclass must implement metadata getter.");
  }

  async initialize() {
    this.state = AdapterLifecycleState.READY;
  }

  async executeTask(taskPayload, context) {
    throw new Error("Adapter subclass must implement executeTask().");
  }

  async shutdown() {
    this.state = AdapterLifecycleState.STOPPED;
  }
}