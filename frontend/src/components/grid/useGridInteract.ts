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
  persistChange: (item: ViewItem) => Promise<void>
) {
  const dragPreview = ref<{ col: number, row: number, w: number, h: number, title: string, isValid: boolean } | null>(null);

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
    const offsetX = clientX - containerRect.left;
    const offsetY = clientY - containerRect.top;
    const snappedX = offsetX - (w * gridSize.value / 2);
    const snappedY = offsetY - (h * gridSize.value / 2);
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
      dragPreview.value = { col, row, w, h, title, isValid };
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
      inertia: {
        resistance: 10,
        minSpeed: 200,
        endSpeed: 100
      },
      listeners: {
        start(event) {
          // If touch, we let the browser handle the scrolling
          if (event.pointerType === 'touch') {
            event.interaction.stop();
            return;
          }
          event.currentTarget.classList.add('is-panning');
        },
        move(event) {
          event.currentTarget.scrollLeft -= event.dx;
          event.currentTarget.scrollTop -= event.dy;
        },
        end(event) {
          event.currentTarget.classList.remove('is-panning');
        }
      }
    });

    // Remove old click prevention logic

    // Card Dragging
    const cardInteractable = interact('.c-card-wrapper')
      .draggable({
        enabled: isEditMode.value,
        inertia: false,
        autoScroll: true,
        modifiers: [
          interact.modifiers.snap({
            targets: [interact.snappers.grid({ x: gridSize.value, y: gridSize.value })],
            range: Infinity,
            relativePoints: [{ x: 0, y: 0 }]
          })
        ],
        listeners: {
          start(event) {
            const target = event.target;
            target.classList.add('is-dragging');
            target.closest('.p-grid__container')?.classList.add('drop-active');
            const id = target.getAttribute('data-id');
            const item = items.value.find(i => i.id === id);
            if (item) {
              originalPos = { x: item.x, y: item.y, w: item.w, h: item.h };
              const x = parseFloat(target.getAttribute('data-x')) || 0;
              const y = parseFloat(target.getAttribute('data-y')) || 0;
              target.style.transform = `translate(${x + 15}px, ${y - 15}px)`;

              dragPreview.value = { 
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
            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
            target.style.transform = `translate(${x + 15}px, ${y - 15}px)`;
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);

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
              if (item.x !== originalPos.x || item.y !== originalPos.y) {
                persistChange(item);
              }
            } else {
              item.x = originalPos.x;
              item.y = originalPos.y;
            }

            const finalX = item.x * gridSize.value;
            const finalY = item.y * gridSize.value;
            target.style.transform = `translate(${finalX}px, ${finalY}px)`;
            target.setAttribute('data-x', finalX.toString());
            target.setAttribute('data-y', finalY.toString());
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
            
            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.deltaRect.left;
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.deltaRect.top;
            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x.toString());
            target.setAttribute('data-y', y.toString());
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

    // Update snap targets when gridSize changes
    watch(gridSize, (newSize) => {
      cardInteractable.draggable({
        modifiers: [
          interact.modifiers.snap({
            targets: [interact.snappers.grid({ x: newSize, y: newSize })],
            range: Infinity,
            relativePoints: [{ x: 0, y: 0 }]
          })
        ]
      });
      cardInteractable.resizable({
        modifiers: [
          interact.modifiers.snapSize({
            targets: [interact.snappers.grid({ x: newSize, y: newSize })],
            range: Infinity,
          })
        ]
      });
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
