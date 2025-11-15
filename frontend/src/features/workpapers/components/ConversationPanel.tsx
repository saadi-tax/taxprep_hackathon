import { useState } from "react";

const seedMessages = [
  {
    author: "Agent",
    content: "1099-INT from Chase mapped to Schedule B, line 1.",
    timestamp: "11:02 AM",
  },
  {
    author: "Reviewer",
    content: "Confirm whether W-2 withholding matches Box 2 totals?",
    timestamp: "11:05 AM",
  },
];

export const ConversationPanel = () => {
  const [messages] = useState(seedMessages);

  return (
    <div className="flex h-full flex-col">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Conversation</h2>
        <span className="text-xs uppercase text-slate-400">Alpha</span>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-3">
        {messages.map((message) => (
          <article
            key={message.timestamp + message.author}
            className="rounded-lg bg-white p-3 shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-primary">{message.author}</span>
              <span>{message.timestamp}</span>
            </div>
            <p className="mt-1 text-sm text-slate-700">{message.content}</p>
          </article>
        ))}
      </div>
      <textarea
        className="mt-3 rounded-lg border border-slate-200 p-3 text-sm focus:border-primary focus:outline-none"
        placeholder="Ask the agent to explain a return line item..."
        rows={3}
      />
    </div>
  );
};

