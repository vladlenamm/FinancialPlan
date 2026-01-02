import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface ArchivedMonth {
  id: string;
  name: string;
  createdAt: string;
  data: {
    dailyExpenses: any[];
    needsItems: any[];
    wantsItems: any[];
    incomeSources: any[];
    savingsData: any;
    topUps: any[];
    envelopeTransfers: any[];
    firstHalfDeposits: any;
  };
  balances: {
    envelopeBalance: number;
    savingsBalance: number;
    totalBalance: number;
  };
}

export function Archive() {
  const [archivedMonths, setArchivedMonths] = useState<ArchivedMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    loadArchive();
  }, []);

  const loadArchive = () => {
    try {
      const archive = JSON.parse(localStorage.getItem('monthArchive') || '[]');
      archive.sort((a: ArchivedMonth, b: ArchivedMonth) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setArchivedMonths(archive);
    } catch (error) {
      console.error('Error loading archive:', error);
    }
  };

  const deleteMonth = (id: string) => {
    const month = archivedMonths.find(m => m.id === id);
    if (!month) return;

    const confirmed = window.confirm(
      `Удалить архив "${month.name}"?\n\nЭто действие нельзя отменить!`
    );

    if (confirmed) {
      const updatedArchive = archivedMonths.filter(m => m.id !== id);
      localStorage.setItem('monthArchive', JSON.stringify(updatedArchive));
      setArchivedMonths(updatedArchive);
      if (selectedMonth === id) {
        setSelectedMonth(null);
      }
    }
  };

  const toggleMonth = (id: string) => {
    setSelectedMonth(selectedMonth === id ? null : id);
  };

  if (archivedMonths.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-gray-400 mb-2">Архив пуст</h2>
          <p className="text-gray-500 text-sm">
            Здесь будут храниться данные о прошлых месяцах
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-[#1a1a1a] mb-2">📦 Архив месяцев</h2>
        <p className="text-[#86868b] text-sm">
          Всего сохранено: {archivedMonths.length} {archivedMonths.length === 1 ? 'месяц' : 'месяцев'}
        </p>
      </div>

      <div className="space-y-3">
        {archivedMonths.map((month) => {
          const isExpanded = selectedMonth === month.id;
          const totalIncome = month.data.incomeSources.reduce(
            (sum: number, source: any) => sum + source.firstHalf + source.secondHalf, 
            0
          );
          const totalExpenses = month.data.dailyExpenses.reduce(
            (sum: number, exp: any) => sum + exp.total, 
            0
          );

          return (
            <div 
              key={month.id} 
              className="bg-white rounded-xl overflow-hidden transition-all duration-200"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <div 
                className="p-4 cursor-pointer hover:bg-[#fafafa] transition-colors duration-150"
                onClick={() => toggleMonth(month.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#f5f5f7] rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-[#1a1a1a]" />
                    </div>
                    <div>
                      <h3 className="text-[#1a1a1a]">{month.name}</h3>
                      <p className="text-[#86868b] text-sm">
                        Создан: {new Date(month.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[#1a1a1a] font-medium">
                        {month.balances.totalBalance.toLocaleString()} ₽
                      </div>
                      <div className="text-[#86868b] text-sm">Остаток</div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMonth(month.id);
                      }}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors duration-150"
                      title="Удалить архив"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[#86868b]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#86868b]" />
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-[rgba(0,0,0,0.06)]">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#fafafa] rounded-xl p-4">
                      <div className="text-[#86868b] text-sm mb-2">Баланс конверты</div>
                      <div className="text-[#1a1a1a] font-medium">
                        {month.balances.envelopeBalance.toLocaleString()} ₽
                      </div>
                    </div>

                    <div className="bg-[#fafafa] rounded-xl p-4">
                      <div className="text-[#86868b] text-sm mb-2">Баланс накопления</div>
                      <div className="text-[#1a1a1a] font-medium">
                        {month.balances.savingsBalance.toLocaleString()} ₽
                      </div>
                    </div>

                    <div className="bg-[#E871A0] bg-opacity-10 rounded-xl p-4">
                      <div className="text-[#E02F76] text-sm mb-2">Общий остаток</div>
                      <div className="text-[#E02F76] font-medium">
                        {month.balances.totalBalance.toLocaleString()} ₽
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <div className="text-green-700 text-sm">Доходы</div>
                      </div>
                      <div className="text-green-700 font-medium">
                        {totalIncome.toLocaleString()} ₽
                      </div>
                    </div>

                    <div className="bg-red-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                        <div className="text-red-700 text-sm">Расходы</div>
                      </div>
                      <div className="text-red-700 font-medium">
                        {totalExpenses.toLocaleString()} ₽
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[#1a1a1a] text-sm font-medium mb-3">
                        Потребности ({month.data.needsItems.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {month.data.needsItems.map((item: any) => (
                          <div 
                            key={item.id} 
                            className="bg-[#fafafa] rounded-lg p-3 flex justify-between items-center"
                          >
                            <div className="flex items-center gap-2">
                              <span>{item.envelope || '📝'}</span>
                              <span className="text-sm text-[#1a1a1a]">{item.category}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-[#1a1a1a]">
                                {(item.actual || 0).toLocaleString()} / {item.expected.toLocaleString()} ₽
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[#1a1a1a] text-sm font-medium mb-3">
                        Желания ({month.data.wantsItems.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {month.data.wantsItems.map((item: any) => (
                          <div 
                            key={item.id} 
                            className="bg-[#fafafa] rounded-lg p-3 flex justify-between items-center"
                          >
                            <div className="flex items-center gap-2">
                              <span>{item.envelope || '✨'}</span>
                              <span className="text-sm text-[#1a1a1a]">{item.category}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-[#1a1a1a]">
                                {(item.actual || 0).toLocaleString()} / {item.expected.toLocaleString()} ₽
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
