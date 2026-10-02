import React, { useState } from 'react';
import { IPSCMatch, getStoredMatches, getMatchStatusMeta, MatchPodiumEntry } from '../../lib/ipscMatches';
import { getWazeNavigationUrl } from '../../lib/navigation';
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Target,
  Shield,
  Layers,
  Sparkles,
  Award,
  Navigation,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
  Radio
} from 'lucide-react';

interface IpscMatchesHubProps {
  compact?: boolean;
  onSelectMatch?: (match: IPSCMatch) => void;
}

export const IpscMatchesHub: React.FC<IpscMatchesHubProps> = ({ compact = false }) => {
  const [matches] = useState<IPSCMatch[]>(getStoredMatches());
  const [filter, setFilter] = useState<'all' | 'open' | 'upcoming' | 'completed'>('all');
  const [expandedPodiumId, setExpandedPodiumId] = useState<string | null>(null);

  const filteredMatches = matches.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'open') return m.registrationStatus === 'open';
    if (filter === 'upcoming') return m.registrationStatus === 'opening_soon' || m.registrationStatus === 'open';
    if (filter === 'completed') return m.registrationStatus === 'completed';
    return true;
  });

  const togglePodium = (matchId: string) => {
    setExpandedPodiumId(prev => (prev === matchId ? null : matchId));
  };

  return (
    <div className="space-y-5 text-right">
      {/* Header & Description */}
      {!compact && (
        <div className="bg-gradient-to-r from-[#252C2A] to-[#1B201F] p-6 rounded-3xl text-white border border-[#DFCEB0]/30 shadow-lg relative overflow-hidden">
          <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-[#A67C37]/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                  <Radio size={12} className="animate-pulse text-amber-400" />
                  <span>IPSC ISRAEL MATCH RADAR</span>
                </span>
                <span className="text-xs text-[#DFCEB0]">סנכרון End of Scoring</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">לוח תחרויות ודירוג ירי מעשי בישראל</h2>
              <p className="text-xs sm:text-sm text-[#DFCEB0]/90 max-w-xl">
                מעקב שוטף אחרי תחרויות הליגה, הרשמה מקוונת למקצים וסקוואדים, ופרסום תוצאות ופודיום של יורי נץ המדבר.
              </p>
            </div>

            <a
              href="https://www.endofscoring.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-2xl bg-[#A67C37] hover:bg-[#8C6527] text-white font-bold text-xs flex items-center gap-2 transition shadow-md shrink-0"
            >
              <span>כניסה לפורטל End of Scoring</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-[#FAF8F5] rounded-2xl border border-[#DFCEB0] text-xs font-bold shrink-0 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl transition-all ${
            filter === 'all'
              ? 'bg-[#A67C37] text-white shadow-sm'
              : 'text-slate-700 hover:bg-[#F4EFE6]'
          }`}
        >
          כל התחרויות ({matches.length})
        </button>
        <button
          onClick={() => setFilter('open')}
          className={`px-4 py-2 rounded-xl transition-all ${
            filter === 'open'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-[#F4EFE6]'
          }`}
        >
          הרשמה פתוחה ({matches.filter(m => m.registrationStatus === 'open').length})
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-xl transition-all ${
            filter === 'upcoming'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-[#F4EFE6]'
          }`}
        >
          קרובות ({matches.filter(m => m.registrationStatus === 'open' || m.registrationStatus === 'opening_soon').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-xl transition-all ${
            filter === 'completed'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-700 hover:bg-[#F4EFE6]'
          }`}
        >
          תוצאות ופודיום ({matches.filter(m => m.registrationStatus === 'completed').length})
        </button>
      </div>

      {/* Match Cards List */}
      <div className="space-y-4">
        {filteredMatches.map(match => {
          const statusMeta = getMatchStatusMeta(match.registrationStatus, match.registrationOpensDate);
          const hasPodium = match.podium && match.podium.length > 0;
          const isPodiumExpanded = expandedPodiumId === match.id;

          return (
            <div
              key={match.id}
              className="bg-white rounded-3xl border border-[#DFCEB0] shadow-xs hover:border-[#A67C37] transition-all overflow-hidden"
            >
              {/* Card Header & Status */}
              <div className="p-5 sm:p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE6D5] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-[#252C2A] text-amber-400">
                      {match.level}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {match.organizer}
                    </span>
                  </div>

                  <span className={`px-3 py-1 rounded-xl text-xs ${statusMeta.badgeClass}`}>
                    {statusMeta.label}
                  </span>
                </div>

                {/* Match Title & Meta Info */}
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                    {match.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {match.description}
                  </p>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
                  <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#DFCEB0] flex items-center gap-2">
                    <Calendar size={16} className="text-[#A67C37] shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500">תאריך</div>
                      <div className="font-bold text-slate-800">{new Date(match.date).toLocaleDateString('he-IL')}</div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#DFCEB0] flex items-center gap-2">
                    <Clock size={16} className="text-[#A67C37] shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500">שעות מקצה</div>
                      <div className="font-bold text-slate-800">{match.time || '08:00'}</div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#DFCEB0] flex items-center gap-2">
                    <Layers size={16} className="text-[#A67C37] shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500">תרגילים (Stages)</div>
                      <div className="font-bold text-slate-800">{match.stagesCount} תרגילים</div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#DFCEB0] flex items-center gap-2">
                    <Target size={16} className="text-[#A67C37] shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500">מינימום כדורים</div>
                      <div className="font-bold text-slate-800">{match.minRounds} כדורים</div>
                    </div>
                  </div>
                </div>

                {/* Range Location & Navigation */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#FAF8F5] rounded-2xl border border-[#DFCEB0] text-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold">
                    <MapPin size={15} className="text-[#A67C37]" />
                    <span>{match.location}</span>
                  </div>

                  <a
                    href={match.locationMapUrl || getWazeNavigationUrl(match.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-[#DFCEB0] font-bold flex items-center gap-1.5 transition"
                  >
                    <Navigation size={13} className="text-sky-600" />
                    <span>ניווט Waze למטווח</span>
                  </a>
                </div>

                {/* Club Highlights (if any) */}
                {match.clubHighlights && match.clubHighlights.length > 0 && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5 text-xs">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-600" />
                      <span>דגשי מועדון נץ המדבר:</span>
                    </div>
                    <ul className="space-y-1 text-amber-800 pr-4 list-disc">
                      {match.clubHighlights.map((hl, i) => (
                        <li key={i}>{hl}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#EFE6D5]">
                  <div className="flex items-center gap-2">
                    {hasPodium && (
                      <button
                        onClick={() => togglePodium(match.id)}
                        className="px-4 py-2 rounded-xl bg-[#252C2A] hover:bg-[#343d3a] text-amber-400 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                      >
                        <Trophy size={14} />
                        <span>{isPodiumExpanded ? 'הסתר פודיום' : 'צפה בפודיום ובתוצאות 🥇'}</span>
                        {isPodiumExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {statusMeta.canRegister ? (
                      <a
                        href={match.matchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md"
                      >
                        <span>הרשמה ומקצים ב-End of Scoring</span>
                        <ExternalLink size={14} />
                      </a>
                    ) : match.resultsUrl ? (
                      <a
                        href={match.resultsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFE6] text-slate-800 border border-[#DFCEB0] font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <span>דוח תוצאות רשמי ב-EOS</span>
                        <ExternalLink size={13} />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Interactive Podium Dropdown Section */}
              {hasPodium && isPodiumExpanded && (
                <div className="p-5 sm:p-6 bg-[#FAF8F5] border-t border-[#DFCEB0] space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Trophy size={18} className="text-[#A67C37]" />
                    <h4 className="font-black text-sm text-slate-900">
                      פודיום מנצחים רשמי — {match.title}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {match.podium!.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white rounded-2xl border border-[#DFCEB0] shadow-xs space-y-3"
                      >
                        <div className="text-xs font-black text-slate-900 border-b border-[#EFE6D5] pb-2 flex items-center justify-between">
                          <span className="text-[#A67C37]">{p.division}</span>
                          <span className="text-[10px] text-slate-400 font-mono">DIV</span>
                        </div>

                        {/* 1st Place */}
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🥇</span>
                            <div>
                              <strong className="text-xs text-amber-950 block">{p.first.name}</strong>
                              <span className="text-[10px] text-amber-800">{p.first.club}</span>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-black text-amber-900">
                            {p.first.percentage.toFixed(1)}%
                          </span>
                        </div>

                        {/* 2nd Place */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🥈</span>
                            <div>
                              <strong className="text-xs text-slate-900 block">{p.second.name}</strong>
                              <span className="text-[10px] text-slate-600">{p.second.club}</span>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-700">
                            {p.second.percentage.toFixed(1)}%
                          </span>
                        </div>

                        {/* 3rd Place */}
                        <div className="p-2.5 rounded-xl bg-amber-900/5 border border-amber-900/10 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🥉</span>
                            <div>
                              <strong className="text-xs text-amber-950 block">{p.third.name}</strong>
                              <span className="text-[10px] text-amber-900/80">{p.third.club}</span>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-amber-950">
                            {p.third.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
