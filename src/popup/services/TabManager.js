/**
 * Manages tab switching and content visibility
 */
export class TabManager {
  constructor() {
    this.tabs = document.querySelectorAll('.tab-btn');
    this.contents = document.querySelectorAll('.tab-content');
    this.initializeTabListeners();
  }

  initializeTabListeners() {
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });
  }

  switchTab(tabId) {
    this.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    this.contents.forEach(content => {
      content.classList.toggle('active', content.id === tabId);
    });
  }
}
