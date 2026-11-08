export type DarkThemePreset = 'warm-dark' | 'oled-dark' | 'system-dark';

export interface ThemePresetOption {
  id: DarkThemePreset;
  name: string;
  shortName: string;
  icon: string;
  desc: string;
  badge: string;
}

export const THEME_PRESETS: ThemePresetOption[] = [
  {
    id: 'warm-dark',
    name: 'Warm Eye-Friendly Dark',
    shortName: 'Warm Dark',
    icon: '🌙',
    desc: 'Soft espresso & warm charcoal with reduced blue light for fatigue-free listening',
    badge: 'Eye-Friendly'
  },
  {
    id: 'oled-dark',
    name: 'OLED True Pitch Black',
    shortName: 'OLED Black',
    icon: '🖤',
    desc: 'Pure pitch black #000000 pixels for true OLED contrast and battery savings',
    badge: 'OLED'
  },
  {
    id: 'system-dark',
    name: 'System Default Dark',
    shortName: 'System',
    icon: '💻',
    desc: 'Balanced neutral dark tone synchronized with your operating system theme',
    badge: 'Auto'
  }
];

export function applyTheme(preset: DarkThemePreset): void {
  document.documentElement.setAttribute('data-theme', preset);
  localStorage.setItem('aura_theme_preset', preset);

  // Update meta theme-color for browser bar and mobile header
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    if (preset === 'oled-dark') {
      metaTheme.setAttribute('content', '#000000');
    } else if (preset === 'system-dark') {
      metaTheme.setAttribute('content', '#100f0e');
    } else {
      metaTheme.setAttribute('content', '#0c0a09');
    }
  }
}

export function getInitialTheme(): DarkThemePreset {
  const saved = localStorage.getItem('aura_theme_preset') as DarkThemePreset;
  if (saved && ['warm-dark', 'oled-dark', 'system-dark'].includes(saved)) {
    return saved;
  }
  return 'warm-dark';
}
