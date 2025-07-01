# Gemini Project Conventions

## Technology Stack

*   **Runtime:** Node.js
*   **Language:** TypeScript
*   **Package Manager:** pnpm

## Core Functionality

*   Build a command-line tool for interacting with large language models.
*   Support chat history.
*   Support multi-turn dialogue.

## Commands

*   `context`: Set the context.
*   `temperature`: Set the temperature.
*   `model`: Set the model.
*   `usage`: Show usage instructions.
*   `version`: Show the version number.
*   `help`: Show help information.
*   `clear`: Clear the screen.
*   `exit`: Exit the program.
*   `save`: Save the conversation.
*   `load`: Load a conversation.
*   `history`: Show history.
*   `config show`: Show configuration.
*   `config set`: Set a configuration value.
*   `config reset`: Reset the configuration.

## Development Workflow

1.  **Unit Tests:** All new features or bug fixes should be accompanied by unit tests.
2.  **Formatting:** All code must be formatted using Prettier before committing.
3.  **Commits:** Commits should follow the Conventional Commits specification (e.g., `feat:`, `fix:`, `style:`, `docs:`).