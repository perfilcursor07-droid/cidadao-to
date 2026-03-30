import { useState } from 'react';
import { streamAnalysis } from '../../services/diario';
import AnalysisResult from './AnalysisResult';

export default function DiarioAnalyzer() {
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [rawResponse, setRawResponse] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!text.trim() || streaming) return;
    setStreaming(true); setRawResponse(''); setResult(null);
    let full = '';
    try {
      for await (const chunk of streamAnalysis(text)) {
        if (chunk.done) { try { setResult(JSON.parse(full)); } catch { setResult({ summary: full, items: [], alerts: [], keywords: [] }); } break; }
        if (chunk.error) { setResult({ summary: `Erro: ${chunk.error}`, items: [], alerts: [], keywords: [] }); break; }
        if (chunk.text) { full += chunk.text; setRawResponse(full); }
      }
    } catch (err: any) { setResult({ summary: `Erro: ${err.message}`, items: [], alerts: [], keywords: [] }); }
    setStreaming(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border rounded-lg p-5">
        <label className="text-sm font-medium text-ink mb-2 block">Texto do Diário Oficial</label>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
          className="w-full border border-border rounded-lg p-3 bg-surface text-ink text-sm resize-y focus:outline-none focus:ring-2 focus:ring-green/20"
          placeholder="Cole aqui o conteúdo do Diário Oficial do Tocantins..." />
        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] text-muted">{text.length > 0 ? `${text.length.toLocaleString()} caracteres` : ''}</span>
          <button onClick={handleAnalyze} disabled={!text.trim() || streaming}
            className="px-5 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark transition-colors disabled:opacity-50">
            {streaming ? 'Analisando...' : '🤖 Analisar com IA'}
          </button>
        </div>
      </div>
      {streaming && rawResponse && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-green animate-pulse" /><span className="text-[11px] text-muted">Recebendo análise...</span></div>
          <pre className="text-xs text-ink2 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">{rawResponse}</pre>
        </div>
      )}
      {result && <AnalysisResult data={result} />}
    </div>
  );
}
