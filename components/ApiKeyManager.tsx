import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from './Button';

const API_KEY_STORAGE_KEY = 'gemini_api_key';

interface ApiKeyManagerProps {
  onApiKeyChange?: (apiKey: string) => void;
}

export const ApiKeyManager = ({ onApiKeyChange }: ApiKeyManagerProps) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      setApiKey(storedKey);
      setSaved(true);
      onApiKeyChange?.(storedKey);
    }
  }, [onApiKeyChange]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
      setSaved(true);
      onApiKeyChange?.(apiKey.trim());
    }
  };

  const handleClear = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey('');
    setSaved(false);
    onApiKeyChange?.('');
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-lg p-4 shadow-xl max-w-md">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-medium text-gray-200">Gemini API Key</h3>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API 키를 입력하세요"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 pr-10"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          <Button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-sm flex items-center gap-2"
          >
            {saved ? <Check className="w-4 h-4" /> : null}
            저장
          </Button>
          
          {saved && (
            <Button
              onClick={handleClear}
              variant="secondary"
              className="px-4 py-2 text-sm"
            >
              삭제
            </Button>
          )}
        </div>
        
        {saved && (
          <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
            <Check className="w-3 h-3" />
            API 키가 저장되었습니다
          </p>
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300"
          >
            API 키 발급받기 →
          </a>
        </p>
      </div>
    </div>
  );
};

// API 키 가져오기 유틸리티 함수
export const getStoredApiKey = (): string => {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
};
