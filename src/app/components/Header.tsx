import { Wallet, Calendar, PieChart, Archive as ArchiveIcon } from 'lucide-react';
import { useState } from 'react';

type Tab = 'daily' | 'budget' | 'archive';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onSave?: () => void;
  onCreateNewMonth?: () => void;
}

export function Header({ activeTab, setActiveTab, onSave, onCreateNewMonth }: HeaderProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const tabs = [
    { id: 'daily' as Tab, label: 'Ежедневник', icon: Calendar },
    { id: 'budget' as Tab, label: 'Бюджет', icon: PieChart },
    { id: 'archive' as Tab, label: 'Архив', icon: ArchiveIcon },
  ];

  const handleSave = () => {
    setSaveStatus('saving');
    if (onSave) {
      onSave();
    }
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 300);
  };

  return (
    <header className="bg-white border-b border-[rgba(0,0,0,0.06)] sticky top-0 z-10" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2c2c2c] rounded-lg flex items-center justify-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-[#1a1a1a]">Учет Финансов</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <nav className="flex gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-[#f5f5f7] text-[#1a1a1a]'
                        : 'text-[#86868b] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
                    }`}
                    style={activeTab === tab.id ? { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' } : {}}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                saveStatus === 'saved'
                  ? 'bg-green-500 text-white'
                  : saveStatus === 'saving'
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-[#2c2c2c] text-white hover:bg-[#1a1a1a]'
              }`}
              style={saveStatus === 'idle' ? { boxShadow: '0 2px 6px rgba(0,0,0,0.12)' } : {}}
            >
              {saveStatus === 'saved' ? '✓ Сохранено' : saveStatus === 'saving' ? 'Сохранение...' : 'Сохранить'}
            </button>
            
            {onCreateNewMonth && (
              <button
                onClick={onCreateNewMonth}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 text-white hover:bg-[#E02F76]"
                style={{ 
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                  backgroundColor: '#E871A0'
                }}
                title="ТЕСТ: Создать новый месяц"
              >
                🗓️ Новый месяц
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}