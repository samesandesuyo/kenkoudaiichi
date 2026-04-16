import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  onSettingsOpen: () => void;
  onLogOut?: () => void;
}

export function Layout({ children, onSettingsOpen, onLogOut }: LayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: "'Noto Sans JP', sans-serif" }}>
      {/* 星の背景 */}
      <div className="stars-bg" aria-hidden="true" />

      {/* ヘッダー */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3" style={{ background: 'rgba(11,15,42,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🌙</span>
          <h1 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)' }}>
            よぞら体調ナビ
          </h1>
        </div>
        <div className="flex items-center gap-1">
        {onLogOut && (
          <button
            onClick={onLogOut}
            className="p-2 rounded-full transition-colors text-xs"
            style={{ color: 'var(--color-muted)' }}
            aria-label="ログアウト"
            title="ログアウト"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        )}
        <button
          onClick={onSettingsOpen}
          className="p-2 rounded-full transition-colors"
          style={{ color: 'var(--color-muted)' }}
          aria-label="設定を開く"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-lg mx-auto px-4 pb-8 pt-4">
        {children}
      </main>
    </div>
  );
}
