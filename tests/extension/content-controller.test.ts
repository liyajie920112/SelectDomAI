import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentController } from '../../src/extension/content-controller';

describe('ContentController', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('copies only the selected element outerHTML as soon as an element is locked', async () => {
    document.body.innerHTML = '<main><button id="target">Pick me</button></main>';
    const target = document.querySelector('#target') as HTMLElement;
    const writeText = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(window, 'getComputedStyle').mockReturnValue(
      {
        getPropertyValue: () => ''
      } as unknown as CSSStyleDeclaration
    );
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    });

    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 100,
      height: 32,
      top: 0,
      left: 0,
      right: 100,
      bottom: 32,
      toJSON: () => ({})
    });

    const controller = new ContentController({ window, document });

    controller.mount();
    const highlight = document.querySelector('[data-select-dom-ai="highlight"]') as HTMLDivElement;
    const trigger = document.querySelector('[data-select-dom-ai="trigger"]') as HTMLButtonElement;
    trigger.click();
    target.dispatchEvent(new window.MouseEvent('mousemove', { bubbles: true }));
    target.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });
    expect(writeText.mock.calls[0]?.[0]).toBe('<button id="target">Pick me</button>');
    expect(highlight.style.display).toBe('none');
  });

  it('renders only a draggable floating trigger without the old panel controls', () => {
    const controller = new ContentController({ window, document });

    controller.mount();

    const trigger = document.querySelector('[data-select-dom-ai="trigger"]') as HTMLButtonElement;
    const summary = document.querySelector('[data-select-dom-ai="summary"]');
    const toggle = document.querySelector('[data-select-dom-ai="toggle"]');
    const cancelButton = Array.from(document.querySelectorAll('button')).find((node) =>
      node.textContent?.includes('Cancel')
    );

    expect(trigger).toBeTruthy();
    expect(summary).toBeNull();
    expect(toggle).toBeNull();
    expect(cancelButton).toBeUndefined();
  });

  it('can be dragged to a new position from the floating trigger', () => {
    const controller = new ContentController({ window, document });

    controller.mount();

    const root = document.querySelector('[data-select-dom-ai="root"]') as HTMLDivElement;
    const dragHandle = document.querySelector('[data-select-dom-ai="trigger"]') as HTMLButtonElement;
    const initialLeft = root.style.left;
    const initialTop = root.style.top;

    dragHandle.dispatchEvent(
      new window.MouseEvent('mousedown', {
        bubbles: true,
        clientX: 900,
        clientY: 600
      })
    );

    document.dispatchEvent(
      new window.MouseEvent('mousemove', {
        bubbles: true,
        clientX: 760,
        clientY: 420
      })
    );

    document.dispatchEvent(
      new window.MouseEvent('mouseup', {
        bubbles: true,
        clientX: 760,
        clientY: 420
      })
    );

    expect(root.style.left).not.toBe(initialLeft);
    expect(root.style.top).not.toBe(initialTop);
  });
});
