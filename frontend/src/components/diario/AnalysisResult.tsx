import AnalysisItem from './AnalysisItem';

interface Props {
  data: { summary?: string; items?: Array<{ title: string; type: string; description: string }>; alerts?: string[]; keywords?: string[] };
}

export default function AnalysisResult({ data }: Props) {
  return (
    <div className="space-y-4">
      {data.summary && (
        <div className="bg-green/5 border border-green/20 rounded-lg p-4">
          <h3 className="text-sm font-bold text-green mb-1">Resumo</h3>
          <p className="text-sm text-ink2 leading-relaxed">{data.summary}</p>
        </div>
      )}
      {data.alerts && data.alerts.length > 0 && (
        <div className="bg-red/5 border border-red/20 rounded-lg p-4">
          <h3 className="text-sm font-bold text-red mb-2">⚠️ Alertas</h3>
          <ul className="space-y-1">{data.alerts.map((a, i) => <li key={i} className="text-sm text-ink2">• {a}</li>)}</ul>
        </div>
      )}
      {data.items && data.items.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-ink mb-3">Itens ({data.items.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{data.items.map((item, i) => <AnalysisItem key={i} item={item} />)}</div>
        </div>
      )}
      {data.keywords && data.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">{data.keywords.map((kw, i) => <span key={i} className="bg-blue/10 text-blue text-[10px] font-medium px-2 py-0.5 rounded-full">{kw}</span>)}</div>
      )}
    </div>
  );
}
