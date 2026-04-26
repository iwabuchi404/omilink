import { ref, watch, type Ref } from 'vue';
import interact from 'interactjs';
import type { ViewsResponse } from '../../lib/pocketbase-types';

export type ItemType = 'bookmark' | 'memo';

export interface ViewItem {
  id: string; // placements record id
  itemId: string;
  type: ItemType;
  title: string;
  content: string;
  url?: string;
  og_image_url?: string;
  favicon_url?: string;
  x: number; // col
  y: number; // row
  w: number; // width
  h: number; // height
  color: string;
}

export function useGridInteract(
  items: Ref<ViewItem[]>,
  currentView: Ref<ViewsResponse>,
  isEditMode: Ref<boolean>,
  gridSize: Ref<number>,
  gap: Ref<number>,
  gridPadding: Ref<number>,
  persistChange: (item: ViewItem) => Promise<void>,
  onViewHeightExpand: (newRows: number) => Promise<void>
) {
  const dragPreview = ref<{ id: string, col: number, row: number, w: number, h: number, title: string, isValid: boolean } | null>(null);

  // Constraints

  const isOverlapping = (r1: {x:number, y:number, w:number, h:number}, r2: {x:number, y:number, w:number, h:number}) => {
    return !(r1.x + r1.w <= r2.x || 
             r2.x + r2.w <= r1.x || 
             r1.y + r1.h <= r2.y || 
             r2.y + r2.h <= r1.y);
  };

  const isValidPosition = (targetId: string, x: number, y: number, w: number, h: number) => {
    if (x < 0 || y < 0) return false;
    if (x + w > currentView.value.cols) return false;
    
    return !items.value.some(item => {
      if (item.id === targetId) return false;
      return isOverlapping({ x, y, w, h }, { x: item.x, y: item.y, w: item.w, h: item.h });
    });
  };

  function calculateGridPosition(clientX: number, clientY: number, container: HTMLElement, w: number = 1, h: number = 1) {
    const containerRect = container.getBoundingClientRect();
    const offsetX = clientX - containerRect.left - gridPadding.value;
    const offsetY = clientY - containerRect.top - gridPadding.value;
    const snappedX = offsetX - (w * gridSize.value / 2) + (gridSize.value / 2);
    const snappedY = offsetY - (h * gridSize.value / 2) + (gridSize.value / 2);
    const col = Math.min(currentView.value.cols - w, Math.max(0, Math.round(snappedX / gridSize.value)));
    const row = Math.max(0, Math.round(snappedY / gridSize.value));
    return { col, row };
  }

  let currentDragMeta: { type: ItemType, title: string, w: number, h: number } | null = null;
  let interactables: any[] = [];
  let pointerMoveListener: ((e: PointerEvent) => void) | null = null;

  function updateGhostFromPointer(e: PointerEvent) {
    const container = document.querySelector<HTMLElement>('.p-grid__container');
    if (!container || !currentDragMeta) return;

    const rect = container.getBoundingClientRect();
    const isOutOfBounds = e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top;

    const { w, h, title } = currentDragMeta;
    const { col, row } = calculateGridPosition(e.clientX, e.clientY, container, w, h);
    const isValid = !isOutOfBounds && isValidPosition('', col, row, w, h);

    if (!dragPreview.value || dragPreview.value.col !== col || dragPreview.value.row !== row || dragPreview.value.isValid !== isValid) {
      dragPreview.value = { id: '', col, row, w, h, title, isValid };
    }
  }

  function setupInteract() {
    interact.dynamicDrop(true);
    // Set global threshold for all interactions
    interact.pointerMoveTolerance(5);

    let originalPos = { x: 0, y: 0, w: 0, h: 0 };

    // Background Panning
    const bgInteractable = interact('.p-grid').draggable({
      cursorChecker: (_action, _interactable, _element, interacting) => interacting ? 'grabbing' : 'default',
      inertia: false,
      listeners: {
        start(event) {
          const target = event.target as HTMLElement;
          if (target.closest('.c-card-wrapper') || target.closest('button') || target.closest('a')) {
            event.interaction.stop();
            return;
          }
          event.currentTarget.classList.add('is-panning');
        },
        move(event) {
          const el = document.querySelector('.p-grid');
          if (el) {
            el.scrollLeft -= event.dx;
            el.scrollTop -= event.dy;
          }
        },
        end(event) {
          event.currentTarget.classList.remove('is-panning');
        }
      }
    });

    // Card Dragging
    const cardInteractable = interact('.c-card-wrapper')
      .draggable({
        enabled: isEditMode.value,
        inertia: false,
        autoScroll: true,
        listeners: {
          start(event) {
            const target = event.target;
            target.classList.add('is-dragging');
            target.closest('.p-grid__container')?.classList.add('drop-active');
            const id = target.getAttribute('data-id');
            const item = items.value.find(i => i.id === id);
            if (item) {
              originalPos = { x: item.x, y: item.y, w: item.w, h: item.h };
              dragPreview.value = { 
                id: item.id,
                col: item.x, 
                row: item.y, 
                w: item.w, 
                h: item.h, 
                title: item.title, 
                isValid: true 
              };
            }
          },
          move(event) {
            const target = event.target;
            const id = target.getAttribute('data-id');
            const item = items.value.find(i => i.id === id);
            const container = target.closest('.p-grid__container') as HTMLElement;
            if (container && item && dragPreview.value) {
              const { col, row } = calculateGridPosition(event.clientX, event.clientY, container, item.w, item.h);
              const rect = container.getBoundingClientRect();
              const isOutOfBounds = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top;
              const isValid = !isOutOfBounds && isValidPosition(item.id, col, row, item.w, item.h);
              
              if (dragPreview.value.col !== col || dragPreview.value.row !== row || dragPreview.value.isValid !== isValid) {
                dragPreview.value = { ...dragPreview.value, col, row, isValid };
              }
            }
          },
          end(event) {
            const target = event.target;
            target.classList.remove('is-dragging');
            target.closest('.p-grid__container')?.classList.remove('drop-active');
            
            const finalPreview = dragPreview.value;
            dragPreview.value = null; // Hide ghost
            
            const id = target.getAttribute('data-id');
            const item = items.value.find(i => i.id === id);
            if (!item) return;

            let snappedX = originalPos.x;
            let snappedY = originalPos.y;

            if (finalPreview && finalPreview.isValid) {
              snappedX = finalPreview.col;
              snappedY = finalPreview.row;
            }

            if (isValidPosition(id, snappedX, snappedY, item.w, item.h)) {
              item.x = snappedX;
              item.y = snappedY;

              // Expand view height if needed
              if (item.y + item.h > currentView.value.rows) {
                onViewHeightExpand(item.y + item.h);
              }

              if (item.x !== originalPos.x || item.y !== originalPos.y) {
                persistChange(item);
              }
            } else {
              item.x = originalPos.x;
              item.y = originalPos.y;
            }
          }
        }
      })
      .resizable({
        enabled: isEditMode.value,
        edges: { right: true, bottom: true },
        modifiers: [
          interact.modifiers.snapSize({
            targets: [interact.snappers.grid({ x: gridSize.value, y: gridSize.value })],
            range: Infinity,
          }),
        ],
        listeners: {
          start(event) {
            event.target.classList.add('is-resizing');
            const id = event.target.getAttribute('data-id');
            const item = items.value.find(i => i.id === id);
            if (item) {
              originalPos = { x: item.x, y: item.y, w: item.w, h: item.h };
            }
          },
          move(event) {
            const target = event.target;
            const id = target.getAttribute('data-id');
            const item = items.value.find(i => i.id === id);
            if (!item) return;

            const maxW = currentView.value.cols - item.x;
            let newW = Math.max(gridSize.value, Math.min(maxW * gridSize.value, event.rect.width));
            let newH = Math.max(gridSize.value, event.rect.height);

            target.style.width = newW + 'px';
            target.style.height = newH + 'px';
          },
          end(event) {
            const target = event.target;
            target.classList.remove('is-resizing');
            const id = target.getAttribute('data-id');
            const item = items.value.find(i => i.id === id);
            if (!item) return;

            const maxW = currentView.value.cols - item.x;
            const snappedW = Math.max(1, Math.min(maxW, Math.round(event.rect.width / gridSize.value)));
            const snappedH = Math.max(1, Math.round(event.rect.height / gridSize.value));
            
            if (isValidPosition(id, item.x, item.y, snappedW, snappedH)) {
              item.w = snappedW;
              item.h = snappedH;

              // Expand view height if needed
              if (item.y + item.h > currentView.value.rows) {
                onViewHeightExpand(item.y + item.h);
              }

              persistChange(item);
            } else {
              item.w = originalPos.w;
              item.h = originalPos.h;
            }
            target.style.width = (item.w * gridSize.value - gap.value) + 'px';
            target.style.height = (item.h * gridSize.value - gap.value) + 'px';
          }
        }
      });

    interactables.push(bgInteractable, cardInteractable);
    
    // Watch for edit mode changes to toggle interact dynamically
    watch(isEditMode, (newMode) => {
      cardInteractable.draggable({ enabled: newMode });
      cardInteractable.resizable({ enabled: newMode });
    });

    pointerMoveListener = updateGhostFromPointer;
    document.addEventListener('pointermove', pointerMoveListener);
  }

  function teardownInteract() {
    interactables.forEach(i => i.unset());
    interactables = [];
    if (pointerMoveListener) {
      document.removeEventListener('pointermove', pointerMoveListener);
    }
  }

  return {
    dragPreview,
    gridSize,
    gap,
    setupInteract,
    teardownInteract
  };
}
