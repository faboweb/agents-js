// ledger.js
class Ledger {
  constructor() {
    this.conversationHistory = [];
    this.tasks = [];
  }

  addMessage(role, content) {
    this.conversationHistory.push({ role, content });
  }

  addTask(task) {
    this.tasks.push(task);
  }

  getSummary() {
    return {
      conversationHistory: this.conversationHistory,
      tasks: this.tasks,
    };
  }
}

export default Ledger;
