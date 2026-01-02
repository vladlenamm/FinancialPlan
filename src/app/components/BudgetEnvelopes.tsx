import { useState, useEffect, useRef } from 'react';
import { Wallet, TrendingUp, Pencil, Check, X, Plus, Trash2, GripVertical, History } from 'lucide-react';
import { DraggableChecklistRow } from './DraggableChecklistRow';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Envelope {
  name: string;
  emoji: string;
  allocated: number; // Выделено
  spent: number; // Потрачено из конверта
  color: string;
  firstHalfDeposit: number; // Первая половина месяца
}

interface ChecklistItem {
  id: string;
  category: string;
  expected: number;
  actual?: number;
  diff: number;
  done: boolean;
  envelope?: string; // Добавляем поле для конверта
}

interface IncomeSource {
  id: string;
  category: string;
  firstHalf: number;  // Доход 1-15
  secondHalf: number; // Доход 16-31
  type?: 'regular' | 'previous-month' | 'other'; // Тип дохода
}

interface TopUp {
  id: string;
  envelopeName: string;
  amount: number;
  source: 'Save' | 'Regular'; // Из накоплений или Regular Life
  date: string;
}

interface EnvelopeTransfer {
  id: string;
  fromEnvelope: string;
  toEnvelope: string;
  amount: number;
  date: string;
  comment?: string;
}

interface BudgetEnvelopesProps {
  needsItems: ChecklistItem[];
  setNeedsItems: (items: ChecklistItem[]) => void;
  wantsItems: ChecklistItem[];
  setWantsItems: (items: ChecklistItem[]) => void;
  incomeSources: IncomeSource[];
  setIncomeSources: (sources: IncomeSource[]) => void;
  dailyExpenses: {
    category: string;
    plan: number;
    week1: { [key: string]: { amount: number; comment: string }[] };
    week2: { [key: string]: { amount: number; comment: string }[] };
    week3: { [key: string]: { amount: number; comment: string }[] };
    week4: { [key: string]: { amount: number; comment: string }[] };
    total: number;
    percent: number;
    color: string;
    envelope?: string;
  }[];
  testDate: 5 | 25; // Тестовая дата
  setTestDate: (date: 5 | 25) => void; // Функция для изменения тестовой даты
  onBalanceChange?: (envelopeBalance: number, savingsBalance: number) => void;
}

export function BudgetEnvelopes({ needsItems, setNeedsItems, wantsItems, setWantsItems, incomeSources, setIncomeSources, dailyExpenses, testDate, setTestDate, onBalanceChange }: BudgetEnvelopesProps) {
  // State для пополнений конвертов
  const [topUps, setTopUps] = useState<TopUp[]>([]);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpEnvelope, setTopUpEnvelope] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpSource, setTopUpSource] = useState<'Save' | 'Regular'>('Save');

  // State для модального окна истории трат
  const [showExpenseHistoryModal, setShowExpenseHistoryModal] = useState(false);
  const [selectedEnvelopeEmoji, setSelectedEnvelopeEmoji] = useState<string | null>(null);

  // State для модального окна истории пополнений
  const [showTopUpHistoryModal, setShowTopUpHistoryModal] = useState(false);

  // State для переводов между конвертами
  const [envelopeTransfers, setEnvelopeTransfers] = useState<EnvelopeTransfer[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferToEnvelope, setTransferToEnvelope] = useState<string | null>(null);
  const [transferFromEnvelope, setTransferFromEnvelope] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferComment, setTransferComment] = useState('');
  const [showTransferHistoryModal, setShowTransferHistoryModal] = useState(false);

  // Состояние для накоплений с распределением по периодам
  const [savingsData, setSavingsData] = useState<{
    investPiggyBank1_15: number;
    investPiggyBank16_31: number;
    investments1_15: number;
    investments16_31: number;
  }>({
    investPiggyBank1_15: 0,
    investPiggyBank16_31: 0,
    investments1_15: 0,
    investments16_31: 0,
  });

  const [editingIncomeItem, setEditingIncomeItem] = useState<{ id: string; field: 'category' | 'firstHalf' | 'secondHalf' } | null>(null);
  const [editingIncomeValue, setEditingIncomeValue] = useState('');

  const [editingNeedsItem, setEditingNeedsItem] = useState<{ id: string; field: 'expected' | 'actual' } | null>(null);
  const [editingNeedsValue, setEditingNeedsValue] = useState('');
  
  const [editingWantsItem, setEditingWantsItem] = useState<{ id: string; field: 'expected' | 'actual' } | null>(null);
  const [editingWantsValue, setEditingWantsValue] = useState('');

  const [editingNeedsCategory, setEditingNeedsCategory] = useState<string | null>(null);
  const [editingNeedsCategoryValue, setEditingNeedsCategoryValue] = useState('');

  const [editingWantsCategory, setEditingWantsCategory] = useState<string | null>(null);
  const [editingWantsCategoryValue, setEditingWantsCategoryValue] = useState('');

  const [deletedNeedsItem, setDeletedNeedsItem] = useState<ChecklistItem | null>(null);
  const [deletedWantsItem, setDeletedWantsItem] = useState<ChecklistItem | null>(null);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);

  const [openNeedsEnvelopeSelector, setOpenNeedsEnvelopeSelector] = useState<string | null>(null);
  const [openWantsEnvelopeSelector, setOpenWantsEnvelopeSelector] = useState<string | null>(null);

  const [firstHalfDeposits, setFirstHalfDeposits] = useState<{ [key: string]: number }>({
    'Education': 0,
    'Health and Beauty': 0,
    'Food': 0,
    'Regular': 0,
    'Save': 0,
  });
  
  const [editingFirstHalf, setEditingFirstHalf] = useState<string | null>(null);
  const [editingFirstHalfValue, setEditingFirstHalfValue] = useState('');

  const [editingSavingsItem, setEditingSavingsItem] = useState<{ item: 'investPiggyBank' | 'investments'; period: '1-15' | '16-31' } | null>(null);
  const [editingSavingsValue, setEditingSavingsValue] = useState('');

  // Состояние для модального окна добавления категории
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [addCategoryType, setAddCategoryType] = useState<'needs' | 'wants'>('needs');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryExpected, setNewCategoryExpected] = useState('');
  const [newCategoryMappingType, setNewCategoryMappingType] = useState<'new' | 'existing'>('new');
  const [newCategoryDailyCategory, setNewCategoryDailyCategory] = useState('');
  const [newCategoryEnvelope, setNewCategoryEnvelope] = useState('');

  // ALL HOOKS ARE NOW AT THE TOP
  // Предварительные расчеты (нужны ДО calculateEnvelopeData)
  
  // Безопасная пров��рка incomeSources
  const safeIncomeSources = incomeSources || [];
  
  // Находим остаток с прошлого месяца (идет в накопления)
  const previousMonthBalance = safeIncomeSources
    .filter(source => source.type === 'previous-month')
    .reduce((sum, source) => sum + (source.firstHalf || 0), 0);
  
  // Общий доход = сумма всех firstHalf и secondHalf
  const totalIncome = safeIncomeSources.reduce((sum, source) => sum + (source.firstHalf || 0) + (source.secondHalf || 0), 0);
  
  // Доход для распределения по конвертам (без остатка с прошлого месяца, т.к. он идет в Save)
  const incomeForEnvelopes = totalIncome - previousMonthBalance;
  
  // ИСПРАВЛЕНИЕ: Доход по периодам ВКЛЮЧАЯ ВСЕ ИСТОЧНИКИ (в том числе previous-month)
  // Теперь считается ВЕСЬ столбец 1-15 и ВЕСЬ столбец 16-31
  const firstHalfIncome = safeIncomeSources
    .reduce((sum, source) => sum + (source.firstHalf || 0), 0);
    
  const secondHalfIncome = safeIncomeSources
    .reduce((sum, source) => sum + (source.secondHalf || 0), 0);

  // Создаем map эмодзи для первичного расчета
  const emojiMap: { [key: string]: { allocated: number; spent: number } } = {
    '🎓': { allocated: 0, spent: 0 },
    '🛁': { allocated: 0, spent: 0 },
    '🥬': { allocated: 0, spent: 0 },
    '🏠': { allocated: 0, spent: 0 },
    '💰': { allocated: 0, spent: 0 },
  };

  // Безопасные массивы для расчетов
  const safeNeedsItems = needsItems || [];
  const safeWantsItems = wantsItems || [];

  // Су�����мируем expected (п��ан) из needsItems и wantsItems по эмодзи
  [...safeNeedsItems, ...safeWantsItems].forEach(item => {
    if (item.envelope && emojiMap[item.envelope]) {
      emojiMap[item.envelope].allocated += item.expected || 0;
    }
  });

  // Суммируем actual (факт) из needsItems и wantsItems по эмодзи
  [...safeNeedsItems, ...safeWantsItems].forEach(item => {
    if (item.envelope && emojiMap[item.envelope] && item.actual) {
      emojiMap[item.envelope].spent += item.actual;
    }
  });

  // Временные конверты БЕЗ Save для расчета отложенных денег
  const tempEnvelopes = [
    { name: 'Education', emoji: '🎓', allocated: emojiMap['🎓'].allocated, spent: emojiMap['🎓'].spent, firstHalfDeposit: Math.round(emojiMap['🎓'].allocated / 2), color: '#E02F76' },
    { name: 'Health and Beauty', emoji: '🛁', allocated: emojiMap['🛁'].allocated, spent: emojiMap['🛁'].spent, firstHalfDeposit: Math.round(emojiMap['🛁'].allocated / 2), color: '#E871A0' },
    { name: 'Food', emoji: '🥬', allocated: emojiMap['🥬'].allocated, spent: emojiMap['🥬'].spent, firstHalfDeposit: Math.round(emojiMap['🥬'].allocated / 2), color: '#F4AFCA' },
    { name: 'Regular', emoji: '🏠', allocated: emojiMap['🏠'].allocated, spent: emojiMap['🏠'].spent, firstHalfDeposit: Math.round(emojiMap['🏠'].allocated / 2), color: '#FDE0ED' },
  ];

  // Суммируем все ФАКТИЧЕСКИЕ отложенные деньги в конвертах (колонка "1-15"), кроме Save
  const totalEnvelopeDeposits = tempEnvelopes.reduce((sum, env) => {
    const customFirstHalf = firstHalfDeposits[env.name] || 0;
    const firstHalfValue = customFirstHalf > 0 ? customFirstHalf : env.firstHalfDeposit;
    return sum + firstHalfValue;
  }, 0);
  
  // Суммируем все ФАКТИЧЕСКИЕ отложенные деньги в конвертах (колонка "16-31"), кроме Save
  const totalEnvelopeDeposits16_31 = tempEnvelopes.reduce((sum, env) => {
    const customFirstHalf = firstHalfDeposits[env.name] || 0;
    const firstHalfValue = customFirstHalf > 0 ? customFirstHalf : env.firstHalfDeposit;
    const secondHalfValue = env.allocated - firstHalfValue;
    return sum + secondHalfValue;
  }, 0);
  
  // Расчет свободных денег и накоплений
  // По требованию: Save 1-15 = Доход 1-15 - сумма отложенных 1-15 в остальные конверты
  // Save 16-31 = Доход 16-31 - сумма отложенных 16-31 в остальные конверты
  // Теперь previousMonthBalance уже включен в firstHalfIncome, поэтому не добавляем его отдельно
  const saveFirstHalf = firstHalfIncome - totalEnvelopeDeposits;
  const saveSecondHalf = secondHalfIncome - totalEnvelopeDeposits16_31;
  const saveAllocated = saveFirstHalf + saveSecondHalf;
  
  // Свободные деньги = Save (по периоду) - Инвест копилка - Инвестиции
  const freeMoney1_15 = saveFirstHalf - savingsData.investPiggyBank1_15 - savingsData.investments1_15;
  const freeMoney16_31 = saveSecondHalf - savingsData.investPiggyBank16_31 - savingsData.investments16_31;
  
  // Итого распределено по периодам
  const savingsTotal1_15 = savingsData.investPiggyBank1_15 + savingsData.investments1_15 + freeMoney1_15;
  const savingsTotal16_31 = savingsData.investPiggyBank16_31 + savingsData.investments16_31 + freeMoney16_31;
  // В заголовке отображается сумма в зависимости от текущей даты
  const savingsTotalActual = testDate > 15 ? savingsTotal1_15 + savingsTotal16_31 : savingsTotal1_15;
  const savingsTotalPlan = saveAllocated; // План накоплений = весь доступный Save

  // Теперь создаем полный список конвертов ВКЛЮЧАЯ Save
  const envelopes = [
    ...tempEnvelopes,
    { name: 'Save', emoji: '💰', allocated: saveAllocated, spent: emojiMap['💰'].spent, firstHalfDeposit: saveFirstHalf, color: '#D4AF37' },
  ].map(env => {
    // Добавляем топапы к allocated
    const envelopeTopUps = topUps.filter(t => t.envelopeName === env.name);
    let adjustedAllocated = env.allocated;
    envelopeTopUps.forEach(topUp => {
      adjustedAllocated += topUp.amount;
    });

    // Вычитаем топапы из источников
    if (env.name === 'Save' || env.name === 'Regular') {
      const outgoingTopUps = topUps.filter(t => t.source === env.name && t.envelopeName !== env.name);
      outgoingTopUps.forEach(topUp => {
        adjustedAllocated -= topUp.amount;
      });
    }

    return { ...env, allocated: adjustedAllocated };
  });

  // Calculate balances with date consideration
  const currentDay = testDate;
  
  const envelopeBalance = envelopes
    .filter(env => env.name !== 'Save') // Exclude Save envelope
    .reduce((sum, env) => {
      // Получаем разницу от переводов (customFirstHalf - начальное значение)
      const customFirstHalf = firstHalfDeposits[env.name];
      const transferDelta = customFirstHalf !== undefined && customFirstHalf !== 0 ? customFirstHalf - env.firstHalfDeposit : 0;
      
      const availableFunds = currentDay <= 15 ? env.firstHalfDeposit + transferDelta : env.allocated + transferDelta;
      const remaining = availableFunds - env.spent;
      return sum + remaining;
    }, 0);
  
  const savingsBalance = envelopes
    .filter(env => env.name === 'Save')
    .reduce((sum, env) => {
      // Для Save тоже учитываем разницу от переводов
      const customFirstHalf = firstHalfDeposits['Save'];
      const transferDelta = customFirstHalf !== undefined && customFirstHalf !== 0 ? customFirstHalf - env.firstHalfDeposit : 0;
      
      const availableFunds = currentDay <= 15 ? env.firstHalfDeposit + transferDelta : env.allocated + transferDelta;
      const remaining = availableFunds - env.spent;
      return sum + remaining;
    }, 0);

  // Передаем балансы в родительский компонент при их изменении
  useEffect(() => {
    if (onBalanceChange) {
      onBalanceChange(envelopeBalance, savingsBalance);
    }
  }, [envelopeBalance, savingsBalance, onBalanceChange]);

  const startEditingNeedsItem = (id: string, field: 'expected' | 'actual', currentValue: number) => {
    setEditingNeedsItem({ id, field });
    setEditingNeedsValue(currentValue.toString());
  };

  const saveEditingNeedsItem = () => {
    if (editingNeedsItem && editingNeedsValue.trim()) {
      const value = parseFloat(editingNeedsValue);
      if (!isNaN(value) && value >= 0) {
        const updatedNeedsItems = [...needsItems];
        const index = updatedNeedsItems.findIndex(item => item.id === editingNeedsItem.id);
        if (index !== -1) {
          if (editingNeedsItem.field === 'expected') {
            updatedNeedsItems[index].expected = value;
          } else {
            updatedNeedsItems[index].actual = value;
          }
          setNeedsItems(updatedNeedsItems);
        }
      }
    }
    setEditingNeedsItem(null);
    setEditingNeedsValue('');
  };

  const cancelEditingNeedsItem = () => {
    setEditingNeedsItem(null);
    setEditingNeedsValue('');
  };

  const startEditingWantsItem = (id: string, field: 'expected' | 'actual', currentValue: number) => {
    setEditingWantsItem({ id, field });
    setEditingWantsValue(currentValue.toString());
  };

  const saveEditingWantsItem = () => {
    if (editingWantsItem && editingWantsValue.trim()) {
      const value = parseFloat(editingWantsValue);
      if (!isNaN(value) && value >= 0) {
        const updatedWantsItems = [...wantsItems];
        const index = updatedWantsItems.findIndex(item => item.id === editingWantsItem.id);
        if (index !== -1) {
          if (editingWantsItem.field === 'expected') {
            updatedWantsItems[index].expected = value;
          } else {
            updatedWantsItems[index].actual = value;
          }
          setWantsItems(updatedWantsItems);
        }
      }
    }
    setEditingWantsItem(null);
    setEditingWantsValue('');
  };

  const cancelEditingWantsItem = () => {
    setEditingWantsItem(null);
    setEditingWantsValue('');
  };

  const startEditingNeedsCategory = (id: string, currentCategory: string) => {
    setEditingNeedsCategory(id);
    setEditingNeedsCategoryValue(currentCategory);
  };

  const saveEditingNeedsCategory = () => {
    if (editingNeedsCategory && editingNeedsCategoryValue.trim()) {
      const updatedNeedsItems = [...needsItems];
      const index = updatedNeedsItems.findIndex(item => item.id === editingNeedsCategory);
      if (index !== -1) {
        updatedNeedsItems[index].category = editingNeedsCategoryValue.trim();
        setNeedsItems(updatedNeedsItems);
      }
    }
    setEditingNeedsCategory(null);
    setEditingNeedsCategoryValue('');
  };

  const cancelEditingNeedsCategory = () => {
    setEditingNeedsCategory(null);
    setEditingNeedsCategoryValue('');
  };

  const startEditingWantsCategory = (id: string, currentCategory: string) => {
    setEditingWantsCategory(id);
    setEditingWantsCategoryValue(currentCategory);
  };

  const saveEditingWantsCategory = () => {
    if (editingWantsCategory && editingWantsCategoryValue.trim()) {
      const updatedWantsItems = [...wantsItems];
      const index = updatedWantsItems.findIndex(item => item.id === editingWantsCategory);
      if (index !== -1) {
        updatedWantsItems[index].category = editingWantsCategoryValue.trim();
        setWantsItems(updatedWantsItems);
      }
    }
    setEditingWantsCategory(null);
    setEditingWantsCategoryValue('');
  };

  const cancelEditingWantsCategory = () => {
    setEditingWantsCategory(null);
    setEditingWantsCategoryValue('');
  };

  const toggleNeedsItem = (id: string) => {
    setNeedsItems(items =>
      items.map(item =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const toggleWantsItem = (id: string) => {
    setWantsItems(items =>
      items.map(item =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const addNeedsItem = () => {
    setAddCategoryType('needs');
    setNewCategoryName('');
    setNewCategoryExpected('');
    setNewCategoryMappingType('new');
    setNewCategoryDailyCategory('');
    setNewCategoryEnvelope('');
    setShowAddCategoryModal(true);
  };

  const deleteNeedsItem = (id: string) => {
    const itemToDelete = needsItems.find(item => item.id === id);
    if (itemToDelete) {
      setDeletedNeedsItem(itemToDelete);
      setNeedsItems(needsItems.filter(item => item.id !== id));
      
      // Очистить предыдущий таймер
      if (undoTimer) clearTimeout(undoTimer);
      
      // Установить новый таймер
      const timer = setTimeout(() => {
        setDeletedNeedsItem(null);
      }, 5000);
      setUndoTimer(timer);
    }
  };

  const undoDeleteNeedsItem = () => {
    if (deletedNeedsItem) {
      setNeedsItems([...needsItems, deletedNeedsItem]);
      setDeletedNeedsItem(null);
      if (undoTimer) {
        clearTimeout(undoTimer);
        setUndoTimer(null);
      }
    }
  };

  const addWantsItem = () => {
    setAddCategoryType('wants');
    setNewCategoryName('');
    setNewCategoryExpected('');
    setNewCategoryMappingType('new');
    setNewCategoryDailyCategory('');
    setNewCategoryEnvelope('');
    setShowAddCategoryModal(true);
  };

  const deleteWantsItem = (id: string) => {
    const itemToDelete = wantsItems.find(item => item.id === id);
    if (itemToDelete) {
      setDeletedWantsItem(itemToDelete);
      setWantsItems(wantsItems.filter(item => item.id !== id));
      
      // Очистить предыдущий таймер
      if (undoTimer) clearTimeout(undoTimer);
      
      // Установить новый таймер
      const timer = setTimeout(() => {
        setDeletedWantsItem(null);
      }, 5000);
      setUndoTimer(timer);
    }
  };

  const undoDeleteWantsItem = () => {
    if (deletedWantsItem) {
      setWantsItems([...wantsItems, deletedWantsItem]);
      setDeletedWantsItem(null);
      if (undoTimer) {
        clearTimeout(undoTimer);
        setUndoTimer(null);
      }
    }
  };

  // Функции для изменения конверта
  const changeNeedsItemEnvelope = (id: string, envelopeName: string) => {
    const updatedNeedsItems = [...needsItems];
    const index = updatedNeedsItems.findIndex(item => item.id === id);
    if (index !== -1) {
      updatedNeedsItems[index].envelope = envelopeName;
      setNeedsItems(updatedNeedsItems);
    }
  };

  const changeWantsItemEnvelope = (id: string, envelopeName: string) => {
    const updatedWantsItems = [...wantsItems];
    const index = updatedWantsItems.findIndex(item => item.id === id);
    if (index !== -1) {
      updatedWantsItems[index].envelope = envelopeName;
      setWantsItems(updatedWantsItems);
    }
  };

  // Получить эмодзи для категории
  const getCategoryEmoji = (item: ChecklistItem): string => {
    // Если установлен конверт напрямую, используем его
    if (item.envelope) {
      const envelope = envelopes.find(env => env.name === item.envelope);
      return envelope?.emoji || '';
    }

    // Иначе используем автоматическое определение по названию категории
    const categoryLower = item.category.toLowerCase();
    const categoryToEnvelope: { [key: string]: string } = {
      'английский': 'Образование',
      'китайский': 'Образование',
      'вартик': 'Образование',
      'трейдинг': 'Образование',
      'обучение': 'Образование',
      'доставка еда': 'Еда',
      'продукты': 'Еда',
      'кафе': 'Еда',
      'маникюр': 'Здоровье и красота',
      'педикюр': 'Здоровье и красота',
      'ресницы': 'Здоровье и красота',
      'косметика': 'Здоровье и красота',
      'одежда': 'Здоровье и красота',
      'тело': 'Здоровье и красота',
    };
    
    const envelopeName = categoryToEnvelope[categoryLower];
    const envelope = envelopes.find(env => env.name === envelopeName);
    return envelope?.emoji || '';
  };

  // Получить цвет фона для категории
  const getCategoryColor = (item: ChecklistItem): string => {
    // Если установлен кон��ерт напрямую, используем его
    let envelopeName = item.envelope;

    // Иначе используем автоматическое определение по названию категории
    if (!envelopeName) {
      const categoryLower = item.category.toLowerCase();
      const categoryToEnvelope: { [key: string]: string } = {
        'английский': 'Education',
        'китайский': 'Education',
        'вартик': 'Education',
        'трейдинг': 'Education',
        'обучение': 'Education',
        'доставка еды': 'Food',
        'продукты': 'Food',
        'кафе': 'Food',
        'маникюр': 'Health and Beauty',
        'педикюр': 'Health and Beauty',
        'ресницы': 'Health and Beauty',
        'губы': 'Health and Beauty',
        'косметика': 'Health and Beauty',
        'одежда': 'Health and Beauty',
        'тело': 'Health and Beauty',
        'телефон': 'Regular',
        'chatgpt': 'Regular',
        'vk music': 'Regular',
        'вейп': 'Regular',
        'стэб': 'Regular',
        'такси': 'Regular',
        'бонусы': 'Regular',
        'подарки': 'Regular',
        'дом': 'Regular',
      };
      
      envelopeName = categoryToEnvelope[categoryLower];
    }
    
    // Ма��пинг конвертов к цветам фона
    const colorMap: { [key: string]: string } = {
      'Education': 'bg-rose-100/80',
      'Health and Beauty': 'bg-rose-100/60',
      'Food': 'bg-red-200/70',
      'Regular': 'bg-rose-50/70',
      'Save': 'bg-rose-100/50',
    };
    
    return envelopeName ? colorMap[envelopeName] || '' : '';
  };

  // Функции для перетаскивания
  const moveNeedsItem = (dragIndex: number, hoverIndex: number) => {
    const dragItem = needsItems[dragIndex];
    const newItems = [...needsItems];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, dragItem);
    setNeedsItems(newItems);
  };

  const moveWantsItem = (dragIndex: number, hoverIndex: number) => {
    const dragItem = wantsItems[dragIndex];
    const newItems = [...wantsItems];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, dragItem);
    setWantsItems(newItems);
  };

  // Income sources functions
  const startEditingIncome = (id: string, field: 'category' | 'firstHalf' | 'secondHalf', currentValue: string | number) => {
    setEditingIncomeItem({ id, field });
    setEditingIncomeValue(currentValue.toString());
  };

  const saveEditingIncome = () => {
    if (editingIncomeItem && editingIncomeValue.trim()) {
      const updatedIncomeSources = [...incomeSources];
      const index = updatedIncomeSources.findIndex(item => item.id === editingIncomeItem.id);
      
      if (index !== -1) {
        if (editingIncomeItem.field === 'category') {
          updatedIncomeSources[index].category = editingIncomeValue.trim();
        } else {
          const value = parseFloat(editingIncomeValue);
          if (!isNaN(value) && value >= 0) {
            if (editingIncomeItem.field === 'firstHalf') {
              updatedIncomeSources[index].firstHalf = value;
            } else if (editingIncomeItem.field === 'secondHalf') {
              updatedIncomeSources[index].secondHalf = value;
            }
          }
        }
        setIncomeSources(updatedIncomeSources);
      }
    }
    setEditingIncomeItem(null);
    setEditingIncomeValue('');
  };

  const cancelEditingIncome = () => {
    setEditingIncomeItem(null);
    setEditingIncomeValue('');
  };

  const addIncomeSource = () => {
    const newSource: IncomeSource = {
      id: `income-${Date.now()}`,
      category: 'Новый источник',
      firstHalf: 0,
      secondHalf: 0,
      type: 'regular',
    };
    setIncomeSources([...incomeSources, newSource]);
  };

  const deleteIncomeSource = (id: string) => {
    setIncomeSources(incomeSources.filter(source => source.id !== id));
  };

  // Функции для редактирования firstHalfDeposit
  const startEditingFirstHalf = (envelopeName: string, currentValue: number) => {
    setEditingFirstHalf(envelopeName);
    setEditingFirstHalfValue(currentValue.toString());
  };

  const saveEditingFirstHalf = () => {
    if (editingFirstHalf && editingFirstHalfValue.trim()) {
      const value = parseFloat(editingFirstHalfValue);
      if (!isNaN(value) && value >= 0) {
        setFirstHalfDeposits({
          ...firstHalfDeposits,
          [editingFirstHalf]: value
        });
      }
    }
    setEditingFirstHalf(null);
    setEditingFirstHalfValue('');
  };

  const cancelEditingFirstHalf = () => {
    setEditingFirstHalf(null);
    setEditingFirstHalfValue('');
  };

  // Функции для редактирования накоплений
  const startEditingSavings = (item: 'investPiggyBank' | 'investments', period: '1-15' | '16-31', currentValue: number) => {
    setEditingSavingsItem({ item, period });
    setEditingSavingsValue(currentValue.toString());
  };

  const saveEditingSavings = () => {
    if (editingSavingsItem && editingSavingsValue.trim()) {
      const value = parseFloat(editingSavingsValue);
      if (!isNaN(value) && value >= 0) {
        const fieldName = `${editingSavingsItem.item}${editingSavingsItem.period === '1-15' ? '1_15' : '16_31'}` as keyof typeof savingsData;
        setSavingsData({
          ...savingsData,
          [fieldName]: value
        });
      }
    }
    setEditingSavingsItem(null);
    setEditingSavingsValue('');
  };

  const cancelEditingSavings = () => {
    setEditingSavingsItem(null);
    setEditingSavingsValue('');
  };

  // Функции для пополнения конвертов
  const openTopUpModal = (envelopeName: string) => {
    setTopUpEnvelope(envelopeName);
    setTopUpAmount('');
    setTopUpSource('Save');
    setShowTopUpModal(true);
  };

  const closeTopUpModal = () => {
    setShowTopUpModal(false);
    setTopUpEnvelope(null);
    setTopUpAmount('');
    setTopUpSource('Save');
  };

  const addTopUp = () => {
    if (!topUpEnvelope || !topUpAmount || parseFloat(topUpAmount) <= 0) return;

    const newTopUp: TopUp = {
      id: `topup-${Date.now()}`,
      envelopeName: topUpEnvelope,
      amount: parseFloat(topUpAmount),
      source: topUpSource,
      date: new Date().toISOString(),
    };

    setTopUps([...topUps, newTopUp]);
    closeTopUpModal();
  };

  const deleteTopUp = (topUpId: string) => {
    setTopUps(topUps.filter(t => t.id !== topUpId));
  };

  const totalPlanned = envelopes.reduce((sum, env) => sum + env.allocated, 0);
  const totalDeposited = envelopes.reduce((sum, env) => sum + env.allocated, 0); // Всего отложено (план)
  const totalSpent = envelopes.reduce((sum, env) => sum + env.spent, 0);

  // Totals for needs and wants
  const needsTotal = needsItems.reduce((sum, item) => sum + item.expected, 0);
  const wantsTotal = wantsItems.reduce((sum, item) => sum + item.expected, 0);

  // Данные для круговой диаграммы - показываем РАСПРЕДЕЛЕНИЕ БЮДЖЕТА, а не планы категорий
  // Итого должно равняться доходу, так как Save = Доход - остальные конверты
  const total = totalIncome; // Используем доход вместо суммы планов

  const pieData = [
    { name: 'Needs', value: Math.max(0, needsTotal), percentage: total > 0 ? ((Math.max(0, needsTotal) / total) * 100).toFixed(0) : 0 },
    { name: 'Wishes', value: Math.max(0, wantsTotal), percentage: total > 0 ? ((Math.max(0, wantsTotal) / total) * 100).toFixed(0) : 0 },
    { name: 'Накопления', value: Math.max(0, savingsTotalPlan), percentage: total > 0 ? ((Math.max(0, savingsTotalPlan) / total) * 100).toFixed(0) : 0 },
  ].filter(item => item.value > 0);

  const COLORS = ['#E02F76', '#E871A0', '#F4AFCA'];

  // Load savings data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('savingsData');
    if (savedData) {
      try {
        setSavingsData(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to parse savingsData from localStorage', e);
      }
    }
  }, []);

  // Save savings data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('savingsData', JSON.stringify(savingsData));
  }, [savingsData]);

  // Load topUps from localStorage on mount
  useEffect(() => {
    const savedTopUps = localStorage.getItem('topUps');
    if (savedTopUps) {
      try {
        setTopUps(JSON.parse(savedTopUps));
      } catch (e) {
        console.error('Failed to parse topUps from localStorage', e);
      }
    }
  }, []);

  // Save topUps to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('topUps', JSON.stringify(topUps));
  }, [topUps]);

  // Load envelope transfers from localStorage on mount
  useEffect(() => {
    const savedTransfers = localStorage.getItem('envelopeTransfers');
    if (savedTransfers) {
      try {
        setEnvelopeTransfers(JSON.parse(savedTransfers));
      } catch (e) {
        console.error('Failed to parse envelopeTransfers from localStorage', e);
      }
    }
  }, []);

  // Save envelope transfers to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('envelopeTransfers', JSON.stringify(envelopeTransfers));
  }, [envelopeTransfers]);

  // Save firstHalfDeposits to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('firstHalfDeposits', JSON.stringify(firstHalfDeposits));
  }, [firstHalfDeposits]);

  // Load firstHalfDeposits from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('firstHalfDeposits');
    if (saved) {
      try {
        setFirstHalfDeposits(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse firstHalfDeposits from localStorage', e);
      }
    }
  }, []);

  // Функции для переводов между конвертами
  const handleOpenTransferModal = (envelopeName: string) => {
    setTransferToEnvelope(envelopeName);
    setTransferFromEnvelope('');
    setTransferAmount('');
    setTransferComment('');
    setShowTransferModal(true);
  };

  const handleSaveTransfer = () => {
    if (!transferToEnvelope || !transferFromEnvelope || !transferAmount) {
      alert('Заполните все обязательные поля');
      return;
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Введите корректную сумму');
      return;
    }

    // Проверяем, что источник и получатель разные
    if (transferFromEnvelope === transferToEnvelope) {
      alert('Нельзя переводить в тот же конверт');
      return;
    }

    // Создаем новый перевод
    const newTransfer: EnvelopeTransfer = {
      id: `transfer-${Date.now()}`,
      fromEnvelope: transferFromEnvelope,
      toEnvelope: transferToEnvelope,
      amount: amount,
      date: new Date().toLocaleDateString('ru-RU'),
      comment: transferComment.trim() || undefined,
    };

    setEnvelopeTransfers([...envelopeTransfers, newTransfer]);

    // Находим начальные значения конвертов
    const fromEnv = envelopes.find(e => e.name === transferFromEnvelope);
    const toEnv = envelopes.find(e => e.name === transferToEnvelope);

    // Обновляем firstHalfDeposits с учетом начальных значений
    setFirstHalfDeposits(prev => {
      const fromInitial = fromEnv?.firstHalfDeposit || 0;
      const toInitial = toEnv?.firstHalfDeposit || 0;
      
      return {
        ...prev,
        [transferFromEnvelope]: (prev[transferFromEnvelope] === 0 ? fromInitial : prev[transferFromEnvelope]) - amount,
        [transferToEnvelope]: (prev[transferToEnvelope] === 0 ? toInitial : prev[transferToEnvelope]) + amount,
      };
    });

    // Закрываем модалку и очищаем поля
    setShowTransferModal(false);
    setTransferToEnvelope(null);
    setTransferFromEnvelope('');
    setTransferAmount('');
    setTransferComment('');
  };

  const handleDeleteTransfer = (transferId: string) => {
    const transfer = envelopeTransfers.find(t => t.id === transferId);
    if (!transfer) return;

    // Находим начальные значения конвертов
    const fromEnv = envelopes.find(e => e.name === transfer.fromEnvelope);
    const toEnv = envelopes.find(e => e.name === transfer.toEnvelope);

    // Возвращаем деньги обратно с учетом начальных значений
    setFirstHalfDeposits(prev => {
      const fromInitial = fromEnv?.firstHalfDeposit || 0;
      const toInitial = toEnv?.firstHalfDeposit || 0;
      
      const newFromValue = (prev[transfer.fromEnvelope] === 0 ? fromInitial : prev[transfer.fromEnvelope]) + transfer.amount;
      const newToValue = (prev[transfer.toEnvelope] === 0 ? toInitial : prev[transfer.toEnvelope]) - transfer.amount;
      
      return {
        ...prev,
        [transfer.fromEnvelope]: newFromValue === fromInitial ? 0 : newFromValue,
        [transfer.toEnvelope]: newToValue === toInitial ? 0 : newToValue,
      };
    });

    // Удаляем перевод
    setEnvelopeTransfers(envelopeTransfers.filter(t => t.id !== transferId));
  };

  // Функция для сохранения новой категории
  const handleSaveNewCategory = () => {
    if (!newCategoryName.trim()) {
      alert('Введите название категории');
      return;
    }

    const expected = parseFloat(newCategoryExpected) || 0;
    
    const newItem: ChecklistItem = {
      id: `${addCategoryType}-${Date.now()}`,
      category: newCategoryName.trim(),
      expected: expected,
      actual: 0,
      diff: expected,
      done: false,
      envelope: newCategoryEnvelope || '🏠',
      dailyCategory: newCategoryMappingType === 'existing' ? newCategoryDailyCategory : newCategoryName.trim()
    };

    if (addCategoryType === 'needs') {
      setNeedsItems([...needsItems, newItem]);
    } else {
      setWantsItems([...wantsItems, newItem]);
    }

    // Если создаем новую категорию в ежедневнике, создадим ее там
    if (newCategoryMappingType === 'new' && dailyExpenses.length > 0) {
      // Уведомим пользователя, что нужно добавить категорию в ежедневник
      // (это делается вручную в компоненте DailyExpenses)
    }

    setShowAddCategoryModal(false);
    setNewCategoryName('');
    setNewCategoryExpected('');
    setNewCategoryMappingType('new');
    setNewCategoryDailyCategory('');
    setNewCategoryEnvelope('');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-sm">
            <Wallet className="w-5 h-5 text-gray-600" />
          </div>
          <h2 className="text-gray-800 font-light tracking-tight">Бюджетные конверты</h2>
          
          {/* Кнопка для просмотра истории пополнений */}
          {topUps.length > 0 && (
            <button
              onClick={() => setShowTopUpHistoryModal(true)}
              className="ml-2 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              История пополнений ({topUps.length})
            </button>
          )}
        </div>
        
        {/* ТЕСТОВАЯ КНОПКА */}
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
          <span className="text-xs text-orange-700 font-medium">ТЕСТ:</span>
          <button
            onClick={() => setTestDate(testDate === 5 ? 25 : 5)}
            className="px-3 py-1 text-xs font-medium rounded-md transition-colors"
            style={{
              backgroundColor: testDate === 5 ? '#E02F76' : '#E871A0',
              color: 'white'
            }}
          >
            Сегодня {testDate}-е число
          </button>
        </div>
      </div>
      
      {/* Income Sources Card and Envelope Distribution */}
      <div className="flex gap-4">
        {/* Income Sources Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex-1" style={{ minWidth: '320px', maxWidth: '680px' }}>
          <div className="flex gap-4">
            {/* Left side - Table */}
            <div className="flex-1 min-w-[320px]">
              {/* Income Sources Section */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
            <h3 className="text-gray-800 font-light tracking-tight text-sm mb-2">Источники дохода</h3>
            <div className="grid grid-cols-[1.5fr_1.1fr_1.1fr] gap-2 text-[9px] text-gray-500 font-medium uppercase tracking-wider">
              <div>Категория</div>
              <div className="text-center">1-15</div>
              <div className="text-center">16-31</div>
            </div>
          </div>
        
              <div className="divide-y divide-gray-50">
                {incomeSources.map((source) => {
            // Определяем визуальный стиль в зависимости от типа
            const isPreviousMonth = source.type === 'previous-month';
            const isOther = source.type === 'other';
            const rowClassName = "px-4 py-2.5 hover:bg-gray-50/50 transition-colors";
            
            return (
              <div key={source.id} className={rowClassName} onContextMenu={(e) => {
                e.preventDefault();
                // Защита от удаления специальных категорий
                if (!isPreviousMonth && !isOther) {
                  deleteIncomeSource(source.id);
                }
              }}>
                <div className="grid grid-cols-[1.5fr_1.1fr_1.1fr] gap-2 items-center">
                  {/* Category */}
                  <div>
                    {editingIncomeItem?.id === source.id && editingIncomeItem?.field === 'category' ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingIncomeValue}
                          onChange={(e) => setEditingIncomeValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditingIncome();
                            if (e.key === 'Escape') cancelEditingIncome();
                          }}
                          className="flex-1 px-1 py-0.5 text-[11px] border border-gray-300 rounded focus:outline-none focus:border-gray-400"
                            autoFocus
                          />
                          <button
                            onClick={saveEditingIncome}
                            className="p-0.5 text-gray-500 hover:text-emerald-600 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelEditingIncome}
                            className="p-0.5 text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="group/cat inline-flex items-center gap-1">
                          <span className="text-[11px] text-gray-800">
                            {source.category}
                          </span>
                          {!isPreviousMonth && !isOther && (
                            <button
                              onClick={() => startEditingIncome(source.id, 'category', source.category)}
                              className="opacity-0 group-hover/cat:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 transition-all"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* First Half (1-15) */}
                    <div className="text-center">
                      {editingIncomeItem?.id === source.id && editingIncomeItem?.field === 'firstHalf' ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={editingIncomeValue}
                            onChange={(e) => setEditingIncomeValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditingIncome();
                              if (e.key === 'Escape') cancelEditingIncome();
                            }}
                            className="w-16 px-1 py-0.5 text-[11px] text-right border border-gray-300 rounded focus:outline-none focus:border-gray-400"
                            autoFocus
                          />
                          <button
                            onClick={saveEditingIncome}
                            className="p-0.5 text-gray-500 hover:text-emerald-600 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelEditingIncome}
                            className="p-0.5 text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="group/first inline-flex items-center gap-1">
                          <span className="text-[11px] text-gray-800">{source.firstHalf.toLocaleString()} ₽</span>
                          <button
                            onClick={() => startEditingIncome(source.id, 'firstHalf', source.firstHalf)}
                            className="opacity-0 group-hover/first:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 transition-all"
                          >
                            <Pencil className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Second Half (16-31) */}
                    <div className="text-center">
                      {editingIncomeItem?.id === source.id && editingIncomeItem?.field === 'secondHalf' ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={editingIncomeValue}
                            onChange={(e) => setEditingIncomeValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditingIncome();
                              if (e.key === 'Escape') cancelEditingIncome();
                            }}
                            className="w-16 px-1 py-0.5 text-[11px] text-right border border-gray-300 rounded focus:outline-none focus:border-gray-400"
                            autoFocus
                          />
                          <button
                            onClick={saveEditingIncome}
                            className="p-0.5 text-gray-500 hover:text-emerald-600 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelEditingIncome}
                            className="p-0.5 text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="group/second inline-flex items-center gap-1">
                          <span className="text-[11px] text-gray-800">{source.secondHalf.toLocaleString()} ₽</span>
                          <button
                            onClick={() => startEditingIncome(source.id, 'secondHalf', source.secondHalf)}
                            className="opacity-0 group-hover/second:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 transition-all"
                          >
                            <Pencil className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Total Row */}
        <div className="px-4 py-2.5 border-t border-gray-200 bg-white">
          <div className="grid grid-cols-[1.5fr_1.1fr_1.1fr] gap-2 items-center">
            <div>
              <span className="text-[11px] font-medium text-gray-800">Итого</span>
            </div>
            <div className="text-center">
              <span className="text-[11px] font-medium text-gray-800">
                {incomeSources.reduce((sum, s) => sum + s.firstHalf, 0).toLocaleString()} ₽
              </span>
            </div>
            <div className="text-center">
              <span className="text-[11px] font-medium text-gray-800">
                {incomeSources.reduce((sum, s) => sum + s.secondHalf, 0).toLocaleString()} ₽
              </span>
            </div>
          </div>
          
          {/* Подсказка о специальных категориях */}
          <div className="mt-2 px-2 py-2 rounded-lg border border-gray-200" style={{ background: 'linear-gradient(to right, #F9FAFB, #F3F4F6)' }}>
            <div className="flex items-start gap-2 text-[10px] text-gray-600">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 leading-relaxed">
                <span className="font-medium text-gray-800">💰 Остаток с прошлого месяца</span> автоматически добавляется к накоплениям (Save). 
                <span className="font-medium text-gray-800 ml-1">🎁 Прочие доходы</span> включаются в общий доход.
              </div>
            </div>
          </div>
          
          <button
            onClick={addIncomeSource}
            className="mt-2 w-full px-3 py-1.5 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-light"
            style={{ backgroundColor: '#E02F76' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C02866'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E02F76'}
          >
            <Plus className="w-3.5 h-3.5" />
            Добавить источник
          </button>
        </div>
        </div>
        </div>
        </div>

        {/* Financial Summary Card - NEW */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex-1">
          <div className="px-[16px] py-[12px] border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
            <h3 className="text-gray-800 font-light tracking-tight text-sm">Сводка</h3>
          </div>
          
          <div className="p-3 space-y-2">
            {(() => {
              // Расчет общей суммы планов конвертов (Education + Health + Food + Regular)
              const totalEnvelopesPlan = envelopes
                .filter(env => env.name !== 'Save')
                .reduce((sum, env) => sum + env.allocated, 0);
              
              // План Save
              const savePlan = saveAllocated;
              
              // Общий доход
              const totalIncomeAmount = totalIncome;
              
              // Проверка баланса: (конверты кроме Save) + Save должно = доходу
              const totalAllocated = totalEnvelopesPlan + savePlan;
              const difference = totalIncomeAmount - totalAllocated;
              const isPositive = Math.abs(difference) < 0.01; // Проверка на равенство с учетом погрешности
              
              return (
                <>
                  {/* Конверты (кроме Save) */}
                  <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-[11px] text-gray-700">💼 Запланировано</span>
                    <span className="text-[11px] font-medium text-gray-800">{totalEnvelopesPlan.toLocaleString()} ₽</span>
                  </div>
                  
                  {/* Общий доход */}
                  <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-[11px] text-gray-800">💵 Доход всего</span>
                    <span className="text-[11px] font-medium text-gray-800">{totalIncomeAmount.toLocaleString()} ₽</span>
                  </div>
                  
                  {/* Save */}
                  <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-[11px] text-gray-700">💰 Накопления</span>
                    <span className="text-[11px] font-medium text-gray-800">{savePlan.toLocaleString()} ₽</span>
                  </div>
                  
                  {/* Итого отложено */}
                  <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-[11px] font-medium text-gray-800">📊 Итого</span>
                    <span className="text-[11px] font-medium text-gray-800">{totalAllocated.toLocaleString()} ₽</span>
                  </div>
                  
                  {/* Баланс проверка */}
                  <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-[11px] font-medium text-gray-800">
                      {isPositive ? '✅ Баланс OK' : '⚠️ Ошибка'}
                    </span>
                    <span className="text-[11px] font-medium text-gray-800">
                      {Math.abs(difference) < 0.01 ? '0' : difference.toFixed(2)} ₽
                    </span>
                  </div>
                  
                  {/* Разделитель */}
                  <div className="border-t border-gray-200 my-2"></div>
                  
                  {/* Баланс конверты */}
                  <div className="flex items-center justify-between px-2 py-2 hover:bg-gray-50 transition-colors rounded-lg">
                    <span className="text-[11px] text-gray-700">💼 Баланс конверты</span>
                    <span className="text-[11px] font-medium text-gray-800">{envelopeBalance.toLocaleString()} ₽</span>
                  </div>
                  
                  {/* Баланс накопления */}
                  <div className="flex items-center justify-between px-2 py-2 hover:bg-gray-50 transition-colors rounded-lg">
                    <span className="text-[11px] text-gray-700">💰 Баланс накопления</span>
                    <span className="text-[11px] font-medium text-gray-800">{savingsBalance.toLocaleString()} ₽</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Envelopes */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {envelopes.map((envelope, idx) => {
          const progress = (envelope.spent / envelope.allocated) * 100;
          const isOverBudget = envelope.spent > envelope.allocated;
          
          // Динамический расчет остатка в зависимости от текущей даты
          const today = new Date();
          const currentDay = testDate; // Используем тестовую дату вместо реальной
        
          // Используем пользовательское значение firstHalfDeposit или автоматически рассчитанное
          const customFirstHalf = firstHalfDeposits[envelope.name];
          const firstHalfValue = customFirstHalf > 0 ? customFirstHalf : envelope.firstHalfDeposit;
          const secondHalfNeeded = envelope.allocated - firstHalfValue;
          
          // Если сегодня до 15 числа (включительно), учитываем только первую половину
          // Если после 15, учитываем обе половины
          const availableFunds = currentDay <= 15 ? firstHalfValue : envelope.allocated;
          const remaining = availableFunds - envelope.spent;
          
          return (
            <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              {/* Заголовок */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{envelope.emoji}</span>
                  <h3 className="text-xs font-light text-gray-800 truncate">{envelope.name}</h3>
                </div>
              </div>

              {/* Основная информация */}
              <div className="space-y-2">
                {/* План на месяц */}
                <div className="group">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">План</span>
                    <span className="text-xs font-light text-gray-900">
                      {envelope.name === 'Save' 
                        ? (testDate <= 15 ? firstHalfValue : envelope.allocated).toLocaleString()
                        : envelope.allocated.toLocaleString()
                      } ₽
                    </span>
                  </div>
                </div>

                <div className="h-px bg-gray-100"></div>

                {/* Первая половина месяца */}
                <div className="group">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">1-15</span>
                    {editingFirstHalf === envelope.name ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editingFirstHalfValue}
                          onChange={(e) => setEditingFirstHalfValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditingFirstHalf();
                            if (e.key === 'Escape') cancelEditingFirstHalf();
                          }}
                          className="w-16 px-1 py-0.5 text-xs text-right border border-gray-300 rounded focus:outline-none focus:border-gray-400"
                          autoFocus
                        />
                        <button
                          onClick={saveEditingFirstHalf}
                          className="p-0.5 text-gray-500 hover:text-emerald-600 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={cancelEditingFirstHalf}
                          className="p-0.5 text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span 
                        className={`text-xs font-light text-gray-900 ${envelope.name !== 'Save' ? 'cursor-pointer hover:text-gray-600 transition-colors' : ''}`}
                        onClick={() => envelope.name !== 'Save' && startEditingFirstHalf(envelope.name, firstHalfValue)}
                      >
                        {firstHalfValue.toLocaleString()} ₽
                      </span>
                    )}
                  </div>
                </div>

                {/* Вторая половина месяца - автоматически */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">16-31</span>
                    <span className="text-xs font-light text-gray-900">
                      {envelope.name === 'Save' && testDate <= 15 
                        ? '—' 
                        : `${secondHalfNeeded.toLocaleString()} ₽`
                      }
                    </span>
                  </div>
                </div>

                <div className="h-px bg-gray-100"></div>

                {/* Факт */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">Факт</span>
                  <span className="text-xs font-light text-gray-700">{envelope.spent.toLocaleString()} ₽</span>
                </div>

                <div className="h-px bg-gray-100"></div>

                {/* Остаток */}
                <button
                  onClick={() => {
                    setSelectedEnvelopeEmoji(envelope.emoji);
                    setShowExpenseHistoryModal(true);
                  }}
                  className="px-2 py-1.5 rounded-lg flex items-center justify-between border w-full hover:shadow-md transition-all cursor-pointer"
                  style={{
                    backgroundColor: isOverBudget ? '#FEE2E2' : remaining < envelope.allocated * 0.2 ? '#FEF3C7' : '#FDE8F3',
                    borderColor: isOverBudget ? '#FCA5A5' : remaining < envelope.allocated * 0.2 ? '#FDE047' : '#F4AFCA'
                  }}
                >
                  <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">Остаток</span>
                  <span className="text-xs font-medium" style={{
                    color: isOverBudget ? '#991B1B' : remaining < envelope.allocated * 0.2 ? '#92400E' : '#E02F76'
                  }}>
                    {remaining.toLocaleString()} ₽
                  </span>
                </button>

                {/* Прогресс бар */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-[10px] text-gray-500">
                    <span className="font-light">Использовано</span>
                    <span className="font-medium">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300 ease-in-out"
                      style={{ 
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: isOverBudget ? '#DC2626' : progress > 80 ? '#F59E0B' : '#E02F76'
                      }}
                    />
                  </div>
                </div>

                {/* Кнопка пополнения */}
                <button
                  onClick={() => handleOpenTransferModal(envelope.name)}
                  className="mt-3 w-full px-3 py-2 bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 text-pink-700 rounded-lg text-xs font-medium transition-all border border-pink-200 hover:border-pink-300 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Пополнить
                </button>
              </div>
            </div>
          );
        })}

      </div>

      {/* Checklists and Summary/Pie Chart Section */}
      <div className="flex flex-col lg:flex-row gap-4">
          {/* Needs Checklist */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible w-full">
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-800 font-light tracking-tight text-sm">Needs</h3>
                  <span className="font-light tracking-tight text-sm" style={{ color: '#F4AFCA' }}>
                    {needsTotal.toLocaleString()} ₽
                  </span>
                </div>
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 text-[9px] text-gray-500 font-medium uppercase tracking-wider">
                  <div>Категория</div>
                  <div className="text-right">План</div>
                  <div className="text-right">Факт</div>
                </div>
              </div>
            
              <div className="divide-y divide-gray-50">
                {needsItems.map((item, index) => (
                <DraggableChecklistRow
                  key={item.id}
                  item={item}
                  index={index}
                  moveItem={moveNeedsItem}
                  deleteItem={deleteNeedsItem}
                  toggleItem={toggleNeedsItem}
                  getCategoryColor={getCategoryColor}
                  getCategoryEmoji={getCategoryEmoji}
                  editingCategory={editingNeedsCategory}
                  editingCategoryValue={editingNeedsCategoryValue}
                  setEditingCategoryValue={setEditingNeedsCategoryValue}
                  startEditingCategory={startEditingNeedsCategory}
                  saveEditingCategory={saveEditingNeedsCategory}
                  cancelEditingCategory={cancelEditingNeedsCategory}
                  editingItem={editingNeedsItem}
                  editingValue={editingNeedsValue}
                  setEditingValue={setEditingNeedsValue}
                  startEditingItem={startEditingNeedsItem}
                  saveEditingItem={saveEditingNeedsItem}
                  cancelEditingItem={cancelEditingNeedsItem}
                  actualColor="text-[#E02F76]"
                  envelopes={envelopes}
                  changeItemEnvelope={changeNeedsItemEnvelope}
                  openEnvelopeSelector={openNeedsEnvelopeSelector}
                  setOpenEnvelopeSelector={setOpenNeedsEnvelopeSelector}
                  totalItems={needsItems.length}
                />
                ))}
              </div>

              {/* Футер с итогами и кнопкой добавления */}

              <div className="px-4 py-3 border-t border-gray-200 bg-white">
                <div className="grid grid-cols-3 gap-2 items-center mb-2">
                  <span className="text-xs font-medium text-gray-800">Итого</span>
                  <span className="text-xs font-medium text-gray-800 text-right">
                    {needsItems.reduce((sum, item) => sum + item.expected, 0).toLocaleString()} ₽
                  </span>
                  <span className="text-xs font-medium text-[#E02F76] text-right">
                    {needsItems.reduce((sum, item) => sum + (item.actual || 0), 0).toLocaleString()} ₽
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addNeedsItem}
                    className="flex-1 px-3 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-light"
                    style={{ backgroundColor: '#E02F76' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C02866'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E02F76'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Добавить категорию
                  </button>
                  {deletedNeedsItem && (
                    <button
                      onClick={undoDeleteNeedsItem}
                      className="w-8 h-8 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-all flex items-center justify-center shadow-md hover:shadow-lg flex-shrink-0"
                      title="Отменить удаление"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Wants Checklist */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible w-full">
              <div className="px-4 py-3 border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-800 font-light tracking-tight text-sm">Wishes</h3>
                  <span className="font-light tracking-tight text-sm" style={{ color: '#F4AFCA' }}>
                    {wantsTotal.toLocaleString()} ₽
                  </span>
                </div>
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 text-[9px] text-gray-500 font-medium uppercase tracking-wider">
                  <div>Категория</div>
                  <div className="text-right">План</div>
                  <div className="text-right">Факт</div>
                </div>
              </div>
          
              <div className="divide-y divide-gray-50">
                {wantsItems.map((item, index) => (
              <DraggableChecklistRow
                key={item.id}
                item={item}
                index={index}
                moveItem={moveWantsItem}
                deleteItem={deleteWantsItem}
                toggleItem={toggleWantsItem}
                getCategoryColor={getCategoryColor}
                getCategoryEmoji={getCategoryEmoji}
                editingCategory={editingWantsCategory}
                editingCategoryValue={editingWantsCategoryValue}
                setEditingCategoryValue={setEditingWantsCategoryValue}
                startEditingCategory={startEditingWantsCategory}
                saveEditingCategory={saveEditingWantsCategory}
                cancelEditingCategory={cancelEditingWantsCategory}
                editingItem={editingWantsItem}
                editingValue={editingWantsValue}
                setEditingValue={setEditingWantsValue}
                startEditingItem={startEditingWantsItem}
                saveEditingItem={saveEditingWantsItem}
                cancelEditingItem={cancelEditingWantsItem}
                checkColor="bg-blue-500"
                actualColor="text-[#E02F76]"
                envelopes={envelopes}
                changeItemEnvelope={changeWantsItemEnvelope}
                openEnvelopeSelector={openWantsEnvelopeSelector}
                setOpenEnvelopeSelector={setOpenWantsEnvelopeSelector}
                totalItems={wantsItems.length}
                />
              ))}
              </div>

              <div className="px-4 py-3 border-t border-gray-200 bg-white">
                <div className="grid grid-cols-3 gap-2 items-center mb-2">
                  <span className="text-xs font-medium text-gray-800">Итого</span>
                  <span className="text-xs font-medium text-gray-800 text-right">
                    {wantsItems.reduce((sum, item) => sum + item.expected, 0).toLocaleString()} ₽
                  </span>
                  <span className="text-xs font-medium text-[#E02F76] text-right">
                    {wantsItems.reduce((sum, item) => sum + (item.actual || 0), 0).toLocaleString()} ₽
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addWantsItem}
                    className="flex-1 px-3 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-light"
                    style={{ backgroundColor: '#E871A0' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D66190'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E871A0'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Добавить категорию
                  </button>
                  {deletedWantsItem && (
                    <button
                      onClick={undoDeleteWantsItem}
                      className="w-8 h-8 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-all flex items-center justify-center shadow-md hover:shadow-lg flex-shrink-0"
                      title="Отменить удаление"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Savings, Summary and Pie Chart */}
          <div className="flex flex-col gap-4 w-full lg:w-80">
            {/* Savings Mini Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white rounded-t-[16px] rounded-b-[0px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-800 font-light tracking-tight text-sm">Накопления</h3>
                  <span className="font-light tracking-tight text-sm" style={{ color: '#F4AFCA' }}>
                    {savingsTotalActual.toLocaleString()} ₽
                  </span>
                </div>
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 text-[9px] text-gray-500 font-medium uppercase tracking-wider">
                  <div>Категория</div>
                  <div className="text-right">1-15</div>
                  <div className="text-right">16-31</div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-50">
                {(() => {
                  return (
                    <>
                      {/* Инвест копилка */}
                      <div className="px-4 py-2.5 hover:bg-gray-50/30 transition-colors">
                        <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 items-center">
                          <span className="text-[11px] text-gray-700">Инвест копилка</span>
                          
                          {/* 1-15 */}
                          {editingSavingsItem?.item === 'investPiggyBank' && editingSavingsItem?.period === '1-15' ? (
                            <div className="flex items-center gap-1 justify-end">
                              <input
                                type="number"
                                value={editingSavingsValue}
                                onChange={(e) => setEditingSavingsValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditingSavings();
                                  if (e.key === 'Escape') cancelEditingSavings();
                                }}
                                className="w-16 px-1 py-0.5 text-xs text-right border border-gray-300 rounded focus:outline-none focus:border-gray-400"
                                autoFocus
                              />
                              <button
                                onClick={saveEditingSavings}
                                className="p-0.5 text-gray-500 hover:text-emerald-600 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={cancelEditingSavings}
                                className="p-0.5 text-gray-500 hover:text-red-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span 
                              className="text-[11px] text-gray-700 text-right cursor-pointer hover:text-gray-500 transition-colors"
                              onClick={() => startEditingSavings('investPiggyBank', '1-15', savingsData.investPiggyBank1_15)}
                            >
                              {savingsData.investPiggyBank1_15.toLocaleString()} ₽
                            </span>
                          )}
                          
                          {/* 16-31 */}
                          {testDate > 15 ? (
                            editingSavingsItem?.item === 'investPiggyBank' && editingSavingsItem?.period === '16-31' ? (
                              <div className="flex items-center gap-1 justify-end">
                                <input
                                  type="number"
                                  value={editingSavingsValue}
                                  onChange={(e) => setEditingSavingsValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditingSavings();
                                    if (e.key === 'Escape') cancelEditingSavings();
                                  }}
                                  className="w-16 px-1 py-0.5 text-xs text-right border border-gray-300 rounded focus:outline-none focus:border-gray-400"
                                  autoFocus
                                />
                                <button
                                  onClick={saveEditingSavings}
                                  className="p-0.5 text-gray-500 hover:text-emerald-600 transition-colors"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={cancelEditingSavings}
                                  className="p-0.5 text-gray-500 hover:text-red-600 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span 
                                className="text-[11px] text-gray-700 text-right cursor-pointer hover:text-gray-500 transition-colors"
                                onClick={() => startEditingSavings('investPiggyBank', '16-31', savingsData.investPiggyBank16_31)}
                              >
                                {savingsData.investPiggyBank16_31.toLocaleString()} ₽
                              </span>
                            )
                          ) : (
                            <span className="text-[11px] text-gray-400 text-right">—</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Инвестиции */}
                      <div className="px-4 py-2.5 hover:bg-gray-50/30 transition-colors">
                        <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 items-center">
                          <span className="text-[11px] text-gray-700">Инвестиции</span>
                          
                          {/* 1-15 */}
                          {editingSavingsItem?.item === 'investments' && editingSavingsItem?.period === '1-15' ? (
                            <div className="flex items-center gap-1 justify-end">
                              <input
                                type="number"
                                value={editingSavingsValue}
                                onChange={(e) => setEditingSavingsValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditingSavings();
                                  if (e.key === 'Escape') cancelEditingSavings();
                                }}
                                className="w-16 px-1 py-0.5 text-xs text-right border border-gray-300 rounded focus:outline-none focus:border-gray-400"
                                autoFocus
                              />
                              <button
                                onClick={saveEditingSavings}
                                className="p-0.5 text-gray-500 hover:text-emerald-600 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={cancelEditingSavings}
                                className="p-0.5 text-gray-500 hover:text-red-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span 
                              className="text-[11px] text-gray-700 text-right cursor-pointer hover:text-gray-500 transition-colors"
                              onClick={() => startEditingSavings('investments', '1-15', savingsData.investments1_15)}
                            >
                              {savingsData.investments1_15.toLocaleString()} ₽
                            </span>
                          )}
                          
                          {/* 16-31 */}
                          {testDate > 15 ? (
                            editingSavingsItem?.item === 'investments' && editingSavingsItem?.period === '16-31' ? (
                              <div className="flex items-center gap-1 justify-end">
                                <input
                                  type="number"
                                  value={editingSavingsValue}
                                  onChange={(e) => setEditingSavingsValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditingSavings();
                                    if (e.key === 'Escape') cancelEditingSavings();
                                  }}
                                  className="w-16 px-1 py-0.5 text-xs text-right border border-gray-300 rounded focus:outline-none focus:border-gray-400"
                                  autoFocus
                                />
                                <button
                                  onClick={saveEditingSavings}
                                  className="p-0.5 text-gray-500 hover:text-emerald-600 transition-colors"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={cancelEditingSavings}
                                  className="p-0.5 text-gray-500 hover:text-red-600 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span 
                                className="text-[11px] text-gray-700 text-right cursor-pointer hover:text-gray-500 transition-colors"
                                onClick={() => startEditingSavings('investments', '16-31', savingsData.investments16_31)}
                              >
                                {savingsData.investments16_31.toLocaleString()} ₽
                              </span>
                            )
                          ) : (
                            <span className="text-[11px] text-gray-400 text-right">—</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Свободные деньги */}
                      <div className="px-4 py-2.5 hover:bg-gray-50/30 transition-colors">
                        <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 items-center">
                          <span className="text-[11px] text-gray-700">Свободные деньги</span>
                          
                          {/* 1-15 (автоматически рассчитанное значение) */}
                          <span className="text-[11px] text-gray-700 text-right">
                            {freeMoney1_15.toLocaleString()} ₽
                          </span>
                          
                          {/* 16-31 (автоматически рассчитанное значение) */}
                          {testDate > 15 ? (
                            <span className="text-[11px] text-gray-700 text-right">
                              {freeMoney16_31.toLocaleString()} ₽
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400 text-right">—</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Итог�� (проверка баланса) */}
                      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200">
                        <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 items-center">
                          <span className="text-[11px] text-gray-800 font-medium">Итого распределено</span>
                          
                          <span className="text-[11px] text-gray-800 font-medium text-right">
                            {savingsTotal1_15.toLocaleString()} ₽
                          </span>
                          
                          {testDate > 15 ? (
                            <span className="text-[11px] text-gray-800 font-medium text-right">
                              {savingsTotal16_31.toLocaleString()} ₽
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400 text-right">—</span>
                          )}
                        </div>
                        <div className="mt-1 text-[9px]">
                          {testDate > 15 ? (
                            savingsTotal1_15 === saveFirstHalf && savingsTotal16_31 === saveSecondHalf ? (
                              <span className="text-[rgba(224,47,118,0.52)] font-normal font-bold">✓ Баланс сходится</span>
                            ) : (
                              <span className="text-[#E02F76]">⚠ Разница 1-15: {(saveFirstHalf - savingsTotal1_15).toLocaleString()} ₽, 16-31: {(saveSecondHalf - savingsTotal16_31).toLocaleString()} ₽</span>
                            )
                          ) : (
                            savingsTotal1_15 === saveFirstHalf ? (
                              <span className="text-[rgba(224,47,118,0.52)] font-normal font-bold">✓ Баланс сходится</span>
                            ) : (
                              <span className="text-[#E02F76]">⚠ Разница: {(saveFirstHalf - savingsTotal1_15).toLocaleString()} ₽</span>
                            )
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Budget Summary Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
              <h3 className="text-gray-800 font-light tracking-tight text-sm mb-2">Сводка по бюджету</h3>
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 text-[9px] text-gray-500 font-medium uppercase tracking-wider">
                <div>Категория</div>
                <div className="text-right">1-15</div>
                <div className="text-right">16-31</div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-50">
              {/* Needs */}
              <div className="px-4 py-2.5">
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E02F76' }}></div>
                    <span className="text-[11px] text-gray-700">Needs</span>
                  </div>
                  <span className="text-[11px] text-gray-700 text-right">
                    {Math.round(needsItems.reduce((sum, item) => sum + item.expected, 0) / 2).toLocaleString()} ₽
                  </span>
                  <span className="text-[11px] text-gray-700 text-right">
                    {Math.round(needsItems.reduce((sum, item) => sum + item.expected, 0) / 2).toLocaleString()} ₽
                  </span>
                </div>
              </div>

              {/* Wishes */}
              <div className="px-4 py-2.5">
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E871A0' }}></div>
                    <span className="text-[11px] text-gray-700">Wishes</span>
                  </div>
                  <span className="text-[11px] text-gray-700 text-right">
                    {Math.round(wantsItems.reduce((sum, item) => sum + item.expected, 0) / 2).toLocaleString()} ₽
                  </span>
                  <span className="text-[11px] text-gray-700 text-right">
                    {Math.round(wantsItems.reduce((sum, item) => sum + item.expected, 0) / 2).toLocaleString()} ₽
                  </span>
                </div>
              </div>

              {/* Накопления */}
              <div className="px-4 py-2.5">
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F4AFCA' }}></div>
                    <span className="text-[11px] text-gray-700">Накопления</span>
                  </div>
                  <span className="text-[11px] text-gray-700 text-right">
                    {savingsTotal1_15.toLocaleString()} ₽
                  </span>
                  <span className="text-[11px] text-gray-700 text-right">
                    {savingsTotal16_31.toLocaleString()} ₽
                  </span>
                </div>
              </div>
            </div>

            {/* Total Row */}
            <div className="px-4 py-2.5 border-t border-gray-200 bg-white">
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 items-center">
                <span className="text-xs font-medium text-gray-800">Итого</span>
                <span className="text-xs font-medium text-gray-800 text-right">
                  {firstHalfIncome.toLocaleString()} ₽
                </span>
                <span className="text-xs font-medium text-gray-800 text-right">
                  {secondHalfIncome.toLocaleString()} ₽
                </span>
              </div>
            </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible flex flex-col">
            {/* Budget Distribution */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
              <h3 className="text-gray-800 font-light tracking-tight text-sm mb-1">Распределение бюджета</h3>
              <p className="text-xs text-gray-500 font-light">{total.toLocaleString()} ₽</p>
            </div>
            
            <div className="p-4">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text 
                          x={x} 
                          y={y} 
                          fill="white" 
                          textAnchor="middle" 
                          dominantBaseline="central"
                          fontSize="11"
                          fontWeight="500"
                        >
                          {`${percentage}%`}
                        </text>
                      );
                    }}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Кастомная легенда */}
              <div className="space-y-3 mt-4">
                {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm flex-shrink-0" 
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span className="text-xs text-gray-700 font-light">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-900 font-medium">{entry.value.toLocaleString()} ₽</span>
                      <span 
                        className="text-xs font-medium w-10 text-right" 
                        style={{ color: COLORS[index] }}
                      >
                        {entry.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно пополнения конверта */}
      {showTopUpModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-black/20"
            onClick={closeTopUpModal}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 font-light tracking-tight">Пополнить конверт</h3>
              <button
                onClick={closeTopUpModal}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Конверт */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 font-medium uppercase tracking-wider">
                  Конверт
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-800">{topUpEnvelope}</span>
                </div>
              </div>

              {/* Сумма */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 font-medium uppercase tracking-wider">
                  Сумма пополнения
                </label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="Введите сумму"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                  autoFocus
                />
              </div>

              {/* Источник */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 font-medium uppercase tracking-wider">
                  Источник средств
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setTopUpSource('Save')}
                    className={`w-full px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-light flex items-center justify-between ${
                      topUpSource === 'Save'
                        ? 'border-[#E02F76] bg-[#FDE8F3]'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>💰</span>
                      <span>Накопления (Save)</span>
                    </span>
                    {topUpSource === 'Save' && (
                      <Check className="w-4 h-4" style={{ color: '#E02F76' }} />
                    )}
                  </button>

                  <button
                    onClick={() => setTopUpSource('Regular')}
                    className={`w-full px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-light flex items-center justify-between ${
                      topUpSource === 'Regular'
                        ? 'border-[#E02F76] bg-[#FDE8F3]'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>🏠</span>
                      <span>Regular Life</span>
                    </span>
                    {topUpSource === 'Regular' && (
                      <Check className="w-4 h-4" style={{ color: '#E02F76' }} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={closeTopUpModal}
                className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-light"
              >
                О��мена
              </button>
              <button
                onClick={addTopUp}
                disabled={!topUpAmount || parseFloat(topUpAmount) <= 0}
                className="flex-1 px-4 py-2 text-sm text-white rounded-lg transition-colors font-light disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#E02F76' }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#C02866';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#E02F76';
                  }
                }}
              >
                Пополнить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно истории пополнений */}
      {showTopUpHistoryModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-black/20"
            onClick={() => setShowTopUpHistoryModal(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-gray-200 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 font-light tracking-tight">История пополнений конвертов</h3>
              <button
                onClick={() => setShowTopUpHistoryModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {topUps.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                Пока нет пополнений
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Дата</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Конверт</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Источник</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Сумма</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...topUps].reverse().map((topUp) => (
                      <tr key={topUp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {new Date(topUp.date).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 font-medium">
                          {topUp.envelopeName}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {topUp.source === 'Save' ? '💰 Накопления' : '🏠 Regular Life'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 text-right font-medium">
                          +{topUp.amount.toLocaleString()} ₽
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm('Удалить это пополнение?')) {
                                deleteTopUp(topUp.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            title="Удалить пополнение"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Всего операций:</span>
                <span className="font-medium text-gray-800">{topUps.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно истории трат */}
      {showExpenseHistoryModal && selectedEnvelopeEmoji && (() => {
        // Маппинг эмодзи к русским названиям (как в DailyExpenses)
        const emojiToRussianName: { [key: string]: string } = {
          '🎓': 'Образование',
          '🛁': 'Здоровье и красота',
          '🥬': 'Еда',
          '🏠': 'Обычная жизнь',
          '💰': 'Накопления',
        };
        
        const targetEnvelopeName = emojiToRussianName[selectedEnvelopeEmoji];
        
        // Получаем название конверта по эмодзи для отображения
        const envelopeName = selectedEnvelopeEmoji === '🎓' ? 'Education'
          : selectedEnvelopeEmoji === '🛁' ? 'Health'
          : selectedEnvelopeEmoji === '🥬' ? 'Food'
          : selectedEnvelopeEmoji === '🏠' ? 'Regular'
          : selectedEnvelopeEmoji === '💰' ? 'Save'
          : '';

        // Получаем все категории из чеклистов, которые относятся к этому envelope
        const envelopeCategories = [
          ...needsItems.filter(item => item.envelope === selectedEnvelopeEmoji).map(item => item.category.toLowerCase().trim()),
          ...wantsItems.filter(item => item.envelope === selectedEnvelopeEmoji).map(item => item.category.toLowerCase().trim())
        ];

        // Собираем историю трат для этого конверта
        const expenseHistory: { amount: number; comment: string; date: string; category: string }[] = [];
        
        // ОТЛАДКА
        console.log('=== ОТЛАДКА ИСТОРИИ ТРАТ ===');
        console.log('Выбранный эмодзи:', selectedEnvelopeEmoji);
        console.log('Целевое название конверта:', targetEnvelopeName);
        console.log('Все категории из dailyExpenses:');
        dailyExpenses.forEach(exp => {
          console.log(`  - ${exp.category}: envelope = "${exp.envelope}"`);
        });
        
        dailyExpenses.forEach(expense => {
          // Проходим по всем неделям
          ['week1', 'week2', 'week3', 'week4'].forEach((week, weekIndex) => {
            const weekData = expense[week as 'week1' | 'week2' | 'week3' | 'week4'];
            Object.entries(weekData).forEach(([date, items]) => {
              items.forEach(item => {
                // Пропускаем запланированные траты (isPlanned = true)
                if (item.isPlanned) {
                  console.log(`  ⏭️ Пропускаем запланированную трату: ${item.comment}, сумма=${item.amount}`);
                  return;
                }
                
                const commentLower = item.comment.toLowerCase().trim();
                
                // Добавляем расход, если:
                // 1. Категория расхода принадлежит этому envelope (сравниваем с русским названием!)
                // 2. ИЛИ комментарий совпадает с категорией из чеклистов этого envelope
                const belongsToEnvelope = expense.envelope === targetEnvelopeName;
                const commentMatchesCategory = commentLower && envelopeCategories.includes(commentLower);
                
                console.log(`Проверка записи: категория="${expense.category}", envelope="${expense.envelope}", сумма=${item.amount}, комментарий="${item.comment}"`);
                console.log(`  belongsToEnvelope: ${belongsToEnvelope} (сравниваем "${expense.envelope}" === "${targetEnvelopeName}")`);
                console.log(`  commentMatchesCategory: ${commentMatchesCategory}`);
                
                if (belongsToEnvelope || commentMatchesCategory) {
                  console.log('  ✅ ДОБАВЛЕНО В ИСТОРИЮ!');
                  expenseHistory.push({
                    amount: item.amount,
                    comment: item.comment || 'Без комментария',
                    date: `${date}.12`,
                    // Если расход идет по комментарию (а не по категории), показываем комментарий как категорию
                    category: commentMatchesCategory && !belongsToEnvelope ? item.comment : expense.category
                  });
                } else {
                  console.log('  ❌ Не подходит');
                }
              });
            });
          });
        });

        console.log('Итого найдено записей:', expenseHistory.length);
        console.log('История трат:', expenseHistory);

        // Сортируем по дате (от новых к старым)
        expenseHistory.sort((a, b) => {
          const dateA = parseInt(a.date.split('.')[0]);
          const dateB = parseInt(b.date.split('.')[0]);
          return dateB - dateA;
        });

        const totalSpent = expenseHistory.reduce((sum, item) => sum + item.amount, 0);

        return (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              {/* Заголовок */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-pink-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedEnvelopeEmoji}</span>
                    <div>
                      <h3 className="font-light text-gray-800">История трат</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Конверт: {envelopeName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowExpenseHistoryModal(false);
                      setSelectedEnvelopeEmoji(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Итого */}
              <div className="px-6 py-3 bg-pink-50/50 border-b border-pink-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">Всего потрачено:</span>
                  <span className="font-medium" style={{ color: '#E02F76' }}>
                    {totalSpent.toLocaleString()} ₽
                  </span>
                </div>
              </div>

              {/* Список трат */}
              <div className="overflow-y-auto max-h-[calc(80vh-180px)]">
                {expenseHistory.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-400 text-sm">Нет записей о расходах</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {expenseHistory.map((item, index) => (
                      <div key={index} className="px-6 py-3 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-700">{item.category}</span>
                              <span className="text-[10px] text-gray-400">•</span>
                              <span className="text-[10px] text-gray-400">{item.date}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{item.comment}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="text-sm font-medium text-gray-800">
                              {item.amount.toLocaleString()} ₽
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Кнопка закрытия */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => {
                    setShowExpenseHistoryModal(false);
                    setSelectedEnvelopeEmoji(null);
                  }}
                  className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-light"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Модальное окно ��обавления категории */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-light text-gray-800 tracking-tight">
                Добавить категорию в {addCategoryType === 'needs' ? 'Needs' : 'Wants'}
              </h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              {/* Название категории */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 font-medium uppercase tracking-wider">
                  Название категории
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Например: Книг��"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                  autoFocus
                />
              </div>

              {/* План */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 font-medium uppercase tracking-wider">
                  План (₽)
                </label>
                <input
                  type="number"
                  value={newCategoryExpected}
                  onChange={(e) => setNewCategoryExpected(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                />
              </div>

              {/* Конверт */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 font-medium uppercase tracking-wider">
                  Конверт
                </label>
                <select
                  value={newCategoryEnvelope}
                  onChange={(e) => setNewCategoryEnvelope(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                >
                  <option value="">Не выбрано</option>
                  <option value="🎓">🎓 Education</option>
                  <option value="🛁">🛁 Health and Beauty</option>
                  <option value="🥬">🥬 Food</option>
                  <option value="🏠">🏠 Regular Life</option>
                  <option value="💰">💰 Save</option>
                </select>
              </div>

              {/* Маппинг на ежедневник */}
              <div>
                <label className="block text-xs text-gray-600 mb-2 font-medium uppercase tracking-wider">
                  Учет в ежедневнике
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setNewCategoryMappingType('new')}
                    className={`w-full px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-light text-left ${
                      newCategoryMappingType === 'new'
                        ? 'border-[#E02F76] bg-[#FDE8F3]'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Создать новое поле в ежедневнике</span>
                      {newCategoryMappingType === 'new' && (
                        <Check className="w-4 h-4" style={{ color: '#E02F76' }} />
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => setNewCategoryMappingType('existing')}
                    className={`w-full px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-light text-left ${
                      newCategoryMappingType === 'existing'
                        ? 'border-[#E02F76] bg-[#FDE8F3]'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Присоединить к существующей категории</span>
                      {newCategoryMappingType === 'existing' && (
                        <Check className="w-4 h-4" style={{ color: '#E02F76' }} />
                      )}
                    </div>
                  </button>
                </div>

                {/* Выбор существующей категории */}
                {newCategoryMappingType === 'existing' && dailyExpenses.length > 0 && (
                  <div className="mt-3">
                    <label className="block text-xs text-gray-600 mb-1.5 font-medium uppercase tracking-wider">
                      Выберите категори�� из ежедневника
                    </label>
                    <select
                      value={newCategoryDailyCategory}
                      onChange={(e) => setNewCategoryDailyCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                    >
                      <option value="">Выберите категорию</option>
                      {dailyExpenses.map((expense) => (
                        <option key={expense.category} value={expense.category}>
                          {expense.category}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-gray-500">
                      Расходы в ежедневнике будут автоматически распределяться между всеми категориями чеклиста, привязанными к этой категории
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-light"
                onClick={() => setShowAddCategoryModal(false)}
              >
                Отмена
              </button>
              <button
                className="flex-1 px-4 py-2 text-sm text-white rounded-lg transition-colors font-light"
                style={{ backgroundColor: '#E02F76' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C02866'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E02F76'}
                onClick={handleSaveNewCategory}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно перевода между конвертами */}
      {showTransferModal && transferToEnvelope && (() => {
        const allEnvelopes = ['Education', 'Health and Beauty', 'Food', 'Regular', 'Save'];
        const availableEnvelopes = allEnvelopes.filter(name => name !== transferToEnvelope);

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h3 className="font-light text-gray-800">Пополнить конверт</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{transferToEnvelope}</p>
                </div>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5 font-medium uppercase tracking-wider">
                    Откуда взять деньги
                  </label>
                  <select
                    value={transferFromEnvelope}
                    onChange={(e) => setTransferFromEnvelope(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300 font-light"
                  >
                    <option value="">Выберите конверт</option>
                    {availableEnvelopes.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1.5 font-medium uppercase tracking-wider">
                    Сумма (₽)
                  </label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Введите сумму"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300 font-light"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1.5 font-medium uppercase tracking-wider">
                    Комментарий (опционально)
                  </label>
                  <input
                    type="text"
                    value={transferComment}
                    onChange={(e) => setTransferComment(e.target.value)}
                    placeholder="Причина перевода"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300 font-light"
                  />
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                <button
                  className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-light"
                  onClick={() => setShowTransferModal(false)}
                >
                  Отмена
                </button>
                <button
                  className="flex-1 px-4 py-2 text-sm text-white rounded-lg transition-colors font-light"
                  style={{ backgroundColor: '#E02F76' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C02866'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E02F76'}
                  onClick={handleSaveTransfer}
                >
                  Перев��сти
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Кнопка для открытия истории переводов */}
      {envelopeTransfers.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowTransferHistoryModal(true)}
            className="px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm font-medium"
          >
            <History className="w-4 h-4" />
            История переводов
          </button>
        </div>
      )}

      {/* Модальное окно истории переводов */}
      {showTransferHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-gray-200 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                  <History className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-light text-gray-800">История переводов</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Все транзакции между конвертами</p>
                </div>
              </div>
              <button
                onClick={() => setShowTransferHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {envelopeTransfers.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-gray-400 text-sm">Нет истории переводов</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {envelopeTransfers.slice().reverse().map((transfer) => (
                    <div key={transfer.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-700">{transfer.fromEnvelope}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-sm font-medium text-gray-700">{transfer.toEnvelope}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{transfer.date}</span>
                            {transfer.comment && (
                              <>
                                <span>•</span>
                                <span className="truncate">{transfer.comment}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-medium text-pink-600">
                            {transfer.amount.toLocaleString()} ₽
                          </span>
                          <button
                            onClick={() => {
                              if (window.confirm('Удалить этот перевод? Деньги вернутся в исходный конверт.')) {
                                handleDeleteTransfer(transfer.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Удалить перевод"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setShowTransferHistoryModal(false)}
                className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-light"
              >
                З��крыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
