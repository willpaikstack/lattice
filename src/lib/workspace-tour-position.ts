type Rect = { left: number; top: number; width: number; height: number };
type Size = { width: number; height: number };

/** Prefer a nearby free edge, keeping the coach on screen when space is limited. */
export function workspaceTourPosition(target: Rect, coach: Size, viewport: Size, preferLeft = false) {
  const margin = 16;
  const gap = 18;
  const right = target.left + target.width;
  const bottom = target.top + target.height;
  const besideRight = { left: right + gap, top: target.top };
  const besideLeft = { left: target.left - coach.width - gap, top: target.top };
  const below = { left: target.left, top: bottom + gap };
  const above = { left: target.left, top: target.top - coach.height - gap };
  const candidates = preferLeft ? [besideLeft, below, above, besideRight] : [besideRight, besideLeft, below, above];
  const clamp = (value: number, size: number, available: number) => Math.max(margin, Math.min(value, available - size - margin));
  return candidates.map((candidate, priority) => {
    const left = clamp(candidate.left, coach.width, viewport.width);
    const top = clamp(candidate.top, coach.height, viewport.height);
    const overlap = Math.max(0, Math.min(left + coach.width, right) - Math.max(left, target.left))
      * Math.max(0, Math.min(top + coach.height, bottom) - Math.max(top, target.top));
    return { left, top, score: overlap + priority / 10 };
  }).reduce((best, candidate) => candidate.score < best.score ? candidate : best);
}
