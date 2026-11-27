import React from 'react';
import { TestItem, TypingCertificate, UserAccount } from '../types';
import { formatCertificateDate } from '../utils/certificateEngine';
import { ArrowLeft, ArrowRight, Award, Download, Eye, FileText, Shuffle, Timer, User } from 'lucide-react';

interface TestExamHubProps {
  testItems: TestItem[];
  onStartTest: (test: TestItem) => void;
  certificates: TypingCertificate[];
  userAccount: UserAccount | null;
  onViewCertificate: (cert: TypingCertificate) => void;
  onDownloadCertificate: (cert: TypingCertificate) => void;
  onDownloadCertificatePdf: (cert: TypingCertificate) => void;
  onOpenAccount: () => void;
  onBackHome: () => void;
}

export const TestExamHub: React.FC<TestExamHubProps> = ({
  testItems,
  onStartTest,
  certificates,
  userAccount,
  onViewCertificate,
  onDownloadCertificate,
  onDownloadCertificatePdf,
  onOpenAccount,
  onBackHome,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-2">
          <a
            href="/"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              onBackHome();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </a>
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-50 tracking-tight">Speed tests</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {testItems.length > 1 && (
            <button
              type="button"
              onClick={() => {
                const pick = testItems[Math.floor(Math.random() * testItems.length)];
                if (pick) onStartTest(pick);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-semibold text-emerald-300 transition-colors whitespace-nowrap"
            >
              <Shuffle className="w-3.5 h-3.5 shrink-0" />
              <span>Random test</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenAccount}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111113] hover:bg-zinc-900 border border-white/[0.08] hover:border-indigo-500/40 text-xs font-semibold text-slate-200 transition-colors whitespace-nowrap"
          >
            <User className="w-4 h-4 text-indigo-400 shrink-0" />
            {userAccount ? (
              <span>
                Certificates auto-issued to <strong className="text-white">{userAccount.fullName}</strong>
              </span>
            ) : (
              <span>Set Account Name for Auto-Certificates</span>
            )}
          </button>
        </div>
      </div>

      {/* Tests Grid */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testItems.map((test) => (
          <div
            key={test.id}
            onClick={() => onStartTest(test)}
            className="group bg-[#111113] hover:bg-zinc-900 border border-white/[0.08] hover:border-emerald-500/50 p-6 rounded-xl shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {test.scoring.toUpperCase()} SCORING
                </span>
                <div className="flex items-center gap-1 text-xs text-slate-400 font-mono tabular-nums">
                  <Timer className="w-3.5 h-3.5" />
                  <span>{test.durationMinutes} min</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                {test.title}
              </h3>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3 font-mono tabular-nums">
                <span className="text-xs font-semibold text-slate-300">
                  Target: <strong className="text-emerald-400">{test.passWpm} WPM</strong>
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  Accuracy: <strong className="text-emerald-400">{test.passAccuracy}%</strong>
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform whitespace-nowrap">
                <span>Start Test</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
        </div>
      </section>

      {/* Earned Certificates Gallery */}
      <section id="earned-certificates" className="space-y-4 pt-2 border-t border-white/[0.08]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Earned Certificates</h2>
          </div>

          <span className="text-xs font-mono tabular-nums font-semibold text-slate-400 whitespace-nowrap">
            {certificates.length} {certificates.length === 1 ? 'Certificate' : 'Certificates'}
          </span>
        </div>

        {certificates.length === 0 ? (
          <div className="bg-[#111113] border border-dashed border-white/[0.08] rounded-xl p-8 text-center">
            <Award className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No certificates earned yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-[#111113] border border-white/[0.08] hover:border-amber-500/40 rounded-xl p-5 shadow-lg transition-colors flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                      <Award className="w-3.5 h-3.5 shrink-0" />
                      <span>{cert.scoring === 'strict' ? 'Strict Exam' : 'Standard Test'}</span>
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-white truncate">{cert.testTitle}</h3>
                    <p className="text-sm font-medium text-zinc-300 mt-0.5 truncate">
                      Awarded to {cert.recipientName}
                    </p>
                  </div>

                  <span className="text-[11px] font-mono tabular-nums text-slate-400 bg-[#09090B] border border-white/[0.08] px-2.5 py-1 rounded-lg shrink-0">
                    {cert.certificateCode}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-mono tabular-nums text-slate-300 bg-[#09090B] border border-white/[0.08] rounded-xl px-4 py-2.5">
                  <span>
                    Speed: <strong className="text-sky-400">{cert.wpm} WPM</strong>
                  </span>
                  <span>
                    Accuracy: <strong className="text-emerald-400">{cert.accuracy}%</strong>
                  </span>
                  <span className="text-slate-400 ml-auto font-sans">
                    {formatCertificateDate(cert.issuedAt)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onDownloadCertificatePdf(cert)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDownloadCertificate(cert)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewCertificate(cert)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Certificate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

