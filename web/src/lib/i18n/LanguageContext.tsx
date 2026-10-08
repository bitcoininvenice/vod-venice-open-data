'use client';

import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { usePreference, writePreference } from '@/lib/localPreference';
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

const LANGUAGE_KEY = 'vod_language';

/** Lingua salvata dall'utente, altrimenti quella del browser (italiano come predefinito). */
function initialLanguage(stored: string | null): Language {
  if (stored === 'it' || stored === 'en') return stored;
  if (typeof navigator !== 'undefined' && navigator.language && !navigator.language.toLowerCase().startsWith('it')) {
    return 'en';
  }
  return 'it';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lato server non c'è preferenza: si rende in italiano e il client si allinea dopo l'idratazione
  const stored = usePreference(LANGUAGE_KEY, 'it');
  const language = initialLanguage(stored);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    writePreference(LANGUAGE_KEY, lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'it' ? 'en' : 'it');
  }, [language, setLanguage]);

  const dict = useMemo(() => dictionaries[language] || itTranslations, [language]);

  const t = useCallback((path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    const resolve = (root: unknown): string | undefined => {
      let current: unknown = root;
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = (current as Record<string, unknown>)[key];
        } else {
          return undefined;
        }
      }
      return typeof current === 'string' ? current : undefined;
    };

    // Chiave mancante nella lingua corrente: si usa l'italiano, poi il percorso stesso
    let result = resolve(dict) ?? resolve(itTranslations) ?? path;
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
