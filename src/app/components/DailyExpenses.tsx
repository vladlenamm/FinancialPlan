import { useState, useEffect, useRef } from 'react';
import { Calendar, Plus, Edit2, X, Save, Trash2, GripVertical } from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';

interface ExpenseItem {
  amount: number;
  comment: string;
  isPlanned?: boolean; // Запланированная трата из ежедневника
  plannedDate?: string; // Дата запланированной траты (формат "DD.MM")
}

interface Expense {
  category: string;
  plan: number;
  week1: { [key: string]: ExpenseItem[] };
  week2: { [key: string]: ExpenseItem[] };
  week3: { [key: string]: ExpenseItem[] };
  week4: { [key: string]: ExpenseItem[] };
  total: number;
  percent: number;
  color: string;
  envelope?: string; // Конверт: 'Образование', 'Здоровье и красота', 'Еда', 'Обычная жизнь', 'Накопления'
}

interface ExpenseModalData {
  categoryIndex: number;
  date: string;
  items: ExpenseItem[];
  period: 1 | 2; // Сохраняем период вместе с данными модалки
}

interface DailyExpensesProps {
  onExpenseAdded: (comment: string, amount: number) => void;
  onExpensesChanged: (expenses: Expense[]) => void;
  needsCategories?: string[]; // Категории из Needs для автодополнения
  wantsCategories?: string[]; // Категории из Wants для автодополнения
  initialExpenses?: Expense[]; // Начальное значение expenses из App.tsx
  testDate: 5 | 25; // Тестовая дата
  setTestDate: (date: 5 | 25) => void; // Функция для изменения тестовой даты
  needsItems?: any[]; // Чеклист потребностей для расчета планов
  wantsItems?: any[]; // Чеклист желаний для расчета планов
}

// Отдельный компонент для строки с drag and drop
interface CategoryRowProps {
  expense: Expense;
  index: number;
  selectedPeriod: 1 | 2;
  dates: string[];
  envelopeOptions: { name: string; emoji: string }[];
  onOpenExpenseModal: (categoryIndex: number, date: string, period: 1 | 2) => void;
  onOpenCategoryModal: (index: number) => void;
  onContextMenu: (e: React.MouseEvent, index: number) => void;
  moveCategory: (dragIndex: number, hoverIndex: number) => void;
  testDate: 5 | 25; // Добавляем testDate для определения будущих дат
}

function CategoryRow({ 
  expense, 
  index, 
  selectedPeriod, 
  dates, 
  envelopeOptions,
  onOpenExpenseModal,
  onOpenCategoryModal,
  onContextMenu,
  moveCategory,
  testDate
}: CategoryRowProps) {
  const ref = useRef<HTMLTableRowElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'category',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [{ handlerId }, drop] = useDrop({
    accept: 'category',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: { index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      moveCategory(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });
  
  drag(drop(ref));
  
  // Объединяем расходы для выбранного периода
  const periodExpenses = selectedPeriod === 1 
    ? { ...expense.week1, ...expense.week2 }
    : { ...expense.week3, ...expense.week4 };
  
  // Функция для расчета общей суммы расходов по категории накопительно до выбранного периода
  const calculateTotalForCategory = (expense: Expense): number => {
    let total = 0;
    
    // Для периода 1 (1-15) считаем только week1 и week2
    // Для периода 2 (16-30) считаем только week3 и week4
    const weeksToSum = selectedPeriod === 1 
      ? [expense.week1, expense.week2]
      : [expense.week3, expense.week4];
    
    weeksToSum.forEach(week => {
      Object.values(week).forEach(items => {
        total += items.reduce((sum, item) => sum + item.amount, 0);
      });
    });
    
    return total;
  };
  
  const calculatePercent = (expense: Expense, total: number): number => {
    if (expense.plan === 0) return 0;
    return Math.round((total / expense.plan) * 100);
  };
  
  const totalForCategory = calculateTotalForCategory(expense);
  const percentForCategory = calculatePercent(expense, totalForCategory);
  
  return (
    <tr 
      ref={ref}
      className="border-b border-gray-50 hover:bg-gray-50/50 transition-all duration-200"
      onContextMenu={(e) => onContextMenu(e, index)}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      data-handler-id={handlerId}
    >
      <td className="px-2 py-1.5 sticky left-0 bg-white z-10 text-xs text-center font-light text-gray-700 shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
        {expense.plan.toLocaleString()} ₽
      </td>
      <td className="px-2 py-1.5 sticky left-[90px] bg-white z-10 text-xs text-left font-light text-gray-800 shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-start gap-1 group">
          {expense.envelope && (
            <span className="text-xs">
              {envelopeOptions.find(e => e.name === expense.envelope)?.emoji}
            </span>
          )}
          <button
            onClick={() => onOpenCategoryModal(index)}
            className="text-xs font-light cursor-pointer text-gray-700 hover:text-gray-900 transition-colors"
          >
            {expense.category}
          </button>
        </div>
      </td>
      {dates.map((date, dateIdx) => {
        const items = periodExpenses[date];
        const dateNum = parseInt(date);
        const isFuture = dateNum > testDate;
        
        return (
          <td 
            key={dateIdx} 
            className="px-1 py-1.5 text-center min-w-[40px] w-[40px]"
          >
            {items ? (
              <button
                onClick={() => onOpenExpenseModal(index, date, selectedPeriod)}
                className={`text-[10px] font-light cursor-pointer transition-colors leading-tight ${
                  isFuture 
                    ? 'text-gray-300 hover:text-gray-400' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {items.reduce((sum, a) => sum + a.amount, 0).toLocaleString()}
              </button>
            ) : (
              <button
                className="w-full h-full flex items-center justify-center hover:scale-110 rounded transition-transform"
                onClick={() => onOpenExpenseModal(index, date, selectedPeriod)}
              >
                <Plus className="w-3 h-3 text-gray-300 hover:text-gray-500" />
              </button>
            )}
          </td>
        );
      })}
      <td className="px-2 py-1.5 text-center text-xs font-light text-gray-700">
        {totalForCategory.toLocaleString()} ₽
      </td>
      <td className="px-2 py-2 text-center text-sm font-medium text-gray-600 tracking-wide w-[50px]">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
          percentForCategory >= 100 
            ? 'bg-red-50 text-red-700 border border-red-100'
            : percentForCategory >= 70
            ? 'bg-amber-50 text-amber-700 border border-amber-100'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
        }`}>
          {percentForCategory}%
        </span>
      </td>
    </tr>
  );
}

function DailyExpensesInner({ onExpenseAdded, onExpensesChanged, needsCategories = [], wantsCategories = [], initialExpenses, testDate, setTestDate, needsItems, wantsItems }: DailyExpensesProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<1 | 2>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ExpenseModalData | null>(null);
  const [tempAmount, setTempAmount] = useState('');
  const [tempComment, setTempComment] = useState('');
  const [hoveredCell, setHoveredCell] = useState<{ categoryIndex: number; date: string } | null>(null);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null); // Индекс редактируемого элемента
  
  // Объединяем все категории для автодополнения
  const allCategories = [...needsCategories, ...wantsCategories];
  
  // Category editing modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryEnvelope, setEditingCategoryEnvelope] = useState('');
  
  // Context menu for deleting categories
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; categoryIndex: number } | null>(null);
  
  const envelopeOptions = [
    { name: 'Образование', emoji: '🎓' },
    { name: 'Здоровье и красота', emoji: '🛁' },
    { name: 'Еда', emoji: '🥬' },
    { name: 'Обычная жизнь', emoji: '🏠' },
    { name: 'Накопления', emoji: '💰' },
  ];
  
  // Генерируем дни недели для 14 дней
  const generateDaysForPeriod = (period: 1 | 2) => {
    const startDay = period === 1 ? 1 : 16;
    const daysOfWeek = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
    const days: string[] = [];
    
    // Для первого периода начинаем с понедельника (ндекс 0)
    // Для второго периода - тоже с текущего дня недели
    for (let i = 0; i < 15; i++) {
      days.push(daysOfWeek[i % 7]);
    }
    return days;
  };
  
  const days = generateDaysForPeriod(selectedPeriod);
  const dates = selectedPeriod === 1 
    ? ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15']
    : ['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'];

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('dailyExpenses');
    if (saved) {
      try {
        let parsedExpenses = JSON.parse(saved);
        
        // МИГРАЦИЯ: Удаляем категории "Стэф" и "Дом"
        parsedExpenses = parsedExpenses.filter((exp: Expense) => 
          exp.category !== 'Стэф' && exp.category !== 'Дом'
        );
        
        // МИГРАЦИЯ: Перемещаем "Образование" между "Китайским" и "Подписками"
        const obrazovanieIndex = parsedExpenses.findIndex((exp: Expense) => exp.category === 'Образование');
        let obrazovanieData = null;
        
        if (obrazovanieIndex !== -1) {
          // Если "Образование" существует, сохраняем его данные и удаляем
          obrazovanieData = parsedExpenses[obrazovanieIndex];
          parsedExpenses.splice(obrazovanieIndex, 1);
        } else {
          // Если "Образование" не сущствует, создаём новую категорию
          obrazovanieData = {
            category: 'Образовани',
            plan: 19000,
            week1: {},
            week2: {},
            week3: {},
            week4: {},
            total: 0,
            percent: 0,
            color: 'bg-white'
          };
        }
        
        // Находи индекс "Китайского" и вставляем "Образование" после него
        const kitaiskiyIndex = parsedExpenses.findIndex((exp: Expense) => exp.category === 'Китайский');
        const insertIndex = kitaiskiyIndex !== -1 ? kitaiskiyIndex + 1 : parsedExpenses.length;
        
        parsedExpenses.splice(insertIndex, 0, obrazovanieData);
        
        // МИГРАЦИЯ: Обновляем план для "Прочее" до 23200
        const procheeIndex = parsedExpenses.findIndex((exp: Expense) => exp.category === 'Прочее');
        if (procheeIndex !== -1) {
          parsedExpenses[procheeIndex].plan = 23200;
        }
        
        // МИГРАЦИЯ: Исправляем envelope="undefined" на правильные значения
        const categoryToEnvelope: { [key: string]: string } = {
          'Продукты': 'Еда',
          'Бонусы и кафе': 'Еда',
          'Салоны красоты': 'Здоровье и красота',
          'Косметика, одежда': 'Здоровье и красота',
          'Здоровье и тело': 'Здоровье и красота',
          'Английский': 'Образование',
          'Китайский': 'Образование',
          'Образование': 'Образование',
          'Подписки': 'Обычная жизнь',
          'Такси': 'Обычная жизнь',
        };
        
        parsedExpenses.forEach((exp: Expense) => {
          // Если envelope === "undefined" или undefined, назначаем правильное значение
          if (!exp.envelope || exp.envelope === 'undefined') {
            if (categoryToEnvelope[exp.category]) {
              exp.envelope = categoryToEnvelope[exp.category];
            }
          }
        });
        
        // ВАЖНО: Сохраняем исправленные данные обратно в localStorage
        localStorage.setItem('dailyExpenses', JSON.stringify(parsedExpenses));
        console.log('✅ Миграция envelope выполнена успешно!');
        
        return parsedExpenses;
      } catch (e) {
        console.error('Failed to parse dailyExpenses from localStorage', e);
      }
    }
    return initialExpenses && initialExpenses.length > 0 ? initialExpenses : [
      {
        category: 'Продукты',
        plan: 20000,
        week1: {},
        week2: {},
        week3: {},
        week4: {},
        total: 0,
        percent: 0,
        color: 'bg-white'
      },
      {
        category: 'Бонусы и кафе',
        plan: 20000,
        week1: {},
        week2: {},
        week3: {},
        week4: {},
        total: 0,
        percent: 0,
        color: 'bg-white'
      },
      {
        category: 'Салоны красоты',
        plan: 7000,
        week1: {},
        week2: {},
        week3: {},
        week4: {},
        total: 0,
        percent: 0,
        color: 'bg-white'
      },
      {
        category: 'Косметика, одежда',
        plan: 16400,
        week1: {},
        week2: {},
        week3: {},
        week4: {},
        total: 0,
        percent: 0,
        color: 'bg-white'
      },
      {
        category: 'Здоровье и тело',
        plan: 3000,
        week1: {},
        week2: {},
        week3: {},
        week4: {},
        total: 0,
        percent: 0,
        color: 'bg-white'
      },
      {
        category: 'Английский',
        plan: 6600,
        week1: {},
        week2: {},
        week3: {},
        week4: {},
        total: 0,
        percent: 0,
        color: 'bg-white'
      },
      {
        category: 'Китайский',
        plan: 5600,
        week1: {},
        week2: {},
        week3: {},
        week4: {},
        total: 0,
        percent: 0,
        color: 'bg-white'
      },
      {
        category: 'Образование',
        plan: 19000,
        week1: {},
        week2: {},
        week3: {},
        week4: {},
        total: 0,
        percent: 0,
        color: 'bg-white'
      },
      {
        category: 'Подписки',
        plan: 3130,
        week1: {},
        week2: {},
        week3: {},
        week4: {},
        total: 0,
        percent: 0,
        color: 'bg-white'
      },
      {
        category: 'Такси',
        plan: 5000,
        week1: {},
        week2: {},
        week3: {},
        week4: {},
        total: 0,
        percent: 0,
        color: 'bg-white'
      },
      {
        category: 'Прочее',
        plan: 23200,
        week1: {},
        week2: {},
        week3: {},
        week4: {},
        total: 0,
        percent: 0,
        color: 'bg-pink-100'
      },
    ];
  });

  // Сохраняем расходы в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('dailyExpenses', JSON.stringify(expenses));
  }, [expenses]);

  // Синхронизируем расхды с чеклистами при инициализации и изменении expenses
  useEffect(() => {
    onExpensesChanged(expenses);
  }, []);

  // Обновляем expenses при изменении initialExpenses (при возврате на вкладку)
  useEffect(() => {
    if (initialExpenses && initialExpenses.length > 0) {
      setExpenses(initialExpenses);
    }
  }, [initialExpenses]);

  // Пересчитываем планы категорий на основе чеклистов
  useEffect(() => {
    if (!needsItems || !wantsItems) return;

    const calculatePlanForCategory = (categoryName: string): number => {
      const catLower = categoryName.toLowerCase();
      
      // Маппинг категорий ежедневника на категории чеклистов
      const mappings: { [key: string]: string[] } = {
        'продукты': ['продукты'],
        'бонусы и кафе': ['бонусы', 'кафе'],
        'салоны красоты': ['салоны'],
        'косметика, одежда': ['косметика', 'одежда'],
        'здоровье и тело': ['тело'],
        'английский': ['английский'],
        'китайский': ['китайский'],
        'образование': ['трейдинг', 'вартик', 'обучение'],
        'подписки': ['chatgpt', 'vk music', 'telegram', 'подписки'],
        'такси': ['такси'],
        'прочее': ['прочее', 'стэф', 'родители', 'подарки', 'дом', 'вейп']
      };
      
      const checklistCategories = mappings[catLower] || [];
      let totalPlan = 0;
      
      checklistCategories.forEach(checklistCat => {
        // Ищем в needsItems
        const needsItem = needsItems.find(item => 
          item.category.toLowerCase() === checklistCat.toLowerCase()
        );
        if (needsItem) {
          totalPlan += needsItem.expected;
        }
        
        // Ищем в wantsItems
        const wantsItem = wantsItems.find(item => 
          item.category.toLowerCase() === checklistCat.toLowerCase()
        );
        if (wantsItem) {
          totalPlan += wantsItem.expected;
        }
      });
      
      return totalPlan;
    };
    
    setExpenses(prevExpenses => {
      return prevExpenses.map(expense => ({
        ...expense,
        plan: calculatePlanForCategory(expense.category)
      }));
    });
  }, [needsItems, wantsItems]);

  // Закрываем контекстное меню при клике вне его
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Закрываем подсказки при клике вне поля
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#comment-input') && !target.closest('.suggestions-dropdown')) {
        setShowSuggestions(false);
      }
    };
    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSuggestions]);

  const weekData = selectedPeriod === 1 ? expenses.map(e => e.week1) : expenses.map(e => e.week2);

  const handleOpenExpenseModal = (categoryIndex: number, date: string, period: 1 | 2) => {
    // Определяем правильную неделю по дате
    const dateNum = parseInt(date);
    let weekKey: 'week1' | 'week2' | 'week3' | 'week4';
    if (dateNum <= 7) weekKey = 'week1';
    else if (dateNum <= 15) weekKey = 'week2';
    else if (dateNum <= 22) weekKey = 'week3';
    else weekKey = 'week4';
    
    const items = expenses[categoryIndex][weekKey][date] || [];
    setModalData({ categoryIndex, date, items: [...items], period: period });
    setTempAmount('');
    setTempComment('');
    setEditingItemIndex(null); // Сбрасываем индекс редактирования
    setIsModalOpen(true);
  };

  const handleEditItem = (index: number) => {
    if (modalData) {
      const item = modalData.items[index];
      setTempAmount(item.amount.toString());
      setTempComment(item.comment);
      setEditingItemIndex(index);
    }
  };

  const handleAddAmountToList = () => {
    if (modalData && tempAmount && !isNaN(Number(tempAmount))) {
      const newAmount = Number(tempAmount);
      
      // Проверяем, является ли дата будущей
      const dateNum = parseInt(modalData.date);
      const isFuture = dateNum > testDate;
      
      if (editingItemIndex !== null) {
        // Редактируем существующий элемент
        const newItems = [...modalData.items];
        newItems[editingItemIndex] = { 
          amount: newAmount, 
          comment: tempComment,
          isPlanned: isFuture,
          plannedDate: isFuture ? `${modalData.date}.12` : undefined
        };
        setModalData({
          ...modalData,
          items: newItems
        });
        setEditingItemIndex(null);
      } else {
        // Добавляем новый элемент
        setModalData({
          ...modalData,
          items: [...modalData.items, { 
            amount: newAmount, 
            comment: tempComment,
            isPlanned: isFuture,
            plannedDate: isFuture ? `${modalData.date}.12` : undefined
          }]
        });
      }
      
      setTempAmount('');
      setTempComment('');
    }
  };

  const handleRemoveAmount = (index: number) => {
    if (modalData) {
      const newItems = modalData.items.filter((_, i) => i !== index);
      setModalData({
        ...modalData,
        items: newItems
      });
    }
  };

  const handleSaveExpense = () => {
    if (modalData) {
      // Если есть введенная сумма, добавляем её в список перед сохранением
      let finalItems = [...modalData.items];
      
      if (tempAmount && !isNaN(Number(tempAmount)) && Number(tempAmount) > 0) {
        const newAmount = Number(tempAmount);
        const dateNum = parseInt(modalData.date);
        const isFuture = dateNum > testDate;
        
        finalItems.push({ 
          amount: newAmount, 
          comment: tempComment,
          isPlanned: isFuture,
          plannedDate: isFuture ? `${modalData.date}.12` : undefined
        });
      }
      
      let newExpenses = [...expenses];
      
      // Определяем правильную неделю по дате
      const dateNum = parseInt(modalData.date);
      let weekKey: 'week1' | 'week2' | 'week3' | 'week4';
      if (dateNum <= 7) weekKey = 'week1';
      else if (dateNum <= 15) weekKey = 'week2';
      else if (dateNum <= 22) weekKey = 'week3';
      else weekKey = 'week4';
      
      if (finalItems.length > 0) {
        // Синхронизируем только ФАКТИЧЕСКИЕ расходы с чеклистами (пропускаем запланированные)
        finalItems.forEach(item => {
          if (item.comment.trim() && !item.isPlanned) {
            onExpenseAdded(item.comment, item.amount);
          }
        });
        
        // Группируем расходы по комментариям, которые совпадают с категориями
        const expensesByCategory = new Map<number, ExpenseItem[]>();
        
        finalItems.forEach(item => {
          if (item.comment.trim()) {
            // Ищем категорию в ежедневнике, которая совпадает с комментарием
            let matchingCategoryIndex = newExpenses.findIndex(
              exp => exp.category.toLowerCase() === item.comment.toLowerCase().trim()
            );
            
            if (matchingCategoryIndex !== -1) {
              // Если нашли совпадение в существующих категориях ежедневника, добавляем расход туда
              if (!expensesByCategory.has(matchingCategoryIndex)) {
                expensesByCategory.set(matchingCategoryIndex, []);
              }
              expensesByCategory.get(matchingCategoryIndex)!.push(item);
            } else {
              // Если не нашли совпадение, оставляем в текущей категории
              if (!expensesByCategory.has(modalData.categoryIndex)) {
                expensesByCategory.set(modalData.categoryIndex, []);
              }
              expensesByCategory.get(modalData.categoryIndex)!.push(item);
            }
          } else {
            // Еси комментарий пустой, сохраняем в текущу категорию
            if (!expensesByCategory.has(modalData.categoryIndex)) {
              expensesByCategory.set(modalData.categoryIndex, []);
            }
            expensesByCategory.get(modalData.categoryIndex)!.push(item);
          }
        });
        
        // Сначала очищаем исходную ячейку
        delete newExpenses[modalData.categoryIndex][weekKey][modalData.date];
        
        // Сохраняем асходы в соответствующие категории
        expensesByCategory.forEach((items, categoryIndex) => {
          newExpenses[categoryIndex][weekKey][modalData.date] = items;
        });
      } else {
        // Если список пустой - удаляем данные из ячейки
        delete newExpenses[modalData.categoryIndex][weekKey][modalData.date];
      }
      
      setExpenses(newExpenses);
      onExpensesChanged(newExpenses);
      setIsModalOpen(false);
      setModalData(null);
      setTempAmount('');
      setTempComment('');
    }
  };

  const handleDeleteAllExpenses = () => {
    if (modalData) {
      // Определяем правильную неделю по дате
      const dateNum = parseInt(modalData.date);
      let weekKey: 'week1' | 'week2' | 'week3' | 'week4';
      if (dateNum <= 7) weekKey = 'week1';
      else if (dateNum <= 15) weekKey = 'week2';
      else if (dateNum <= 22) weekKey = 'week3';
      else weekKey = 'week4';
      
      const newExpenses = [...expenses];
      delete newExpenses[modalData.categoryIndex][weekKey][modalData.date];
      setExpenses(newExpenses);
      onExpensesChanged(newExpenses);
      setIsModalOpen(false);
      setModalData(null);
      setTempAmount('');
      setTempComment('');
    }
  };

  const handleOpenCategoryModal = (index: number) => {
    setEditingCategoryIndex(index);
    setEditingCategoryName(expenses[index].category);
    setEditingCategoryEnvelope(expenses[index].envelope || '');
    setIsCategoryModalOpen(true);
  };

  const handleOpenAddCategoryModal = () => {
    setEditingCategoryIndex(null);
    setEditingCategoryName('');
    setEditingCategoryEnvelope('');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = () => {
    if (editingCategoryIndex !== null) {
      // Editing existing category
      const newExpenses = [...expenses];
      newExpenses[editingCategoryIndex].category = editingCategoryName;
      newExpenses[editingCategoryIndex].envelope = editingCategoryEnvelope;
      setExpenses(newExpenses);
      onExpensesChanged(newExpenses);
      setIsCategoryModalOpen(false);
      setEditingCategoryIndex(null);
      setEditingCategoryName('');
      setEditingCategoryEnvelope('');
    } else {
      // Adding new category
      const newCategory: Expense = {
        category: editingCategoryName,
        plan: 0,
        week1: {},
        week2: {},
        week3: {},
        week4: {},
        total: 0,
        percent: 0,
        color: 'bg-white',
        envelope: editingCategoryEnvelope || undefined,
      };
      const newExpenses = [...expenses, newCategory];
      setExpenses(newExpenses);
      onExpensesChanged(newExpenses);
      setIsCategoryModalOpen(false);
      setEditingCategoryIndex(null);
      setEditingCategoryName('');
      setEditingCategoryEnvelope('');
    }
  };

  const handleDeleteCategory = (index: number) => {
    const newExpenses = [...expenses];
    newExpenses.splice(index, 1);
    setExpenses(newExpenses);
    onExpensesChanged(newExpenses);
    setContextMenu(null);
  };

  // Drag and drop functionality
  const moveCategory = (dragIndex: number, hoverIndex: number) => {
    const newExpenses = [...expenses];
    const [draggedItem] = newExpenses.splice(dragIndex, 1);
    newExpenses.splice(hoverIndex, 0, draggedItem);
    setExpenses(newExpenses);
    onExpensesChanged(newExpenses);
  };

  // Autocomplete functionality
  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempComment(value);
    setSuggestionIndex(-1);
    if (value) {
      const suggestions = allCategories.filter(category =>
        category.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setTempComment(suggestion);
    setFilteredSuggestions([]);
    setShowSuggestions(false);
    setSuggestionIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestionIndex(prevIndex => (prevIndex < filteredSuggestions.length - 1 ? prevIndex + 1 : prevIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggestionIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestionIndex >= 0 && suggestionIndex < filteredSuggestions.length) {
        handleSuggestionClick(filteredSuggestions[suggestionIndex]);
      } else {
        handleAddAmountToList();
      }
    }
  };

  // Функция для сброса всех данных
  const handleResetAllData = () => {
    if (window.confirm('Вы уверены, что хотите сбросить все данные ежедневника? Это действие нельзя отменить.')) {
      const defaultExpenses: Expense[] = [
        {
          category: 'Продукты',
          plan: 20000,
          week1: {},
          week2: {},
          week3: {},
          week4: {},
          total: 0,
          percent: 0,
          color: 'bg-white',
          envelope: 'Еда'
        },
        {
          category: 'Бонусы и кафе',
          plan: 20000,
          week1: {},
          week2: {},
          week3: {},
          week4: {},
          total: 0,
          percent: 0,
          color: 'bg-white',
          envelope: 'Еда'
        },
        {
          category: 'Салоны красоты',
          plan: 7000,
          week1: {},
          week2: {},
          week3: {},
          week4: {},
          total: 0,
          percent: 0,
          color: 'bg-white',
          envelope: 'Здоровье и красота'
        },
        {
          category: 'Косметика, одежда',
          plan: 16400,
          week1: {},
          week2: {},
          week3: {},
          week4: {},
          total: 0,
          percent: 0,
          color: 'bg-white',
          envelope: 'Здоровье и красота'
        },
        {
          category: 'Здоровье и тело',
          plan: 3000,
          week1: {},
          week2: {},
          week3: {},
          week4: {},
          total: 0,
          percent: 0,
          color: 'bg-white',
          envelope: 'Здоровье и красота'
        },
        {
          category: 'Английский',
          plan: 6600,
          week1: {},
          week2: {},
          week3: {},
          week4: {},
          total: 0,
          percent: 0,
          color: 'bg-white',
          envelope: 'Образование'
        },
        {
          category: 'Китайский',
          plan: 5600,
          week1: {},
          week2: {},
          week3: {},
          week4: {},
          total: 0,
          percent: 0,
          color: 'bg-white',
          envelope: 'Образование'
        },
        {
          category: 'Образование',
          plan: 19000,
          week1: {},
          week2: {},
          week3: {},
          week4: {},
          total: 0,
          percent: 0,
          color: 'bg-white',
          envelope: 'Образование'
        },
        {
          category: 'Подписки',
          plan: 3130,
          week1: {},
          week2: {},
          week3: {},
          week4: {},
          total: 0,
          percent: 0,
          color: 'bg-white',
          envelope: 'Обычная жизнь'
        },
        {
          category: 'Такси',
          plan: 5000,
          week1: {},
          week2: {},
          week3: {},
          week4: {},
          total: 0,
          percent: 0,
          color: 'bg-white',
          envelope: 'Обычная жизнь'
        },
        {
          category: 'Прочее',
          plan: 23200,
          week1: {},
          week2: {},
          week3: {},
          week4: {},
          total: 0,
          percent: 0,
          color: 'bg-pink-100'
        },
      ];
      setExpenses(defaultExpenses);
      onExpensesChanged(defaultExpenses);
      localStorage.setItem('dailyExpenses', JSON.stringify(defaultExpenses));
    }
  };

  // Функция для расчета общего итого по всем категориям для периода
  const calculateGrandTotal = (period: 1 | 2): number => {
    let grandTotal = 0;
    
    expenses.forEach(expense => {
      const weeksToSum = period === 1 
        ? [expense.week1, expense.week2]
        : [expense.week3, expense.week4];
      
      weeksToSum.forEach(week => {
        Object.values(week).forEach(items => {
          grandTotal += items.reduce((sum, item) => sum + item.amount, 0);
        });
      });
    });
    
    return grandTotal;
  };

  // Функция для расчета общей суммы всех планов
  const calculateTotalPlan = (): number => {
    return expenses.reduce((sum, expense) => sum + expense.plan, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-sm">
            <Calendar className="w-4 h-4 text-gray-600" />
          </div>
          <h2 className="text-sm text-gray-800 font-light tracking-tight">Ежедневный учет расходов</h2>
          <button
            onClick={handleOpenAddCategoryModal}
            className="ml-2 p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 group"
            title="Добавить категорию"
          >
            <Plus className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {/* КНОПКА СБРОСА ДАННЫХ */}
          <button
            onClick={handleResetAllData}
            className="px-3 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium"
            title="Сбросить все данные ежедневника"
          >
            Сбросить данные
          </button>
          
          {/* ТЕСТОВАЯ КНОПКА */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
            <span className="text-xs text-orange-700 font-medium">ТЕСТ:</span>
            <button
              onClick={() => setTestDate(testDate === 5 ? 25 : 5)}
              className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors"
              style={{
                backgroundColor: testDate === 5 ? '#10b981' : '#3b82f6',
                color: 'white'
              }}
            >
              Сегодня {testDate}-е
            </button>
          </div>
        </div>
      </div>

      {/* Таблица для периода 1-2 (1-15 числа) */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xs font-medium text-gray-600">Неделя 1-2 (1-15 числа)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
                <th className="px-2 py-2 text-center sticky left-0 bg-gradient-to-b from-gray-50 to-white z-20 text-sm font-medium text-gray-600 tracking-wide w-[90px]">План на месяц</th>
                <th className="px-2 py-2 text-center sticky left-[90px] bg-gradient-to-b from-gray-50 to-white z-20 text-sm font-medium text-gray-600 tracking-wide w-[140px]">Категория</th>
                {generateDaysForPeriod(1).map((day, idx) => {
                  const period1Dates = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'];
                  return (
                    <th key={idx} className="px-1 py-2 text-center min-w-[40px] w-[40px]">
                      <div className="text-xs font-medium text-gray-500">{day}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{period1Dates[idx]}</div>
                    </th>
                  );
                })}
                <th className="px-2 py-2 text-center text-sm font-medium text-gray-600 tracking-wide w-[90px]">Итого</th>
                <th className="px-2 py-2 text-center text-sm font-medium text-gray-600 tracking-wide w-[50px]">%</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, idx) => (
                <CategoryRow
                  key={idx}
                  expense={expense}
                  index={idx}
                  selectedPeriod={1}
                  dates={['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15']}
                  envelopeOptions={envelopeOptions}
                  onOpenExpenseModal={handleOpenExpenseModal}
                  onOpenCategoryModal={handleOpenCategoryModal}
                  onContextMenu={(e, index) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, categoryIndex: index });
                  }}
                  moveCategory={moveCategory}
                  testDate={testDate}
                />
              ))}
              <tr className="bg-gradient-to-b from-gray-100 to-gray-50 border-t border-gray-200">
                <td className="px-2 py-3.5 sticky left-0 bg-gradient-to-b from-gray-100 to-gray-50 z-10 text-[10px] text-center font-medium text-gray-800">{calculateTotalPlan().toLocaleString()} ₽</td>
                <td className="px-2 py-3.5 sticky left-[90px] bg-gradient-to-b from-gray-100 to-gray-50 z-10 text-[10px] text-center font-medium text-gray-800">Итого</td>
                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'].map((_, idx) => (
                  <td key={idx} className="px-1 py-3.5 min-w-[40px] w-[40px]"></td>
                ))}
                <td className="px-2 py-3.5 text-center text-[10px] font-medium text-gray-800">{calculateGrandTotal(1).toLocaleString()} ₽</td>
                <td className="px-2 py-3.5 text-center text-[10px]">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Таблица для периода 3-4 (16-30 числа) */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xs font-medium text-gray-600">Неделя 3-4 (16-30 числа)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
                <th className="px-2 py-2 text-center sticky left-0 bg-gradient-to-b from-gray-50 to-white z-20 text-sm font-medium text-gray-600 tracking-wide w-[90px]">План на месяц</th>
                <th className="px-2 py-2 text-center sticky left-[90px] bg-gradient-to-b from-gray-50 to-white z-20 text-sm font-medium text-gray-600 tracking-wide w-[140px]">Категория</th>
                {generateDaysForPeriod(2).map((day, idx) => {
                  const period2Dates = ['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'];
                  return (
                    <th key={idx} className="px-1 py-2 text-center min-w-[40px] w-[40px]">
                      <div className="text-xs font-medium text-gray-500">{day}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{period2Dates[idx]}</div>
                    </th>
                  );
                })}
                <th className="px-2 py-2 text-center text-sm font-medium text-gray-600 tracking-wide w-[90px]">Итого</th>
                <th className="px-2 py-2 text-center text-sm font-medium text-gray-600 tracking-wide w-[50px]">%</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, idx) => (
                <CategoryRow
                  key={`period2-${idx}`}
                  expense={expense}
                  index={idx}
                  selectedPeriod={2}
                  dates={['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30']}
                  envelopeOptions={envelopeOptions}
                  onOpenExpenseModal={handleOpenExpenseModal}
                  onOpenCategoryModal={handleOpenCategoryModal}
                  onContextMenu={(e, index) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, categoryIndex: index });
                  }}
                  moveCategory={moveCategory}
                  testDate={testDate}
                />
              ))}
              <tr className="bg-gradient-to-b from-gray-100 to-gray-50 border-t border-gray-200">
                <td className="px-2 py-3.5 sticky left-0 bg-gradient-to-b from-gray-100 to-gray-50 z-10 text-[10px] text-center font-medium text-gray-800">{calculateTotalPlan().toLocaleString()} ₽</td>
                <td className="px-2 py-3.5 sticky left-[90px] bg-gradient-to-b from-gray-100 to-gray-50 z-10 text-[10px] text-center font-medium text-gray-800">Итого</td>
                {['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'].map((_, idx) => (
                  <td key={idx} className="px-1 py-3.5 min-w-[40px] w-[40px]"></td>
                ))}
                <td className="px-2 py-3.5 text-center text-[10px] font-medium text-gray-800">{calculateGrandTotal(2).toLocaleString()} ₽</td>
                <td className="px-2 py-3.5 text-center text-[10px]">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-3 shadow-sm">
        <p className="text-xs text-gray-600 font-light">
          💡 Нажмите на ячейку с суммой для редактирования или на "+" для добавления новой траты
        </p>
      </div>

      {isModalOpen && modalData && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-lg w-80 border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-light text-gray-800 tracking-tight">
                Управление расходами
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="px-5 py-4 space-y-3">
              {modalData.items.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-500 mb-2 font-light">Текущие расхоы</label>
                  <div className="space-y-1.5">
                    {modalData.items.map((item, index) => (
                      <div key={index} className={`px-3 py-2 rounded-lg border transition-colors ${
                        editingItemIndex === index 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-100'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-light text-gray-800">{item.amount.toLocaleString()} ₽</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditItem(index)}
                              className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                              title="Редактировать"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveAmount(index)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Удалить"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {item.comment && (
                          <p className="text-xs text-gray-500 font-light">{item.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-light">Итого:</span>
                      <span className="text-sm text-gray-800 font-light">{modalData.items.reduce((sum, a) => sum + a.amount, 0).toLocaleString()} ₽</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-light">Добавить сумму (₽)</label>
                <input
                  type="number"
                  value={tempAmount}
                  onChange={(e) => setTempAmount(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const commentInput = document.getElementById('comment-input') as HTMLInputElement;
                      if (commentInput) commentInput.focus();
                    }
                  }}
                  placeholder="Введите сумму"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 font-light"
                  autoFocus
                />
              </div>

              <div className="relative">
                <label className="block text-xs text-gray-500 mb-1.5 font-light">Комментарий</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      id="comment-input"
                      type="text"
                      value={tempComment}
                      onChange={handleCommentChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Комментарий"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 font-light"
                    />
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50 suggestions-dropdown">
                        {filteredSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                              index === suggestionIndex ? 'bg-gray-100' : ''
                            }`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            onMouseEnter={() => setSuggestionIndex(index)}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAddAmountToList}
                    className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
              {modalData.items.length > 0 && (
                <button
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-light"
                  onClick={handleDeleteAllExpenses}
                >
                  Удалить всё
                </button>
              )}
              <div className="flex-1"></div>
              <button
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-light"
                onClick={() => setIsModalOpen(false)}
              >
                Отмена
              </button>
              <button
                className="px-3 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-light"
                onClick={handleSaveExpense}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-lg w-80 border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-light text-gray-800 tracking-tight">
                {editingCategoryIndex !== null ? 'Редактирование категории' : 'Добавление категории'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-light">Название категории</label>
                <input
                  type="text"
                  value={editingCategoryName}
                  onChange={(e) => setEditingCategoryName(e.target.value)}
                  placeholder="Название категории"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 font-light"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-light">Конверт</label>
                <select
                  value={editingCategoryEnvelope}
                  onChange={(e) => setEditingCategoryEnvelope(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 font-light"
                >
                  <option value="">Выберите конверт</option>
                  {envelopeOptions.map(option => (
                    <option key={option.name} value={option.name}>
                      {option.emoji} {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
              <div className="flex-1"></div>
              <button
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-light"
                onClick={() => setIsCategoryModalOpen(false)}
              >
                Отмена
              </button>
              <button
                className="px-3 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-light"
                onClick={handleSaveCategory}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-lg z-50 border border-gray-200 py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            onClick={() => handleDeleteCategory(contextMenu.categoryIndex)}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            Удалить категорию
          </button>
        </div>
      )}
    </div>
  );
}

export function DailyExpenses({ onExpenseAdded, onExpensesChanged, needsCategories, wantsCategories, initialExpenses, testDate, setTestDate, needsItems, wantsItems }: DailyExpensesProps) {
  return (
    <DailyExpensesInner onExpenseAdded={onExpenseAdded} onExpensesChanged={onExpensesChanged} needsCategories={needsCategories} wantsCategories={wantsCategories} initialExpenses={initialExpenses} testDate={testDate} setTestDate={setTestDate} needsItems={needsItems} wantsItems={wantsItems} />
  );
}