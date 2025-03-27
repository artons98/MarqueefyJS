export class Marqueefy {
    constructor(selector, options = {}) {
      this.container = document.querySelector(selector);
      if (!this.container) {
        console.warn(`[Marqueefy] Element '${selector}' niet gevonden.`);
        return;
      }
  
      this.options = Object.assign(
        {
          speed: 0.5,
          pauseOnHover: true,
          minLoopWidth: window.innerWidth * 1.5,
          responsive: {
            default: 3,
            768: 2,
            480: 1
          }
        },
        options
      );
  
      this._init();
    }
  
    _getVisibleCount() {
      const width = window.innerWidth;
      const breakpoints = Object.keys(this.options.responsive)
        .filter(b => b !== 'default')
        .map(n => parseInt(n))
        .sort((a, b) => b - a);
  
      for (const bp of breakpoints) {
        if (width >= bp) {
          return this.options.responsive[bp];
        }
      }
  
      return this.options.responsive.default || 3;
    }
  
    _init() {
        this._insertStyles();
      this.container.classList.add("marqueefy-container");
  
      const originalItems = Array.from(this.container.children);
      const visibleCount = this._getVisibleCount();
      const itemMinWidth = Math.floor(window.innerWidth / visibleCount);
  
      // Meet individuele breedtes
      const tempWrapper = document.createElement("div");
      tempWrapper.style.visibility = "hidden";
      tempWrapper.style.position = "absolute";
      tempWrapper.style.whiteSpace = "nowrap";
      tempWrapper.style.display = "flex";
  
      originalItems.forEach(item => {
        const clone = item.cloneNode(true);
        clone.style.minWidth = itemMinWidth + 'px';
        tempWrapper.appendChild(clone);
      });
  
      document.body.appendChild(tempWrapper);
  
      const itemWidths = [...tempWrapper.children].map(el => el.offsetWidth);
      const minWidth = this.options.minLoopWidth;
      const finalItems = [];
  
      let currentWidth = 0;
      let i = 0;
  
      while (currentWidth < minWidth) {
        const original = originalItems[i % originalItems.length].cloneNode(true);
        original.style.minWidth = itemMinWidth + 'px';
        finalItems.push(original);
        currentWidth += itemWidths[i % itemWidths.length];
        i++;
      }
  
      document.body.removeChild(tempWrapper);
  
      const track = document.createElement("div");
      track.classList.add("marqueefy-track");
      finalItems.forEach(item => track.appendChild(item));
      this.container.innerHTML = "";
      this.container.appendChild(track);
  
      this.track = track;
      this.offset = 0;
      this.isPaused = false;
  
      if (this.options.pauseOnHover) {
        this.container.addEventListener("mouseenter", () => (this.isPaused = true));
        this.container.addEventListener("mouseleave", () => (this.isPaused = false));
      }
  
      requestAnimationFrame(() => this._animate());
    }
  
    _animate() {
      if (!this.isPaused) {
        this.offset -= this.options.speed;
        if (Math.abs(this.offset) >= this.track.scrollWidth / 2) {
          this.offset = 0;
        }
        this.track.style.transform = `translateX(${this.offset}px)`;
      }
  
      requestAnimationFrame(() => this._animate());
    }
    _insertStyles() {
        if (document.getElementById('marqueefy-styles')) return;
      
        const style = document.createElement('style');
        style.id = 'marqueefy-styles';
        style.textContent = `
          .marqueefy-container {
            overflow: hidden;
            position: relative;
            width: 100%;
            white-space: nowrap;
        }
        
        .marqueefy-track {
            display: flex;
            width: max-content;
            white-space: nowrap;
            will-change: transform;
        }
        
        .marqueefy-track > * {
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            flex-shrink: 0;
        }
        `;
        document.head.appendChild(style);
      }
  }