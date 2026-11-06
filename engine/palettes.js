// 三套基础视觉预设。每期可在 episode.json 里用 palette 字段选择，
// 也可以在 scenes 里按需覆盖局部颜色。所有颜色都集中在引擎里，便于统一改。
export const palettes = {
  // 科学：深蓝黑 + 金色高光 + 冷青辅色（教程「深海/光纤」气质的通用版）
  science: {
    id: 'science',
    bg0: '#02040A',
    bg1: '#07182A',
    bgType: 'stars',
    vignette: 0.5,
    text: '#F4F7FB',
    muted: '#8FA3B8',
    accent: '#FFC15E',
    accent2: '#7FD0FF',
    danger: '#FF6B6B',
    grid: 'rgba(127,208,255,0.08)',
    paper: '#0B1B2A',
    ink: '#F4F7FB',
    fontTitle: '"Noto Serif SC", serif',
    fontBody: '"Noto Sans SC", sans-serif',
    subtitleColor: '#FFFFFF',
    subtitleHighlight: '#FFC15E',
    subtitleShadow: 'rgba(0,0,0,0.95)',
    titleColor: '#FFF3DC',
    titleGlow: 'rgba(255,170,70,0.55)',
  },

  // 历史：深琥珀 + 羊皮纸 + 旧金 + 铁锈红（K35 旧学院风的深色舞台版）
  history: {
    id: 'history',
    bg0: '#120E0A',
    bg1: '#2A1C10',
    bgType: 'paper',
    vignette: 0.48,
    text: '#F2E7D3',
    muted: '#B09A7A',
    accent: '#D8A84E',
    accent2: '#9B4A32',
    danger: '#B5483A',
    grid: 'rgba(216,168,78,0.07)',
    paper: '#E8D6B3',
    ink: '#2B2118',
    fontTitle: '"Noto Serif SC", serif',
    fontBody: '"Noto Sans SC", sans-serif',
    subtitleColor: '#FFF6E6',
    subtitleHighlight: '#FFC15E',
    subtitleShadow: 'rgba(0,0,0,0.95)',
    titleColor: '#F8E8C8',
    titleGlow: 'rgba(216,168,78,0.5)',
  },

  // 投资：墨绿黑 + 奶油纸卡 + 红蓝铅笔（L40 数据叙事的深色舞台版）
  investing: {
    id: 'investing',
    bg0: '#07110D',
    bg1: '#10231B',
    bgType: 'grid',
    vignette: 0.5,
    text: '#F3EFE3',
    muted: '#93A89A',
    accent: '#E0B15C',
    accent2: '#D35F4A',
    accent3: '#5B8FD6',
    danger: '#D35F4A',
    grid: 'rgba(224,177,92,0.06)',
    paper: '#F4EBDD',
    ink: '#1F2933',
    fontTitle: '"Noto Serif SC", serif',
    fontBody: '"Noto Sans SC", sans-serif',
    subtitleColor: '#FFF9EC',
    subtitleHighlight: '#FFC15E',
    subtitleShadow: 'rgba(0,0,0,0.95)',
    titleColor: '#FFF3DC',
    titleGlow: 'rgba(224,177,92,0.5)',
  },
};

export function getPalette(id) {
  return palettes[id] || palettes.science;
}
