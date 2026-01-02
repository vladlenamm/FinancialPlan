import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Envelope {
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
}

export function BudgetOverview() {
  const [incomeData] = useState([
    { category: 'Шары 16-31', expected: 80000, actual: 84000, diff: 4000 },
    { category: 'Стикеры', expected: 27000, actual: 47000, diff: 20000 },
    { category: 'Шары 1-15', expected: 90000, actual: 185000, diff: 95000 },
    { category: 'Остаток', expected: 0, actual: 0, diff: 0 },
  ]);

  const [savingsData] = useState([
    { category: 'Инвест копилка', expected: 1200, actual: 0, diff: 0 },
    { category: 'Трейдинг', expected: 0, actual: 0, diff: 0 },
    { category: 'Накопления', expected: 1490, actual: 0, diff: 0 },
    { category: 'Остаток', expected: 0, actual: 0, diff: 0 },
  ]);

  const [budgetSummary] = useState([
    { category: 'needs', expected: 86300, actual: 34410, diff: 51890 },
    { category: 'wants', expected: 108010, actual: 0, diff: 108010 },
    { category: 'saving & dept', expected: 2690, actual: 0, diff: 2690 },
  ]);

  const [envelopes] = useState<Envelope[]>([
    { category: 'education envelope', allocated: 15100, spent: 9200, remaining: 5900 },
    { category: 'Health and Beauty envelope', allocated: 26900, spent: 23360, remaining: 3540 },
    { category: 'food envelope', allocated: 25000, spent: 22265, remaining: 2735 },
    { category: 'regular life', allocated: 60000, spent: 64200, remaining: -4200 },
  ]);

  const totalIncome = incomeData.reduce((sum, item) => sum + item.actual, 0);
  const totalExpenses = budgetSummary.reduce((sum, item) => sum + item.actual, 0);
  const totalSavings = savingsData.reduce((sum, item) => sum + item.actual, 0);

  const breakdownData = [
    { name: 'needs', expected: 44, actual: 11, value: 11 },
    { name: 'wants', expected: 55, actual: 0, value: 0 },
    { name: 'saving & dept', expected: 1, actual: 0, value: 0 },
  ];

  const COLORS = ['#ec4899', '#f97316', '#3b82f6', '#10b981'];

  return (
    <div className="w-full space-y-6 p-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Income Section */}
        <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-pink-400 text-white p-3 text-center">INCOME</div>
          <table className="w-full">
            <thead className="bg-pink-100">
              <tr>
                <th className="p-2 text-left">category</th>
                <th className="p-2 text-right">expected</th>
                <th className="p-2 text-right">actual</th>
                <th className="p-2 text-right">diff</th>
              </tr>
            </thead>
            <tbody>
              {incomeData.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-2">{item.category}</td>
                  <td className="p-2 text-right">{item.expected.toLocaleString()} ₽</td>
                  <td className="p-2 text-right">{item.actual.toLocaleString()} ₽</td>
                  <td className="p-2 text-right">{item.diff.toLocaleString()} ₽</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-orange-400 text-white">
              <tr>
                <td className="p-2 font-semibold">total</td>
                <td className="p-2 text-right font-semibold">
                  {incomeData.reduce((sum, item) => sum + item.expected, 0).toLocaleString()} ₽
                </td>
                <td className="p-2 text-right font-semibold">
                  {totalIncome.toLocaleString()} ₽
                </td>
                <td className="p-2 text-right font-semibold">
                  {incomeData.reduce((sum, item) => sum + item.diff, 0).toLocaleString()} ₽
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Savings & Dept Section */}
        <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-pink-400 text-white p-3 text-center">savings and dept</div>
          <table className="w-full">
            <thead className="bg-pink-100">
              <tr>
                <th className="p-2 text-left">category</th>
                <th className="p-2 text-right">expected</th>
                <th className="p-2 text-right">actual</th>
                <th className="p-2 text-right">diff</th>
              </tr>
            </thead>
            <tbody>
              {savingsData.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-2">{item.category}</td>
                  <td className="p-2 text-right">{item.expected.toLocaleString()} ₽</td>
                  <td className="p-2 text-right">{item.actual.toLocaleString()} ₽</td>
                  <td className="p-2 text-right">{item.diff.toLocaleString()} ₽</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-orange-400 text-white">
              <tr>
                <td className="p-2 font-semibold">total</td>
                <td className="p-2 text-right font-semibold">
                  {savingsData.reduce((sum, item) => sum + item.expected, 0).toLocaleString()} ₽
                </td>
                <td className="p-2 text-right font-semibold">
                  {totalSavings.toLocaleString()} ₽
                </td>
                <td className="p-2 text-right font-semibold">
                  {savingsData.reduce((sum, item) => sum + item.diff, 0).toLocaleString()} ₽
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Budget Summary */}
        <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-pink-500 text-white p-3 text-center">BUDGET SUMMARY</div>
          <table className="w-full">
            <thead className="bg-pink-100">
              <tr>
                <th className="p-2 text-left">category</th>
                <th className="p-2 text-right">expected</th>
                <th className="p-2 text-right">actual</th>
                <th className="p-2 text-right">diff</th>
              </tr>
            </thead>
            <tbody>
              {budgetSummary.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-2">{item.category}</td>
                  <td className="p-2 text-right">{item.expected.toLocaleString()} ₽</td>
                  <td className="p-2 text-right">{item.actual.toLocaleString()} ₽</td>
                  <td className="p-2 text-right">{item.diff.toLocaleString()} ₽</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-pink-600 text-white">
              <tr>
                <td className="p-2 font-semibold">total</td>
                <td className="p-2 text-right font-semibold">
                  {budgetSummary.reduce((sum, item) => sum + item.expected, 0).toLocaleString()} ₽
                </td>
                <td className="p-2 text-right font-semibold">
                  {totalExpenses.toLocaleString()} ₽
                </td>
                <td className="p-2 text-right font-semibold">
                  {budgetSummary.reduce((sum, item) => sum + item.diff, 0).toLocaleString()} ₽
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* % Breakdown */}
        <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-pink-500 text-white p-3 text-center">% BREAKDOWN</div>
          <table className="w-full">
            <thead className="bg-pink-100">
              <tr>
                <th className="p-2 text-left">category</th>
                <th className="p-2 text-right">expected</th>
                <th className="p-2 text-right">actual</th>
                <th className="p-2 text-right">diff</th>
              </tr>
            </thead>
            <tbody>
              {breakdownData.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-2">{item.name}</td>
                  <td className="p-2 text-right">{item.expected}%</td>
                  <td className="p-2 text-right">{item.actual}%</td>
                  <td className="p-2 text-right">{item.expected - item.actual}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-pink-600 text-white">
              <tr>
                <td className="p-2 font-semibold">total</td>
                <td className="p-2 text-right font-semibold">100%</td>
                <td className="p-2 text-right font-semibold">11%</td>
                <td className="p-2 text-right font-semibold">89%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Envelopes */}
      <div className="grid grid-cols-2 gap-4">
        {envelopes.map((envelope, idx) => (
          <div key={idx} className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="bg-blue-300 text-white p-3 text-center">{envelope.category}:</div>
            <table className="w-full">
              <thead className="bg-blue-100">
                <tr>
                  <th className="p-2 text-left">category</th>
                  <th className="p-2 text-right">отложено</th>
                  <th className="p-2 text-right">потрачено</th>
                  <th className="p-2 text-right">остаток</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="p-2">1-15</td>
                  <td className="p-2 text-right">{Math.floor(envelope.allocated / 2).toLocaleString()} ₽</td>
                  <td className="p-2 text-right">{Math.floor(envelope.spent / 2).toLocaleString()} ₽</td>
                  <td className="p-2 text-right">{Math.floor(envelope.remaining / 2).toLocaleString()} ₽</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-2">16-31</td>
                  <td className="p-2 text-right">{Math.ceil(envelope.allocated / 2).toLocaleString()} ₽</td>
                  <td className="p-2 text-right">{Math.ceil(envelope.spent / 2).toLocaleString()} ₽</td>
                  <td className="p-2 text-right">{Math.ceil(envelope.remaining / 2).toLocaleString()} ₽</td>
                </tr>
              </tbody>
              <tfoot className="bg-blue-400 text-white">
                <tr>
                  <td className="p-2 font-semibold">edu total:</td>
                  <td className="p-2 text-right font-semibold">{envelope.allocated.toLocaleString()} ₽</td>
                  <td className="p-2 text-right font-semibold">{envelope.spent.toLocaleString()} ₽</td>
                  <td className="p-2 text-right font-semibold"></td>
                </tr>
              </tfoot>
            </table>
            <div className="p-2 bg-blue-200 text-center">{envelope.allocated.toLocaleString()} ₽</div>
          </div>
        ))}
      </div>

      {/* Envelopes Summary Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-gray-800 font-light tracking-tight">Конверты</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Категория</th>
              <th className="px-6 py-3 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">1-15</th>
              <th className="px-6 py-3 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">16-31</th>
              <th className="px-6 py-3 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">Остаток</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <tr className="bg-gray-50 hover:bg-gray-100/50 transition-colors">
              <td className="px-6 py-3 font-light text-gray-900">Приход</td>
              <td className="px-6 py-3 text-right font-light text-gray-900">131 000 ₽</td>
              <td className="px-6 py-3 text-right font-light text-gray-900">185 000 ₽</td>
              <td className="px-6 py-3"></td>
            </tr>
            {envelopes.map((envelope, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-3 font-light text-gray-800">{envelope.category}</td>
                <td className="px-6 py-3 text-right font-light text-gray-700">{Math.floor(envelope.allocated / 2).toLocaleString()} ₽</td>
                <td className="px-6 py-3 text-right font-light text-gray-700">{Math.ceil(envelope.allocated / 2).toLocaleString()} ₽</td>
                <td className="px-6 py-3 text-right font-light text-gray-700">{envelope.remaining.toLocaleString()} ₽</td>
              </tr>
            ))}
            <tr className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-3 font-light text-gray-800">savings and dept</td>
              <td className="px-6 py-3 text-right font-light text-gray-700">4 000 ₽</td>
              <td className="px-6 py-3 text-right font-light text-gray-700">-2 510 ₽</td>
              <td className="px-6 py-3"></td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-6 py-4 font-light text-gray-900">Итого накоплений</td>
              <td className="px-6 py-4 text-right font-light text-gray-900">1 490 ₽</td>
              <td className="px-6 py-4 text-right font-light text-gray-900">0 ₽</td>
              <td className="px-6 py-4 text-right font-light text-gray-900">0 ₽</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}