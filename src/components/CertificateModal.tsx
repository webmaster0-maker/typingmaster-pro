import React, { useEffect, useState } from 'react';
import { TypingCertificate } from '../types';
import {
  downloadCertificatePng,
  formatCertificateDate,
  formatCertificateDuration,
} from '../utils/certificateEngine';
import { Download, Printer, X, Check } from 'lucide-react';

interface CertificateModalProps {
  certificate: TypingCertificate;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  onClose,
}) => {
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const handleDownload = () => {
    downloadCertificatePng(certificate);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2200);
  };

  const handlePrint = () => {
    window.print();
  };

  const scoringLabel =
    certificate.scoring === 'strict' ? 'strict exam' : 'standardized test';

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Typing Proficiency Certificate"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl flex flex-col gap-4 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar (Hidden on Print) */}
        <div className="print-hidden flex flex-wrap items-center justify-between gap-3 bg-slate-900/95 border border-slate-800 rounded-2xl px-4 py-3 shadow-xl">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              Certificate of Typing Proficiency
            </h2>
            <p className="text-xs text-slate-400 font-mono tabular-nums truncate">
              ID: {certificate.certificateCode} · Issued {formatCertificateDate(certificate.issuedAt)}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-lg shadow-emerald-950/40"
            >
              {downloaded ? (
                <>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>PNG Saved</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Download PNG</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors whitespace-nowrap"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              aria-label="Close certificate preview"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Archival Ivory Certificate Surface */}
        <div className="certificate-print-root w-full flex items-center justify-center">
          <div className="certificate-print-surface relative w-full bg-[#FCFBF7] text-[#0F172A] rounded-xl shadow-2xl overflow-hidden border-[8px] sm:border-[10px] border-[#0F172A] p-3 sm:p-5">
            {/* Inner Gold Ornamental Frame */}
            <div className="relative border-2 border-[#B48A3E] p-1.5 sm:p-2.5">
              <div className="relative border border-[#0F172A]/20 px-5 py-7 sm:px-12 sm:py-10 flex flex-col items-center text-center">
                {/* Corner Accents */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2.5 left-2.5 w-6 h-6 border-t-2 border-l-2 border-[#B48A3E]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2.5 right-2.5 w-6 h-6 border-t-2 border-r-2 border-[#B48A3E]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-2.5 left-2.5 w-6 h-6 border-b-2 border-l-2 border-[#B48A3E]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-2.5 right-2.5 w-6 h-6 border-b-2 border-r-2 border-[#B48A3E]"
                />

                {/* Top Issuer Line */}
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.24em] text-[#9E7630]">
                  TypeCrest · Official Certification
                </p>
                <div className="w-32 sm:w-44 h-px bg-[#B48A3E]/80 mt-2.5 mb-5" />

                {/* Formal Serif Title */}
                <p
                  role="heading"
                  aria-level={3}
                  className="font-serif text-2xl sm:text-4xl md:text-[42px] font-bold tracking-tight text-[#0F172A] leading-tight"
                >
                  Certificate of Typing Proficiency
                </p>

                <p className="mt-4 sm:mt-5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  This credential is proudly presented to
                </p>

                {/* Recipient Name */}
                <div className="mt-2 sm:mt-3 pb-2.5 border-b-2 border-[#B48A3E] min-w-[220px] sm:min-w-[360px] max-w-full px-4">
                  <p className="font-serif italic font-bold text-3xl sm:text-5xl text-[#0F172A] break-words leading-tight">
                    {certificate.recipientName}
                  </p>
                </div>

                {/* Citation */}
                <p className="mt-4 sm:mt-5 max-w-2xl text-xs sm:text-base text-slate-700 leading-relaxed">
                  For successfully passing the{' '}
                  <strong className="font-semibold text-[#0F172A]">
                    &ldquo;{certificate.testTitle}&rdquo;
                  </strong>{' '}
                  assessment under {scoringLabel} conditions, demonstrating verified
                  touch-typing speed and precision.
                </p>

                {/* Verified Metrics Ribbon */}
                <div className="mt-6 sm:mt-7 w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 bg-[#F7F3E8] border border-[#D6C49C] divide-y sm:divide-y-0 sm:divide-x divide-[#DECFA9]">
                  <div className="py-3 sm:py-4 px-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Net Speed
                    </div>
                    <div className="mt-1 font-mono tabular-nums text-lg sm:text-2xl font-bold text-[#0F172A]">
                      {certificate.wpm} WPM
                    </div>
                  </div>
                  <div className="py-3 sm:py-4 px-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Accuracy
                    </div>
                    <div className="mt-1 font-mono tabular-nums text-lg sm:text-2xl font-bold text-[#0F172A]">
                      {certificate.accuracy}%
                    </div>
                  </div>
                  <div className="py-3 sm:py-4 px-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Duration
                    </div>
                    <div className="mt-1 font-mono tabular-nums text-lg sm:text-2xl font-bold text-[#0F172A]">
                      {formatCertificateDuration(certificate.durationSeconds)}
                    </div>
                  </div>
                  <div className="py-3 sm:py-4 px-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Scoring Mode
                    </div>
                    <div className="mt-1 font-mono tabular-nums text-sm sm:text-lg font-bold text-[#0F172A] leading-7 sm:leading-8">
                      {certificate.scoring === 'strict' ? 'STRICT EXAM' : 'STANDARD'}
                    </div>
                  </div>
                </div>

                {/* Footer Row: Issue Date | Rosette Seal | Signatory */}
                <div className="mt-7 sm:mt-9 w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 items-center gap-6 sm:gap-4">
                  {/* Left: Date & Code */}
                  <div className="flex flex-col items-center">
                    <div className="font-serif font-semibold text-sm sm:text-base text-[#0F172A]">
                      {formatCertificateDate(certificate.issuedAt)}
                    </div>
                    <div className="w-44 h-px bg-slate-400 my-1.5" />
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Date of Issue
                    </div>
                    <div className="mt-1 font-mono tabular-nums text-[11px] font-semibold text-slate-600">
                      ID: {certificate.certificateCode}
                    </div>
                  </div>

                  {/* Center: Gold & Navy Scalloped Seal */}
                  <div className="flex items-center justify-center">
                    <svg
                      viewBox="0 0 140 160"
                      className="w-24 h-28 sm:w-28 sm:h-32 select-none"
                      aria-label="Verified Passed Official Seal"
                    >
                      <defs>
                        <linearGradient id="certGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#DFBE74" />
                          <stop offset="50%" stopColor="#B48A3E" />
                          <stop offset="100%" stopColor="#8C6523" />
                        </linearGradient>
                      </defs>
                      {/* Twin Navy Ribbons */}
                      <polygon points="48,94 34,154 52,142 66,154 66,94" fill="#0F172A" />
                      <polygon points="74,94 74,154 88,142 106,154 92,94" fill="#0F172A" />
                      <line x1="53" y1="100" x2="45" y2="142" stroke="#D4AF6A" strokeWidth="1.5" />
                      <line x1="87" y1="100" x2="95" y2="142" stroke="#D4AF6A" strokeWidth="1.5" />
                      {/* Outer Gold Scalloped Burst */}
                      <circle cx="70" cy="64" r="46" fill="url(#certGoldGrad)" stroke="#7A571D" strokeWidth="2" strokeDasharray="6 3" />
                      <circle cx="70" cy="64" r="42" fill="url(#certGoldGrad)" />
                      {/* Inner Navy Core */}
                      <circle cx="70" cy="64" r="33" fill="#0F172A" stroke="#E5C985" strokeWidth="2" />
                      <circle cx="70" cy="64" r="27" fill="none" stroke="#E5C985" strokeOpacity="0.45" strokeWidth="1" />
                      <text
                        x="70"
                        y="57"
                        textAnchor="middle"
                        fill="#F6E7C1"
                        fontSize="8.5"
                        fontWeight="700"
                        letterSpacing="1.6"
                      >
                        VERIFIED
                      </text>
                      <text
                        x="70"
                        y="73"
                        textAnchor="middle"
                        fill="#F6E7C1"
                        fontSize="12"
                        fontWeight="700"
                        fontFamily="Georgia, serif"
                      >
                        PASSED
                      </text>
                    </svg>
                  </div>

                  {/* Right: Signatory */}
                  <div className="flex flex-col items-center">
                    <div className="font-serif italic font-bold text-lg sm:text-xl text-[#0F172A]">
                      TypeCrest
                    </div>
                    <div className="w-44 h-px bg-slate-400 my-1.5" />
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Certification Board
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-slate-600">
                      Verified Touch-Typing Credential
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
