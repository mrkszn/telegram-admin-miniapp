import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { BackButton } from '@/components/layout/BackButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useApi } from '@/lib/hooks/useApi'
import { useT, type Translator } from '@/lib/i18n'
import { getPrizes, updatePrize } from '@/lib/api/admin'
import type {
  ApiError,
  PrizeTier,
  PrizeTierOut,
  PrizeTierUpdate,
  PrizesResponse,
} from '@/lib/api/types'
import { ADMIN_NAV } from './nav'

const TIER_ORDER: PrizeTier[] = ['small', 'medium', 'large']
const TIER_LABEL_KEYS = {
  small: 'prizes.tier.small',
  medium: 'prizes.tier.medium',
  large: 'prizes.tier.large',
} as const satisfies Record<PrizeTier, Parameters<Translator>[0]>

export function PrizesRoute() {
  const t = useT()
  const navigate = useNavigate()
  const goBack = useCallback(() => navigate('/settings'), [navigate])

  const { data, error, isLoading, refetch } = useApi<PrizesResponse>('prizes', () =>
    getPrizes(),
  )

  const byTier = useMemo(() => {
    const map = new Map<PrizeTier, PrizeTierOut>()
    data?.prizes.forEach((p) => map.set(p.tier, p))
    return map
  }, [data])

  return (
    <AppShell
      title={t('title.prizes')}
      navItems={ADMIN_NAV}
      headerRight={null}
      onBack={goBack}
    >
      <BackButton onClick={goBack} />
      <div className="flex flex-col gap-5">
        {error ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : isLoading || !data ? (
          <div className="flex justify-center py-16">
            <BrandSpinner size="lg" label={t('prizes.loading')} />
          </div>
        ) : (
          TIER_ORDER.map((tier) => {
            const prize = byTier.get(tier)
            if (!prize) return null
            return <PrizeCard key={tier} prize={prize} />
          })
        )}
      </div>
    </AppShell>
  )
}

interface PrizeCardProps {
  prize: PrizeTierOut
}

function PrizeCard({ prize }: PrizeCardProps) {
  const t = useT()
  const [baseline, setBaseline] = useState<PrizeTierOut>(prize)
  const [draft, setDraft] = useState<PrizeTierOut>(prize)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<ApiError | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const dirty =
    draft.code !== baseline.code ||
    draft.label_uk !== baseline.label_uk ||
    draft.label_en !== baseline.label_en

  const onSave = useCallback(async () => {
    const patch: PrizeTierUpdate = {}
    if (draft.code !== baseline.code) patch.code = draft.code
    if (draft.label_uk !== baseline.label_uk) patch.label_uk = draft.label_uk
    if (draft.label_en !== baseline.label_en) patch.label_en = draft.label_en
    if (Object.keys(patch).length === 0) return

    setSaving(true)
    setSaveError(null)
    try {
      const fresh = await updatePrize(prize.tier, patch)
      setBaseline(fresh)
      setDraft(fresh)
      setSavedAt(Date.now())
    } catch (err) {
      setSaveError(err as ApiError)
    } finally {
      setSaving(false)
    }
  }, [draft, baseline, prize.tier])

  const tierLabel = t(TIER_LABEL_KEYS[prize.tier])

  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-3.5">
      <header className="flex items-baseline justify-between gap-2">
        <h2 className="font-serif text-lg text-ink">{tierLabel}</h2>
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted-2">
          {prize.tier}
        </span>
      </header>

      <Field
        id={`${prize.tier}-code`}
        label={t('prizes.field.code')}
        value={draft.code}
        onChange={(v) => setDraft((d) => ({ ...d, code: v }))}
        disabled={saving}
      />
      <Field
        id={`${prize.tier}-label-uk`}
        label={t('prizes.field.label_uk')}
        value={draft.label_uk}
        onChange={(v) => setDraft((d) => ({ ...d, label_uk: v }))}
        disabled={saving}
      />
      <Field
        id={`${prize.tier}-label-en`}
        label={t('prizes.field.label_en')}
        value={draft.label_en}
        onChange={(v) => setDraft((d) => ({ ...d, label_en: v }))}
        disabled={saving}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="min-h-5 flex-1 text-xs" aria-live="polite">
          {saving ? (
            <span className="text-muted">{t('prizes.saving')}</span>
          ) : saveError ? (
            <span className="text-danger">{t('prizes.saveError')}</span>
          ) : savedAt && !dirty ? (
            <span className="text-muted">{t('prizes.saved')}</span>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => void onSave()}
          disabled={!dirty || saving}
        >
          {t('prizes.save')}
        </Button>
      </div>
    </section>
  )
}

interface FieldProps {
  id: string
  label: string
  value: string
  onChange(v: string): void
  disabled: boolean
}

function Field({ id, label, value, onChange, disabled }: FieldProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-2">{label}</span>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete="off"
      />
    </label>
  )
}
