interface Props {
  item: { title: string; type: string; description: string };
}

const typeColors: Record<string, string> = {
  nomeação: 'bg-blue/10 text-blue',
  licitação: 'bg-yellow-50 text-yellow-700',
  decreto: 'bg-green/10 text-green',
  portaria: 'bg-gray-100 text-ink2',
  contrato: 'bg-yellow-50 text-yellow-700',
  outro: 'bg-gray-100 text-muted',
};

export default function AnalysisItem({ item }: Props) {
  return (
    <div className="bg-white border border-border rounded-lg p-3">
      <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1.5 ${typeColors[item.type] || typeColors.outro}`}>
        {item.type}
      </span>
      <h4 className="text-sm font-bold text-ink leading-snug">{item.title}</h4>
      <p className="text-xs text-muted mt-1">{item.description}</p>
    </div>
  );
}
