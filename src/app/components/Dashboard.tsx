import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

interface IncomeSource {
  id: string;
  category: string;
  expected: number;
  received: number;
}

interface DashboardProps {
  incomeSources: IncomeSource[];
}

export function Dashboard({ incomeSources }: DashboardProps) {
  // Transform incomeSources to incomeData format
  const incomeData = incomeSources.map(source => ({
    category: source.category,
    expected: source.expected,
    actual: source.received,
    diff: source.received - source.expected
  }));

  const budgetSummary = [
    { category: 'Needs', expected: 86300, actual: 34410, diff: 51890, color: '#E02F76' },
    { category: 'Wishes', expected: 108010, actual: 0, diff: 108010, color: '#E871A0' },
    { category: 'Накопления', expected: 2690, actual: 0, diff: 2690, color: '#F4AFCA' },
  ];

  const pieData = [
    { name: 'Needs', value: 44, color: '#E02F76' },
    { name: 'Wishes', value: 55, color: '#E871A0' },
    { name: 'Накопления', value: 1, color: '#F4AFCA' },
  ];

  const totalIncome = incomeData.reduce((sum, item) => sum + item.actual, 0);
  const totalExpected = incomeData.reduce((sum, item) => sum + item.expected, 0);
  const totalSpent = budgetSummary.reduce((sum, item) => sum + item.actual, 0);
  const balance = totalIncome - totalSpent;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.08)] transition-all" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#86868b] text-xs font-medium tracking-wide uppercase">Доход</p>
              <p className="text-2xl mt-2 font-light text-[#1a1a1a]">{totalIncome.toLocaleString()} ₽</p>
              <p className="text-[#E02F76] text-sm mt-2 flex items-center gap-1 font-light">
                <TrendingUp className="w-4 h-4" />
                +{((totalIncome - totalExpected) / totalExpected * 100).toFixed(0)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-[#f5f5f7] rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#E02F76]" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.08)] transition-all" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#86868b] text-xs font-medium tracking-wide uppercase">Расходы</p>
              <p className="text-2xl mt-2 font-light text-[#1a1a1a]">{totalSpent.toLocaleString()} ₽</p>
              <p className="text-[#86868b] text-sm mt-2 font-light">из {totalExpected.toLocaleString()} ₽</p>
            </div>
            <div className="w-12 h-12 bg-[#f5f5f7] rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-[#86868b]" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.08)] transition-all" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#86868b] text-xs font-medium tracking-wide uppercase">Баланс</p>
              <p className="text-2xl mt-2 font-light text-[#1a1a1a]">{balance.toLocaleString()} ₽</p>
              <p className="text-[#E871A0] text-sm mt-2 font-light">{((balance / totalIncome) * 100).toFixed(0)}% от дохода</p>
            </div>
            <div className="w-12 h-12 bg-[#f5f5f7] rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-[#E871A0]" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.08)] transition-all" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between">
            <div className="w-full">
              <p className="text-[#86868b] text-xs font-medium tracking-wide uppercase">План выполнен</p>
              <p className="text-2xl mt-2 font-light text-[#1a1a1a]">{((totalSpent / totalExpected) * 100).toFixed(0)}%</p>
              <div className="w-full bg-[#f5f5f7] rounded-full h-1.5 mt-3">
                <div 
                  className="bg-gradient-to-r from-[#2c2c2c] to-[#1a1a1a] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((totalSpent / totalExpected) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Chart */}
        <div className="bg-white p-8 rounded-xl border border-[rgba(0,0,0,0.06)]" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 className="mb-6 text-[#1a1a1a] font-light tracking-tight">Доходы</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f7" vertical={false} />
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12, fill: '#86868b' }}
                axisLine={{ stroke: '#e8e8ed' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#86868b' }}
                axisLine={{ stroke: '#e8e8ed' }}
              />
              <Tooltip 
                formatter={(value: number) => `${value.toLocaleString()} ₽`}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  fontWeight: '300'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '13px', fontWeight: '300' }} />
              <Bar dataKey="expected" name="План" fill="#e8e8ed" radius={[6, 6, 0, 0]} />
              <Bar dataKey="actual" name="Факт" fill="#E02F76" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Breakdown Pie */}
        <div className="bg-white p-8 rounded-xl border border-[rgba(0,0,0,0.06)]" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 className="mb-6 text-[#1a1a1a] font-light tracking-tight">Распределение бюджета</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name} ${entry.value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  fontWeight: '300'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget Summary Table */}
      <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.06)] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="p-6 border-b border-[rgba(0,0,0,0.06)]">
          <h3 className="text-[#1a1a1a] font-light tracking-tight">Сводка по бюджету</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#fafafa] border-b border-[rgba(0,0,0,0.06)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase text-[#86868b] font-medium tracking-wide">Категория</th>
                <th className="px-6 py-4 text-right text-xs uppercase text-[#86868b] font-medium tracking-wide">План</th>
                <th className="px-6 py-4 text-right text-xs uppercase text-[#86868b] font-medium tracking-wide">Факт</th>
                <th className="px-6 py-4 text-right text-xs uppercase text-[#86868b] font-medium tracking-wide">Разница</th>
                <th className="px-6 py-4 text-right text-xs uppercase text-[#86868b] font-medium tracking-wide">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
              {budgetSummary.map((item, index) => (
                <tr key={index} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-light text-[#1a1a1a]">{item.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-light text-[#1a1a1a]">{item.expected.toLocaleString()} ₽</td>
                  <td className="px-6 py-4 text-right text-sm font-light text-[#1a1a1a]">{item.actual.toLocaleString()} ₽</td>
                  <td className="px-6 py-4 text-right text-sm font-light text-[#86868b]">{item.diff.toLocaleString()} ₽</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      item.actual === 0 
                        ? 'bg-[#f5f5f7] text-[#86868b] border-[rgba(0,0,0,0.06)]' 
                        : 'bg-[#E02F76]/10 text-[#E02F76] border-[#E02F76]/20'
                    }`}>
                      {item.actual === 0 ? '0%' : `${((item.actual / item.expected) * 100).toFixed(0)}%`}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-[#f5f5f7] border-t border-[rgba(0,0,0,0.08)]">
                <td className="px-6 py-4 text-sm font-medium text-[#1a1a1a]">Итого</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-[#1a1a1a]">{totalExpected.toLocaleString()} ₽</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-[#1a1a1a]">{totalSpent.toLocaleString()} ₽</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-[#1a1a1a]">{(totalExpected - totalSpent).toLocaleString()} ₽</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-[#1a1a1a]">
                  {totalSpent === 0 ? '0%' : `${((totalSpent / totalExpected) * 100).toFixed(0)}%`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Income Summary Table */}
      <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.06)] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="p-6 border-b border-[rgba(0,0,0,0.06)]">
          <h3 className="text-[#1a1a1a] font-light tracking-tight">Источники дохода</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#fafafa] border-b border-[rgba(0,0,0,0.06)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase text-[#86868b] font-medium tracking-wide">Категория</th>
                <th className="px-6 py-4 text-right text-xs uppercase text-[#86868b] font-medium tracking-wide">План</th>
                <th className="px-6 py-4 text-right text-xs uppercase text-[#86868b] font-medium tracking-wide">Факт</th>
                <th className="px-6 py-4 text-right text-xs uppercase text-[#86868b] font-medium tracking-wide">Разница</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
              {incomeData.map((item, index) => (
                <tr key={index} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-6 py-4 text-sm font-light text-[#1a1a1a]">{item.category}</td>
                  <td className="px-6 py-4 text-right text-sm font-light text-[#1a1a1a]">{item.expected.toLocaleString()} ₽</td>
                  <td className="px-6 py-4 text-right text-sm font-light text-[#1a1a1a]">{item.actual.toLocaleString()} ₽</td>
                  <td className="px-6 py-4 text-right text-sm font-light text-[#E02F76]">+{item.diff.toLocaleString()} ₽</td>
                </tr>
              ))}
              <tr className="bg-[#f5f5f7] border-t border-[rgba(0,0,0,0.08)]">
                <td className="px-6 py-4 text-sm font-medium text-[#1a1a1a]">Итого</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-[#1a1a1a]">{totalExpected.toLocaleString()} ₽</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-[#1a1a1a]">{totalIncome.toLocaleString()} ₽</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-[#E02F76]">+{(totalIncome - totalExpected).toLocaleString()} ₽</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}