import { lookupAddress } from "./ip"
it.each([
  ["172.16.0.1", "Private network"],
  ["172.32.0.1", "Public address range"],
  ["2001:db8::1", "Documentation"],
  ["fe80::1", "Link-local"],
  ["::1", "Loopback"],
])("classifies %s", (input, scope) => expect(lookupAddress(input)?.scope).toBe(scope))
it.each(["01.2.3.4", "bad:port", "256.1.1.1", "10.2.3.4/path"])("rejects %s", (v) =>
  expect(lookupAddress(v)).toBeNull(),
)
