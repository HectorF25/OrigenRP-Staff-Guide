export const FM_PROJECT_ID = process.env.NEXT_PUBLIC_FM_PROJECT_ID || '69d387c0267b3f52186f4eb5';

export function fmtTime(ts) {
  try {
    return new Intl.DateTimeFormat('es', {
      dateStyle: 'short', timeStyle: 'medium', timeZone: 'UTC',
    }).format(new Date(ts));
  } catch { return ts; }
}

export function fmtTimeRelative(ts) {
  try {
    const diff  = Date.now() - new Date(ts).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins  < 1)  return 'ahora';
    if (mins  < 60) return `hace ${mins}m`;
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${days}d`;
  } catch { return ts; }
}

export function embedColorToCss(color) {
  if (color == null) return undefined;
  return `#${color.toString(16).padStart(6, '0')}`;
}

export function levelLabel(level) {
  return (level ?? 'INFO').toUpperCase().slice(0, 5);
}

export function levelPillClass(level) {
  switch (level) {
    case 'error': return 'pr';
    case 'warn':  return 'py';
    case 'info':  return 'pb';
    default:      return 'pc';
  }
}

export function levelBorderVar(level) {
  switch (level) {
    case 'error': return 'var(--red)';
    case 'warn':  return 'var(--yellow)';
    case 'info':  return 'var(--blue)';
    default:      return 'var(--cyan)';
  }
}

export function getPopulatedChannel(log) {
  if (typeof log.channelId === 'object' && log.channelId !== null) return log.channelId;
  return null;
}

export function getCategory(log) {
  const ch = getPopulatedChannel(log);
  if (!ch) return null;
  if (typeof ch.categoryId === 'object') return ch.categoryId;
  return null;
}

export function groupLogsByCategory(logs) {
  const map = new Map();
  for (const log of logs) {
    const ch  = getPopulatedChannel(log);
    const cat = getCategory(log);
    if (!ch || !cat) continue;
    if (!map.has(cat._id)) {
      map.set(cat._id, { categoryId: cat._id, categoryName: cat.name, channels: new Map() });
    }
    const catGroup = map.get(cat._id);
    if (!catGroup.channels.has(ch._id)) {
      catGroup.channels.set(ch._id, { channelId: ch._id, channelName: ch.name, logs: [] });
    }
    catGroup.channels.get(ch._id).logs.push(log);
  }
  return [...map.values()].map(g => ({ ...g, channels: [...g.channels.values()] }));
}
