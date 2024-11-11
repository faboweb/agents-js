// index.js
import inquirer from "inquirer";
import agentConfigs from "./src/agents/agents";
import Ledger from "./src/ledger";
import Orchestrator from "./src/agents/orchestrator";

async function main() {
  console.log("Welcome to the AI Agent CLI Chat!");

  // Instantiate the orchestrator directly
  const orchestratorConfig = agentConfigs.find(
    (agent) => agent.name.toLowerCase() === "orchestrator"
  );

  if (!orchestratorConfig) {
    console.error("Orchestrator config not found.");
    return;
  }

  const agent = new Orchestrator(orchestratorConfig);

  console.log(
    `\nYou are now chatting with ${agent.name}.\nType 'exit' to quit.\n`
  );

  const ledger = new Ledger();

  while (true) {
    const { userInput } = await inquirer.prompt([
      {
        type: "input",
        name: "userInput",
        message: "You:",
        default: "Wo arbeitet Fabian Weber?",
      },
    ]);

    if (userInput.toLowerCase() === "exit") {
      break;
    }

    ledger.addMessage("user", userInput);

    const aiResponse = await agent.orchestrate(ledger, userInput);

    console.log(`${agent.name}: ${aiResponse}\n`);
  }

  console.log("Chat ended.");
}

main();
