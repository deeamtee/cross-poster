import React from 'react';
import { Link } from 'react-router-dom';

export const SettingsOverviewPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">РќР°СЃС‚СЂРѕР№РєРё РїСЂРёР»РѕР¶РµРЅРёСЏ</h1>
        <p className="text-gray-600">РЈРїСЂР°РІР»РµРЅРёРµ РєРѕРЅС„РёРіСѓСЂР°С†РёРµР№ Рё РїРѕРґРєР»СЋС‡РµРЅРёРµРј Рє РїР»Р°С‚С„РѕСЂРјР°Рј</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          to="/settings/access-keys" 
          className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">РљР»СЋС‡Рё РґРѕСЃС‚СѓРїР°</h3>
          </div>
          <p className="text-gray-600">
            РќР°СЃС‚СЂРѕР№С‚Рµ С‚РѕРєРµРЅС‹ Рё РєР»СЋС‡Рё РґР»СЏ РїРѕРґРєР»СЋС‡РµРЅРёСЏ Рє Telegram Рё РґСЂСѓРіРёРј РїР»Р°С‚С„РѕСЂРјР°Рј
          </p>
        </Link>
        
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg opacity-60">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-400">РџСЂРѕС„РёР»СЊ</h3>
          </div>
          <p className="text-gray-400">
            РЈРїСЂР°РІР»РµРЅРёРµ РїСЂРѕС„РёР»РµРј РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ (СЃРєРѕСЂРѕ)
          </p>
        </div>
        
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg opacity-60">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-400">РќР°СЃС‚СЂРѕР№РєРё РїСЂРёР»РѕР¶РµРЅРёСЏ</h3>
          </div>
          <p className="text-gray-400">
            РћР±С‰РёРµ РЅР°СЃС‚СЂРѕР№РєРё Рё РїСЂРµРґРїРѕС‡С‚РµРЅРёСЏ (СЃРєРѕСЂРѕ)
          </p>
        </div>
      </div>
    </div>
  );
};
