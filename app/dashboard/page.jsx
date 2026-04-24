import Link from 'next/link';
import { BookOpen, Coffee, Moon } from 'lucide-react';
import InstallPrompt from '@/components/InstallPrompt';

export default function Dashboard() {
  const cards = [
    {
      title: "Academics",
      description: "Structured study spaces and unit discussions.",
      icon: <BookOpen className="w-8 h-8 text-blue-500" />,
      href: "/academics",
      bgGradient: "from-blue-500/10 to-blue-500/5",
      hoverRing: "hover:ring-blue-300",
      titleColor: "text-slate-800",
      descColor: "text-slate-500"
    },
    {
      title: "Casual",
      description: "General chat for everyday conversations.",
      icon: <Coffee className="w-8 h-8 text-amber-500" />,
      href: "/casual",
      bgGradient: "from-amber-500/10 to-orange-500/5",
      hoverRing: "hover:ring-amber-300",
      titleColor: "text-slate-800",
      descColor: "text-slate-500"
    },
    {
      title: "Naughty",
      description: "A private, cozy space.",
      icon: <Moon className="w-8 h-8 text-rose-400" />,
      href: "/naughty",
      bgGradient: "from-slate-800 to-slate-900",
      hoverRing: "hover:ring-rose-500/50",
      titleColor: "text-slate-100",
      descColor: "text-slate-400"
    }
  ];

  return (
    <div className="min-h-screen p-6 md:p-12 w-full flex flex-col relative animated-gradient-bg">
      <div className="max-w-6xl w-full mx-auto flex flex-col flex-1 relative z-10 page-transition-enter">
        <header className="mb-16 mt-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-blue-100 mb-6 backdrop-blur-md shadow-sm">
            <span className="animate-pulse">💫</span>
            <span className="text-sm font-medium text-blue-600">Our Space</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-4 text-slate-800 drop-shadow-sm">Welcome Back</h1>
          <p className="text-slate-500 text-lg md:text-xl font-light max-w-2xl">Choose a space to continue the conversation.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 content-start">
          {cards.map((card, idx) => (
            <Link href={card.href} key={card.title} className="group outline-none" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className={`h-full p-8 rounded-[2rem] glass-panel bg-gradient-to-br ${card.bgGradient} ring-1 ring-slate-200 ${card.hoverRing} transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col relative overflow-hidden`}>
                
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-[2rem]"></div>
                
                <div className="mb-6 p-4 bg-white rounded-2xl w-max ring-1 ring-slate-100 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-sm backdrop-blur-md relative z-10">
                {card.icon}
              </div>
              <h2 className={`text-2xl font-medium mb-3 ${card.titleColor} relative z-10`}>{card.title}</h2>
              <p className={`${card.descColor} leading-relaxed flex-1 relative z-10`}>{card.description}</p>
              
              <div className="mt-8 flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300 relative z-10">
                Enter Space →
              </div>
            </div>
          </Link>
        ))}
        </div>
      </div>
      <InstallPrompt />
    </div>
  );
}
