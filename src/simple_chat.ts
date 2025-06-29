import blessed from 'blessed';
import { LLMService } from './services/LLMService.js';
import { ConfigManager } from './managers/ConfigManager.js';

const configManager = new ConfigManager();
const llmService = new LLMService(configManager);

// Create a screen object with UTF-8 support
const screen = blessed.screen({
  smartCSR: true,
  fastCSR: true,
  fullUnicode: true,
  dockBorders: true,
  autoPadding: true,
  warnings: false
});

screen.title = 'Simple Chat';

// Create a display box for showing entered text
const displayBox = blessed.box({
  top: 2,
  left: 'center',
  width: '80%',
  height: '60%',
  content: 'Chat history will be displayed here...',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'blue',
    border: {
      fg: '#f0f0f0'
    }
  },
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: ' ',
    track: {
      bg: 'cyan'
    },
    style: {
      inverse: true
    }
  }
});

// Create an input box
const inputBox = blessed.textbox({
  top: '70%',
  left: 'center',
  width: '80%',
  height: 3,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: '#f0f0f0'
    },
    focus: {
      border: {
        fg: 'green'
      }
    }
  },
  inputOnFocus: true
});

// Create a label for the input box
const inputLabel = blessed.text({
  top: '65%',
  left: 'center',
  width: '80%',
  height: 1,
  content: 'Enter your message and press Enter:',
  style: {
    fg: 'yellow'
  }
});

// Append components to the screen
screen.append(displayBox);
screen.append(inputBox);
screen.append(inputLabel);

const addMessage = (prefix: string, message: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    let currentContent = displayBox.getContent();
    if (currentContent === 'Chat history will be displayed here...') {
        currentContent = '';
    }
    const newContent = currentContent + `[${timeStr}] ${prefix}: ${message}\n`;
    displayBox.setContent(newContent);
    displayBox.setScrollPerc(100);
    screen.render();
}

// Handle input submission
inputBox.on('submit', async (value) => {
  if (value.trim()) {
    addMessage('You', value);
    inputBox.clearValue();
    inputBox.focus();
    screen.render();

    try {
        llmService.getCompletion([{ role: 'user', content: value }]);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        addMessage('Error', errorMessage);
    }

    llmService.on('data', (chunk) => {
        addMessage('AI', chunk);
    });

    llmService.on('error', (error) => {
        addMessage('Error', error);
    });
  }
});

// Handle escape key to clear input
inputBox.key('escape', function() {
  inputBox.clearValue();
  screen.render();
});

// Quit on Control-C
screen.key(['C-c'], function(ch, key) {
  return process.exit(0);
});

// Focus the input box initially
inputBox.focus();

// Render the screen.
screen.render();
