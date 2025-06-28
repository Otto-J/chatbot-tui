import { EventEmitter } from 'events';

// 模拟的LLM服务
export class LLMService extends EventEmitter {
  async getCompletion(prompt: string) {
    // 立即发出一个 "start" 事件
    this.emit('start');

    const thinkingMessage = 'AI is thinking...';
    const responseMessage = `You said: "${prompt}". This is a simulated response.`;
    const fullMessage = thinkingMessage + responseMessage;
    let index = 0;

    const interval = setInterval(() => {
      if (index < fullMessage.length) {
        // 发出 "data" 事件，传递单个字符
        this.emit('data', fullMessage[index]);
        index++;
      } else {
        // 当消息结束时，清除定时器并发出 "end" 事件
        clearInterval(interval);
        this.emit('end');
      }
    }, 50); // 每50毫秒发送一个字符，模拟流式效果
  }
}
