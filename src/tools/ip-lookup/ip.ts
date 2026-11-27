export function lookupAddress(input: string) {
  const value = input.trim().toLowerCase()
  if (/^[0-9.]+$/.test(value)) {
    const parts = value.split(".")
    if (parts.length !== 4 || parts.some((p) => !/^(0|[1-9]\d{0,2})$/.test(p) || Number(p) > 255))
      return null
    const [a, b, c] = parts.map(Number)
    let scope = "Public address range"
    if (a === 10 || (a === 172 && b! >= 16 && b! <= 31) || (a === 192 && b === 168))
      scope = "Private network"
    else if (a === 127) scope = "Loopback"
    else if (a === 169 && b === 254) scope = "Link-local"
    else if (a === 100 && b! >= 64 && b! <= 127) scope = "Shared carrier network"
    else if (
      (a === 192 && b === 0 && c === 2) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113)
    )
      scope = "Documentation"
    else if (a! >= 224 && a! < 240) scope = "Multicast"
    else if (
      a === 0 ||
      a! >= 240 ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 192 && b === 0 && c === 0)
    )
      scope = "Special-use range"
    return { version: "IPv4", value, scope }
  }
  if (!value.includes(":") || !/^[\da-f:.]+$/.test(value)) return null
  try {
    const addr = new URL("http://[" + value + "]").hostname.slice(1, -1)
    const scope =
      addr === "::1"
        ? "Loopback"
        : addr === "::"
          ? "Unspecified"
          : /^f[cd]/.test(addr)
            ? "Private network"
            : /^fe[89ab]/.test(addr)
              ? "Link-local"
              : addr.startsWith("ff")
                ? "Multicast"
                : addr.startsWith("2001:db8:")
                  ? "Documentation"
                  : addr.startsWith("::ffff:")
                    ? "IPv4-mapped"
                    : /^[23]/.test(addr)
                      ? "Global unicast range"
                      : "Special-use range"
    return { value: addr, version: "IPv6", scope }
  } catch {
    return null
  }
}
