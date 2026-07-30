import { AdapterLifecycleState } from "../adapters/BaseAdapter.js";

export class AdapterRegistry {
  constructor() {
    this.registeredAdapters = new Map();
  }

  register(adapterInstance) {
    if (!adapterInstance?.metadata) {
      throw new Error("Invalid adapter.");
    }

    const id = adapterInstance.metadata.id;

    if (this.registeredAdapters.has(id)) {
      throw new Error(`Adapter ${id} already registered.`);
    }

    this.registeredAdapters.set(id, {
      instance: adapterInstance,
      metadata: adapterInstance.metadata
    });

    return adapterInstance.metadata;
  }

  async execute(adapterId, taskPayload, context) {
    const record = this.registeredAdapters.get(adapterId);

    if (!record) {
      throw new Error(`Adapter '${adapterId}' not found.`);
    }

    if (record.instance.state !== AdapterLifecycleState.READY) {
      throw new Error(
        `Adapter '${adapterId}' is not ready.`
      );
    }

    record.instance.state = AdapterLifecycleState.EXECUTING;

    try {
      const result = await record.instance.executeTask(
        taskPayload,
        context
      );

      record.instance.state = AdapterLifecycleState.READY;

      return result;
    } catch (error) {
      record.instance.state = AdapterLifecycleState.FAILED;
      throw error;
    }
  }

  async shutdown(adapterId) {
    const record = this.registeredAdapters.get(adapterId);

    if (!record) {
      throw new Error(`Adapter '${adapterId}' not found.`);
    }

    record.instance.state = AdapterLifecycleState.DRAINING;

    await record.instance.shutdown();
  }
}