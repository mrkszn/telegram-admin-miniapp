import { useT, type Translator } from '@/lib/i18n'
import type { JourneyBeat, MealOccasion, SessionJourney } from '@/lib/api/types'

const MEAL_KEYS = {
  breakfast: 'journey.meal.breakfast',
  lunch: 'journey.meal.lunch',
  dinner: 'journey.meal.dinner',
  other: 'journey.meal.other',
} as const satisfies Record<MealOccasion, Parameters<Translator>[0]>

interface JourneyRibbonProps {
  journey: SessionJourney
}

export function JourneyRibbon({ journey }: JourneyRibbonProps) {
  const t = useT()
  const modeKey =
    journey.mode === 'targeted' ? 'journey.mode.targeted' : 'journey.mode.non_targeted'

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-3.5">
      <header className="flex flex-wrap items-center gap-2">
        <span className="inline-flex rounded-tag bg-brand-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-on-soft">
          {t(modeKey)}
        </span>
        {journey.meal_occasion ? (
          <span className="text-[12.5px] text-muted-2">
            {t('journey.meal.label')}: {t(MEAL_KEYS[journey.meal_occasion])}
          </span>
        ) : null}
      </header>

      <ol className="flex list-none flex-col gap-2.5 p-0">
        {journey.beats.map((beat, i) => (
          <li key={`${beat.label_uk}|${i}`}>
            <BeatRow beat={beat} />
          </li>
        ))}
      </ol>
    </div>
  )
}

function BeatRow({ beat }: { beat: JourneyBeat }) {
  const t = useT()
  const score = beat.score == null ? t('journey.beat.noScore') : t('journey.beat.score', { score: beat.score })
  const transcription = beat.transcription_uk?.trim()

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[13.5px] leading-snug text-ink">
        <span aria-hidden="true" className="mr-1.5">
          {beat.emoji}
        </span>
        <span className="font-medium">{beat.label_uk}</span>
        <span className="text-muted">: </span>
        <span className="font-mono text-[12.5px] text-ink-2">{score}</span>
        {transcription ? (
          <>
            <span className="text-muted"> — </span>
            <span className="text-ink-2">{transcription}</span>
          </>
        ) : null}
      </p>
      {beat.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {beat.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-tag bg-surface-2 px-2 py-0.5 text-[11px] text-ink-2"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
