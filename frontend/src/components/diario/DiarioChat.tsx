import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { streamChat } from '../../services/diario';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/** Renderiza texto com quebras de linha e listas numeradas */
function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={i} />;
        // Lista numerada: "1. texto" ou "1) texto"
        const listMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
        if (listMatch) {
          return (
            <div key={i} className="flex gap-1.5 mt-0.5">
              <span className="text-muted shrink-0">{listMatch[1]}.</span>
              <span>{listMatch[2]}</span>
            </div>
          );
        }
        return <p key={i} className={i > 0 ? 'mt-1' : ''}>{trimmed}</p>;
      })}
    </>
  );
}

export default function DiarioChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || streaming) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setStreaming(true);

    let response = '';
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      for await (const chunk of streamChat(q)) {
        if (chunk.done) break;
        if (chunk.error) {
          response = `Erro: ${chunk.error}`;
          setMessages(prev => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: 'assistant', content: response };
            return copy;
          });
          break;
        }
        if (chunk.text) {
          response += chunk.text;
          const current = response;
          setMessages(prev => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: 'assistant', content: current };
            return copy;
          });
        }
      }
    } catch (err: any) {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: `Erro: ${err.message}` };
        return copy;
      });
    }
    setStreaming(false);
  };

  const suggestions = [
    'Quem foi nomeado recentemente?',
    'Houve reajuste salarial?',
    'Quais licitações publicadas?',
    'Resumo da última edição',
  ];

  return (
    <>
      {/* Botão flutuante com label */}
      <AnimatePresence>
        {!open && (
          <motion.button
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-gradient-to-r from-green to-green-dark text-white pl-4 pr-3 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Chat com IA sobre o Diário Oficial"
          >
            <span className="text-xs font-medium whitespace-nowrap">Pergunte sobre os diários</span>
            <span className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
                <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
              </svg>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Botão fechar quando aberto */}
      {open && (
        <motion.button
          onClick={() => setOpen(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-5 right-5 z-50 w-11 h-11 bg-gray-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
          aria-label="Fechar chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </motion.button>
      )}

      {/* Painel do chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-5 z-50 w-[340px] max-w-[calc(100vw-2rem)] bg-white border border-border rounded-xl shadow-modal flex flex-col overflow-hidden"
            style={{ height: '400px' }}
          >
            {/* Header compacto */}
            <div className="bg-gradient-to-r from-green to-green-dark px-3 py-2.5 flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-white">Assistente do Diário Oficial</h3>
                <p className="text-[9px] text-white/60">IA · Baseado nos diários analisados</p>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-[9px] text-white/50 hover:text-white/80 transition-colors px-1.5 py-0.5 rounded"
                  title="Limpar conversa"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2.5">
              {messages.length === 0 && (
                <div className="py-4 px-1">
                  <p className="text-[11px] text-muted text-center mb-3">Pergunte sobre nomeações, licitações, decretos ou qualquer publicação.</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {suggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); inputRef.current?.focus(); }}
                        className="text-left text-[11px] bg-surface border border-border rounded-lg px-2.5 py-2 hover:bg-green/5 hover:border-green/20 transition-colors text-ink2 leading-snug"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-green text-white rounded-br-sm'
                      : 'bg-surface text-ink border border-border rounded-bl-sm'
                  }`}>
                    {msg.content ? (
                      <FormattedText text={msg.content} />
                    ) : (streaming && i === messages.length - 1 ? (
                      <span className="flex items-center gap-1.5 text-muted text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                        Consultando diários...
                      </span>
                    ) : null)}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border px-2.5 py-2 shrink-0">
              <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Sua pergunta..."
                  disabled={streaming}
                  className="flex-1 text-xs bg-surface border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-green/20 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || streaming}
                  className="bg-green text-white w-8 h-8 rounded-lg text-xs font-medium hover:bg-green-dark transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
