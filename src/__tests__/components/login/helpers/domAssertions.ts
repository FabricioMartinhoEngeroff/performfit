import { expect } from "vitest";

export function expectAttributes(element: HTMLElement, attributes: Record<string, string>) {
  for (const [name, value] of Object.entries(attributes)) {
    expect(element, name).toHaveAttribute(name, value);
  }
}

export function expectFieldError(field: HTMLElement, message: string) {
  expect(field).toHaveAttribute("aria-invalid", "true");
  const describedBy = field.getAttribute("aria-describedby");
  expect(describedBy, "aria-describedby").toBeTruthy();
  expect(document.getElementById(describedBy!)).toHaveTextContent(message);
}

export function expectBusy(button: HTMLElement) {
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
}

export function expectSecretOnlyInValueOf(
  container: HTMLElement,
  secret: string,
  valueFields: HTMLElement[],
) {
  expect(container.textContent).not.toContain(secret);
  for (const element of Array.from(container.querySelectorAll("*"))) {
    for (const attribute of Array.from(element.attributes)) {
      const isAllowedValue =
        attribute.name === "value" && valueFields.includes(element as HTMLElement);
      if (!isAllowedValue) {
        expect(attribute.value, `${element.tagName}[${attribute.name}]`).not.toContain(secret);
      }
    }
  }
}