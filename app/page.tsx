'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Database,
  Film,
  Smile,
  Send,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Star,
  Clock,
  User,
  BarChart3,
  Zap,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CalendarDays,
  Clapperboard,
  BookOpen,
  Search,
} from 'lucide-react';



interface AnalyticsStat {
  toolName: string;
  count: number;
  successRate: number;
  avgExecutionTime: number;
}

interface Analytics {
  toolStats: AnalyticsStat[];
  cachedMoviesCount: number;
}

interface JokeRatingState {
  [jokeId: string]: { thumbsUp: number; thumbsDown: number; voted?: 'up' | 'down' };
}



function ToolBadge({ toolName }: { toolName: string }) {
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    queryDatabase: { label: 'Database', color: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30', icon: <Database size={11} /> },
    searchMovies:  { label: 'Movies',   color: 'text-pink-300 bg-pink-500/10 border-pink-500/30',     icon: <Film size={11} /> },
    getJoke:       { label: 'Jokes',    color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30', icon: <Smile size={11} /> },
  };
  const c = config[toolName];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${c.color}`}>
      {c.icon} {c.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="flex gap-2 py-2 px-3">
      <div className="skeleton h-3 flex-1 rounded" />
      <div className="skeleton h-3 w-16 rounded" />
      <div className="skeleton h-3 w-12 rounded" />
    </div>
  );
}

function DatabaseTable({ data, query, total, executionTime }: {
  data: any[]; query?: string; total: number; executionTime: number;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-slate-400 text-xs">
        <AlertTriangle size={14} className="text-amber-400" />
        No records found matching your query.
      </div>
    );
  }

  const columns = Object.keys(data[0]).filter((k) => k !== 'createdAt' && k !== 'updatedAt' && k !== '__v');
  const RATING_COLS = ['rating', 'thumbsUp', 'thumbsDown'];

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        {query && (
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Search size={11} /> {query}
          </span>
        )}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-[10px] text-slate-500">{total} result{total !== 1 ? 's' : ''}</span>
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock size={10} /> {executionTime}ms
          </span>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[#212e4a]/60">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col.replace(/([A-Z])/g, ' $1').trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri}>
                {columns.map((col) => (
                  <td key={col} title={String(row[col] ?? '')}>
                    {RATING_COLS.includes(col) ? (
                      <span className="inline-flex items-center gap-1">
                        <Star size={10} className="text-amber-400" />
                        {row[col]}
                      </span>
                    ) : (
                      String(row[col] ?? '—')
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MovieCard({ movie }: { movie: any }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="animate-fade-in-up bg-[#0b0f19]/60 rounded-xl border border-[#212e4a] overflow-hidden hover:border-pink-500/30 transition-all group">
      <div className="flex flex-col sm:flex-row gap-0">

        <div className="sm:w-28 shrink-0 bg-[#0f1729] relative overflow-hidden">
          {movie.poster && movie.poster !== 'N/A' ? (
            <>
              {!imgLoaded && <div className="skeleton absolute inset-0" />}
              <img
                src={movie.poster}
                alt={movie.title}
                onLoad={() => setImgLoaded(true)}
                className={`w-full h-40 sm:h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
              />
            </>
          ) : (
            <div className="w-full h-40 sm:h-full flex items-center justify-center text-slate-600">
              <Clapperboard size={32} />
            </div>
          )}
          {movie.fromCache && (
            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-600/80 text-white backdrop-blur-sm">
              CACHED
            </span>
          )}
        </div>


        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-bold text-sm text-white leading-snug">{movie.title}</h4>
              {movie.rating && movie.rating !== 'N/A' && (
                <span className="shrink-0 flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  <Star size={9} fill="currentColor" /> {movie.rating}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
              {movie.year && movie.year !== 'N/A' && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <CalendarDays size={10} /> {movie.year}
                </span>
              )}
              {movie.runtime && movie.runtime !== 'N/A' && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock size={10} /> {movie.runtime}
                </span>
              )}
              {movie.genre && movie.genre !== 'N/A' && (
                <span className="text-[11px] text-pink-400">{movie.genre}</span>
              )}
            </div>

            {movie.plot && movie.plot !== 'N/A' && (
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-2">{movie.plot}</p>
            )}
          </div>

          <div className="space-y-1 mt-1">
            {movie.director && movie.director !== 'N/A' && (
              <p className="text-[11px] text-slate-400">
                <span className="text-slate-500">Director: </span>{movie.director}
              </p>
            )}
            {movie.cast && movie.cast !== 'N/A' && (
              <p className="text-[11px] text-slate-400 truncate">
                <span className="text-slate-500">Cast: </span>{movie.cast}
              </p>
            )}
            {movie.productionCompanies && movie.productionCompanies !== 'N/A' && (
              <p className="text-[11px] text-slate-400 truncate">
                <span className="text-slate-500">Studios: </span>{movie.productionCompanies}
              </p>
            )}
          </div>
        </div>
      </div>
      

      {movie.recommendations && movie.recommendations.length > 0 && (
        <div className="bg-[#151d30]/60 p-3 border-t border-[#212e4a]">
          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Similar Movies</h5>
          <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
            {movie.recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="w-16 shrink-0 group/rec cursor-pointer">
                <div className="w-16 h-24 bg-[#0f1729] rounded overflow-hidden mb-1.5 border border-[#212e4a] group-hover/rec:border-pink-500/50 transition-colors">
                  {rec.poster ? (
                    <img src={rec.poster} alt={rec.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Clapperboard size={14} />
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 leading-tight line-clamp-2 text-center group-hover/rec:text-pink-300 transition-colors">{rec.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function JokeCard({
  result,
  jokeRatings,
  onRate,
}: {
  result: any;
  jokeRatings: JokeRatingState;
  onRate: (jokeId: string, rating: 'thumbsUp' | 'thumbsDown') => void;
}) {
  const jokeId = result.jokeId;
  const ratings = jokeRatings[jokeId] || { thumbsUp: result.thumbsUp ?? 0, thumbsDown: result.thumbsDown ?? 0 };
  const voted = jokeRatings[jokeId]?.voted;

  return (
    <div className="animate-fade-in-up bg-[#0b0f19]/40 border border-[#212e4a] rounded-xl p-5 relative overflow-hidden">
      <span className="absolute top-2 right-4 text-7xl text-slate-700/15 font-serif select-none leading-none">"</span>
      {result.source === 'db' && (
        <span className="inline-block mb-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-600/40 text-slate-400 border border-slate-600/40">
          FROM CACHE
        </span>
      )}
      {result.source === 'fallback' && (
        <span className="inline-block mb-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          FALLBACK
        </span>
      )}
      <p className="text-slate-100 text-sm leading-relaxed relative z-10 font-[var(--font-geist-mono)] pr-4">
        {result.joke}
      </p>
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[#212e4a]/50 relative z-10">
        <button
          id={`thumbs-up-${jokeId}`}
          onClick={() => jokeId && onRate(jokeId, 'thumbsUp')}
          disabled={!!voted || !jokeId}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            voted === 'up'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-[#151d30] hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-300 border border-[#212e4a] disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          <ThumbsUp size={13} /> {ratings.thumbsUp}
        </button>
        <button
          id={`thumbs-down-${jokeId}`}
          onClick={() => jokeId && onRate(jokeId, 'thumbsDown')}
          disabled={!!voted || !jokeId}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            voted === 'down'
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : 'bg-[#151d30] hover:bg-red-500/10 text-slate-400 hover:text-red-300 border border-[#212e4a] disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          <ThumbsDown size={13} /> {ratings.thumbsDown}
        </button>
        <span className="ml-auto text-[10px] text-slate-500 flex items-center gap-1">
          <Smile size={11} /> Dad Joke
        </span>
      </div>
    </div>
  );
}

function AnalyticsBar({ analytics }: { analytics: Analytics | null }) {
  const TOOL_ICONS: Record<string, React.ReactNode> = {
    queryDatabase: <Database size={12} />,
    searchMovies: <Film size={12} />,
    getJoke: <Smile size={12} />,
    rateJoke: <ThumbsUp size={12} />,
  };

  if (!analytics) return null;

  return (
    <div className="animate-fade-in flex items-center gap-4 flex-wrap">
      {analytics.toolStats.map((stat) => (
        <div key={stat.toolName} className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className="text-slate-500">{TOOL_ICONS[stat.toolName]}</span>
          <span className="font-mono font-bold text-slate-300">{stat.count}</span>
          <span className="text-slate-600">calls</span>
          <span className="text-emerald-400 ml-0.5">{stat.successRate}%</span>
        </div>
      ))}
      {analytics.cachedMoviesCount > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Shield size={11} className="text-indigo-400" />
          <span className="font-mono font-bold text-slate-300">{analytics.cachedMoviesCount}</span>
          <span className="text-slate-600">cached movies</span>
        </div>
      )}
    </div>
  );
}



export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, setMessages, status } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [jokeRatings, setJokeRatings] = useState<JokeRatingState>({});
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  const isStreaming = status === 'streaming' || status === 'submitted';


  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setAnalytics(data);
      }
    } catch {
  
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (!isStreaming) fetchAnalytics();
  }, [isStreaming, fetchAnalytics]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleQuickPrompt = (promptText: string) => {
    setInput(promptText);
    setTimeout(() => {
      sendMessage({ text: promptText });
      setInput('');
    }, 100);
  };

  const handleReset = () => setMessages([]);

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedMessage('');
    try {
      const res = await fetch('/api/db/seed');
      const data = await res.json();
      if (data.success) {
        setSeedMessage(`✅ Seeded: ${data.counts.movies} movies, ${data.counts.users} users, ${data.counts.reviews} reviews`);
      } else {
        setSeedMessage(`❌ ${data.error}`);
      }
    } catch {
      setSeedMessage('❌ Seed failed — is MongoDB running?');
    }
    setIsSeeding(false);
    setTimeout(() => setSeedMessage(''), 6000);
  };

  const handleRateJoke = async (jokeId: string, rating: 'thumbsUp' | 'thumbsDown') => {

    setJokeRatings((prev) => ({
      ...prev,
      [jokeId]: {
        thumbsUp: (prev[jokeId]?.thumbsUp ?? 0) + (rating === 'thumbsUp' ? 1 : 0),
        thumbsDown: (prev[jokeId]?.thumbsDown ?? 0) + (rating === 'thumbsDown' ? 1 : 0),
        voted: rating === 'thumbsUp' ? 'up' : 'down',
      },
    }));

    try {
      await fetch('/api/jokes/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jokeId, rating }),
      });
    } catch {

    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0B0F19] text-slate-100" style={{ fontFamily: 'var(--font-geist-sans)' }}>


      <header className="border-b border-[#1E293B] bg-[#0B0F19]/90 backdrop-blur sticky top-0 z-20">

        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0b0f19]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">AI Multi-Tool Studio</h1>
              <p className="text-[10px] text-slate-500 mt-0.5">MongoDB · TMDB · Dad Jokes</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="seed-db-btn"
              onClick={handleSeed}
              disabled={isSeeding}
              title="Seed the database with sample data"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151D30] border border-[#212E4A] text-[11px] font-medium text-slate-300 hover:bg-[#1C263F] hover:text-white transition-all disabled:opacity-50"
            >
              {isSeeding ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
              Seed DB
            </button>
            <button
              id="reset-session-btn"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151D30] border border-[#212E4A] text-[11px] font-medium text-slate-300 hover:bg-[#1C263F] hover:text-white transition-all"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>
        </div>



      </header>


      {seedMessage && (
        <div className="animate-fade-in px-5 py-2 bg-[#151d30]/80 border-b border-[#212e4a] text-xs text-slate-300">
          {seedMessage}
        </div>
      )}


      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="max-w-3xl mx-auto space-y-6">


          {messages.length === 0 && (
            <div className="space-y-6 my-4 animate-fade-in-up">
              <div className="glass rounded-2xl p-5">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">Assistant</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Welcome to <span className="text-white font-semibold">AI Multi-Tool Studio</span>. I can query your MongoDB database, look up movies from TMDB, or tell you a dad joke.
                  Start by seeding the database with sample data using the button above, then ask me anything!
                </p>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                <div className="group flex flex-col gap-3 p-4 rounded-xl bg-[#151D30]/60 border border-[#212E4A] hover:border-indigo-500/40 transition-all">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 w-fit group-hover:scale-110 transition-transform">
                    <Database size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white mb-1">Database Chat</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">Natural language MongoDB queries across movies, users & reviews.</p>
                  </div>
                  <div className="space-y-1.5 mt-auto">
                    {['Show me all sci-fi movies', 'Find users older than 25', 'Movies rated above 8.5', 'Count movies by genre'].map((p) => (
                      <button
                        key={p}
                        onClick={() => handleQuickPrompt(p)}
                        className="w-full text-left flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0f19]/60 hover:bg-indigo-500/10 text-[11px] text-slate-400 hover:text-indigo-300 transition-all border border-transparent hover:border-indigo-500/20"
                      >
                        <ChevronRight size={11} className="shrink-0" /> {p}
                      </button>
                    ))}
                  </div>
                </div>


                <div className="group flex flex-col gap-3 p-4 rounded-xl bg-[#151D30]/60 border border-[#212E4A] hover:border-pink-500/40 transition-all">
                  <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 w-fit group-hover:scale-110 transition-transform">
                    <Film size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white mb-1">Movie Database</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">Live TMDB lookups with poster, cast, director & ratings. Results cached in MongoDB.</p>
                  </div>
                  <div className="space-y-1.5 mt-auto">
                    {['Search for Inception', 'Find the movie Parasite', 'Tell me about Interstellar', 'Who directed The Matrix?'].map((p) => (
                      <button
                        key={p}
                        onClick={() => handleQuickPrompt(p)}
                        className="w-full text-left flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0f19]/60 hover:bg-pink-500/10 text-[11px] text-slate-400 hover:text-pink-300 transition-all border border-transparent hover:border-pink-500/20"
                      >
                        <ChevronRight size={11} className="shrink-0" /> {p}
                      </button>
                    ))}
                  </div>
                </div>


                <div className="group flex flex-col gap-3 p-4 rounded-xl bg-[#151D30]/60 border border-[#212E4A] hover:border-emerald-500/40 transition-all">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit group-hover:scale-110 transition-transform">
                    <Smile size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white mb-1">Dad Jokes</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">Jokes from icanhazdadjoke.com, stored in MongoDB with thumbs ratings.</p>
                  </div>
                  <div className="space-y-1.5 mt-auto">
                    {['Tell me a random joke', 'Give me a programming joke', 'Tell me a cat joke', 'I need a laugh'].map((p) => (
                      <button
                        key={p}
                        onClick={() => handleQuickPrompt(p)}
                        className="w-full text-left flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0f19]/60 hover:bg-emerald-500/10 text-[11px] text-slate-400 hover:text-emerald-300 transition-all border border-transparent hover:border-emerald-500/20"
                      >
                        <ChevronRight size={11} className="shrink-0" /> {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}


          {messages.map((message: any) => {
            const isUser = message.role === 'user';

            return (
              <div key={message.id} className="animate-fade-in-up space-y-2">
                <div className={`flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase ${isUser ? 'justify-end text-slate-500' : 'text-indigo-400'}`}>
                  {!isUser && <Zap size={10} />}
                  <span>{isUser ? 'You' : 'Assistant'}</span>
                  {isUser && <User size={10} />}
                </div>

                <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`w-full max-w-2xl ${isUser ? 'flex justify-end' : ''}`}>

                    {isUser ? (
                      <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-lg shadow-indigo-950/40 max-w-lg">
                        {message.parts?.map((part: any, i: number) =>
                          part.type === 'text' ? <div key={i} className="whitespace-pre-wrap">{part.text}</div> : null
                        ) || message.content}
                      </div>
                    ) : (
                      <div className="glass rounded-2xl rounded-tl-sm p-4 text-sm text-slate-200 w-full space-y-4">


                        {message.parts && message.parts.length > 0
                          ? message.parts.map((part: any, i: number) =>
                              part.type === 'text' ? (
                                <div key={i} className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#0f1729]/60 prose-pre:border prose-pre:border-[#212e4a]/40">
                                  <ReactMarkdown>{part.text}</ReactMarkdown>
                                </div>
                              ) : null
                            )
                          : message.content && (
                              <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#0f1729]/60 prose-pre:border prose-pre:border-[#212e4a]/40">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            )}


                        {(message.toolInvocations || (message.parts || []).filter((p: any) => p.type.startsWith('tool-') && p.type !== 'tool-invocation').map((p: any) => ({
                          toolCallId: p.toolCallId,
                          toolName: p.toolName || p.type.replace('tool-', ''),
                          state: p.state === 'output-available' || p.state === 'output-error' ? 'result' : p.state,
                          result: p.output || (p.errorText ? { error: p.errorText, success: false } : undefined)
                        }))).map((toolInv: any) => {
                          const { toolName, toolCallId, state } = toolInv;

                          if (state !== 'result') {
                            return (
                              <div key={toolCallId} className="flex items-center gap-2 text-xs text-slate-400 bg-[#0f1729]/60 px-3 py-2 rounded-lg border border-[#212e4a]/40 w-fit">
                                <Loader2 size={12} className="animate-spin text-indigo-400" />
                                <span>Running </span>
                                <ToolBadge toolName={toolName} />
                                <span>tool...</span>
                              </div>
                            );
                          }

                          const result = toolInv.result;

                          return (
                            <div key={toolCallId} className="border-t border-[#212e4a]/50 pt-3 mt-1">
                              <div className="flex items-center gap-2 mb-3">
                                <ToolBadge toolName={toolName} />
                                {result.success ? (
                                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                                    <CheckCircle2 size={10} /> Success
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] text-red-400">
                                    <AlertTriangle size={10} /> Error
                                  </span>
                                )}
                                {result.executionTime !== undefined && (
                                  <span className="ml-auto text-[10px] text-slate-500 flex items-center gap-1">
                                    <Clock size={9} /> {result.executionTime}ms
                                  </span>
                                )}
                              </div>


                              {result.error && (
                                <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-lg p-3 text-xs text-red-300">
                                  <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                                  <div>
                                    <p className="font-semibold mb-0.5">Error</p>
                                    <p className="text-red-300/80">{result.error}</p>
                                  </div>
                                </div>
                              )}


                              {toolName === 'queryDatabase' && result.data && (
                                <DatabaseTable
                                  data={result.data}
                                  query={result.query}
                                  total={result.total}
                                  executionTime={result.executionTime}
                                />
                              )}


                              {toolName === 'searchMovies' && result.movies && result.movies.length > 0 && (
                                <div className="space-y-3">
                                  {result.fromCache && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 bg-indigo-500/8 border border-indigo-500/20 px-2 py-0.5 rounded">
                                      <Shield size={10} /> Served from MongoDB cache
                                    </span>
                                  )}
                                  {result.movies.map((movie: any, idx: number) => (
                                    <MovieCard key={idx} movie={movie} />
                                  ))}
                                </div>
                              )}


                              {toolName === 'getJoke' && result.joke && (
                                <JokeCard
                                  result={result}
                                  jokeRatings={jokeRatings}
                                  onRate={handleRateJoke}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}


          {isStreaming && (
            <div className="animate-fade-in flex items-center gap-2 text-xs text-slate-500 pl-1">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>AI is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>


      <div className="border-t border-[#1E293B] bg-[#0B0F19]/95 p-4 pb-5">
        <form
          id="chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim() || isStreaming) return;
            sendMessage({ text: input });
            setInput('');
          }}
          className="max-w-3xl mx-auto"
        >
          <div className="relative flex items-center gap-2">
            <input
              id="chat-input"
              ref={inputRef}
              className="w-full bg-[#151D30] border border-[#212E4A] focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 rounded-xl py-3 pl-4 pr-14 text-sm text-white placeholder-slate-500 outline-none transition-all"
              value={input}
              placeholder="Ask anything — database queries, movie search, or a joke..."
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              autoComplete="off"
            />
            <button
              id="send-btn"
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="absolute right-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-indigo-900/40"
            >
              {isStreaming ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] text-slate-600">
                <Database size={9} /> <BookOpen size={9} /> <Smile size={9} />
              </span>
              <span className="text-[10px] text-slate-600">3 tools active</span>
            </div>
            <span className="text-[10px] text-slate-600">
              Powered by GPT-4o + MongoDB
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}