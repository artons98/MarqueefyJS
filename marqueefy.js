class Marqueefy {
    constructor(selector, options = {}) {
      this.container =
        typeof selector === "string" ? document.querySelector(selector) : selector;
      if (!this.container) {
        console.warn(`[Marqueefy] Element '${selector}' niet gevonden.`);
        return;
      }

      this.options = Object.assign(
        {
          speed: 0.5,
          pauseOnHover: true,
          minLoopWidth: null, // null = 1.5x viewportbreedte, bepaald bij init
          responsive: {
            default: 1,
            480: 2,
            768: 3,
            1200: 4,
          },
          maxWidth: null,
          backgroundColor: null,
        },
        options
      );

      this._originalItems = Array.from(this.container.children).map(el => el.cloneNode(true));

      this.isPaused = false;
      if (this.options.pauseOnHover) {
        this.container.addEventListener("mouseenter", () => (this.isPaused = true));
        this.container.addEventListener("mouseleave", () => (this.isPaused = false));
      }

      // Herbereken bij resize: statisch <-> scrollend kan omslaan.
      this._onResize = () => {
        clearTimeout(this._resizeTimer);
        this._resizeTimer = setTimeout(() => this.reInit(), 150);
      };
      window.addEventListener("resize", this._onResize);

      // Webfonts veranderen de gemeten breedte; meet opnieuw zodra ze er zijn.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => this.reInit());
      }

      this._init();
    }

    _getVisibleCount() {
      const width = window.innerWidth;
      const breakpoints = Object.keys(this.options.responsive)
        .filter(b => b !== "default")
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

      // Past de hele set al in de container (of wil de gebruiker geen
      // beweging)? Dan statisch gecentreerd tonen in plaats van eindeloos
      // scrollen.
      const reducedMotion =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const naturalWidth = this._measureFullSetWidth(null);
      if (reducedMotion || naturalWidth <= this.container.clientWidth) {
        this._buildTrack(this._cloneSet(null), true);
        return;
      }

      const visibleCount = this._getVisibleCount();
      const itemMinWidth = Math.floor(window.innerWidth / visibleCount);
      const fullSetWidth = this._measureFullSetWidth(itemMinWidth);

      // Genoeg hele sets zodat de reset (na precies één set) naadloos is:
      // minstens één set méér dan wat er zichtbaar moet blijven.
      const minLoopWidth = this.options.minLoopWidth || window.innerWidth * 1.5;
      const targetWidth = Math.max(minLoopWidth, this.container.clientWidth) + fullSetWidth;

      const finalItems = [];
      let currentWidth = 0;
      while (currentWidth < targetWidth) {
        finalItems.push(...this._cloneSet(itemMinWidth));
        currentWidth += fullSetWidth;
      }

      this._buildTrack(finalItems, false);
      this.firstGroupWidth = fullSetWidth;
      this.offset = 0;

      this._raf = requestAnimationFrame(() => this._animate());
    }

    _cloneSet(itemMinWidth) {
      return this._originalItems.map(origEl => {
        const cloned = origEl.cloneNode(true);
        if (itemMinWidth) {
          cloned.style.minWidth = itemMinWidth + "px";
        }
        return cloned;
      });
    }

    _buildTrack(items, isStatic) {
      const track = document.createElement("div");
      track.classList.add("marqueefy-track");
      if (isStatic) {
        track.classList.add("marqueefy-track--static");
      }
      items.forEach(item => track.appendChild(item));

      this.container.innerHTML = "";
      this.container.appendChild(track);
      this.track = track;
    }

    _measureFullSetWidth(itemMinWidth) {
      const tempContainer = document.createElement("div");
      // Zelfde track-styling als de echte meting, anders telt de
      // item-padding niet mee in de breedte.
      tempContainer.classList.add("marqueefy-track");
      tempContainer.style.visibility = "hidden";
      tempContainer.style.position = "absolute";
      document.body.appendChild(tempContainer);

      this._cloneSet(itemMinWidth).forEach(clone => tempContainer.appendChild(clone));

      const w = tempContainer.offsetWidth;
      document.body.removeChild(tempContainer);
      return w;
    }

    _animate() {
      if (!this.isPaused) {
        this.offset -= this.options.speed;

        // Na precies één volledige set staat de track er identiek bij:
        // naadloze reset zonder zichtbare sprong.
        if (Math.abs(this.offset) >= this.firstGroupWidth) {
          this.offset += this.firstGroupWidth;
        }

        this.track.style.transform = `translateX(${this.offset}px)`;
      }
      this._raf = requestAnimationFrame(() => this._animate());
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
        .marqueefy-track--static {
          width: 100%;
          justify-content: center;
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
      cancelAnimationFrame(this._raf);
      this._init();
    }

    destroy() {
      cancelAnimationFrame(this._raf);
      window.removeEventListener("resize", this._onResize);
      clearTimeout(this._resizeTimer);
      this.container.classList.remove("marqueefy-container");
      this.container.innerHTML = "";
      this._originalItems.forEach(el => this.container.appendChild(el.cloneNode(true)));
    }
  }

  // Expliciet op window: class-declaraties zijn lexicaal en anders niet
  // bereikbaar vanuit module-code (bijv. React/Next).
  window.Marqueefy = Marqueefy;
