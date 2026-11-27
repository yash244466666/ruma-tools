import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { GeneratedTextFile } from "@/components/ui/GeneratedTextFile"
import { Field } from "@/components/ui/Field"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { buildVcard } from "./vcard"

export default function VcardGenerator() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [organization, setOrganization] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [url, setUrl] = useState("")
  const [address, setAddress] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")

  function generate() {
    const result = buildVcard({
      firstName,
      lastName,
      organization,
      phone,
      email,
      url,
      address,
    })
    if (result.status === "error") {
      setOutput("")
      setError(result.message)
      return
    }
    setError("")
    setOutput(result.card)
  }

  function reset() {
    setFirstName("")
    setLastName("")
    setOrganization("")
    setPhone("")
    setEmail("")
    setUrl("")
    setAddress("")
    setOutput("")
    setError("")
  }

  return (
    <div className="grid gap-4">
      <ToolPanel title="Contact details">
        <div
          className="grid gap-3"
          onChange={() => {
            setOutput("")
            setError("")
          }}
        >
          <Field
            error={error === "" ? undefined : error}
            hint="At least one name is required. Escaping follows RFC 2426: semicolons, commas, backslashes, and newlines are safe."
            htmlFor="vcard-first-name"
            label="First name"
          >
            <input
              className="app-input"
              id="vcard-first-name"
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Ada"
              value={firstName}
            />
          </Field>
          <Field htmlFor="vcard-last-name" label="Last name">
            <input
              className="app-input"
              id="vcard-last-name"
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Lovelace"
              value={lastName}
            />
          </Field>
          <Field htmlFor="vcard-organization" label="Organization (optional)">
            <input
              className="app-input"
              id="vcard-organization"
              onChange={(event) => setOrganization(event.target.value)}
              placeholder="Acme Inc."
              value={organization}
            />
          </Field>
          <Field htmlFor="vcard-phone" label="Phone (optional)">
            <input
              className="app-input"
              id="vcard-phone"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+880 1XX XXX XXXX"
              value={phone}
            />
          </Field>
          <Field htmlFor="vcard-email" label="Email (optional)">
            <input
              className="app-input"
              id="vcard-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ada@example.com"
              value={email}
            />
          </Field>
          <Field
            hint="Only https links are included."
            htmlFor="vcard-url"
            label="Website (optional)"
          >
            <input
              className="app-input"
              id="vcard-url"
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              value={url}
            />
          </Field>
          <Field htmlFor="vcard-address" label="Address (optional)">
            <input
              className="app-input"
              id="vcard-address"
              onChange={(event) => setAddress(event.target.value)}
              placeholder="1 Main St, City, Country"
              value={address}
            />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={generate}>Generate vCard</Button>
          <Button onClick={reset} variant="quiet">
            Clear
          </Button>
        </div>
      </ToolPanel>

      {output !== "" ? (
        <GeneratedTextFile
          key={output}
          name="contact.vcf"
          mimeType="text/vcard"
          copyLabel="Copy vCard"
          content={output}
        />
      ) : null}

      <p className="text-xs leading-5 text-[var(--text-secondary)]">
        Save the .vcf file to import this card into your contacts.
      </p>
    </div>
  )
}
