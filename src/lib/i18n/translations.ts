/**
 * UI string catalogue for the admin Mini App.
 *
 * Two locales: Ukrainian (`uk`, default) and English (`en`). `uk` is the
 * canonical dictionary — its keys define the `TranslationKey` union and `en`
 * is type-checked to provide every one of them.
 *
 * Values are either a plain string or a small function for interpolation /
 * pluralisation. Look-ups go through `translate()` (see ./index).
 */

export type Language = 'uk' | 'en'

export type TranslationParams = Record<string, string | number>
export type TranslationFn = (params: TranslationParams) => string
export type TranslationEntry = string | TranslationFn

/** Slavic 3-form plural selector (uk, ru-like). */
function plural3(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
  return forms[2]
}

/* ── Ukrainian (canonical) ──────────────────────────────── */

export const uk = {
  // common ----------------------------------------------------
  'common.error': 'Помилка',
  'common.retry': 'Повторити',
  'common.loadFailed': 'Не вдалося завантажити дані. Спробуйте пізніше.',
  'common.noData': 'Немає даних',
  'common.loading': 'Завантаження',

  // sentiment -------------------------------------------------
  'sentiment.positive': 'позитив',
  'sentiment.negative': 'негатив',
  'sentiment.neutral': 'нейтрально',

  // header / shell --------------------------------------------
  'header.back': 'Назад',
  'nav.aria': 'Основна навігація',
  'nav.agentBusy': 'Агент готує відповідь',

  // nav bottom slots ------------------------------------------
  'nav.dashboard': 'Головна',
  'nav.metrics': 'Метрики',
  'nav.topics': 'Теми',
  'nav.clients': 'Клієнти',
  'nav.ask': 'Чат',

  // page titles -----------------------------------------------
  'title.dashboard': 'Зведення',
  'title.metrics': 'Метрики',
  'title.topics': 'Теми',
  'title.clients': 'Клієнти',
  'title.ask': 'Чат',
  'title.settings': 'Налаштування',

  // theme toggle (top-level, kept) ----------------------------
  'themeToggle.auto': 'Тема: авто',
  'themeToggle.light': 'Тема: світла',
  'themeToggle.dark': 'Тема: темна',

  // settings button -------------------------------------------
  'settingsButton.aria': 'Налаштування',

  // settings page ---------------------------------------------
  'settings.loading': 'Завантаження налаштувань…',
  'settings.language.title': 'Мова',
  'settings.language.description': 'Мова інтерфейсу.',
  'settings.language.aria': 'Мова інтерфейсу',
  'settings.language.uk': 'Українська',
  'settings.language.en': 'English',
  'settings.saving': 'Збереження…',
  'settings.saveError': 'Не вдалося зберегти. Зміни скасовано.',

  // date range ------------------------------------------------
  'dateRange.aria': 'Період',
  'dateRange.7d': '7 днів',
  'dateRange.30d': '30 днів',
  'dateRange.90d': '90 днів',
  'dateRange.custom': 'Свій',
  'dateRange.from': 'Від',
  'dateRange.to': 'До',
  'dateRange.apply': 'Застосувати',

  // dashboard -------------------------------------------------
  'dashboard.kpi.sessions': 'Сесій',
  'dashboard.kpi.sessionsCaption': 'за період',
  'dashboard.kpi.avgSentiment': 'Середній sentiment',
  'dashboard.kpi.topics': 'Тем',
  'dashboard.kpi.topicsCaption': 'унікальних',
  'dashboard.kpi.positive': 'Позитив',
  'dashboard.kpi.positiveShare': 'частка',
  'dashboard.kpi.positiveCount': ({ positive, total }: TranslationParams) =>
    `${positive} з ${total}`,
  'dashboard.cards.positive': 'Позитивні',
  'dashboard.cards.negative': 'Негативні',
  'dashboard.top5': 'Топ-5 тем · позитив',

  // topics ----------------------------------------------------
  'topics.tab.positive': 'Позитивні',
  'topics.tab.negative': 'Негативні',
  'topics.top5.aria': 'Топ-5 тем',
  'topics.top5.positive': 'Топ-5 · позитив',
  'topics.top5.negative': 'Топ-5 · негатив',
  'topics.noDataPeriod': 'За період даних немає.',
  'topics.table.topic': 'Тема',
  'topics.table.sentiment': 'Sentiment',
  'topics.table.count': 'К-сть',

  // metrics ---------------------------------------------------
  'metrics.selectMetric': 'Вибрати метрику',
  'metrics.groupBy.aria': 'Групування',
  'metrics.groupBy.day': 'День',
  'metrics.groupBy.week': 'Тиждень',
  'metrics.chartKind.aria': 'Тип графіка',
  'metrics.chartKind.bar': 'Стовпці',
  'metrics.chartKind.donut': 'Кільце',
  'metrics.notFound': ({ label }: TranslationParams) => `Метрика «${label}» не знайдена.`,
  'metrics.textMetric':
    'Текстова метрика — використовуйте «Теми» або «Клієнти» для аналізу.',
  'metrics.noDataForMetric': ({ label }: TranslationParams) =>
    `За метрикою «${label}» даних за період немає.`,
  'metrics.unsupported': 'Непідтримуваний тип метрики.',
  'metrics.avgForPeriod': 'сер. за період',
  'metrics.avgByMetric': ({ label }: TranslationParams) => `Середнє за метрикою «${label}»`,
  'metrics.valuesByDay': 'Значення за днями',
  'metrics.table.day': 'День',
  'metrics.table.avg': 'Середнє',
  'metrics.table.count': 'К-сть',
  'metrics.values': 'значень',
  'metrics.distributionByMetric': ({ label }: TranslationParams) =>
    `Розподіл за метрикою «${label}»`,
  'metrics.donutCenter': 'всього',
  'metrics.total': 'Всього:',
  'metrics.undefined': 'Не визначено:',
  'metrics.categories': 'Категорії',

  // clients ---------------------------------------------------
  'clients.suggestion.1': 'скарги на доставку',
  'clients.suggestion.2': 'хвалять сервіс',
  'clients.suggestion.3': 'довге очікування',
  'clients.suggestion.4': 'постійні гості',
  'clients.search.aria': 'Пошук клієнтів',
  'clients.search.placeholder': 'Опишіть, кого шукаєте…',
  'clients.search.clear': 'Очистити запит',
  'clients.nothingFound': 'Нічого не знайдено.',
  'clients.askOwner': 'Запитайте голосом власника.',
  'clients.semanticHint':
    'Семантичний пошук шукає клієнтів за змістом запиту, а не за іменем чи id.',
  'clients.searching': 'Пошук…',
  'clients.results': ({ count }: TranslationParams) =>
    plural3(Number(count), ['результат', 'результати', 'результатів']),
  'clients.byMeaning': 'за змістом',
  'clients.client': ({ id }: TranslationParams) => `Клієнт ${id}`,
  'clients.anon': 'Анонім',
  'clients.profile.title': 'Профіль клієнта',
  'clients.profile.description':
    'Зведення по клієнту: кількість сесій, середній sentiment, теми.',
  'clients.profile.loading': 'Завантаження профілю…',
  'clients.profile.loadError': 'Профіль не завантажився.',
  'clients.profile.notFound': 'Профіль не знайдено.',
  'clients.profile.lastSession': 'остання сесія',
  'clients.profile.sessions': 'Сесій',
  'clients.profile.topics': 'Теми',
  'clients.profile.recentCards': 'Останні картки',
  'clients.card.noDescription': 'Без опису.',
  'clients.cardSentiment.positive': 'позитивний',
  'clients.cardSentiment.neutral': 'нейтральний',
  'clients.cardSentiment.negative': 'негативний',

  // ask / chat ------------------------------------------------
  'ask.prompt.1': 'Топ-3 скарги за тиждень',
  'ask.prompt.2': 'Зведення за 30 днів',
  'ask.prompt.3': 'Що хвалять клієнти',
  'ask.prompt.4': 'Знайди скарги на швидкість',
  'ask.placeholder': 'Запитайте про метрики або клієнтів…',
  'ask.empty.title': 'Запитайте про дані.',
  'ask.empty.body':
    'Агент сходить у метрики, теми та клієнтів і поверне зведення. Можна перейти на іншу вкладку, поки він рахує — відповідь дочекається вас тут.',
  'ask.failed': 'Не вдалося отримати відповідь.',

  // chat widget ----------------------------------------------
  'chat.placeholder': 'Повідомлення…',
  'chat.message.aria': 'Повідомлення',
  'chat.send': 'Відправити',

  // chart from text ------------------------------------------
  'chart.distribution': 'Розподіл',
  'chart.trend': 'Тренд',
  'chart.sentimentDistribution': 'Розподіл тональностей',
  'chart.comparison': 'Порівняння',
  'chart.share': 'Частка',
  'chart.kpi': 'Показник',

  // root / bootstrap -----------------------------------------
  'root.loginFailed': 'Не вдалося увійти',
  'root.openViaTelegram': 'Відкрийте застосунок через Telegram, щоб отримати initData.',
  'root.authorizing': 'Авторизація…',
  'root.initializing': 'Ініціалізація…',

  // drill-down: clients list ---------------------------------
  'clients.list.sessions': 'сесій',
  'clients.byTopic': 'Клієнти за темою',

  // clients search modes -------------------------------------
  'clients.mode.aria': 'Режим пошуку',
  'clients.mode.semantic': 'Семантичний',
  'clients.mode.name': "За ім'ям",
  'clients.mode.topics': 'За темами',
  'clients.byName.aria': "Пошук за ім'ям або ID",
  'clients.byName.placeholder': "Ім'я або Telegram ID…",
  'clients.byName.hint': "Введіть ім'я клієнта або його Telegram ID.",
  'clients.byTopics.title': 'Теми',
  'clients.byTopics.hint': 'Оберіть одну або кілька тем, щоб знайти клієнтів.',
  'clients.match.aria': 'Режим збігу',
  'clients.match.and': 'усі',
  'clients.match.or': 'будь-яка',

  // sessions list / timeline ---------------------------------
  'sessions.empty': 'Сесій за період немає.',
  'session.title': 'Сесія',
  'session.loading': 'Завантаження сесії…',
  'session.summary': 'Підсумок',
  'session.answers': 'Відповіді',
  'session.transcript': 'Діалог',
  'session.noMessages': 'У цій сесії немає повідомлень.',

  // dashboard drill-down aria labels -------------------------
  'dashboard.drill.sessions': 'Переглянути сесії',
  'dashboard.drill.topics': 'Переглянути теми',
  'dashboard.drill.positiveSessions': 'Переглянути позитивні сесії',
  'dashboard.drill.negativeSessions': 'Переглянути негативні сесії',

  // metrics drill-down ---------------------------------------
  'metrics.byCategory': ({ label }: TranslationParams) => `Клієнти за метрикою «${label}»`,

  // ask-AI markers -------------------------------------------
  'askAi.aria': 'Запитати ШІ',
  'askAi.cta': 'Запитати ШІ про цю вибірку',
  'askAi.dashboard': ({ period }: TranslationParams) =>
    `Дай розгорнутий аналітичний звіт за період ${period}. Включи: загальну кількість сесій, середній sentiment, динаміку по днях, топ-5 позитивних і топ-5 негативних тем. Поясни, що це означає для бізнесу, виділи аномалії та сформулюй 2–3 практичні рекомендації. Додай chart_text з візуалізацією тренду або розподілу.`,
  'askAi.metric': ({ label, period }: TranslationParams) =>
    `Проаналізуй метрику «${label}» за період ${period}. Покажи середнє/розподіл значень, топ-категорії, аномалії та динаміку. Поясни висновки для бізнесу і запропонуй 2 практичні рекомендації. Додай chart_text з візуалізацією розподілу або тренду.`,
  'askAi.topicsList': ({ tone, period, topics }: TranslationParams) =>
    `Проаналізуй топ-5 ${tone} тем за період ${period}: ${topics}. Поясни, що означають ці теми для бізнесу, виділи спільні патерни та які дії варто вжити. Додай chart_text з візуалізацією частоти згадок по темах.`,
  'askAi.tone.positive': 'позитивних',
  'askAi.tone.negative': 'негативних',
  'askAi.answer': ({ question, answer }: TranslationParams) =>
    `Що означає цей фідбек на питання «${question}»: ${answer}. Дай розгорнуту інтерпретацію та порекомендуй дії.`,
  'askAi.summary': ({ text }: TranslationParams) =>
    `Що означає цей фідбек: ${text}. Дай розгорнуту інтерпретацію та порекомендуй дії.`,
} satisfies Record<string, TranslationEntry>

export type TranslationKey = keyof typeof uk

/* ── English ─────────────────────────────────────────────── */

export const en: Record<TranslationKey, TranslationEntry> = {
  'common.error': 'Error',
  'common.retry': 'Retry',
  'common.loadFailed': 'Failed to load data. Please try again later.',
  'common.noData': 'No data',
  'common.loading': 'Loading',

  'sentiment.positive': 'positive',
  'sentiment.negative': 'negative',
  'sentiment.neutral': 'neutral',

  'header.back': 'Back',
  'nav.aria': 'Main navigation',
  'nav.agentBusy': 'Agent is preparing a response',

  'nav.dashboard': 'Home',
  'nav.metrics': 'Metrics',
  'nav.topics': 'Topics',
  'nav.clients': 'Clients',
  'nav.ask': 'Chat',

  'title.dashboard': 'Overview',
  'title.metrics': 'Metrics',
  'title.topics': 'Topics',
  'title.clients': 'Clients',
  'title.ask': 'Chat',
  'title.settings': 'Settings',

  'themeToggle.auto': 'Theme: auto',
  'themeToggle.light': 'Theme: light',
  'themeToggle.dark': 'Theme: dark',

  'settingsButton.aria': 'Settings',

  'settings.loading': 'Loading settings…',
  'settings.language.title': 'Language',
  'settings.language.description': 'Interface language.',
  'settings.language.aria': 'Interface language',
  'settings.language.uk': 'Українська',
  'settings.language.en': 'English',
  'settings.saving': 'Saving…',
  'settings.saveError': "Couldn't save. Changes were reverted.",

  'dateRange.aria': 'Period',
  'dateRange.7d': '7 days',
  'dateRange.30d': '30 days',
  'dateRange.90d': '90 days',
  'dateRange.custom': 'Custom',
  'dateRange.from': 'From',
  'dateRange.to': 'To',
  'dateRange.apply': 'Apply',

  'dashboard.kpi.sessions': 'Sessions',
  'dashboard.kpi.sessionsCaption': 'for the period',
  'dashboard.kpi.avgSentiment': 'Average sentiment',
  'dashboard.kpi.topics': 'Topics',
  'dashboard.kpi.topicsCaption': 'unique',
  'dashboard.kpi.positive': 'Positive',
  'dashboard.kpi.positiveShare': 'share',
  'dashboard.kpi.positiveCount': ({ positive, total }: TranslationParams) =>
    `${positive} of ${total}`,
  'dashboard.cards.positive': 'Positive',
  'dashboard.cards.negative': 'Negative',
  'dashboard.top5': 'Top 5 topics · positive',

  'topics.tab.positive': 'Positive',
  'topics.tab.negative': 'Negative',
  'topics.top5.aria': 'Top 5 topics',
  'topics.top5.positive': 'Top 5 · positive',
  'topics.top5.negative': 'Top 5 · negative',
  'topics.noDataPeriod': 'No data for this period.',
  'topics.table.topic': 'Topic',
  'topics.table.sentiment': 'Sentiment',
  'topics.table.count': 'Count',

  'metrics.selectMetric': 'Select metric',
  'metrics.groupBy.aria': 'Grouping',
  'metrics.groupBy.day': 'Day',
  'metrics.groupBy.week': 'Week',
  'metrics.chartKind.aria': 'Chart type',
  'metrics.chartKind.bar': 'Bars',
  'metrics.chartKind.donut': 'Ring',
  'metrics.notFound': ({ label }: TranslationParams) => `Metric “${label}” not found.`,
  'metrics.textMetric': 'Text metric — use “Topics” or “Clients” to analyse it.',
  'metrics.noDataForMetric': ({ label }: TranslationParams) =>
    `No data for metric “${label}” in this period.`,
  'metrics.unsupported': 'Unsupported metric type.',
  'metrics.avgForPeriod': 'avg for period',
  'metrics.avgByMetric': ({ label }: TranslationParams) => `Average for metric “${label}”`,
  'metrics.valuesByDay': 'Values by day',
  'metrics.table.day': 'Day',
  'metrics.table.avg': 'Average',
  'metrics.table.count': 'Count',
  'metrics.values': 'values',
  'metrics.distributionByMetric': ({ label }: TranslationParams) =>
    `Distribution for metric “${label}”`,
  'metrics.donutCenter': 'total',
  'metrics.total': 'Total:',
  'metrics.undefined': 'Undefined:',
  'metrics.categories': 'Categories',

  'clients.suggestion.1': 'delivery complaints',
  'clients.suggestion.2': 'praise the service',
  'clients.suggestion.3': 'long wait',
  'clients.suggestion.4': 'regular guests',
  'clients.search.aria': 'Search clients',
  'clients.search.placeholder': 'Describe who you’re looking for…',
  'clients.search.clear': 'Clear query',
  'clients.nothingFound': 'Nothing found.',
  'clients.askOwner': 'Ask in the owner’s voice.',
  'clients.semanticHint':
    'Semantic search finds clients by the meaning of your query, not by name or id.',
  'clients.searching': 'Searching…',
  'clients.results': ({ count }: TranslationParams) =>
    Number(count) === 1 ? 'result' : 'results',
  'clients.byMeaning': 'by meaning',
  'clients.client': ({ id }: TranslationParams) => `Client ${id}`,
  'clients.anon': 'Anon',
  'clients.profile.title': 'Client profile',
  'clients.profile.description':
    'Client summary: number of sessions, average sentiment, topics.',
  'clients.profile.loading': 'Loading profile…',
  'clients.profile.loadError': 'Failed to load profile.',
  'clients.profile.notFound': 'Profile not found.',
  'clients.profile.lastSession': 'last session',
  'clients.profile.sessions': 'Sessions',
  'clients.profile.topics': 'Topics',
  'clients.profile.recentCards': 'Recent cards',
  'clients.card.noDescription': 'No description.',
  'clients.cardSentiment.positive': 'positive',
  'clients.cardSentiment.neutral': 'neutral',
  'clients.cardSentiment.negative': 'negative',

  'ask.prompt.1': 'Top 3 complaints this week',
  'ask.prompt.2': 'Overview for 30 days',
  'ask.prompt.3': 'What do clients praise',
  'ask.prompt.4': 'Find complaints about speed',
  'ask.placeholder': 'Ask about metrics or clients…',
  'ask.empty.title': 'Ask about your data.',
  'ask.empty.body':
    'The agent will look into metrics, topics and clients and return a summary. You can switch to another tab while it works — the answer will wait for you here.',
  'ask.failed': 'Couldn’t get a response.',

  'chat.placeholder': 'Message…',
  'chat.message.aria': 'Message',
  'chat.send': 'Send',

  'chart.distribution': 'Distribution',
  'chart.trend': 'Trend',
  'chart.sentimentDistribution': 'Sentiment distribution',
  'chart.comparison': 'Comparison',
  'chart.share': 'Share',
  'chart.kpi': 'Metric',

  'root.loginFailed': 'Failed to sign in',
  'root.openViaTelegram': 'Open the app via Telegram to obtain initData.',
  'root.authorizing': 'Authorizing…',
  'root.initializing': 'Initializing…',

  'clients.list.sessions': 'sessions',
  'clients.byTopic': 'Clients by topic',

  'clients.mode.aria': 'Search mode',
  'clients.mode.semantic': 'Semantic',
  'clients.mode.name': 'By name',
  'clients.mode.topics': 'By topics',
  'clients.byName.aria': 'Search by name or ID',
  'clients.byName.placeholder': 'Name or Telegram ID…',
  'clients.byName.hint': 'Enter a client name or their Telegram ID.',
  'clients.byTopics.title': 'Topics',
  'clients.byTopics.hint': 'Pick one or more topics to find clients.',
  'clients.match.aria': 'Match mode',
  'clients.match.and': 'all',
  'clients.match.or': 'any',

  'sessions.empty': 'No sessions for this period.',
  'session.title': 'Session',
  'session.loading': 'Loading session…',
  'session.summary': 'Summary',
  'session.answers': 'Answers',
  'session.transcript': 'Transcript',
  'session.noMessages': 'This session has no messages.',

  'dashboard.drill.sessions': 'View sessions',
  'dashboard.drill.topics': 'View topics',
  'dashboard.drill.positiveSessions': 'View positive sessions',
  'dashboard.drill.negativeSessions': 'View negative sessions',

  'metrics.byCategory': ({ label }: TranslationParams) => `Clients for metric “${label}”`,

  'askAi.aria': 'Ask AI',
  'askAi.cta': 'Ask AI about this selection',
  'askAi.dashboard': ({ period }: TranslationParams) =>
    `Give a detailed analytical report for the period ${period}. Include: total session count, average sentiment, daily dynamics, top-5 positive and top-5 negative topics. Explain what this means for the business, highlight anomalies, and suggest 2–3 practical recommendations. Add chart_text visualising the trend or distribution.`,
  'askAi.metric': ({ label, period }: TranslationParams) =>
    `Analyse the metric “${label}” for the period ${period}. Show average / distribution of values, top categories, anomalies, and dynamics. Explain the business takeaway and suggest 2 practical recommendations. Add chart_text visualising the distribution or trend.`,
  'askAi.topicsList': ({ tone, period, topics }: TranslationParams) =>
    `Analyse the top-5 ${tone} topics for the period ${period}: ${topics}. Explain what these topics mean for the business, highlight shared patterns, and suggest actions. Add chart_text visualising the mention frequency per topic.`,
  'askAi.tone.positive': 'positive',
  'askAi.tone.negative': 'negative',
  'askAi.answer': ({ question, answer }: TranslationParams) =>
    `What does this feedback to the question “${question}” mean: ${answer}. Give a detailed interpretation and recommend actions.`,
  'askAi.summary': ({ text }: TranslationParams) =>
    `What does this feedback mean: ${text}. Give a detailed interpretation and recommend actions.`,
}

export const translations: Record<Language, Record<TranslationKey, TranslationEntry>> = {
  uk,
  en,
}
