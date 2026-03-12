type ContentControllerOptions = {
  window: Window;
  document: Document;
};

const TRIGGER_SIZE = 42;
const VIEWPORT_MARGIN = 16;

export class ContentController {
  private readonly window: Window;
  private readonly document: Document;
  private root: HTMLDivElement | null = null;
  private triggerNode: HTMLButtonElement | null = null;
  private highlightNode: HTMLDivElement | null = null;
  private isSelecting = false;
  private isDragging = false;
  private hoveredElement: HTMLElement | null = null;
  private selectedElement: HTMLElement | null = null;
  private currentLeft = 0;
  private currentTop = 0;
  private dragOriginLeft = 0;
  private dragOriginTop = 0;
  private dragStartX = 0;
  private dragStartY = 0;
  private readonly handleMouseMoveBound: (event: MouseEvent) => void;
  private readonly handleClickBound: (event: MouseEvent) => void;
  private readonly handleKeyDownBound: (event: KeyboardEvent) => void;
  private readonly handleDragMoveBound: (event: MouseEvent) => void;
  private readonly handleDragEndBound: () => void;

  constructor(options: ContentControllerOptions) {
    this.window = options.window;
    this.document = options.document;
    this.handleMouseMoveBound = (event) => this.handleMouseMove(event);
    this.handleClickBound = (event) => this.handleClick(event);
    this.handleKeyDownBound = (event) => this.handleKeyDown(event);
    this.handleDragMoveBound = (event) => this.handleDragMove(event);
    this.handleDragEndBound = () => this.handleDragEnd();
  }

  mount() {
    if (this.root) {
      return;
    }

    this.currentLeft = Math.max(
      VIEWPORT_MARGIN,
      this.window.innerWidth - TRIGGER_SIZE - VIEWPORT_MARGIN
    );
    this.currentTop = Math.max(
      VIEWPORT_MARGIN,
      this.window.innerHeight - TRIGGER_SIZE - VIEWPORT_MARGIN
    );

    const root = this.document.createElement('div');
    root.setAttribute('data-select-dom-ai', 'root');
    root.style.position = 'fixed';
    root.style.left = `${this.currentLeft}px`;
    root.style.top = `${this.currentTop}px`;
    root.style.zIndex = '2147483647';

    const trigger = this.document.createElement('button');
    trigger.type = 'button';
    trigger.setAttribute('data-select-dom-ai', 'trigger');
    trigger.setAttribute('aria-label', 'Select DOM element');
    trigger.textContent = '</>';
    trigger.style.width = `${TRIGGER_SIZE}px`;
    trigger.style.height = `${TRIGGER_SIZE}px`;
    trigger.style.border = '1px solid rgba(15, 23, 42, 0.12)';
    trigger.style.borderRadius = '999px';
    trigger.style.background = 'rgba(255, 255, 255, 0.96)';
    trigger.style.boxShadow = '0 10px 30px rgba(15, 23, 42, 0.14)';
    trigger.style.color = '#0f172a';
    trigger.style.fontSize = '12px';
    trigger.style.fontWeight = '700';
    trigger.style.lineHeight = '1';
    trigger.style.cursor = 'grab';
    trigger.style.padding = '0';
    trigger.style.backdropFilter = 'blur(10px)';
    trigger.style.display = 'flex';
    trigger.style.alignItems = 'center';
    trigger.style.justifyContent = 'center';
    trigger.style.userSelect = 'none';
    trigger.addEventListener('mousedown', (event) => this.handleDragStart(event));
    trigger.addEventListener('click', (event) => this.handleTriggerClick(event));

    const highlight = this.document.createElement('div');
    highlight.setAttribute('data-select-dom-ai', 'highlight');
    highlight.style.position = 'fixed';
    highlight.style.pointerEvents = 'none';
    highlight.style.zIndex = '2147483646';
    highlight.style.border = '2px solid #14b8a6';
    highlight.style.background = 'rgba(20, 184, 166, 0.12)';
    highlight.style.borderRadius = '8px';
    highlight.style.display = 'none';

    root.append(trigger);
    this.document.body.append(root, highlight);

    this.root = root;
    this.triggerNode = trigger;
    this.highlightNode = highlight;
  }

  startSelection() {
    if (this.isSelecting) {
      return;
    }

    this.isSelecting = true;
    this.syncTriggerState();
    this.document.addEventListener('mousemove', this.handleMouseMoveBound, true);
    this.document.addEventListener('click', this.handleClickBound, true);
    this.document.addEventListener('keydown', this.handleKeyDownBound, true);
  }

  cancelSelection() {
    this.isSelecting = false;
    this.hoveredElement = null;
    this.selectedElement = null;
    this.teardownSelectionListeners();
    this.hideHighlight();
    this.syncTriggerState();
  }

  async submitSelection() {
    if (!this.selectedElement) {
      return;
    }

    try {
      await this.window.navigator.clipboard.writeText(this.selectedElement.outerHTML);
    } finally {
      this.hideHighlight();
      this.cancelSelection();
    }
  }

  private handleTriggerClick(event: MouseEvent) {
    if (this.isDragging) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (this.isSelecting) {
      this.cancelSelection();
      return;
    }

    this.startSelection();
  }

  private handleMouseMove(event: MouseEvent) {
    const candidate = this.resolveSelectableElement(event.target);
    if (!candidate || candidate === this.hoveredElement) {
      return;
    }

    this.hoveredElement = candidate;
    this.showHighlight(candidate);
  }

  private handleClick(event: MouseEvent) {
    if (!this.isSelecting) {
      return;
    }

    const candidate = this.resolveSelectableElement(event.target);
    if (!candidate) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.selectedElement = candidate;
    this.isSelecting = false;
    this.teardownSelectionListeners();
    this.syncTriggerState();
    void this.submitSelection();
  }

  private handleDragStart(event: MouseEvent) {
    if (!this.root || event.button !== 0) {
      return;
    }

    this.isDragging = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragOriginLeft = this.currentLeft;
    this.dragOriginTop = this.currentTop;
    this.document.addEventListener('mousemove', this.handleDragMoveBound, true);
    this.document.addEventListener('mouseup', this.handleDragEndBound, true);
  }

  private handleDragMove(event: MouseEvent) {
    if (!this.root) {
      return;
    }

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;

    if (!this.isDragging && Math.abs(deltaX) + Math.abs(deltaY) < 4) {
      return;
    }

    this.isDragging = true;
    this.currentLeft = clamp(
      this.dragOriginLeft + deltaX,
      VIEWPORT_MARGIN,
      this.window.innerWidth - TRIGGER_SIZE - VIEWPORT_MARGIN
    );
    this.currentTop = clamp(
      this.dragOriginTop + deltaY,
      VIEWPORT_MARGIN,
      this.window.innerHeight - TRIGGER_SIZE - VIEWPORT_MARGIN
    );
    this.applyPosition();
  }

  private handleDragEnd() {
    this.document.removeEventListener('mousemove', this.handleDragMoveBound, true);
    this.document.removeEventListener('mouseup', this.handleDragEndBound, true);

    this.window.setTimeout(() => {
      this.isDragging = false;
    }, 0);
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.cancelSelection();
    }
  }

  private resolveSelectableElement(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement)) {
      return null;
    }

    if (target.closest('[data-select-dom-ai]')) {
      return null;
    }

    return target;
  }

  private teardownSelectionListeners() {
    this.document.removeEventListener('mousemove', this.handleMouseMoveBound, true);
    this.document.removeEventListener('click', this.handleClickBound, true);
    this.document.removeEventListener('keydown', this.handleKeyDownBound, true);
  }

  private showHighlight(element: HTMLElement) {
    if (!this.highlightNode) {
      return;
    }

    const rect = element.getBoundingClientRect();
    this.highlightNode.style.display = 'block';
    this.highlightNode.style.left = `${rect.left}px`;
    this.highlightNode.style.top = `${rect.top}px`;
    this.highlightNode.style.width = `${rect.width}px`;
    this.highlightNode.style.height = `${rect.height}px`;
  }

  private hideHighlight() {
    if (this.highlightNode) {
      this.highlightNode.style.display = 'none';
    }
  }

  private syncTriggerState() {
    if (!this.triggerNode) {
      return;
    }

    this.triggerNode.style.background = this.isSelecting ? '#0f766e' : 'rgba(255, 255, 255, 0.96)';
    this.triggerNode.style.color = this.isSelecting ? '#ffffff' : '#0f172a';
    this.triggerNode.style.borderColor = this.isSelecting
      ? 'rgba(15, 118, 110, 0.42)'
      : 'rgba(15, 23, 42, 0.12)';
  }

  private applyPosition() {
    if (!this.root) {
      return;
    }

    this.root.style.left = `${this.currentLeft}px`;
    this.root.style.top = `${this.currentTop}px`;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
