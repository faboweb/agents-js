// base_agent.js
import OpenAI from "openai";
// import { HfInference } from "@huggingface/inference";

class BaseAgent {
  constructor(agentConfig) {
    this.name = agentConfig.name;
    this.provider = agentConfig.provider;
    this.model = agentConfig.model;
    this.apiKey = agentConfig.apiKey;
    this.endpoint = agentConfig.endpoint;
  }

  async getResponse(messages, json_output = false) {
    if (typeof messages === "string") {
      messages = [
        {
          role: "assistant",
          content: messages,
        },
      ];
    }
    if (json_output) {
      messages = [
        {
          role: "system",
          content:
            "You are an AI agent interfacing with machines. Please output an answer in pure JSON format.",
        },
        ...messages,
      ];
    }
    if (this.provider === "openai") {
      return await this.getOpenAIResponse(messages, json_output);
    } else if (this.provider === "huggingface") {
      return await this.getHuggingFaceResponse(messages, json_output);
    } else {
      throw new Error("Unsupported provider.");
    }
  }

  async getOpenAIResponse(messages, json_output) {
    const configuration = {
      apiKey: this.apiKey,
      baseUrl: this.endpoint || undefined,
    };
    const openai = new OpenAI(configuration);

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 1024,
        response_format: json_output ? { type: "json_object" } : undefined,
      });
      const aiMessage = response.choices[0].message.content;
      return aiMessage;
    } catch (error) {
      console.error(`Error from OpenAI (${this.name}):`, error.message);
      return "An error occurred while processing your message.";
    }
  }

  async getHuggingFaceResponse(messages) {
    if (!this.endpoint) {
      throw new Error("Hugging Face endpoint not found.");
    }
    try {
      const data = {
        model: "tgi",
        messages: messages,
        max_tokens: 1024,
        stream: false, // TODO handle stream
      };
      const response = await fetch(this.endpoint, {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + this.apiKey,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(data),
      });
      // handle error in response
      if (!response.ok) {
        if (response.status === 503) {
          // sleep for 30s
          await new Promise((resolve) => setTimeout(resolve, 30000));
          return this.getHuggingFaceResponse(messages);
        }

        throw new Error(
          `HTTP error! status: ${response.status} ${response.statusText}`
        );
      }
      const result = await response.json();
      return result.choices[0].message.content;
    } catch (error) {
      console.error(`Error from Hugging Face (${this.name}):`, error.message);
      return "An error occurred while processing your message.";
    }
  }

  createMessagesFromLedger(ledger) {
    return ledger.conversationHistory;
  }
}

export default BaseAgent;
