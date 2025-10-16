import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  flag: string;
  rtl?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly STORAGE_KEY = 'selectedLanguage';
  private readonly DEFAULT_LANGUAGE = 'tr';
  
  private currentLanguageSubject = new BehaviorSubject<string>(this.DEFAULT_LANGUAGE);
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  private readonly supportedLanguages: Language[] = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  constructor(private translate: TranslateService) {
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    // Get language from localStorage or use default
    const savedLanguage = localStorage.getItem(this.STORAGE_KEY);
    const languageToUse = savedLanguage || this.DEFAULT_LANGUAGE;
    
    this.setLanguage(languageToUse);
  }

  getSupportedLanguages(): Language[] {
    return [...this.supportedLanguages];
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  setLanguage(languageCode: string): void {
    if (this.isLanguageSupported(languageCode)) {
      this.translate.use(languageCode);
      this.currentLanguageSubject.next(languageCode);
      localStorage.setItem(this.STORAGE_KEY, languageCode);
      
      // Set document direction for RTL languages
      const language = this.supportedLanguages.find(lang => lang.code === languageCode);
      if (language?.rtl) {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
    }
  }

  private isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.some(lang => lang.code === languageCode);
  }

  getLanguageName(languageCode: string): string {
    const language = this.supportedLanguages.find(lang => lang.code === languageCode);
    return language?.name || languageCode;
  }

  getLanguageFlag(languageCode: string): string {
    const language = this.supportedLanguages.find(lang => lang.code === languageCode);
    return language?.flag || '🌐';
  }

  isRTL(languageCode?: string): boolean {
    const code = languageCode || this.getCurrentLanguage();
    const language = this.supportedLanguages.find(lang => lang.code === code);
    return language?.rtl || false;
  }

  // Helper method to get translated text
  translateText(key: string, params?: any): Observable<string> {
    return this.translate.get(key, params);
  }

  // Helper method to get translated text synchronously
  translateTextSync(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }

  // Method to detect browser language
  detectBrowserLanguage(): string {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    const langCode = browserLang.split('-')[0];
    
    if (this.isLanguageSupported(langCode)) {
      return langCode;
    }
    
    return this.DEFAULT_LANGUAGE;
  }

  // Method to set language based on browser preference
  setLanguageFromBrowser(): void {
    const browserLang = this.detectBrowserLanguage();
    this.setLanguage(browserLang);
  }

  // Method to reset to default language
  resetToDefault(): void {
    this.setLanguage(this.DEFAULT_LANGUAGE);
  }

  // Method to get all available languages
  getAvailableLanguages(): Language[] {
    return this.supportedLanguages;
  }

  // Method to check if a language is currently active
  isLanguageActive(languageCode: string): boolean {
    return this.getCurrentLanguage() === languageCode;
  }

  // Method to get language direction
  getLanguageDirection(languageCode?: string): 'ltr' | 'rtl' {
    return this.isRTL(languageCode) ? 'rtl' : 'ltr';
  }

  // Method to format numbers based on language
  formatNumber(value: number, languageCode?: string): string {
    const code = languageCode || this.getCurrentLanguage();
    return new Intl.NumberFormat(code).format(value);
  }

  // Method to format currency based on language
  formatCurrency(value: number, currency: string = 'TRY', languageCode?: string): string {
    const code = languageCode || this.getCurrentLanguage();
    return new Intl.NumberFormat(code, {
      style: 'currency',
      currency: currency
    }).format(value);
  }

  // Method to format date based on language
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions, languageCode?: string): string {
    const code = languageCode || this.getCurrentLanguage();
    return new Intl.DateTimeFormat(code, options).format(date);
  }

  // Method to format relative time based on language
  formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, languageCode?: string): string {
    const code = languageCode || this.getCurrentLanguage();
    const rtf = new Intl.RelativeTimeFormat(code, { numeric: 'auto' });
    return rtf.format(value, unit);
  }
}
