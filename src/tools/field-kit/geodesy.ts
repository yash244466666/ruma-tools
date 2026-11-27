export function distanceBearing(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const rad = Math.PI / 180
  const a = from.latitude * rad,
    b = to.latitude * rad,
    d = (to.longitude - from.longitude) * rad
  const h = Math.sin((b - a) / 2) ** 2 + Math.cos(a) * Math.cos(b) * Math.sin(d / 2) ** 2
  const distance = 12742000 * Math.asin(Math.sqrt(Math.min(1, h)))
  const bearing =
    (Math.atan2(
      Math.sin(d) * Math.cos(b),
      Math.cos(a) * Math.sin(b) - Math.sin(a) * Math.cos(b) * Math.cos(d),
    ) /
      rad +
      360) %
    360
  return { distance, bearing }
}
