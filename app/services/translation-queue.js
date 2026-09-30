'use strict';

class TranslationQueue {
  constructor() {
    this.pending = [];
    this.running = false;
    this.sequence = 0;
  }

  enqueue(run, options = {}) {
    const priority = Number.isFinite(options.priority) ? options.priority : 0;
    const signal = options.signal || null;
    if (signal?.aborted) return Promise.reject(signal.reason || new Error('任务已取消'));

    return new Promise((resolve, reject) => {
      const task = {
        id: ++this.sequence,
        priority,
        run,
        resolve,
        reject,
        signal,
        abortHandler: null
      };
      if (signal) {
        task.abortHandler = () => {
          const index = this.pending.indexOf(task);
          if (index >= 0) {
            this.pending.splice(index, 1);
            reject(signal.reason || new Error('任务已取消'));
          }
        };
        signal.addEventListener('abort', task.abortHandler, { once: true });
      }
      this.pending.push(task);
      this.pending.sort((a, b) => b.priority - a.priority || a.id - b.id);
      void this.drain();
    });
  }

  async drain() {
    if (this.running) return;
    this.running = true;
    try {
      while (this.pending.length > 0) {
        const task = this.pending.shift();
        if (task.abortHandler) task.signal.removeEventListener('abort', task.abortHandler);
        if (task.signal?.aborted) {
          task.reject(task.signal.reason || new Error('任务已取消'));
          continue;
        }
        try {
          task.resolve(await task.run(task.signal));
        } catch (error) {
          task.reject(error);
        }
      }
    } finally {
      this.running = false;
      if (this.pending.length > 0) void this.drain();
    }
  }
}

module.exports = { TranslationQueue };
