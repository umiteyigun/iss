import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

import { LanguageService, Language } from '../../services/language.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ClickOutsideDirective],
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss']
})
export class LanguageSelectorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  availableLanguages: Language[] = [];
  currentLanguage: string = '';
  isDropdownOpen = false;

  constructor(
    private languageService: LanguageService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.availableLanguages = this.languageService.getSupportedLanguages();
    this.currentLanguage = this.languageService.getCurrentLanguage();
    
    // Subscribe to language changes
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(language => {
        this.currentLanguage = language;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLanguageChange(languageCode: string): void {
    this.languageService.setLanguage(languageCode);
    this.isDropdownOpen = false;
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  getCurrentLanguageInfo(): Language | undefined {
    return this.availableLanguages.find(lang => lang.code === this.currentLanguage);
  }

  getLanguageName(languageCode: string): string {
    return this.languageService.getLanguageName(languageCode);
  }

  getLanguageFlag(languageCode: string): string {
    return this.languageService.getLanguageFlag(languageCode);
  }

  isLanguageActive(languageCode: string): boolean {
    return this.languageService.isLanguageActive(languageCode);
  }
}
