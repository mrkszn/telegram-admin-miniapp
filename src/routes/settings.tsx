import { useCallback, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { BackButton } from '@/components/layout/BackButton'
import { SegmentedControl } from '@/components/ui/segmented'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useApi } from '@/lib/hooks/useApi'
import { useT, setLanguage } from '@/lib/i18n'
import { fetchSettings, updateSettings } from '@/lib/api/admin'
import type {
  AdminSettings,
  AdminSettingsUpdate,
  ApiError,
  SettingsLanguage,
} from '@/lib/api/types'
import { ADMIN_NAV } from './nav'

/* ── route ──────────────────────────────────────────────── */

export function SettingsRoute() {
  const t = useT()
  const navigate = useNavigate()
  const goBack = useCallback(() => navigate('/dashboard'), [navigate])

  const { data, error, isLoading, refetch } = useApi<AdminSettings>(
    'settings',
    () => fetchSettings(),
  )

  return (
    <AppShell
      title={t('title.settings')}
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
            <BrandSpinner size="lg" label={t('settings.loading')} />
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
  const t = useT()
  const [settings, setSettings] = useState<AdminSettings>(initial)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<ApiError | null>(null)

  const languageOptions: { value: SettingsLanguage; label: string }[] = [
    { value: 'uk', label: t('settings.language.uk') },
    { value: 'en', label: t('settings.language.en') },
  ]

  /**
   * Optimistically apply `patch`, PUT it, then reconcile with the server's
   * canonical response. On failure we roll back to the previous values and
   * surface the error inline. Language is mirrored into the i18n store
   * immediately so the whole UI re-translates the instant the user taps.
   */
  const save = useCallback(
    async (patch: AdminSettingsUpdate) => {
      const previous = settings
      const optimistic = { ...settings, ...patch }
      setSettings(optimistic)
      if (patch.language !== undefined) setLanguage(patch.language)
      setSaving(true)
      setSaveError(null)
      try {
        const fresh = await updateSettings(patch)
        setSettings(fresh)
        setLanguage(fresh.language)
      } catch (err) {
        setSettings(previous)
        setLanguage(previous.language)
        setSaveError(err as ApiError)
      } finally {
        setSaving(false)
      }
    },
    [settings],
  )

  return (
    <>
      <Section
        title={t('settings.language.title')}
        description={t('settings.language.description')}
      >
        <SegmentedControl
          label={t('settings.language.aria')}
          options={languageOptions}
          value={settings.language}
          onChange={(language) => void save({ language })}
          disabled={saving}
        />
      </Section>

      <div className="min-h-5 text-xs" aria-live="polite">
        {saving ? (
          <span className="text-muted">{t('settings.saving')}</span>
        ) : saveError ? (
          <span className="text-danger">{t('settings.saveError')}</span>
        ) : null}
      </div>

      <Section title={t('title.prizes')} description={t('prizes.link.description')}>
        <Link
          to="/prizes"
          className="inline-flex h-10 items-center justify-center rounded-input border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
        >
          {t('nav.prizes')} →
        </Link>
      </Section>
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
