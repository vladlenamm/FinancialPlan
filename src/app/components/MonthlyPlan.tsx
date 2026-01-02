import React, { useState } from 'react';

interface Expense {
  category: string;
  planned: number;
  days: { [key: string]: number };
}

export function MonthlyPlan() {
  const [activeView, setActiveView] = useState<'monthly' | 'daily'>('monthly');
  
  const monthlyExpenses: Expense[] = [
    { category: 'Доставка еды', planned: 19200, days: { '02': 5905, '03': 3140, '06': 5905, '08': 4165 } },
    { category: 'Продукты', planned: 20000, days: { '02': 10965, '04': 2340 } },
    { category: 'Бонусы и кафе', planned: 20000, days: { '02': 13035, '03': 650, '04': 185, '05': 1470, '06': 120, '07': 2670, '08': 740, '09': 220, '10': 220, '14': 450 } },
    { category: 'Салоны красоты', planned: 22200, days: { '02': 15100, '08': 500, '13': 1000 } },
    { category: 'Косметика, одежда', planned: 16400, days: { '02': 12285, '06': 640, '08': 3180, '13': 295, '14': 165 } },
    { category: 'Здоровье и тело', planned: 3000, days: { '02': 855, '06': 580, '14': 1400 } },
    { category: 'Английский', planned: 6600, days: { '02': 3000, '06': 1200, '07': 600, '13': 1200, '14': 600 } },
    { category: 'Китайский', planned: 5600, days: { '02': 0 } },
    { category: 'Образование', planned: 18840, days: { '02': 18840 } },
    { category: 'Подписки', planned: 5580, days: { '02': 2090, '03': 250, '07': 2390, '08': 500, '09': 250 } },
    { category: 'Такси', planned: 5000, days: { '02': 3185, '03': 335, '04': 300, '05': 130, '07': 130, '14': 540, '15': 380 } },
    { category: 'Стэф', planned: 2200, days: { '02': 2200 } },
    { category: 'Дом', planned: 5000, days: { '02': 6565, '04': 270, '06': 1590, '08': 5845, '13': 2000, '14': 1860 } },
    { category: 'Подарки', planned: 38690, days: { '02': 2720, '03': 9690, '06': 1260, '07': 2080, '08': 1220, '14': 20220, '15': 1500 } },
    { category: 'Прочее', planned: 2000, days: { '02': 2415, '03': 280, '04': 100, '05': 405, '06': 550, '07': 450, '08': 530, '09': 570, '10': 300, '14': 1250 } },
  ];

  const dailyHabits: Expense[] = [
    { category: 'Доставка еды', planned: 19200, days: { '02': 5905, '03': 3140, '06': 5905, '08': 4165 } },
    { category: 'Продукты', planned: 19000, days: { '02': 7125, '03': 840, '06': 2980, '07': 1090, '08': 4800, '09': 2520 } },
    { category: 'Бонусы и кафе', planned: 20000, days: { '02': 4265, '03': 200, '05': 180, '07': 1090, '08': 4800, '10': 4000 } },
    { category: 'Салоны красоты', planned: 20000, days: { '02': 3190, '04': 500, '10': 4000, '14': 2500 } },
    { category: 'Косметика, одежда', planned: 16400, days: { '02': 5755, '03': 2530, '04': 4000 } },
    { category: 'Здоровье и тело', planned: 3000, days: { '02': 855 } },
    { category: 'Английский', planned: 6600, days: { '02': 0, '04': 1200, '08': 1200 } },
    { category: 'Китайский', planned: 5600, days: { '02': 0 } },
    { category: 'Образование', planned: 18840, days: { '02': 33100, '03': 10840, '04': 5000, '05': 33000, '14': 3000 } },
    { category: 'Подписки', planned: 5580, days: { '02': 820, '04': 600, '05': 200, '07': 2120, '08': 390, '14': 100 } },
    { category: 'Такси', planned: 5000, days: { '02': 2075, '03': 210, '07': 510, '08': 2200, '09': 2200 } },
    { category: 'Стэф', planned: 2200, days: { '02': 2200, '04': 1400, '06': 4090, '07': 2000 } },
    { category: 'Дом', planned: 5000, days: { '02': 9865, '04': 1300, '05': 2090 } },
    { category: 'Подарки', planned: 38690, days: { '02': 4670, '14': 2000 } },
    { category: 'Прочее', planned: 2000, days: { '02': 4506 } },
  ];

  const currentExpenses = activeView === 'monthly' ? monthlyExpenses : dailyHabits;
  
  const weeks = [
    { name: 'Week 1', days: ['01', '02', '03', '04', '05', '06', '07', '08'], color: 'bg-pink-200' },
    { name: 'Week 2', days: ['09', '10', '11', '12', '13', '14', '15'], color: 'bg-orange-200' },
    { name: 'Week 3', days: ['16', '17', '18', '19', '20', '21', '22'], color: 'bg-blue-200' },
    { name: 'Week 4', days: ['23', '24', '25', '26', '27', '28', '29'], color: 'bg-green-200' },
  ];

  const calculateTotal = (expense: Expense) => {
    return Object.values(expense.days).reduce((sum, val) => sum + val, 0);
  };

  const calculatePercent = (expense: Expense) => {
    const total = calculateTotal(expense);
    if (expense.planned === 0) return 0;
    return Math.round((total / expense.planned) * 100);
  };

  const getPercentColor = (percent: number) => {
    if (percent > 100) return 'text-red-600';
    if (percent > 80) return 'text-orange-600';
    if (percent > 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="w-full overflow-auto">
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveView('monthly')}
          className={`px-4 py-2 rounded ${activeView === 'monthly' ? 'bg-pink-500 text-white' : 'bg-gray-200'}`}
        >
          План на месяц
        </button>
        <button
          onClick={() => setActiveView('daily')}
          className={`px-4 py-2 rounded ${activeView === 'daily' ? 'bg-pink-500 text-white' : 'bg-gray-200'}`}
        >
          Daily Habits
        </button>
      </div>

      <div className="min-w-[1200px]">
        <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-[200px_100px_repeat(32,60px)_100px_60px] bg-pink-100">
            <div className="p-2 border-r font-semibold">
              {activeView === 'monthly' ? 'План на месяц' : 'Daily Habits'}
            </div>
            <div className="p-2 border-r text-center font-semibold">
              {activeView === 'monthly' ? 'December' : 'December'}
            </div>
            {weeks.map((week, idx) => (
              <React.Fragment key={idx}>
                <div className={`col-span-8 p-2 border-r text-center font-semibold ${week.color}`}>
                  {week.name}
                </div>
              </React.Fragment>
            ))}
            <div className="p-2 border-r text-center font-semibold">Итого:</div>
            <div className="p-2 text-center font-semibold">%</div>
          </div>

          {/* Days */}
          <div className="grid grid-cols-[200px_100px_repeat(32,60px)_100px_60px] bg-gray-50">
            <div className="p-2 border-r"></div>
            <div className="p-2 border-r text-center font-semibold">Остаток:</div>
            {weeks.map((week) =>
              week.days.map((day, idx) => (
                <div key={`${week.name}-${day}`} className={`p-2 border-r text-center text-sm ${week.color}`}>
                  {day}
                </div>
              ))
            )}
            <div className="p-2 border-r"></div>
            <div className="p-2"></div>
          </div>

          {/* Expense rows */}
          {currentExpenses.map((expense, idx) => {
            const total = calculateTotal(expense);
            const percent = calculatePercent(expense);
            const isOverBudget = total > expense.planned;
            
            return (
              <div
                key={idx}
                className={`grid grid-cols-[200px_100px_repeat(32,60px)_100px_60px] border-t ${
                  expense.category === 'Прочее' ? 'bg-orange-100' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className="p-2 border-r">{expense.category}</div>
                <div className="p-2 border-r text-right">{expense.planned.toLocaleString()} ₽</div>
                {weeks.map((week) =>
                  week.days.map((day) => (
                    <div
                      key={`${expense.category}-${day}`}
                      className={`p-2 border-r text-right text-sm ${week.color}`}
                    >
                      {expense.days[day] ? `${expense.days[day].toLocaleString()} ₽` : ''}
                    </div>
                  ))
                )}
                <div className={`p-2 border-r text-right ${isOverBudget ? 'bg-red-200' : ''}`}>
                  {total.toLocaleString()} ₽
                </div>
                <div className={`p-2 text-right ${getPercentColor(percent)}`}>
                  {percent}%
                </div>
              </div>
            );
          })}

          {/* Total row */}
          <div className="grid grid-cols-[200px_100px_repeat(32,60px)_100px_60px] bg-pink-300 border-t-2">
            <div className="p-2 border-r font-semibold">Итого:</div>
            <div className="p-2 border-r text-right font-semibold">
              {currentExpenses.reduce((sum, e) => sum + e.planned, 0).toLocaleString()} ₽
            </div>
            {weeks.map((week) =>
              week.days.map((day) => {
                const dayTotal = currentExpenses.reduce((sum, e) => sum + (e.days[day] || 0), 0);
                return (
                  <div key={`total-${day}`} className={`p-2 border-r text-right text-sm font-semibold ${week.color}`}>
                    {dayTotal > 0 ? `${dayTotal.toLocaleString()} ₽` : ''}
                  </div>
                );
              })
            )}
            <div className="p-2 border-r text-right font-semibold">
              {currentExpenses.reduce((sum, e) => sum + calculateTotal(e), 0).toLocaleString()} ₽
            </div>
            <div className="p-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
}