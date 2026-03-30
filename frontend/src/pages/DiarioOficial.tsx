import DiarioAnalyzer from '../components/diario/DiarioAnalyzer';
import PageTitle from '../components/shared/PageTitle';

export default function DiarioOficial() {
  return (
    <div>
      <PageTitle title="Diário Oficial + IA" subtitle="Analise publicações do Diário Oficial do Tocantins com inteligência artificial" />
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { emoji: '📋', title: 'Cole o texto', desc: 'Copie o conteúdo do D.O.' },
          { emoji: '🤖', title: 'IA analisa', desc: 'Categoriza cada publicação' },
          { emoji: '🔔', title: 'Alertas', desc: 'Itens que merecem atenção' },
        ].map(c => (
          <div key={c.title} className="bg-white border border-border rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">{c.emoji}</div>
            <h3 className="text-xs font-bold text-ink">{c.title}</h3>
            <p className="text-[11px] text-muted mt-0.5">{c.desc}</p>
          </div>
        ))}
      </div>
      <DiarioAnalyzer />
    </div>
  );
}
