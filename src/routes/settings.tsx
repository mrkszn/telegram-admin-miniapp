import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { BackButton } from '@/components/layout/BackButton'
import { SegmentedControl } from '@/components/ui/segmented'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useApi } from '@/lib/hooks/useApi'
import {
  useThemePreference,
  type ThemePreference,
} from '@/lib/hooks/useThemePreference'
import { fetchSettings, updateSettings } from '@/lib/api/admin'
import type {
  AdminSettings,
  AdminSettingsUpdate,
  ApiError,
  SettingsLanguage,
  SettingsTheme,
} from '@/lib/api/types'
import { ADMIN_NAV } from './nav'

/* ── theme <→ local-preference mapping ───────────────────────
 * Backend uses 'system'; the app-wide theme store uses 'auto'.
 * Everything else maps 1:1. */
function themeToPreference(theme: SettingsTheme): ThemePreference {
  return theme === 'system' ? 'auto' : theme
}

const THEME_OPTIONS: { value: SettingsTheme; label: string }[] = [
  { value: 'system', label: 'Системная' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
]

const LANGUAGE_OPTIONS: { value: SettingsLanguage; label: string }[] = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
]

/* ── route ──────────────────────────────────────────────── */

export function SettingsRoute() {
  const navigate = useNavigate()
  const goBack = useCallback(() => navigate('/dashboard'), [navigate])

  const { data, error, isLoading, refetch } = useApi<AdminSettings>(
    'settings',
    () => fetchSettings(),
  )

  return (
    <AppShell
      title="Настройки"
      navItems={ADMIN_NAV}
      headerRight={null}
      onBack={goBack}
    >
      <BackButton onClick={goBack} />
      <div className="flex flex-col gap-6">
        {error ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : isLoading || !data ? (
          <div className="flex justify-center py-16">
            <BrandSpinner size="lg" label="Загрузка настроек…" />
          </div>
        ) : (
          <SettingsForm initial={data} />
        )}
      </div>
    </AppShell>
  )
}

/* ── form ───────────────────────────────────────────────── */

function SettingsForm({ initial }: { initial: AdminSettings }) {
  const [settings, setSettings] = useState<AdminSettings>(initial)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<ApiError | null>(null)
  const { setPreference } = useThemePreference()

  /**
   * Optimistically apply `patch`, PUT it, then reconcile with the server's
   * canonical response. On failure we roll back to the previous values and
   * surface the error inline.
   */
  const save = useCallback(
    async (patch: AdminSettingsUpdate) => {
      const previous = settings
      const optimistic = { ...settings, ...patch }
      setSettings(optimistic)
      setSaving(true)
      setSaveError(null)
      try {
        const fresh = await updateSettings(patch)
        setSettings(fresh)
        // Keep the live app theme in sync with the saved value.
        if (patch.theme !== undefined) {
          setPreference(themeToPreference(fresh.theme))
        }
      } catch (err) {
        setSettings(previous)
        setSaveError(err as ApiError)
      } finally {
        setSaving(false)
      }
    },
    [settings, setPreference],
  )

  return (
    <>
      <Section
        title="Тема"
        description="Как приложение выглядит. «Системная» следует настройкам Telegram."
      >
        <SegmentedControl
          label="Тема оформления"
          options={THEME_OPTIONS}
          value={settings.theme}
          onChange={(theme) => void save({ theme })}
          disabled={saving}
        />
      </Section>

      <Section title="Язык" description="Язык интерфейса.">
        <SegmentedControl
          label="Язык интерфейса"
          options={LANGUAGE_OPTIONS}
          value={settings.language}
          onChange={(language) => void save({ language })}
          disabled={saving}
        />
      </Section>

      <div className="min-h-5 text-xs" aria-live="polite">
        {saving ? (
          <span className="text-muted">Сохранение…</span>
        ) : saveError ? (
          <span className="text-danger">
            Не удалось сохранить. Изменения отменены.
          </span>
        ) : null}
      </div>
    </>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <header className="flex flex-col gap-0.5">
        <h2 className="font-serif text-lg leading-tight text-ink">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </header>
      {children}
    </section>
  )
}
