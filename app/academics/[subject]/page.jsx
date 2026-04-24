import Link from 'next/link';
import { ArrowLeft, Layers } from 'lucide-react';

export default async function SubjectPage({ params }) {
  const { subject } = await params;
  
  const units = [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto flex flex-col page-transition-enter">
      <header className="mb-12 mt-4 text-center md:text-left">
        <Link href="/academics" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6 group bg-white/50 px-3 py-1.5 rounded-full border border-slate-200">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Academics
        </Link>
        <h1 className="text-4xl font-light tracking-tight mb-2 uppercase text-slate-800">{subject} Units</h1>
        <p className="text-slate-500 text-lg">Select a unit to enter its dedicated discussion room.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit, idx) => (
          <Link href={`/academics/${subject}/Unit${unit}`} key={unit} className="group outline-none" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="p-6 rounded-3xl glass-panel bg-white/90 ring-1 ring-slate-200 hover:ring-blue-300 hover:bg-blue-50/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 flex items-center justify-between">
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-white rounded-xl text-blue-500 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-medium text-slate-800">Unit {unit}</h2>
              </div>
              <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300 relative z-10">
                →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
