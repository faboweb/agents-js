// orchestrator.js
import BaseAgent from "./base_agent";
import prompts from "./orchestrator_prompts";
const {
  ORCHESTRATOR_SYSTEM_MESSAGE,
  ORCHESTRATOR_CLOSED_BOOK_PROMPT,
  ORCHESTRATOR_PLAN_PROMPT,
  ORCHESTRATOR_SYNTHESIZE_PROMPT,
  ORCHESTRATOR_LEDGER_PROMPT,
  ORCHESTRATOR_UPDATE_FACTS_PROMPT,
  ORCHESTRATOR_UPDATE_PLAN_PROMPT,
  ORCHESTRATOR_GET_FINAL_ANSWER,
} = prompts;
import Ledger from "../ledger";

class Orchestrator extends BaseAgent {
  constructor(agentConfig) {
    super(agentConfig);
    this.systemMessage = ORCHESTRATOR_SYSTEM_MESSAGE;
    this.factSheet = "";
    this.plan = "";
    this.task = "";
    this.teamDescription = "";
    this.chatHistory = [];
    this.stallCounter = 0;
    this.replanCounter = 0;
    this.maxStallsBeforeReplan = 3;
    this.maxReplans = 3;
    this.returnFinalAnswer = false;
    this.ledger = new Ledger();
  }

  async orchestrate(ledger, userInput) {
    ledger.addMessage("user", userInput);
    this.task = userInput;
    this.teamDescription = this.getTeamDescription();

    // Step 1: Closed Book Prompt
    let messages = [
      {
        role: "system",
        content: ORCHESTRATOR_CLOSED_BOOK_PROMPT,
      },
      {
        role: "user",
        content: this.task,
      },
    ];
    let aiResponse = await this.getResponse(messages);
    ledger.addMessage("assistant", aiResponse);

    // Extract facts from aiResponse
    this.factSheet = aiResponse;

    // Step 2: Plan Prompt
    let prompt = this.fillTemplate(ORCHESTRATOR_PLAN_PROMPT, {
      team: this.teamDescription,
    });
    aiResponse = await this.getResponse(prompt);
    ledger.addMessage("assistant", aiResponse);

    // Extract plan from aiResponse
    this.plan = aiResponse;

    // Step 3: Synthesize Prompt
    prompt = this.fillTemplate(ORCHESTRATOR_SYNTHESIZE_PROMPT, {
      task: JSON.stringify(this.task),
      team: JSON.stringify(this.teamDescription),
      facts: JSON.stringify(this.factSheet),
      plan: JSON.stringify(this.plan),
    });
    aiResponse = await this.getResponse(prompt);
    ledger.addMessage("assistant", aiResponse);

    // Step 4: Main Orchestration Loop
    let isTaskComplete = false;
    while (!isTaskComplete && this.replanCounter <= this.maxReplans) {
      // Update ledger
      const ledgerPrompt = this.fillTemplate(ORCHESTRATOR_LEDGER_PROMPT, {
        task: this.task,
        team: this.teamDescription,
        names: this.getTeamNames(),
      });

      let ledgerUpdate;
      while (true) {
        aiResponse = await this.getResponse(ledgerPrompt, true);
        try {
          ledgerUpdate = JSON.parse(aiResponse);
          break;
        } catch (error) {
          console.error(
            "Failed to parse ledger information:",
            error,
            aiResponse
          );
        }
      }

      // Check if the task is satisfied
      if (ledgerUpdate.is_request_satisfied.answer) {
        if (this.returnFinalAnswer) {
          // Prepare final answer
          prompt = this.fillTemplate(ORCHESTRATOR_GET_FINAL_ANSWER, {
            task: this.task,
          });
          aiResponse = await this.getResponse(prompt);
          ledger.addMessage("assistant", aiResponse);
          return aiResponse;
        }
        isTaskComplete = true;
        break;
      }

      // Check for stalling or loops
      const stalled =
        ledgerUpdate.is_in_loop.answer ||
        !ledgerUpdate.is_progress_being_made.answer;
      if (stalled) {
        this.stallCounter += 1;
        if (this.stallCounter > this.maxStallsBeforeReplan) {
          this.replanCounter += 1;
          this.stallCounter = 0;
          if (this.replanCounter > this.maxReplans) {
            console.error("Replan counter exceeded... Terminating.");
            break;
          } else {
            // Update facts and plan
            prompt = this.fillTemplate(ORCHESTRATOR_UPDATE_FACTS_PROMPT, {
              task: this.task,
              facts: this.factSheet,
            });
            aiResponse = await this.getResponse(prompt);
            this.factSheet = aiResponse;
            ledger.addMessage("assistant", aiResponse);

            prompt = this.fillTemplate(ORCHESTRATOR_UPDATE_PLAN_PROMPT, {
              team: this.teamDescription,
            });
            aiResponse = await this.getResponse(prompt);
            this.plan = aiResponse;
            ledger.addMessage("assistant", aiResponse);

            // Synthesize new plan
            prompt = this.fillTemplate(ORCHESTRATOR_SYNTHESIZE_PROMPT, {
              task: this.task,
              team: this.teamDescription,
              facts: this.factSheet,
              plan: this.plan,
            });
            aiResponse = await this.getResponse(prompt);
            ledger.addMessage("assistant", aiResponse);
            continue;
          }
        }
      }

      console.log("Orchestrator: Ledger update:", ledgerUpdate);

      // Determine next agent and instruction
      const nextAgentName = ledgerUpdate.next_speaker.answer;
      const instruction = ledgerUpdate.instruction_or_question.answer;
      ledger.addMessage("assistant", instruction);

      // Send instruction to the next agent
      const nextAgent = this.getAgentByName(nextAgentName);
      if (nextAgent) {
        const messages = nextAgent.createMessagesFromLedger(ledger);
        aiResponse = await nextAgent.getResponse(messages);
        ledger.addMessage("assistant", aiResponse);
      } else {
        console.error("Next agent not found.");
        break;
      }
    }

    return "Orchestration complete.";
  }

  fillTemplate(template, variables) {
    return template.replace(/{(\w+)}/g, (match, key) => {
      return variables[key] || "";
    });
  }

  getTeam() {
    const agentConfigs = require("./agents").default;
    const teamAgents = agentConfigs.filter(
      (agent) => agent.name.toLowerCase() !== "orchestrator"
    );
    const teamNames = teamAgents.map((agent) => agent.name).join(", ");
    return teamNames;
  }

  getTeamDescription() {
    const agentConfigs = require("./agents").default;
    const teamDescriptions = agentConfigs
      .filter((agent) => agent.name.toLowerCase() !== "orchestrator")
      .map((agent) => `${agent.name}: ${agent.description || "No description"}`)
      .join("\n");
    return teamDescriptions;
  }

  getTeamNames() {
    const agentConfigs = require("./agents").default;
    const teamNames = agentConfigs
      .filter((agent) => agent.name.toLowerCase() !== "orchestrator")
      .map((agent) => agent.name)
      .join(", ");
    return teamNames;
  }

  getAgentByName(name) {
    const agentConfigs = require("./agents").default;
    const agentConfig = agentConfigs.find(
      (agent) => agent.name.toLowerCase() === name.toLowerCase()
    );
    if (!agentConfig) return null;
    const agentClass = require(agentConfig.path).default;
    return agentClass(agentConfig);
  }
}

export default Orchestrator;
