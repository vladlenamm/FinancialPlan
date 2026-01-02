import { useRef, useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical, Pencil, X, Check, Trash2 } from 'lucide-react';

interface ChecklistItem {
  id: string;
  category: string;
  expected: number;
  actual?: number;
  diff: number;
  done: boolean;
  envelope?: string;
}

interface DraggableChecklistRowProps {
  item: ChecklistItem;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  deleteItem: (id: string) => void;
  toggleItem?: (id: string) => void;
  getCategoryColor: (item: ChecklistItem) => string;
  getCategoryEmoji: (item: ChecklistItem) => string;
  editingCategory: string | null;
  editingCategoryValue: string;
  setEditingCategoryValue: (value: string) => void;
  startEditingCategory: (id: string, category: string) => void;
  saveEditingCategory: () => void;
  cancelEditingCategory: () => void;
  editingItem: { id: string; field: 'expected' | 'actual' } | null;
  editingValue: string;
  setEditingValue: (value: string) => void;
  startEditingItem: (id: string, field: 'expected' | 'actual', value: number) => void;
  saveEditingItem: () => void;
  cancelEditingItem: () => void;
  checkColor?: string;
  actualColor: string;
  envelopes?: { name: string; emoji: string }[];
  changeItemEnvelope?: (id: string, envelopeName: string) => void;
  openEnvelopeSelector?: string | null;
  setOpenEnvelopeSelector?: (id: string | null) => void;
  totalItems?: number;
}

export function DraggableChecklistRow({
  item,
  index,
  moveItem,
  deleteItem,
  toggleItem,
  getCategoryColor,
  getCategoryEmoji,
  editingCategory,
  editingCategoryValue,
  setEditingCategoryValue,
  startEditingCategory,
  saveEditingCategory,
  cancelEditingCategory,
  editingItem,
  editingValue,
  setEditingValue,
  startEditingItem,
  saveEditingItem,
  cancelEditingItem,
  checkColor,
  actualColor,
  envelopes,
  changeItemEnvelope,
  openEnvelopeSelector,
  setOpenEnvelopeSelector,
  totalItems
}: DraggableChecklistRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const [{ isDragging }, drag] = useDrag({
    type: 'checklist-item',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'checklist-item',
    hover: (draggedItem: { index: number }, monitor) => {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      // Не заменяем элемент сам на себя
      if (dragIndex === hoverIndex) {
        return;
      }

      // Определяем прямоугольник элемента на экране
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Получаем середину по вертикали
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Определяем позицию курсора
      const clientOffset = monitor.getClientOffset();
      
      if (!clientOffset) {
        return;
      }
      
      // Получаем пиксели до верха
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Перетаскивание вниз
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Перетаскивание вверх
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Выполняем перемещение
      moveItem(dragIndex, hoverIndex);
      
      // Обновляем индекс для избежания повторных вызовов
      draggedItem.index = hoverIndex;
    },
  });

  drag(drop(ref));

  const handleEmojiClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (envelopes && changeItemEnvelope && setOpenEnvelopeSelector) {
      // Если уже открыт для этого элемента, закрываем, иначе открываем
      if (openEnvelopeSelector === item.id) {
        setOpenEnvelopeSelector(null);
      } else {
        setOpenEnvelopeSelector(item.id);
      }
    }
  };

  const handleEnvelopeSelect = (emoji: string) => {
    if (changeItemEnvelope && setOpenEnvelopeSelector) {
      changeItemEnvelope(item.id, emoji);
      setOpenEnvelopeSelector(null);
    }
  };

  const showEnvelopeSelector = openEnvelopeSelector === item.id;

  // Белый фон для всех строк
  const getRowBackgroundColor = () => {
    return '#FFFFFF';
  };

  // Обработчик контекстного меню
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContextMenu(true);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  // Закрываем контекстное меню при клике вне его
  useEffect(() => {
    if (showContextMenu) {
      const handleClick = () => setShowContextMenu(false);
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showContextMenu]);

  // Обработчик удаления из контекстного меню
  const handleDelete = () => {
    deleteItem(item.id);
    setShowContextMenu(false);
  };

  return (
    <>
      <div
        ref={ref}
        className={`px-4 py-2 transition-colors ${
          isDragging ? 'opacity-40' : 'opacity-100'
        }`}
        style={{
          backgroundColor: getRowBackgroundColor()
        }}
        onContextMenu={handleContextMenu}
      >
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 items-center group">
          {/* Category Column */}
          <div className="flex items-center gap-2">
            <div ref={drag} className="cursor-move flex-shrink-0">
              <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
            </div>

            <div className="relative flex-1">
              {editingCategory === item.id ? (
                <div className="flex items-center gap-1">
                  {envelopes && changeItemEnvelope && (
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={handleEmojiClick}
                        className="p-0.5 hover:bg-gray-100 rounded transition-all text-xs"
                        title="Выбрать конверт"
                      >
                        {item.envelope || '📋'}
                      </button>
                      {showEnvelopeSelector && (
                        <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] py-1 min-w-[160px] max-h-[200px] overflow-y-auto">
                          {envelopes.map((envelope) => (
                            <button
                              key={envelope.name}
                              onClick={() => handleEnvelopeSelect(envelope.emoji)}
                              className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              {envelope.emoji && <span>{envelope.emoji}</span>}
                              <span className="text-gray-700">{envelope.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <input
                    type="text"
                    value={editingCategoryValue}
                    onChange={(e) => setEditingCategoryValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditingCategory();
                      if (e.key === 'Escape') cancelEditingCategory();
                    }}
                    className="w-full px-1 py-0.5 text-[11px] border border-gray-300 rounded focus:outline-none focus:border-gray-400"
                    autoFocus
                  />
                  <button
                    onClick={saveEditingCategory}
                    className="p-0.5 text-gray-500 hover:text-emerald-600 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={cancelEditingCategory}
                    className="p-0.5 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group/category">
                  {envelopes && changeItemEnvelope && item.envelope !== '🏠' && (
                    <div className="relative">
                      <button
                        onClick={handleEmojiClick}
                        className="p-0.5 hover:bg-gray-100 rounded transition-all text-xs"
                        title="Выбрать конверт"
                      >
                        {item.envelope}
                      </button>
                      {showEnvelopeSelector && (
                        <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] py-1 min-w-[160px] max-h-[200px] overflow-y-auto">
                          {envelopes.map((envelope) => (
                            <button
                              key={envelope.name}
                              onClick={() => handleEnvelopeSelect(envelope.emoji)}
                              className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              {envelope.emoji && <span>{envelope.emoji}</span>}
                              <span className="text-gray-700">{envelope.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <span 
                    className={`text-[11px] ${
                      item.done ? 'line-through text-gray-400' : 'text-gray-700'
                    }`}
                  >
                    {item.category}
                  </span>
                  <button
                    onClick={() => startEditingCategory(item.id, item.category)}
                    className="opacity-0 group-hover/category:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 transition-all"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Expected Column */}
          <div className="text-right">
            {editingItem?.id === item.id && editingItem?.field === 'expected' ? (
              <div className="flex items-center justify-end gap-1">
                <input
                  type="number"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEditingItem();
                    if (e.key === 'Escape') cancelEditingItem();
                  }}
                  className="w-20 px-1 py-0.5 text-[11px] text-right border border-gray-300 rounded focus:outline-none focus:border-gray-400"
                  autoFocus
                />
                <button
                  onClick={saveEditingItem}
                  className="p-0.5 text-gray-500 hover:text-emerald-600 transition-colors"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={cancelEditingItem}
                  className="p-0.5 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="group/expected inline-flex items-center gap-1">
                <span
                  className={`text-[11px] ${
                    item.done ? 'line-through text-gray-400' : 'text-gray-700'
                  }`}
                >
                  {item.expected.toLocaleString('ru-RU')} ₽
                </span>
                <button
                  onClick={() => startEditingItem(item.id, 'expected', item.expected)}
                  className="opacity-0 group-hover/expected:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <Pencil className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>

          {/* Actual Column */}
          <div className="text-right flex items-center justify-end gap-2">
            {editingItem?.id === item.id && editingItem?.field === 'actual' ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEditingItem();
                    if (e.key === 'Escape') cancelEditingItem();
                  }}
                  className="w-20 px-1 py-0.5 text-[11px] text-right border border-gray-300 rounded focus:outline-none focus:border-gray-400"
                  autoFocus
                />
                <button
                  onClick={saveEditingItem}
                  className="p-0.5 text-gray-500 hover:text-emerald-600 transition-colors"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={cancelEditingItem}
                  className="p-0.5 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="group/actual inline-flex items-center gap-1">
                <span
                  className={`text-[11px] font-medium ${actualColor} ${
                    item.done ? 'line-through' : ''
                  }`}
                >
                  {item.actual ? `${item.actual.toLocaleString('ru-RU')} ₽` : '—'}
                </span>
                <button
                  onClick={() => startEditingItem(item.id, 'actual', item.actual || 0)}
                  className="opacity-0 group-hover/actual:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <Pencil className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showContextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] py-1 min-w-[140px]"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
        >
          <button
            className="w-full px-4 py-2 text-left text-[11px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            onClick={handleDelete}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>Удалить</span>
          </button>
        </div>
      )}
    </>
  );
}