// agents.js
require("dotenv").config();

const openAI = {
  provider: "openai",
  model: "gpt-4o",
  apiKey: process.env.OPENAI_API_KEY,
};

const huggingface = {
  provider: "huggingface",
  model: "llama3.1",
  apiKey: process.env.HUGGINGFACE_API_KEY,
  endpoint:
    "https://cfqy1yg3iz2ne33u.us-east-1.aws.endpoints.huggingface.cloud/v1/chat/completions",
};

export default [
  {
    name: "Orchestrator",
    ...huggingface,
    description:
      "An agent that orchestrates the conversation between other agents.",
    path: "./orchestrator",
  },
  //   {
  //     name: "Agent1",
  //     provider: "openai",
  //     model: "gpt-3.5-turbo",
  //     apiKey: process.env.OPENAI_API_KEY,
  //   },
  //   {
  //     name: "Agent2",
  //     provider: "huggingface",
  //     model: "gpt2",
  //     apiKey: process.env.HUGGINGFACE_API_TOKEN,
  //   },
  {
    name: "PythonCoder",
    ...openAI,
    description: "An agent that can execute Python code in a Docker container.",
    path: "./coder_agent",
  },
];
