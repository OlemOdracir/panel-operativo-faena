import '@testing-library/jest-dom/vitest';

// jsdom 30 cannot resolve a few CSS custom-property font expressions emitted by Emotion.
// Keep accessibility queries deterministic while preserving the real computed style when it works.
const nativeGetComputedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = ((element: Element, pseudoElement?: string | null) => {
  try {
    return nativeGetComputedStyle(element, pseudoElement);
  } catch {
    return {
      display: 'block',
      visibility: 'visible',
      opacity: '1',
      getPropertyValue: () => '',
    } as unknown as CSSStyleDeclaration;
  }
}) as typeof window.getComputedStyle;
