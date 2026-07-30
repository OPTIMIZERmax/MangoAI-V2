export class ExecutionContext {
  #jobStore;

  constructor({ jobId, logger, browserPool, sessionVault, jobStore, tracer }) {
    if (!jobId || !logger || !jobStore) {
      throw new Error(
        "ExecutionContext requires at least jobId, logger, and jobStore."
      );
    }

    this.jobId = String(jobId);
    this.logger = logger;
    this.browserPool = browserPool ?? null;
    this.sessionVault = sessionVault ?? null;
    this.tracer = tracer ?? null;
    this.createdAt = Date.now();

    this.#jobStore = jobStore;

    Object.freeze(this);
  }

  async reportProgress(percentage, statusMessage = "") {
    if (
      typeof percentage !== "number" ||
      percentage < 0 ||
      percentage > 100
    ) {
      throw new Error(
        "Progress percentage must be between 0 and 100."
      );
    }

    await this.#jobStore.updateJobProgress(
      this.jobId,
      { percentage, statusMessage }
    );
  }

  async recordArtifact(key, data) {
    if (!key || typeof key !== "string") {
      throw new Error(
        "Artifact key must be a valid string."
      );
    }

    await this.#jobStore.saveArtifact(
      this.jobId,
      key,
      data
    );
  }
}