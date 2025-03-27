class Marqueefy {
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
        //   minLoopWidth: window.innerWidth * 1.5,
            minLoopWidth: this.container.width,
          responsive: {
            default: 1, 
                480: 2,
                768: 3, 
                1200: 4,
          },
          maxWidth: null,
          backgroundColor: null
        },
        options
      );
  
      this._originalItems = Array.from(this.container.children).map(el => el.cloneNode(true));
  
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
  
      if (this.options.maxWidth) {
        this.container.style.maxWidth = this.options.maxWidth;
        this.container.style.margin = "0 auto";
      }
  
      if (this.options.backgroundColor) {
        this.container.style.backgroundColor = this.options.backgroundColor;
      }
 
      const visibleCount = this._getVisibleCount();
      const itemMinWidth = Math.floor(window.innerWidth / visibleCount);
      
  
      const fullSetWidth = this._measureFullSetWidth(itemMinWidth);
  
      const finalItems = [];
      let currentWidth = 0;
  
      while (currentWidth < this.options.minLoopWidth) {
        this._originalItems.forEach(origEl => {
          const cloned = origEl.cloneNode(true);
          cloned.style.minWidth = itemMinWidth + "px";
          finalItems.push(cloned);
        });
        currentWidth += fullSetWidth;
      }

      const track = document.createElement("div");
      track.classList.add("marqueefy-track");
      finalItems.forEach(item => track.appendChild(item));
  
      this.container.innerHTML = "";
      this.container.appendChild(track);
  
      this.track = track;
      this.offset = 0;
      this.isPaused = false;
  
      this.firstGroupWidth = fullSetWidth;
  
      if (this.options.pauseOnHover) {
        this.container.addEventListener("mouseenter", () => (this.isPaused = true));
        this.container.addEventListener("mouseleave", () => (this.isPaused = false));
      }
  
      requestAnimationFrame(() => this._animate());
    }
  
    _measureFullSetWidth(itemMinWidth) {
      const tempContainer = document.createElement("div");
      tempContainer.style.visibility = "hidden";
      tempContainer.style.position = "absolute";
      tempContainer.style.whiteSpace = "nowrap";
      document.body.appendChild(tempContainer);
  
      let total = 0;
      this._originalItems.forEach(origEl => {
        const clone = origEl.cloneNode(true);
        clone.style.minWidth = itemMinWidth + "px";
        tempContainer.appendChild(clone);
      });
  
      const w = tempContainer.offsetWidth;
      document.body.removeChild(tempContainer);
      return w;
    }
  
    _animate() {
        if (!this.isPaused) {
          this.offset -= this.options.speed;
      
          const resetThreshold = this.firstGroupWidth + this.container.offsetWidth;
          if (Math.abs(this.offset) >= resetThreshold) {
            this.offset = 0;
          }
      
          this.track.style.transform = `translateX(${this.offset}px)`;
        }
        requestAnimationFrame(() => this._animate());
      }
  
    _insertStyles() {
      if (document.getElementById("marqueefy-styles")) return;
  
      const style = document.createElement("style");
      style.id = "marqueefy-styles";
      style.textContent = `
        .marqueefy-container {
          position: relative;
          width: 100%;
          overflow: hidden;
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
  
    reInit() {
      if (this.track) {
        this.track.remove();
      }
      this.offset = 0;
      this._init();
    }
  }
