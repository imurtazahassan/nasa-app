import React, { useMemo, useState } from 'react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Language, Persona } from '../types/telemetry';

const SUGGESTED_QUESTIONS: Record<Language, Record<Persona, string[]>> = {
  en: {
    farmer: [
      'Should I irrigate crops today based on soil moisture?',
      'How much rain is expected over the next 3 days?',
      'Is there any flood or waterlogging risk for my fields?',
      'Are smoke or dust levels safe for outdoor fieldwork?',
    ],
    hiker: [
      'Are there any active wildfires near my trail radius?',
      'Is flash-flood risk elevated in valleys or streams?',
      'How severe is heat exposure for hiking today?',
      'Is the air quality safe for strenuous uphill cardio?',
    ],
    responder: [
      'What is the closest active hazard distance and bearing?',
      'What is the current river discharge flood ratio?',
      'Are respiratory hazards above 100 US AQI right now?',
      'Which satellite sources have missing or stale readings?',
    ],
    planner: [
      'How many high-AQI days occurred in the past 30 days?',
      'What is the 30-day cumulative rainfall vs flood ratio?',
      'Are root-zone soils showing drought or saturation stress?',
      'What thermal detections were recorded within radius?',
    ],
  },
  ur: {
    farmer: [
      'کیا زمین کی نمی کے مطابق آج فصلوں کو پانی دینا چاہیے؟',
      'اگلے 3 دنوں میں کتنی بارش متوقع ہے؟',
      'کیا کھیتوں کے لیے سیلاب یا زیادہ پانی کا خطرہ ہے؟',
      'کیا کھیتوں میں کام کے لیے ہوا کا معیار محفوظ ہے؟',
    ],
    hiker: [
      'کیا میرے ٹریک کے دائرے میں کوئی فعال جنگل کی آگ ہے؟',
      'کیا وادیوں یا نالوں میں فلیش فلڈ کا خطرہ زیادہ ہے؟',
      'آج پیدل سفر کے لیے گرمی کی شدت کیسی ہے؟',
      'کیا تیز چڑھائی کے لیے ہوا کا معیار محفوظ ہے؟',
    ],
    responder: [
      'قریب ترین فعال خطرے کا فاصلہ اور سمت کیا ہے؟',
      'دریائی بہاؤ اور سیلاب کا موجودہ تناسب کیا ہے؟',
      'کیا اس وقت فضائی آلودگی 100 US AQI سے زیادہ ہے؟',
      'کن سیٹلائٹ ذرائع کا ڈیٹا غائب یا پرانا ہے؟',
    ],
    planner: [
      'گزشتہ 30 دنوں میں کتنے دن AQI 100 سے زیادہ رہا؟',
      '30 دن کی مجموعی بارش اور سیلابی تناسب کیا ہے؟',
      'کیا زمین کی نمی خشک سالی یا آبی دباؤ دکھا رہی ہے؟',
      'دائرے کے اندر کتنے حرارتی ہاٹ اسپاٹس ریکارڈ ہوئے؟',
    ],
  },
};

export const ChatPanel: React.FC = () => {
  const {
    persona,
    language,
    t,
    localTimeStr,
    chatMessages,
    chatLoading,
    sendChatQuestion,
  } = useApp();

  const [input, setInput] = useState('');

  const suggestions = useMemo(
    () => SUGGESTED_QUESTIONS[language][persona],
    [language, persona]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;
    const q = input;
    setInput('');
    void sendChatQuestion(q);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Grounding header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 text-[var(--interactive)]" aria-hidden="true" />
          <h2 className="text-[15px] font-semibold text-[var(--text)]">{t.chatPanel.title}</h2>
        </div>
        <span className="font-mono-tabular text-[11px] text-[var(--muted)]">
          {t.chatPanel.groundedAsOf} {localTimeStr}
        </span>
      </div>

      {/* 4 One-tap suggested questions */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-[var(--muted)]">
          {t.chatPanel.suggestedLabel}
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {suggestions.map((q) => (
            <button
              key={q}
              type="button"
              disabled={chatLoading}
              onClick={() => void sendChatQuestion(q)}
              className="rounded-[4px] border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1.5 text-start text-[12px] text-[var(--text)] transition-colors duration-150 hover:border-[var(--interactive)] hover:bg-[var(--raised)] disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation feed */}
      <div className="flex-1 space-y-2.5 overflow-y-auto py-1 telemetry-scroll">
        {chatMessages.length === 0 ? (
          <p className="rounded-[6px] border border-dashed border-[var(--line)] p-3 text-center text-[12px] text-[var(--muted)]">
            {t.chatPanel.emptyPrompt}
          </p>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-[6px] border p-2.5 text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'ms-6 border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--text)]'
                  : 'me-4 border-[var(--line)] bg-[var(--bg)] text-[var(--text)]'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))
        )}

        {chatLoading && (
          <div className="flex items-center gap-2 rounded-[6px] border border-[var(--line)] bg-[var(--bg)] p-2.5 text-[12px] text-[var(--muted)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--interactive)]" aria-hidden="true" />
            <span>Analyzing active telemetry…</span>
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-[var(--line)] pt-2.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.chatPanel.placeholder}
          aria-label={t.chatPanel.placeholder}
          className="h-9 min-w-0 flex-1 rounded-[4px] border border-[var(--line)] bg-[var(--bg)] px-3 text-[13px] text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--interactive)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || chatLoading}
          aria-label={t.chatPanel.send}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[4px] bg-[var(--primary)] px-3 text-[12px] font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-45"
        >
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t.chatPanel.send}</span>
        </button>
      </form>
    </div>
  );
};
