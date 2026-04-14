import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ClipboardList, Menu, Package, Search, Settings as SettingsIcon, Shield, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useFooterSearchStore } from '../../store/footerSearchStore';

const QUICK_LINKS = [
  { label: 'タスク管理', path: '/tasks', icon: ClipboardList, desc: 'AI実行キュー' },
  { label: '成果物', path: '/deliverables', icon: Package, desc: '完了した出力' },
  { label: 'ガバナンス', path: '/governance', icon: Shield, desc: 'ログ・リスク監視' },
  { label: '設定', path: '/settings', icon: SettingsIcon, desc: 'プロフィール・ファイル' },
] as const;

type SearchSessionHit = { id: string; title: string | null; createdAt: string };
type SearchMessageHit = {
  id: string;
  sessionId: string;
  sessionTitle: string | null;
  role: string;
  snippet: string;
  createdAt: string;
};

const RAINBOW_TEXT_GRADIENT =
  'linear-gradient(90deg, #ffffff, #eef0f6, #d8eefb, #bfe7ff, #e6f7ff, #ffffff)';

const RAINBOW_LINE =
  'linear-gradient(90deg, transparent, #ffffff, #eef0f6, #d8eefb, #bfe7ff, #e6f7ff, #ffffff, transparent)';

/**
 * 秘書検索モード。BottomNav と同じ liquid-unified-nav 虹ピルに統一。
 */
export function FooterSearch() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const focusSignal = useFooterSearchStore((s) => s.focusSignal);
  const closeSecretarySearch = useFooterSearchStore((s) => s.closeSecretarySearch);
  const [query, setQuery] = useState('');
  const [sessions, setSessions] = useState<SearchSessionHit[]>([]);
  const [messages, setMessages] = useState<SearchMessageHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusSignal === 0) return;
    inputRef.current?.focus();
  }, [focusSignal]);

  useEffect(() => {
    if (query.trim().length < 1) {
      setSessions([]);
      setMessages([]);
      setSearching(false);
      return;
    }
    const t = setTimeout(() => {
      setSearching(true);
      api
        .get<{ success: boolean; data: { sessions: SearchSessionHit[]; messages: SearchMessageHit[] } }>(
          '/chat/search',
          { params: { q: query.trim() } },
        )
        .then((res) => {
          setSessions(res.data.data?.sessions ?? []);
          setMessages(res.data.data?.messages ?? []);
        })
        .catch(() => {
          setSessions([]);
          setMessages([]);
        })
        .finally(() => setSearching(false));
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  const goHit = (sessionId: string) => {
    setQuery('');
    setFocused(false);
    closeSecretarySearch();
    navigate(`/chat/${sessionId}`);
  };

  const goLink = (path: string) => {
    setQuery('');
    setFocused(false);
    closeSecretarySearch();
    navigate(path);
  };

  const showResults = focused && (query.trim().length > 0 || searching);
  const showQuickLinks = focused && query.trim().length === 0 && !searching;

  return (
    <div className="relative w-full bg-transparent">
      <div className={reduceMotion ? '' : 'liquid-pill-shell'}>
        <div
          className={
            reduceMotion
              ? 'flex h-[52px] items-center gap-2 rounded-full border border-white/88 bg-white/74 px-2.5 shadow-elev-2 backdrop-blur-xl'
              : 'liquid-pill-inner flex h-[52px] items-center gap-2 px-2.5'
          }
        >
          <motion.button
            type="button"
            aria-label="検索を閉じてナビを表示"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/42 text-primary shadow-sm backdrop-blur-sm transition-colors hover:bg-white/58"
            whileTap={reduceMotion ? undefined : { scale: 0.94 }}
            onClick={() => closeSecretarySearch()}
          >
            <Menu className="h-5 w-5" />
          </motion.button>

          <div className="relative min-w-0 flex-1">
            <div
              className={`rounded-xl p-[2px] shadow-sm ${reduceMotion ? '' : 'footer-search-iridescent'}`}
              style={
                reduceMotion
                  ? {
                      background:
                        'linear-gradient(110deg, #ffffff, #eef0f6, #d8eefb, #bfe7ff, #e6f7ff, #ffffff)',
                    }
                  : undefined
              }
            >
              <div className="flex h-10 items-center gap-2 rounded-[999px] border border-white/72 bg-white/38 px-2.5 py-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl sm:px-3">
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/58 shadow-sm"
                  style={{
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.95), 0 0 0 1px rgba(255,255,255,0.72), 0 2px 8px rgba(17,24,39,0.06)',
                  }}
                  aria-hidden
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#8fd8ff] sm:h-4 sm:w-4" strokeWidth={2} />
                </div>
                <Search className="h-4 w-4 flex-shrink-0 text-neutral-400/90" aria-hidden />
                <input
                  ref={inputRef}
                  type="search"
                  enterKeyHint="search"
                  className="min-w-0 flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400/90"
                  placeholder="過去の会話・メッセージを検索…"
                  value={query}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  aria-label="会話検索"
                />
              </div>
            </div>

            <AnimatePresence>
              {showQuickLinks && (
                <motion.div
                  key="quick"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.2, 0, 0, 1] }}
                  className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-xl border border-white/92 bg-white/96 py-2 backdrop-blur-md"
                  style={{
                    boxShadow:
                      '0 -12px 40px rgba(17,24,39,0.08), 0 0 0 1px rgba(255,255,255,0.95), inset 0 1px 0 0 rgba(255,255,255,1)',
                  }}
                >
                  <div
                    className="pointer-events-none absolute left-3 right-3 top-0 h-px rounded-full opacity-95"
                    style={{ background: RAINBOW_LINE }}
                  />
                  <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                    クイックリンク
                  </p>
                  <ul className="px-2 pb-1">
                    {QUICK_LINKS.map((link) => {
                      const Icon = link.icon;
                      return (
                        <li key={link.path}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-neutral-100"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => goLink(link.path)}
                          >
                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                              <Icon size={14} />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-neutral-800">{link.label}</span>
                              <span className="block text-[11px] text-neutral-500">{link.desc}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
              {showResults && (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.2, 0, 0, 1] }}
                  className="absolute bottom-full left-0 right-0 z-50 mb-2 max-h-64 overflow-y-auto rounded-xl border border-white/92 bg-white/96 py-2 backdrop-blur-md"
                  style={{
                    boxShadow:
                      '0 -12px 40px rgba(17,24,39,0.08), 0 0 0 1px rgba(255,255,255,0.95), inset 0 1px 0 0 rgba(255,255,255,1)',
                  }}
                >
                  <div
                    className="pointer-events-none absolute left-3 right-3 top-0 h-px rounded-full opacity-95"
                    style={{ background: RAINBOW_LINE }}
                  />
                  <div className="pt-1">
                    {searching && <p className="px-4 py-2 text-sm text-neutral-500">検索中…</p>}
                    {!searching && query.trim().length > 0 && sessions.length === 0 && messages.length === 0 && (
                      <p className="px-4 py-2 text-sm text-neutral-500">該当する会話はありません</p>
                    )}
                    {!searching && sessions.length > 0 && (
                      <div className="px-2 pb-1">
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                          セッション
                        </p>
                        <ul className="space-y-0.5">
                          {sessions.map((s) => (
                            <li key={s.id}>
                              <button
                                type="button"
                                className="w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-800 transition-colors hover:bg-neutral-100"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => goHit(s.id)}
                              >
                                <span className="line-clamp-1 font-medium">{s.title || '無題の会話'}</span>
                                <span className="mt-0.5 block text-[10px] text-neutral-400">
                                  {new Date(s.createdAt).toLocaleString('ja-JP')}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!searching && messages.length > 0 && (
                      <div className="px-2">
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                          メッセージ
                        </p>
                        <ul className="space-y-0.5">
                          {messages.map((m) => (
                            <li key={m.id}>
                              <button
                                type="button"
                                className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-100"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => goHit(m.sessionId)}
                              >
                                <span
                                  className="text-[10px] font-medium"
                                  style={{
                                    background: RAINBOW_TEXT_GRADIENT,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                  }}
                                >
                                  {m.sessionTitle || '無題'} · {m.role}
                                </span>
                                <span className="mt-0.5 block line-clamp-2 text-sm text-neutral-600">{m.snippet}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
