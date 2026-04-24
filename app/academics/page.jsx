import Link from 'next/link';
import { ArrowLeft, BookMarked, BrainCircuit, Cloud, Lock, Bug, MessageSquareText } from 'lucide-react';

export default function AcademicsPage() {
  const subjects = [
    { id: 'ML', name: 'Machine Learning', color: 'from-emerald-500/10 to-teal-500/5', iconColor: 'text-emerald-400', icon: BrainCircuit },
    { id: 'CC', name: 'Cloud Computing', color: 'from-sky-500/10 to-blue-500/5', iconColor: 'text-sky-400', icon: Cloud },
    { id: 'CNS', name: 'Cryptography & Network Security', color: 'from-violet-500/10 to-purple-500/5', iconColor: 'text-violet-400', icon: Lock },
    { id: 'STM', name: 'Software Testing Methodologies', color: 'from-orange-500/10 to-red-500/5', iconColor: 'text-orange-400', icon: Bug },
    { id: 'NLP', name: 'Natural Language Processing', color: 'from-pink-500/10 to-rose-500/5', iconColor: 'text-pink-400', icon: MessageSquareText },
  ];

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto flex flex-col page-transition-enter">
      <header className="mb-12 mt-4 text-center md:text-left">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6 group bg-white/50 px-3 py-1.5 rounded-full border border-slate-200">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
        <h1 className="text-4xl font-light tracking-tight mb-2 text-slate-800">Academics</h1>
        <p className="text-slate-500 text-lg">Select a subject to view its units.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((sub, idx) => {
          const Icon = sub.icon;
          return (
          <Link href={`/academics/${sub.id}`} key={sub.id} className="group outline-none" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className={`p-6 rounded-3xl glass-panel bg-gradient-to-br ${sub.color} ring-1 ring-slate-200 hover:ring-blue-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 flex items-start gap-4 h-full relative overflow-hidden bg-white/90`}>
              {/* Soft glow on hover */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>

              <div className={`p-3 bg-white rounded-xl ${sub.iconColor} shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform relative z-10`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="relative z-10">
                <h2 className="text-xl font-medium mb-1 text-slate-800">{sub.id}</h2>
                <p className="text-slate-500 text-sm leading-tight">{sub.name}</p>
              </div>
            </div>
          </Link>
        )})}
      </div>
    </div>
  );
}
