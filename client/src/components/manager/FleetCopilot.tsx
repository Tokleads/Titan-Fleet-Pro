import { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Loader2, ChevronDown, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const EXAMPLE_QUESTIONS = [
  'Give me a fleet status overview',
  'Who is near Sheffield right now?',
  'Show me all open defects',
  'Which vehicles have MOT expiring soon?',
  'What are the daily walkaround check requirements?',
  'How many hours can a driver work before a break?',
];

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center mt-1">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export function FleetCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi, I'm Fleet Copilot. I have live access to your fleet data and deep knowledge of UK transport regulations.\n\nAsk me anything — who drove a vehicle, where drivers are now, open defects, MOT status, driver hours rules, or DVSA compliance questions.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setShowExamples(false);
    const userMessage: Message = { role: 'user', content: trimmed, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: trimmed, history }),
      });

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.ok ? data.response : (data.error || 'Something went wrong. Please try again.'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleExampleClick = (question: string) => {
    sendMessage(question);
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Hi, I'm Fleet Copilot. I have live access to your fleet data and deep knowledge of UK transport regulations.\n\nAsk me anything — who drove a vehicle, where drivers are now, open defects, MOT status, driver hours rules, or DVSA compliance questions.",
      timestamp: new Date(),
    }]);
    setShowExamples(true);
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          data-testid="copilot-open-button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-blue-900/50 transition-all duration-200 hover:scale-105 group"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold text-sm">Fleet Copilot</span>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          data-testid="copilot-panel"
          className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-3rem)] flex flex-col bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Fleet Copilot</p>
                <p className="text-xs text-green-400">Live fleet data · DVSA knowledge</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="text-gray-400 hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-xs"
                title="Clear chat"
              >
                Clear
              </button>
              <button
                data-testid="copilot-close-button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    <span className="text-gray-400 text-sm">Checking your fleet data...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Example questions */}
            {showExamples && messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Try asking:</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {EXAMPLE_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      data-testid={`copilot-example-${i}`}
                      onClick={() => handleExampleClick(q)}
                      className="text-left text-sm text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 px-3 py-2 rounded-xl transition-all duration-150"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-700 p-3 bg-gray-900 flex-shrink-0">
            <div className="flex items-end gap-2 bg-gray-800 rounded-xl border border-gray-700 focus-within:border-blue-500 transition-colors px-3 py-2">
              <textarea
                ref={inputRef}
                data-testid="copilot-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Ask anything about your fleet...'
                rows={1}
                disabled={isLoading}
                className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 resize-none outline-none max-h-24 disabled:opacity-50"
                style={{ minHeight: '24px' }}
              />
              <button
                data-testid="copilot-send-button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 w-8 h-8 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors mb-0.5"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1.5 text-center">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
}
