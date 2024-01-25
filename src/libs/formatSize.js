export function formatSize(size, kilo = 1024) {
  if (size < 0.9 * kilo) {
    return size.toFixed() + 'B'
  }

  const KB = size / kilo
  if (KB < 0.9 * kilo) {
    return KB.toFixed(1) + 'k'
  }

  const MB = KB / kilo
  if (MB < 0.9 * kilo) {
    return MB.toFixed(1) + 'M'
  }

  const GB = MB / kilo
  if (GB < 0.9 * kilo) {
    return GB.toFixed(1) + 'G'
  }

  const TB = GB / kilo
  return TB.toFixed(1) + 'T'
}