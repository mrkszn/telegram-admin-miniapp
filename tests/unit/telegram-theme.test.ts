import { describe, it, expect, beforeEach } from 'vitest'
import { applyTelegramTheme } from '@/lib/telegram/theme'

describe('applyTelegramTheme', () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.createElement('div')
  })

  it('writes raw --tg-theme-* variables for every provided param', () => {
    applyTelegramTheme(
      { bg_color: '#101010', text_color: '#ffffff', accent_text_color: '#06b6d4' },
      'dark',
      { root },
    )
    expect(root.style.getPropertyValue('--tg-theme-bg-color')).toBe('#101010')
    expect(root.style.getPropertyValue('--tg-theme-text-color')).toBe('#ffffff')
    expect(root.style.getPropertyValue('--tg-theme-accent-text-color')).toBe('#06b6d4')
  })

  it('overrides token vars so existing utility classes follow Telegram chrome', () => {
    applyTelegramTheme(
      {
        bg_color: '#222222',
        secondary_bg_color: '#333333',
        section_bg_color: '#444444',
        text_color: '#eeeeee',
        button_color: '#7c3aed',
        button_text_color: '#ffffff',
      },
      'light',
      { root },
    )
    expect(root.style.getPropertyValue('--bg')).toBe('#222222')
    expect(root.style.getPropertyValue('--surface-2')).toBe('#333333')
    expect(root.style.getPropertyValue('--surface')).toBe('#444444')
    expect(root.style.getPropertyValue('--ink')).toBe('#eeeeee')
    expect(root.style.getPropertyValue('--primary')).toBe('#7c3aed')
  })

  it('sets data-theme attribute from the colour scheme', () => {
    applyTelegramTheme({ bg_color: '#000' }, 'dark', { root })
    expect(root.getAttribute('data-theme')).toBe('dark')
  })

  it('falls through cleanly with no params', () => {
    const result = applyTelegramTheme(undefined, 'light', { root })
    expect(result.scheme).toBe('light')
    expect(result.applied).toEqual({})
  })

  it('ignores empty-string param values', () => {
    applyTelegramTheme({ bg_color: '', text_color: '#fff' }, 'light', { root })
    expect(root.style.getPropertyValue('--bg')).toBe('')
    expect(root.style.getPropertyValue('--ink')).toBe('#fff')
  })

  it('with overrideTokens=false: skips token overrides AND clears prior ones', () => {
    // Pre-seed the root with values left from a prior Telegram update.
    root.style.setProperty('--bg', '#222222')
    root.style.setProperty('--surface', '#333333')
    applyTelegramTheme(
      { bg_color: '#aaaaaa', section_bg_color: '#bbbbbb', accent_text_color: '#06b6d4' },
      'dark',
      { root, overrideTokens: false },
    )
    // Token vars are reset so CSS rules from [data-theme='dark'] can win.
    expect(root.style.getPropertyValue('--bg')).toBe('')
    expect(root.style.getPropertyValue('--surface')).toBe('')
    // But raw --tg-theme-* still exposed for opt-in consumers.
    expect(root.style.getPropertyValue('--tg-theme-bg-color')).toBe('#aaaaaa')
    expect(root.style.getPropertyValue('--tg-theme-accent-text-color')).toBe('#06b6d4')
    expect(root.getAttribute('data-theme')).toBe('dark')
  })
})
