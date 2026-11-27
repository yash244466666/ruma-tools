export function displayVector(values: readonly number[], angle: number): readonly number[] {
  if (values.length !== 3) return values
  const [x, y, z] = values as [number, number, number]
  switch (((angle % 360) + 360) % 360) {
    case 90:
      return [-y, x, z]
    case 180:
      return [-x, -y, z]
    case 270:
      return [y, -x, z]
    default:
      return values
  }
}
