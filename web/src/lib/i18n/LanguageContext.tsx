'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language, Translations } from './types';
import { itTranslations } from './it';
import { enTranslations } from './en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  dict: Translations;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const dictionaries: Record<Language, Translations> = {
  it: itTranslations,
  en: enTranslations
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'it',
  setLanguage: () => {},
  toggleLanguage: () => {},
  dict: itTranslations,
  t: (path: string) => path
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('it');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vod_language');
      if (saved === 'it' || saved === 'en') {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      } else if (typeof navigator !== 'undefined') {
        const browserLang = navigator.language?.toLowerCase();
        if (browserLang && !browserLang.startsWith('it')) {
          setLanguageState('en');
          document.documentElement.lang = 'en';
        } else {
          document.documentElement.lang = 'it';
        }
      }
    } catch {
      // Storage access blocked or SSR
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('vod_language', lang);
      document.documentElement.lang = lang;
    } catch {
      // Storage access blocked
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'it' ? 'en' : 'it');
  }, [language, setLanguage]);

  const dict = useMemo(() => dictionaries[language] || itTranslations, [language]);

  const t = useCallback((path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = dict;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to Italian
        let fallback: any = itTranslations;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            fallback = path;
            break;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    let result = current;
    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        result = result.replace(new RegExp(`{${pKey}}`, 'g'), String(pVal));
      }
    }

    return result;
  }, [dict]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage,
    dict,
    t
  }), [language, setLanguage, toggleLanguage, dict, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useTranslation() {
  return useContext(LanguageContext);
}
