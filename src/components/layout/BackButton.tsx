import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTelegram } from '@/lib/telegram/sdk'

interface BackButtonProps {
  /** If true, hide native BackButton when this component unmounts. */
  visible?: boolean
  /** Optional override — defaults to navigate(-1). */
  onClick?: () => void
}

/**
 * Bridges Telegram's native BackButton to react-router. Renders nothing
 * itself — Telegram chrome owns the pixels. When `visible` is true and
 * we're inside Telegram, the native button shows; otherwise no-op.
 */
export function BackButton({ visible = true, onClick }: BackButtonProps) {
  const navigate = useNavigate()
  useEffect(() => {
    const tg = getTelegram()
    if (!tg) return
    const handler = onClick ?? (() => navigate(-1))
    if (visible) {
      tg.BackButton.show()
      tg.BackButton.onClick(handler)
    } else {
      tg.BackButton.hide()
    }
    return () => {
      tg.BackButton.offClick(handler)
      tg.BackButton.hide()
    }
  }, [visible, onClick, navigate])
  return null
}
