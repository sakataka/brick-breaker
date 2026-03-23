export function getRequiredElement<T extends Element>(
  root: Document | HTMLElement,
  selector: string,
  message: string,
): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(message);
  }
  return element;
}
