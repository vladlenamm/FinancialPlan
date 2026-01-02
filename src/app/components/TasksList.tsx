import React, { useState } from 'react';
import { Checkbox } from './ui/checkbox';

interface Task {
  id: string;
  category: string;
  expected: number;
  actual?: number;
  diff: number;
  done: boolean;
}

interface TaskGroup {
  date: string;
  tasks: Task[];
}

export function TasksList() {
  const [needsGroups, setNeedsGroups] = useState<TaskGroup[]>([
    {
      date: '30.20 p',
      tasks: [
        { id: 'n1', category: 'Доставка еды', expected: 19200, actual: 13210, diff: 5990, done: false },
        { id: 'n2', category: 'Продукты', expected: 20000, actual: undefined, diff: 20000, done: false },
      ],
    },
    {
      date: '16.20 p',
      tasks: [
        { id: 'n3', category: 'Маникюр', expected: 2000, actual: undefined, diff: 2000, done: false },
        { id: 'n4', category: 'Педикюр', expected: 2800, actual: undefined, diff: 2800, done: false },
        { id: 'n5', category: 'Ресницы', expected: 1800, actual: undefined, diff: 1800, done: false },
        { id: 'n6', category: 'Губы', expected: 15600, actual: 15600, diff: 0, done: true },
      ],
    },
    {
      date: '12.20 p',
      tasks: [
        { id: 'n7', category: 'Английский', expected: 6600, actual: undefined, diff: 6600, done: false },
        { id: 'n8', category: 'Китайский', expected: 5600, actual: 5600, diff: 0, done: false },
      ],
    },
    {
      date: '7 sep p',
      tasks: [
        { id: 'n9', category: 'Телефон', expected: 700, actual: undefined, diff: 700, done: false },
        { id: 'n10', category: 'ChatGPT', expected: 2600, actual: undefined, diff: 2600, done: false },
        { id: 'n11', category: 'VK Music', expected: 200, actual: undefined, diff: 200, done: false },
        { id: 'n12', category: '', expected: 0, actual: undefined, diff: 0, done: false },
      ],
    },
    {
      date: '9.20 p',
      tasks: [
        { id: 'n13', category: 'Вейп', expected: 2000, actual: undefined, diff: 2000, done: false },
        { id: 'n14', category: 'Стэф', expected: 2200, actual: undefined, diff: 2200, done: false },
        { id: 'n15', category: 'Такси', expected: 5000, actual: undefined, diff: 5000, done: false },
      ],
    },
  ]);

  const [wantsGroups, setWantsGroups] = useState<TaskGroup[]>([
    {
      date: '20.000 p',
      tasks: [
        { id: 'w1', category: 'Бонусы', expected: 15000, actual: undefined, diff: 15000, done: false },
        { id: 'w2', category: 'Кафе', expected: 5000, actual: undefined, diff: 5000, done: false },
      ],
    },
    {
      date: '19.40 p',
      tasks: [
        { id: 'w3', category: 'Косметика', expected: 5400, actual: undefined, diff: 5400, done: false },
        { id: 'w4', category: 'Одежда', expected: 11000, actual: undefined, diff: 11000, done: false },
        { id: 'w5', category: 'Тело', expected: 3000, actual: undefined, diff: 3000, done: false },
        { id: 'w6', category: '', expected: 0, actual: undefined, diff: 0, done: false },
      ],
    },
    {
      date: '18.84 p',
      tasks: [
        { id: 'w7', category: 'Вартик', expected: 3000, actual: undefined, diff: 3000, done: false },
        { id: 'w8', category: 'Трейдинг', expected: 10840, actual: undefined, diff: 10840, done: false },
        { id: 'w9', category: 'Обучение', expected: 5000, actual: undefined, diff: 5000, done: false },
      ],
    },
    {
      date: '6.08b p',
      tasks: [
        { id: 'w10', category: 'MyBook', expected: 550, actual: undefined, diff: 550, done: false },
        { id: 'w11', category: 'Telegram', expected: 330, actual: undefined, diff: 330, done: false },
        { id: 'w12', category: 'Инвесткоп', expected: 1200, actual: undefined, diff: 1200, done: false },
        { id: 'w13', category: 'Прочее', expected: 4000, actual: undefined, diff: 4000, done: false },
      ],
    },
    {
      date: '43.690 p',
      tasks: [
        { id: 'w14', category: 'Родители', expected: 0, actual: undefined, diff: 0, done: false },
        { id: 'w15', category: 'Подарки', expected: 38690, actual: undefined, diff: 38690, done: false },
        { id: 'w16', category: 'Дом', expected: 5000, actual: undefined, diff: 5000, done: false },
      ],
    },
  ]);

  const toggleTask = (groupIndex: number, taskId: string, type: 'needs' | 'wants') => {
    if (type === 'needs') {
      const newGroups = [...needsGroups];
      const task = newGroups[groupIndex].tasks.find(t => t.id === taskId);
      if (task) {
        task.done = !task.done;
        setNeedsGroups(newGroups);
      }
    } else {
      const newGroups = [...wantsGroups];
      const task = newGroups[groupIndex].tasks.find(t => t.id === taskId);
      if (task) {
        task.done = !task.done;
        setWantsGroups(newGroups);
      }
    }
  };

  const calculateTotal = (groups: TaskGroup[]) => {
    return groups.reduce((sum, group) => {
      return sum + group.tasks.reduce((taskSum, task) => taskSum + task.expected, 0);
    }, 0);
  };

  const calculateActualTotal = (groups: TaskGroup[]) => {
    return groups.reduce((sum, group) => {
      return sum + group.tasks.reduce((taskSum, task) => taskSum + (task.actual || 0), 0);
    }, 0);
  };

  const calculateDiffTotal = (groups: TaskGroup[]) => {
    return groups.reduce((sum, group) => {
      return sum + group.tasks.reduce((taskSum, task) => taskSum + task.diff, 0);
    }, 0);
  };

  const renderTaskGroup = (group: TaskGroup, groupIndex: number, type: 'needs' | 'wants') => {
    const groupTotal = group.tasks.reduce((sum, task) => sum + task.expected, 0);
    
    return (
      <div key={groupIndex} className="mb-6">
        <div className="grid grid-cols-[60px_1fr_150px_150px_150px] gap-2 mb-2">
          {group.tasks.map((task, taskIndex) => (
            <React.Fragment key={task.id}>
              <div className="flex items-center justify-center bg-pink-100 p-2 rounded">
                <Checkbox
                  checked={task.done}
                  onCheckedChange={() => toggleTask(groupIndex, task.id, type)}
                />
              </div>
              <div className="bg-white p-2 rounded border">{task.category}</div>
              <div className="bg-white p-2 rounded border text-right">
                {task.expected > 0 ? `${task.expected.toLocaleString()} ₽` : ''}
              </div>
              <div className="bg-white p-2 rounded border text-right">
                {task.actual ? `${task.actual.toLocaleString()} ₽` : ''}
              </div>
              <div className="bg-white p-2 rounded border text-right">
                {task.diff > 0 ? `${task.diff.toLocaleString()} ₽` : task.diff === 0 ? '0 ₽' : ''}
              </div>
            </React.Fragment>
          ))}
        </div>
        {groupIndex < (type === 'needs' ? needsGroups.length - 1 : wantsGroups.length - 1) && (
          <div className="text-right text-sm text-gray-600 mt-1 mr-2">{groupTotal.toLocaleString()} ₽</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full p-4">
      <div className="grid grid-cols-2 gap-8">
        {/* Needs Section */}
        <div>
          <div className="bg-pink-400 text-white p-4 rounded-t-lg mb-4">
            <div className="grid grid-cols-[60px_1fr_150px_150px_150px] gap-2">
              <div className="text-center">done</div>
              <div>category</div>
              <div className="text-right">expected</div>
              <div className="text-right">actual</div>
              <div className="text-right">diff</div>
            </div>
          </div>
          <div className="bg-pink-50 p-4 rounded-b-lg">
            {needsGroups.map((group, idx) => renderTaskGroup(group, idx, 'needs'))}
            <div className="bg-pink-500 text-white p-3 rounded grid grid-cols-[60px_1fr_150px_150px_150px] gap-2 mt-4">
              <div></div>
              <div>total</div>
              <div className="text-right">{calculateTotal(needsGroups).toLocaleString()} ₽</div>
              <div className="text-right">{calculateActualTotal(needsGroups).toLocaleString()} ₽</div>
              <div className="text-right">{calculateDiffTotal(needsGroups).toLocaleString()} ₽</div>
            </div>
            <div className="text-right mt-2 text-sm">{calculateDiffTotal(needsGroups).toLocaleString()} ₽</div>
          </div>
        </div>

        {/* Wants Section */}
        <div>
          <div className="bg-pink-400 text-white p-4 rounded-t-lg mb-4">
            <div className="grid grid-cols-[60px_1fr_150px_150px_150px] gap-2">
              <div className="text-center">done</div>
              <div>category</div>
              <div className="text-right">expected</div>
              <div className="text-right">actual</div>
              <div className="text-right">diff</div>
            </div>
          </div>
          <div className="bg-pink-50 p-4 rounded-b-lg">
            {wantsGroups.map((group, idx) => renderTaskGroup(group, idx, 'wants'))}
            <div className="bg-pink-500 text-white p-3 rounded grid grid-cols-[60px_1fr_150px_150px_150px] gap-2 mt-4">
              <div></div>
              <div>total</div>
              <div className="text-right">{calculateTotal(wantsGroups).toLocaleString()} ₽</div>
              <div className="text-right">{calculateActualTotal(wantsGroups).toLocaleString()} ₽</div>
              <div className="text-right">{calculateDiffTotal(wantsGroups).toLocaleString()} ₽</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
