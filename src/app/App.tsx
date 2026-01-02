import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Header } from './components/Header';
import { DailyExpenses } from './components/DailyExpenses';
import { BudgetEnvelopes } from './components/BudgetEnvelopes';
import { Archive } from './components/Archive';

type Tab = 'daily' | 'budget' | 'archive';

interface ChecklistItem {
  id: string;
  category: string;
  expected: number;
  actual?: number;
  diff: number;
  done: boolean;
  envelope?: string;
  dailyCategory?: string;
}

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
  envelope?: string;
}

interface IncomeSource {
  id: string;
  category: string;
  firstHalf: number;
  secondHalf: number;
  type?: 'regular' | 'previous-month' | 'other';
}

const defaultIncomeSources: IncomeSource[] = [
  { id: 'income-prev', category: 'Остаток с прошлого месяца', firstHalf: 0, secondHalf: 0, type: 'previous-month' },
  { id: 'income-1', category: 'Шары', firstHalf: 90000, secondHalf: 80000, type: 'regular' },
  { id: 'income-2', category: 'Стикеры', firstHalf: 27000, secondHalf: 0, type: 'regular' },
  { id: 'income-other', category: 'Прочие доходы', firstHalf: 0, secondHalf: 0, type: 'other' },
];

const defaultNeedsItems: ChecklistItem[] = [
  { id: '2', category: 'Продукты', expected: 20000, diff: 20000, done: false, envelope: '🥬' },
  { id: '3', category: 'Салоны', expected: 7000, diff: 7000, done: false, envelope: '🛁' },
  { id: '4', category: 'Английский', expected: 6600, diff: 6600, done: false, envelope: '🎓' },
  { id: '5', category: 'Китайский', expected: 5600, diff: 5600, done: false, envelope: '🎓' },
  { id: '6', category: 'Трейдинг', expected: 11000, diff: 11000, done: false, envelope: '🎓' },
  { id: '7', category: 'Вартик', expected: 3000, diff: 3000, done: false, envelope: '🏠' },
  { id: '10', category: 'ChatGPT', expected: 2600, diff: 2600, done: false, envelope: '🏠' },
  { id: '11', category: 'VK Music', expected: 200, diff: 200, done: false, envelope: '🏠' },
  { id: '13', category: 'Стэф', expected: 2200, diff: 2200, done: false, envelope: '🏠' },
  { id: '14', category: 'Такси', expected: 5000, diff: 5000, done: false, envelope: '🏠' },
];

const defaultWantsItems: ChecklistItem[] = [
  { id: '1', category: 'Бонусы', expected: 15000, diff: 15000, done: false, envelope: '🏠' },
  { id: '2', category: 'Кафе', expected: 5000, diff: 5000, done: false, envelope: '🏠' },
  { id: '3', category: 'Косметика', expected: 5400, diff: 5400, done: false, envelope: '🛁' },
  { id: '4', category: 'Одежда', expected: 11000, diff: 11000, done: false, envelope: '🛁' },
  { id: '5', category: 'Тело', expected: 3000, diff: 3000, done: false, envelope: '🛁' },
  { id: '8', category: 'Обучение', expected: 5000, diff: 5000, done: false, envelope: '🎓' },
  { id: '10', category: 'Telegram', expected: 330, diff: 330, done: false, envelope: '🏠' },
  { id: '12', category: 'Прочее', expected: 4000, diff: 4000, done: false, envelope: '🏠' },
  { id: '13', category: 'Родители', expected: 0, diff: 0, done: false, envelope: '💰' },
  { id: '14', category: 'Подарки', expected: 10000, diff: 10000, done: false, envelope: '🏠' },
  { id: '15', category: 'Дом', expected: 5000, diff: 5000, done: false, envelope: '🏠' },
  { id: '16', category: 'Подписки', expected: 0, diff: 0, done: false, envelope: '🏠' },
  { id: '17', category: 'Вейп', expected: 2000, diff: 2000, done: false, envelope: '🏠' },
];

function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return defaultValue;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const [testDate, setTestDate] = useState<5 | 25>(5);
  
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(() => 
    loadFromLocalStorage('incomeSources', defaultIncomeSources)
  );
  
  const [needsItems, setNeedsItems] = useState<ChecklistItem[]>(() => 
    loadFromLocalStorage('needsItems', defaultNeedsItems)
  );
  
  const [wantsItems, setWantsItems] = useState<ChecklistItem[]>(() => 
    loadFromLocalStorage('wantsItems', defaultWantsItems)
  );
  
  const [dailyExpenses, setDailyExpenses] = useState<Expense[]>([]);

  // Сохраняем балансы из BudgetEnvelopes
  const [currentEnvelopeBalance, setCurrentEnvelopeBalance] = useState(0);
  const [currentSavingsBalance, setCurrentSavingsBalance] = useState(0);

  const handleBalanceChange = (envelopeBalance: number, savingsBalance: number) => {
    setCurrentEnvelopeBalance(envelopeBalance);
    setCurrentSavingsBalance(savingsBalance);
  };

  // Сохранение в localStorage
  useEffect(() => {
    try {
      localStorage.setItem('needsItems', JSON.stringify(needsItems));
    } catch (error) {
      console.error('Error saving needsItems:', error);
    }
  }, [needsItems]);

  useEffect(() => {
    try {
      localStorage.setItem('wantsItems', JSON.stringify(wantsItems));
    } catch (error) {
      console.error('Error saving wantsItems:', error);
    }
  }, [wantsItems]);

  useEffect(() => {
    try {
      localStorage.setItem('incomeSources', JSON.stringify(incomeSources));
    } catch (error) {
      console.error('Error saving incomeSources:', error);
    }
  }, [incomeSources]);

  // Пересчет чеклистов при изменении testDate
  useEffect(() => {
    if (dailyExpenses.length > 0) {
      syncExpensesWithChecklists(dailyExpenses);
    }
  }, [testDate]);

  const syncExpensesWithChecklists = (expenses: Expense[]) => {
    setDailyExpenses(expenses);
    
    const categoryTotals: { [key: string]: number } = {};

    expenses.forEach(expense => {
      ['week1', 'week2', 'week3', 'week4'].forEach(week => {
        const weekData = expense[week as keyof Expense] as { [key: string]: ExpenseItem[] };
        Object.entries(weekData).forEach(([date, items]) => {
          const dateNum = parseInt(date);
          
          if (dateNum <= testDate) {
            items.forEach(item => {
              const commentLower = item.comment.toLowerCase().trim();
              
              if (commentLower) {
                if (commentLower === 'стэф' || commentLower === 'дом') {
                  categoryTotals['прочее'] = (categoryTotals['прочее'] || 0) + item.amount;
                  return;
                }
                
                const needsMatch = needsItems.find(need => 
                  need.category.toLowerCase().trim() === commentLower
                );
                if (needsMatch) {
                  categoryTotals[commentLower] = (categoryTotals[commentLower] || 0) + item.amount;
                  return;
                }
                
                const wantsMatch = wantsItems.find(want => 
                  want.category.toLowerCase().trim() === commentLower
                );
                if (wantsMatch) {
                  categoryTotals[commentLower] = (categoryTotals[commentLower] || 0) + item.amount;
                  return;
                }
              }
              
              const categoryLower = expense.category.toLowerCase().trim();
              const mappedNeedsItems = needsItems.filter(need => 
                need.dailyCategory?.toLowerCase().trim() === categoryLower
              );
              const mappedWantsItems = wantsItems.filter(want => 
                want.dailyCategory?.toLowerCase().trim() === categoryLower
              );
              
              const allMappedItems = [...mappedNeedsItems, ...mappedWantsItems];
              
              if (allMappedItems.length > 0) {
                const totalExpected = allMappedItems.reduce((sum, item) => sum + item.expected, 0);
                
                if (totalExpected > 0) {
                  allMappedItems.forEach(mappedItem => {
                    const portion = (mappedItem.expected / totalExpected) * item.amount;
                    const itemCategoryLower = mappedItem.category.toLowerCase().trim();
                    categoryTotals[itemCategoryLower] = (categoryTotals[itemCategoryLower] || 0) + portion;
                  });
                } else {
                  const portionPerItem = item.amount / allMappedItems.length;
                  allMappedItems.forEach(mappedItem => {
                    const itemCategoryLower = mappedItem.category.toLowerCase().trim();
                    categoryTotals[itemCategoryLower] = (categoryTotals[itemCategoryLower] || 0) + portionPerItem;
                  });
                }
              } else {
                // Fallback маппинг
                if (categoryLower === 'бонусы и кафе') {
                  categoryTotals['бонусы'] = (categoryTotals['бонусы'] || 0) + item.amount / 2;
                  categoryTotals['кафе'] = (categoryTotals['кафе'] || 0) + item.amount / 2;
                } else if (categoryLower === 'косметика, одежда') {
                  categoryTotals['косметика'] = (categoryTotals['косметика'] || 0) + item.amount / 2;
                  categoryTotals['одежда'] = (categoryTotals['одежда'] || 0) + item.amount / 2;
                } else if (categoryLower === 'здоровье и тело') {
                  categoryTotals['тело'] = (categoryTotals['тело'] || 0) + item.amount;
                } else if (categoryLower === 'образование') {
                  const vartikPart = (3000 / 19000) * item.amount;
                  const obucheniePart = (5000 / 19000) * item.amount;
                  const treidingPart = (11000 / 19000) * item.amount;
                  categoryTotals['вартик'] = (categoryTotals['вартик'] || 0) + vartikPart;
                  categoryTotals['обучение'] = (categoryTotals['обучение'] || 0) + obucheniePart;
                  categoryTotals['трейдинг'] = (categoryTotals['трейдинг'] || 0) + treidingPart;
                } else if (categoryLower === 'подписки') {
                  const chatgptPart = (2600 / 3130) * item.amount;
                  const vkmusicPart = (200 / 3130) * item.amount;
                  const telegramPart = (330 / 3130) * item.amount;
                  categoryTotals['chatgpt'] = (categoryTotals['chatgpt'] || 0) + chatgptPart;
                  categoryTotals['vk music'] = (categoryTotals['vk music'] || 0) + vkmusicPart;
                  categoryTotals['telegram'] = (categoryTotals['telegram'] || 0) + telegramPart;
                } else if (categoryLower === 'прочее') {
                  const allProcheeItems = [...needsItems, ...wantsItems].filter(item => 
                    ['прочее', 'родители', 'подарки', 'вейп', 'дом', 'стэф'].includes(item.category.toLowerCase())
                  );
                  const totalProcheeExpected = allProcheeItems.reduce((sum, item) => sum + item.expected, 0);
                  
                  if (totalProcheeExpected > 0) {
                    allProcheeItems.forEach(procheeItem => {
                      const portion = (procheeItem.expected / totalProcheeExpected) * item.amount;
                      const itemCategoryLower = procheeItem.category.toLowerCase().trim();
                      categoryTotals[itemCategoryLower] = (categoryTotals[itemCategoryLower] || 0) + portion;
                    });
                  }
                } else if (categoryLower === 'салоны красоты' || categoryLower === 'салоны') {
                  categoryTotals['салоны'] = (categoryTotals['салоны'] || 0) + item.amount;
                } else {
                  categoryTotals[categoryLower] = (categoryTotals[categoryLower] || 0) + item.amount;
                }
              }
            });
          }
        });
      });
    });

    const updatedNeeds = needsItems.map(item => {
      const categoryLower = item.category.toLowerCase().trim();
      const actual = Math.round(categoryTotals[categoryLower] || 0);
      return { ...item, actual };
    });

    const updatedWants = wantsItems.map(item => {
      const categoryLower = item.category.toLowerCase().trim();
      const actual = Math.round(categoryTotals[categoryLower] || 0);
      return { ...item, actual };
    });

    setNeedsItems(updatedNeeds);
    setWantsItems(updatedWants);
  };

  const updateChecklistActual = (comment: string, amount: number) => {
    if (!comment.trim()) return;

    const lowerComment = comment.toLowerCase().trim();

    const needsIndex = needsItems.findIndex(item => 
      item.category.toLowerCase() === lowerComment
    );

    if (needsIndex !== -1) {
      const updatedItems = [...needsItems];
      updatedItems[needsIndex].actual = (updatedItems[needsIndex].actual || 0) + amount;
      setNeedsItems(updatedItems);
      return;
    }

    const wantsIndex = wantsItems.findIndex(item => 
      item.category.toLowerCase() === lowerComment
    );

    if (wantsIndex !== -1) {
      const updatedItems = [...wantsItems];
      updatedItems[wantsIndex].actual = (updatedItems[wantsIndex].actual || 0) + amount;
      setWantsItems(updatedItems);
    }
  };

  const handleSaveAll = () => {
    try {
      localStorage.setItem('needsItems', JSON.stringify(needsItems));
      localStorage.setItem('wantsItems', JSON.stringify(wantsItems));
      localStorage.setItem('incomeSources', JSON.stringify(incomeSources));
      localStorage.setItem('dailyExpenses', JSON.stringify(dailyExpenses));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleCreateNewMonth = () => {
    const confirmed = window.confirm(
      '⚠️ ТЕСТ: Создать новый месяц?\n\n' +
      'Это действие:\n' +
      '• Сохранит текущий месяц в архив\n' +
      '• Рассчитает остаток (баланс конвертов + баланс накоплений)\n' +
      '• Перенесет остаток в "Остаток с прошлого месяца"\n' +
      '• Обнулит все источники дохода (кроме остатка)\n' +
      '• Очистит расходы в ежедневнике\n' +
      '• Сбросит фактические расходы в чеклистах\n' +
      '• Очистит историю пополнений и переводов\n' +
      '• Очистит данные накоплений\n\n' +
      'Продолжить?'
    );

    if (!confirmed) return;

    try {
      // 1. Используем балансы из сводки (рассчитанные в BudgetEnvelopes)
      const totalRemainder = currentEnvelopeBalance + currentSavingsBalance;

      console.log('📊 Остаток на следующий месяц:', {
        'Баланс конверты': currentEnvelopeBalance,
        'Баланс накопления': currentSavingsBalance,
        'Итого остаток': totalRemainder
      });

      // 2. АРХИВИРУЕМ ТЕКУЩИЙ МЕСЯЦ ПЕРЕД ОЧИСТКОЙ
      const currentDate = new Date();
      const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                          'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
      const archiveKey = `archive_${currentDate.getFullYear()}_${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const archiveName = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

      const archiveSnapshot = {
        id: archiveKey,
        name: archiveName,
        createdAt: currentDate.toISOString(),
        data: {
          dailyExpenses: dailyExpenses,
          needsItems: needsItems,
          wantsItems: wantsItems,
          incomeSources: incomeSources,
          savingsData: JSON.parse(localStorage.getItem('savingsData') || '{}'),
          topUps: JSON.parse(localStorage.getItem('topUps') || '[]'),
          envelopeTransfers: JSON.parse(localStorage.getItem('envelopeTransfers') || '[]'),
          firstHalfDeposits: JSON.parse(localStorage.getItem('firstHalfDeposits') || '{}')
        },
        balances: {
          envelopeBalance: currentEnvelopeBalance,
          savingsBalance: currentSavingsBalance,
          totalBalance: totalRemainder
        }
      };

      // Сохраняем в архив
      const existingArchive = JSON.parse(localStorage.getItem('monthArchive') || '[]');
      existingArchive.push(archiveSnapshot);
      localStorage.setItem('monthArchive', JSON.stringify(existingArchive));

      console.log('✅ Месяц архивирован:', archiveName);

      // 3. Обновляем "Остаток с прошлого месяца" и обнуляем все остальные источники
      const newIncomeSources = incomeSources.map(source => {
        if (source.type === 'previous-month') {
          return {
            ...source,
            firstHalf: totalRemainder,
            secondHalf: 0
          };
        }
        // Обнуляем все остальные источники дохода
        return {
          ...source,
          firstHalf: 0,
          secondHalf: 0
        };
      });

      // 4. Очищаем расходы в ежедневнике (оставляем только структуру)
      const clearedExpenses = dailyExpenses.map(expense => ({
        ...expense,
        week1: {},
        week2: {},
        week3: {},
        week4: {},
        total: 0,
        percent: 0
      }));

      // 5. Сбрасываем фактические расходы в чеклистах
      const clearedNeeds = needsItems.map(item => ({
        ...item,
        actual: 0,
        done: false
      }));

      const clearedWants = wantsItems.map(item => ({
        ...item,
        actual: 0,
        done: false
      }));

      // 6. Применяем изменения
      setIncomeSources(newIncomeSources);
      setDailyExpenses(clearedExpenses);
      setNeedsItems(clearedNeeds);
      setWantsItems(clearedWants);

      // 7. Очищаем localStorage для истории
      localStorage.setItem('savingsData', JSON.stringify({
        investPiggyBank1_15: 0,
        investPiggyBank16_31: 0,
        investments1_15: 0,
        investments16_31: 0
      }));
      localStorage.setItem('topUps', JSON.stringify([]));
      localStorage.setItem('envelopeTransfers', JSON.stringify([]));
      localStorage.setItem('firstHalfDeposits', JSON.stringify({}));

      // 8. Сохраняем обновленные данные
      localStorage.setItem('incomeSources', JSON.stringify(newIncomeSources));
      localStorage.setItem('dailyExpenses', JSON.stringify(clearedExpenses));
      localStorage.setItem('needsItems', JSON.stringify(clearedNeeds));
      localStorage.setItem('wantsItems', JSON.stringify(clearedWants));

      // 9. Сбрасываем тестовую дату
      setTestDate(5);

      alert(`✅ Новый месяц создан!\n\nМесяц "${archiveName}" сохранен в архив.\n\nОстаток с прошлого месяца: ${totalRemainder.toLocaleString()} ₽\n\n(Баланс конверты: ${currentEnvelopeBalance.toLocaleString()} ₽\nБаланс накопления: ${currentSavingsBalance.toLocaleString()} ₽)`);

    } catch (error) {
      console.error('Error creating new month:', error);
      alert('❌ Ошибка при создании нового месяца. См. консоль для деталей.');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-[#fafafa] overflow-y-auto">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} onSave={handleSaveAll} onCreateNewMonth={handleCreateNewMonth} />
        
        <main className="container mx-auto px-4 py-6 max-w-7xl pb-12">
          {activeTab === 'daily' && (
            <DailyExpenses 
              onExpenseAdded={updateChecklistActual}
              onExpensesChanged={syncExpensesWithChecklists}
              needsCategories={needsItems.map(item => item.category)}
              wantsCategories={wantsItems.map(item => item.category)}
              initialExpenses={dailyExpenses}
              testDate={testDate}
              setTestDate={setTestDate}
              needsItems={needsItems}
              wantsItems={wantsItems}
            />
          )}
          {activeTab === 'budget' && (
            <BudgetEnvelopes 
              needsItems={needsItems}
              setNeedsItems={setNeedsItems}
              wantsItems={wantsItems}
              setWantsItems={setWantsItems}
              incomeSources={incomeSources}
              setIncomeSources={setIncomeSources}
              dailyExpenses={dailyExpenses}
              testDate={testDate}
              setTestDate={setTestDate}
              onBalanceChange={handleBalanceChange}
            />
          )}
          {activeTab === 'archive' && (
            <Archive />
          )}
        </main>
      </div>
    </DndProvider>
  );
}