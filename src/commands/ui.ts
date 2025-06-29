import { buildCommand } from '@stricli/core'
import blessed from 'blessed'

export async function startTUI(): Promise<void> {
  // Create a screen object.
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Chatbot TUI',
  })

  // Create a box perfectly centered horizontally and vertically.
  const box = blessed.box({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '50%',
    content: 'TUI is running! Press "q" or "Ctrl+C" to quit.',
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      fg: 'white',
      bg: 'magenta',
      border: {
        fg: '#f0f0f0',
      },
    },
  })

  // Append our box to the screen.
  screen.append(box)

  // If box is focused, handle `enter`/`return` and `escape` keys.
  // box.key(['enter', 'escape'], function (ch, key) {
  //   // Handled by the 'q' and 'C-c' bindings below
  // })

  // Quit on 'q' or Control-C.
  // screen.key(["q", "C-c"], function (ch, key) {
  //   return process.exit(0);
  // });

  // Focus our element.
  box.focus()

  // Render the screen.
  screen.render()
}

export const uiCommand = buildCommand({
  docs: {
    brief: 'Starts the interactive TUI mode',
  },
  parameters: {
    positional: {
      kind: 'tuple',
      parameters: [],
    },
  },
  loader: async () => startTUI,
})
