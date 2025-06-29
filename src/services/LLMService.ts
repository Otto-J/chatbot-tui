import { EventEmitter } from "events";
import axios from "axios";
import type { Message } from "../managers/ChatManager";
import type { ConfigManager } from "../managers/ConfigManager";

export class LLMService extends EventEmitter {
  private configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    super();
    this.configManager = configManager;
  }

  async getCompletion(messages: Message[]) {
    this.emit("start");

    const apiKey = this.configManager.get("apiKey");
    const apiEndpoint = this.configManager.get("apiEndpoint");
    const model = this.configManager.get("defaultModel");

    if (!apiKey) {
      this.emit(
        "error",
        "API key is not set. Please configure it in the settings."
      );
      this.emit("end", null); // End the stream
      return;
    }

    try {
      debugger;
      const response = await axios.post(
        // `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`,
        `${apiEndpoint}/chat/completions`,
        {
          model: model,
          messages: messages,
          stream: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          responseType: "stream",
        }
      );

      let fullResponse = "";
      const stream = response.data;

      stream.on("data", (chunk: Buffer) => {
        const lines = chunk.toString().split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.substring(6);
            if (data.trim() === "[DONE]") {
              return;
            }
            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content || "";
              if (content) {
                fullResponse += content;
                this.emit("data", content);
              }
            } catch (error) {
              // Ignore parsing errors for incomplete JSON chunks
            }
          }
        }
      });

      stream.on("end", () => {
        this.emit("end", fullResponse);
      });

      stream.on("error", (err: Error) => {
        this.emit("error", `API stream error: ${err.message}`);
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        let message = `API request failed with status ${status}.`;
        if (status === 401) {
          message = "Authentication error (401). Please check your API key.";
        } else if (status === 404) {
          message =
            "API endpoint not found (404). Please check your API endpoint configuration.";
        }
        this.emit("error", message);
      } else {
        this.emit(
          "error",
          `An unknown error occurred: ${(error as Error).message}`
        );
      }
      this.emit("end", null);
    }
  }
}
