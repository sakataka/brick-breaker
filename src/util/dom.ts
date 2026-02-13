export function getRequiredElement<T extends Element>(
  root: Document | HTMLElement,
  selector: string,
  message: string,
): T {
  const element = root.querySelector(selector) as T | null;
  if (!element) {
    throw new Error(message);
  }
  return element;
}
