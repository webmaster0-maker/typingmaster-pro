import { SessionResult, TypingCertificate } from '../types';
import { signCertificate, verifyCertificate } from './integrityEngine';

const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function normalizeRecipientName(rawName: string): string {
  return rawName.trim().replace(/\s+/g, ' ').slice(0, 80);
}

export function isEligibleForCertificate(result: SessionResult): boolean {
  return (result.type === 'test' || result.type === 'exam') && result.passed === true;
}

export function generateCertificateCode(issuedAtIso: string, seed: string): string {
  const parsedDate = new Date(issuedAtIso);
  const year = Number.isNaN(parsedDate.getTime()) ? new Date().getFullYear() : parsedDate.getFullYear();

  const input = `${issuedAtIso}|${seed}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + (i * 31);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  h1 >>>= 0;
  h2 >>>= 0;

  let code = '';
  let combined = h1;
  for (let i = 0; i < 6; i++) {
    if (i === 3) combined = h2;
    code += CODE_ALPHABET[combined % CODE_ALPHABET.length];
    combined = Math.floor(combined / CODE_ALPHABET.length) + ((h1 ^ (h2 >>> i)) >>> 0);
  }

  return `TMP-${year}-${code}`;
}

export function createCertificateFromSession(
  result: SessionResult,
  rawRecipientName: string
): TypingCertificate {
  if (!isEligibleForCertificate(result)) {
    throw new Error('Certificates are only generated for passed tests and exams.');
  }

  const recipientName = normalizeRecipientName(rawRecipientName);
  if (!recipientName) {
    throw new Error('Recipient name is required to generate a certificate.');
  }

  const issuedAt = result.completedAt || new Date().toISOString();
  const certificateCode = generateCertificateCode(
    issuedAt,
    `${result.id}|${result.itemId}|${recipientName}|${result.wpm}|${result.accuracy}`
  );

  return signCertificate({
    id: `cert-${result.id}`,
    certificateCode,
    sessionId: result.id,
    testId: result.itemId,
    testTitle: result.title,
    recipientName,
    wpm: Math.max(0, Math.round(result.wpm)),
    accuracy: Math.max(0, Math.min(100, Math.round(result.accuracy))),
    errors: Math.max(0, Math.round(result.errors)),
    durationSeconds: Math.max(1, Math.round(result.durationSeconds)),
    scoring: result.scoring === 'strict' ? 'strict' : 'standard',
    issuedAt,
  });
}

export function upsertCertificate(
  existing: TypingCertificate[],
  nextCert: TypingCertificate
): TypingCertificate[] {
  const alreadyExists = existing.some((c) => c.sessionId === nextCert.sessionId);
  if (alreadyExists) {
    return existing;
  }
  const signed = signCertificate(nextCert);
  return [signed, ...existing];
}

export function formatCertificateDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Issued Today';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatCertificateDuration(seconds: number): string {
  const safeSecs = Math.max(1, Math.round(seconds));
  const mins = Math.floor(safeSecs / 60);
  const rem = safeSecs % 60;
  if (mins === 0) return `${rem}s`;
  if (rem === 0) return `${mins}m`;
  return `${mins}m ${rem}s`;
}

export function getUserInitials(fullName: string): string {
  const clean = normalizeRecipientName(fullName);
  if (!clean) return 'U';
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function sanitizeCertificateFilename(recipientName: string, testTitle: string): string {
  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 36);
  const nameSlug = slugify(recipientName) || 'recipient';
  const testSlug = slugify(testTitle) || 'typing-test';
  return `TypingMaster-Certificate-${nameSlug}-${testSlug}.png`;
}

function drawCornerFlourish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flipX: number,
  flipY: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX, flipY);

  ctx.strokeStyle = '#B48A3E';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.lineTo(0, 0);
  ctx.lineTo(42, 0);
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(10, 32);
  ctx.lineTo(10, 10);
  ctx.lineTo(32, 10);
  ctx.stroke();

  ctx.fillStyle = '#B48A3E';
  ctx.beginPath();
  ctx.arc(10, 10, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawRosetteSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();

  // Twin navy ribbons beneath seal
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.moveTo(cx - 26, cy + 36);
  ctx.lineTo(cx - 42, cy + 104);
  ctx.lineTo(cx - 21, cy + 90);
  ctx.lineTo(cx - 4, cy + 104);
  ctx.lineTo(cx - 4, cy + 36);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + 4, cy + 36);
  ctx.lineTo(cx + 4, cy + 104);
  ctx.lineTo(cx + 21, cy + 90);
  ctx.lineTo(cx + 42, cy + 104);
  ctx.lineTo(cx + 26, cy + 36);
  ctx.closePath();
  ctx.fill();

  // Gold ribbon trim
  ctx.strokeStyle = '#D4AF6A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 19, cy + 44);
  ctx.lineTo(cx - 28, cy + 90);
  ctx.moveTo(cx + 19, cy + 44);
  ctx.lineTo(cx + 28, cy + 90);
  ctx.stroke();

  // Scalloped outer gold medallion
  const teeth = 24;
  const outerR = 54;
  const innerR = 47;
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i * Math.PI) / teeth;
    const r = i % 2 === 0 ? outerR : innerR;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const goldGrad = ctx.createLinearGradient(cx - 54, cy - 54, cx + 54, cy + 54);
  goldGrad.addColorStop(0, '#DFBE74');
  goldGrad.addColorStop(0.5, '#B48A3E');
  goldGrad.addColorStop(1, '#8C6523');
  ctx.fillStyle = goldGrad;
  ctx.fill();
  ctx.strokeStyle = '#7A571D';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner deep navy circle
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, Math.PI * 2);
  ctx.fillStyle = '#0F172A';
  ctx.fill();
  ctx.strokeStyle = '#E5C985';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner subtle ring
  ctx.beginPath();
  ctx.arc(cx, cy, 31, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(229, 201, 133, 0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Seal text
  ctx.fillStyle = '#F6E7C1';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 10px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('VERIFIED', cx, cy - 9);
  ctx.font = '700 13px Georgia, "Times New Roman", serif';
  ctx.fillText('PASSED', cx, cy + 7);

  ctx.restore();
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function renderCertificateToCanvas(
  cert: TypingCertificate
): HTMLCanvasElement {
  const width = 1600;
  const height = 1130;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize canvas 2D context for certificate export.');
  }

  // Archival ivory parchment backdrop
  const bgGrad = ctx.createRadialGradient(
    width / 2,
    height * 0.42,
    120,
    width / 2,
    height / 2,
    width * 0.65
  );
  bgGrad.addColorStop(0, '#FFFDF9');
  bgGrad.addColorStop(0.65, '#FCFBF7');
  bgGrad.addColorStop(1, '#F3EFE4');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer deep navy ceremonial border
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 14;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  // Secondary burnished gold border
  ctx.strokeStyle = '#B48A3E';
  ctx.lineWidth = 3;
  ctx.strokeRect(58, 58, width - 116, height - 116);

  // Inner fine hairline
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(70, 70, width - 140, height - 140);

  // Corner flourishes
  drawCornerFlourish(ctx, 84, 84, 1, 1);
  drawCornerFlourish(ctx, width - 84, 84, -1, 1);
  drawCornerFlourish(ctx, 84, height - 84, 1, -1);
  drawCornerFlourish(ctx, width - 84, height - 84, -1, -1);

  // Top emblem & brand header
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#9E7630';
  ctx.font = '700 18px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('TYPINGMASTER PRO  •  OFFICIAL CERTIFICATION', width / 2, 146);

  // Decorative divider under brand
  ctx.strokeStyle = '#B48A3E';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 140, 174);
  ctx.lineTo(width / 2 + 140, 174);
  ctx.stroke();

  // Main Certificate Heading
  ctx.fillStyle = '#0F172A';
  ctx.font = '700 62px Georgia, "Times New Roman", serif';
  ctx.fillText('Certificate of Typing Proficiency', width / 2, 248);

  // Presenter line
  ctx.fillStyle = '#64748B';
  ctx.font = '600 17px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('THIS CREDENTIAL IS PROUDLY PRESENTED TO', width / 2, 326);

  // Recipient Name (auto-fit font size so long names never overflow)
  let nameFontSize = 70;
  ctx.font = `italic 700 ${nameFontSize}px Georgia, "Times New Roman", serif`;
  while (ctx.measureText(cert.recipientName).width > 1180 && nameFontSize > 36) {
    nameFontSize -= 2;
    ctx.font = `italic 700 ${nameFontSize}px Georgia, "Times New Roman", serif`;
  }
  ctx.fillStyle = '#0F172A';
  ctx.fillText(cert.recipientName, width / 2, 412);

  // Gold signature rule under recipient name
  const nameRuleWidth = Math.min(760, Math.max(380, ctx.measureText(cert.recipientName).width + 90));
  ctx.strokeStyle = '#B48A3E';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - nameRuleWidth / 2, 462);
  ctx.lineTo(width / 2 + nameRuleWidth / 2, 462);
  ctx.stroke();

  // Achievement citation
  const scoringLabel = cert.scoring === 'strict' ? 'strict exam' : 'standardized test';
  const citationText = `For successfully passing the "${cert.testTitle}" assessment under ${scoringLabel} conditions, demonstrating verified touch-typing speed and precision.`;
  ctx.fillStyle = '#334155';
  ctx.font = '500 23px "Plus Jakarta Sans", system-ui, sans-serif';
  const citationLines = wrapCanvasText(ctx, citationText, 1080);
  citationLines.forEach((line, idx) => {
    ctx.fillText(line, width / 2, 518 + idx * 34);
  });

  // Metrics Ribbon
  const ribbonX = 220;
  const ribbonY = 626;
  const ribbonW = width - 440;
  const ribbonH = 144;

  ctx.fillStyle = '#F7F3E8';
  ctx.fillRect(ribbonX, ribbonY, ribbonW, ribbonH);
  ctx.strokeStyle = '#D6C49C';
  ctx.lineWidth = 2;
  ctx.strokeRect(ribbonX, ribbonY, ribbonW, ribbonH);

  const metrics = [
    { label: 'NET SPEED', value: `${cert.wpm} WPM` },
    { label: 'ACCURACY', value: `${cert.accuracy}%` },
    { label: 'DURATION', value: formatCertificateDuration(cert.durationSeconds) },
    { label: 'SCORING MODE', value: cert.scoring === 'strict' ? 'STRICT EXAM' : 'STANDARD' },
  ];

  const colW = ribbonW / metrics.length;
  metrics.forEach((m, idx) => {
    const cx = ribbonX + colW * idx + colW / 2;
    if (idx > 0) {
      ctx.strokeStyle = '#DECFA9';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ribbonX + colW * idx, ribbonY + 24);
      ctx.lineTo(ribbonX + colW * idx, ribbonY + ribbonH - 24);
      ctx.stroke();
    }

    ctx.fillStyle = '#64748B';
    ctx.font = '700 14px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(m.label, cx, ribbonY + 46);

    ctx.fillStyle = '#0F172A';
    ctx.font = '700 32px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillText(m.value, cx, ribbonY + 94);
  });

  // Bottom Footer: Left Date/ID | Center Seal | Right Signature
  const footerY = 895;

  // Left: Date & Verification Code
  const leftX = 330;
  ctx.fillStyle = '#0F172A';
  ctx.font = '600 22px Georgia, "Times New Roman", serif';
  ctx.fillText(formatCertificateDate(cert.issuedAt), leftX, footerY - 10);

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftX - 165, footerY + 18);
  ctx.lineTo(leftX + 165, footerY + 18);
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = '700 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('DATE OF ISSUE', leftX, footerY + 42);

  ctx.fillStyle = '#475569';
  ctx.font = '600 15px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(`ID: ${cert.certificateCode}`, leftX, footerY + 72);

  // Center: Scalloped Gold-and-Navy Seal
  drawRosetteSeal(ctx, width / 2, footerY - 8);

  // Right: Authorized Signatory
  const rightX = width - 330;
  ctx.fillStyle = '#0F172A';
  ctx.font = 'italic 700 28px Georgia, "Times New Roman", serif';
  ctx.fillText('TypingMaster Pro', rightX, footerY - 12);

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rightX - 165, footerY + 18);
  ctx.lineTo(rightX + 165, footerY + 18);
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = '700 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('CERTIFICATION BOARD', rightX, footerY + 42);

  ctx.fillStyle = '#475569';
  ctx.font = '500 14px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Verified Touch-Typing Credential', rightX, footerY + 72);

  return canvas;
}

export function downloadCertificatePng(cert: TypingCertificate): void {
  const canvas = renderCertificateToCanvas(cert);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = sanitizeCertificateFilename(cert.recipientName, cert.testTitle);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
