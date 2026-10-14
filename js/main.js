const config = {
  phone: '5585900000000',
  fallbackMessage: 'Olá, vim pelo site e gostaria de falar com um advogado.'
};

document.documentElement.classList.add('js');

const buildWhatsappUrl = message => {
  return `https://wa.me/${config.phone}?text=${encodeURIComponent(message)}`;
};

const setupWhatsappLinks = () => {
  const links = document.querySelectorAll('[data-whatsapp]');

  links.forEach(link => {
    const message = link.dataset.message || config.fallbackMessage;

    link.href = buildWhatsappUrl(message);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
};

const setupHeader = () => {
  const header = document.getElementById('site-header');

  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
};

const setupMenu = () => {
  const root = document.documentElement;
  const header = document.getElementById('site-header');
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('site-nav');
  const desktopQuery = window.matchMedia('(min-width: 901px)');

  const setOpen = open => {
    header.classList.toggle('menu-open', open);
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  });

  desktopQuery.addEventListener('change', event => {
    if (event.matches) {
      setOpen(false);
    }
  });
};

const wrapWords = (node, counter) => {
  Array.from(node.childNodes).forEach(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      wrapWords(child, counter);
      return;
    }

    if (child.nodeType !== Node.TEXT_NODE) {
      return;
    }

    const fragment = document.createDocumentFragment();

    child.textContent.split(/(\s+)/).forEach(part => {
      if (!part) {
        return;
      }

      if (/^\s+$/.test(part)) {
        fragment.appendChild(document.createTextNode(' '));
        return;
      }

      const word = document.createElement('span');
      const inner = document.createElement('span');

      word.className = 'word';
      word.setAttribute('aria-hidden', 'true');
      inner.className = 'word-inner';
      inner.textContent = part;
      inner.style.setProperty('--word-index', counter.value);
      counter.value += 1;

      word.appendChild(inner);
      fragment.appendChild(word);
    });

    node.replaceChild(fragment, child);
  });
};

const splitHeadings = () => {
  document.querySelectorAll('[data-split]').forEach(heading => {
    heading.setAttribute('aria-label', heading.textContent.trim());
    wrapWords(heading, { value: 0 });
  });
};

const setupReveal = () => {
  const targets = document.querySelectorAll('[data-reveal], [data-split]');

  targets.forEach(target => {
    const step = Number(target.dataset.delay || 0);

    if (step) {
      target.style.setProperty('--reveal-delay', `${step * 110}ms`);
    }
  });

  if (!('IntersectionObserver' in window)) {
    targets.forEach(target => target.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

  targets.forEach(target => observer.observe(target));
};

const setupDock = () => {
  const dock = document.getElementById('dock');

  if (!dock) {
    return;
  }

  const items = Array.from(dock.querySelectorAll('.dock-item'));
  const panels = Array.from(document.querySelectorAll('.area-panel'));
  const compactQuery = window.matchMedia('(max-width: 600px)');
  const restingSpeed = 250;

  const getSettings = () => {
    return compactQuery.matches
      ? { maxScale: 1.55, spread: 90 }
      : { maxScale: 1.9, spread: 130 };
  };

  const activate = (item, shouldFocus) => {
    items.forEach(other => {
      const isActive = other === item;

      other.classList.toggle('is-active', isActive);
      other.setAttribute('aria-selected', String(isActive));
      other.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach(panel => {
      panel.classList.toggle('is-active', panel.dataset.area === item.dataset.area);
    });

    if (shouldFocus) {
      item.focus();
    }
  };

  const magnify = pointerX => {
    const settings = getSettings();

    items.forEach(item => {
      const rect = item.getBoundingClientRect();
      const distance = Math.abs(pointerX - (rect.left + rect.width / 2));
      const smooth = Math.pow(Math.max(0, 1 - distance / settings.spread), 0.6);

      item.style.setProperty('--scale', 1 + (settings.maxScale - 1) * smooth);
      item.style.setProperty('--transition-duration', '0ms');
    });
  };

  const reset = () => {
    items.forEach(item => {
      item.style.setProperty('--scale', 1);
      item.style.setProperty('--transition-duration', `${restingSpeed}ms`);
    });
  };

  dock.addEventListener('pointermove', event => magnify(event.clientX));
  dock.addEventListener('pointerleave', reset);
  dock.addEventListener('pointercancel', reset);

  dock.addEventListener('pointerup', event => {
    if (event.pointerType !== 'mouse') {
      reset();
    }
  });

  items.forEach(item => {
    item.addEventListener('click', () => activate(item, false));

    item.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') {
        activate(item, false);
      }
    });
  });

  dock.addEventListener('keydown', event => {
    const current = items.indexOf(document.activeElement);

    if (current < 0) {
      return;
    }

    const lastIndex = items.length - 1;
    let target = current;

    if (event.key === 'ArrowRight') {
      target = current === lastIndex ? 0 : current + 1;
    } else if (event.key === 'ArrowLeft') {
      target = current === 0 ? lastIndex : current - 1;
    } else if (event.key === 'Home') {
      target = 0;
    } else if (event.key === 'End') {
      target = lastIndex;
    } else {
      return;
    }

    event.preventDefault();
    activate(items[target], true);
  });
};

const setupFlipCards = () => {
  const cards = document.querySelectorAll('.flip-card');
  const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

  cards.forEach(card => {
    const toggle = () => {
      const flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', String(flipped));
    };

    card.addEventListener('click', () => {
      if (!hoverQuery.matches) {
        toggle();
      }
    });

    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });
  });
};

const setupCarousel = () => {
  const viewport = document.getElementById('carousel-viewport');

  if (!viewport) {
    return;
  }

  const track = document.getElementById('carousel-track');
  const slides = Array.from(track.children);
  const dotsWrap = document.getElementById('carousel-dots');
  const count = document.getElementById('carousel-count');
  const prev = document.getElementById('carousel-prev');
  const next = document.getElementById('carousel-next');
  const swipeDistance = 50;
  let index = 0;
  let startX = 0;
  let startY = 0;
  let tracking = false;

  const dots = slides.map((slide, position) => {
    const dot = document.createElement('button');

    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Ir para a situação ${position + 1}`);
    dotsWrap.appendChild(dot);

    return dot;
  });

  const goTo = target => {
    index = Math.min(Math.max(target, 0), slides.length - 1);
    track.style.transform = `translateX(${-index * 100}%)`;

    slides.forEach((slide, position) => {
      slide.inert = position !== index;
    });

    dots.forEach((dot, position) => {
      dot.classList.toggle('is-active', position === index);
    });

    count.textContent = `${index + 1} / ${slides.length}`;
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
  };

  dots.forEach((dot, position) => {
    dot.addEventListener('click', () => goTo(position));
  });

  prev.addEventListener('click', () => goTo(index - 1));
  next.addEventListener('click', () => goTo(index + 1));

  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      goTo(index - 1);
    } else if (event.key === 'ArrowRight') {
      goTo(index + 1);
    }
  });

  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    startX = event.clientX;
    startY = event.clientY;
    tracking = true;
  });

  viewport.addEventListener('pointerup', event => {
    if (!tracking) {
      return;
    }

    tracking = false;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (Math.abs(deltaX) > swipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
      goTo(index + (deltaX < 0 ? 1 : -1));
    }
  });

  viewport.addEventListener('pointercancel', () => {
    tracking = false;
  });

  goTo(0);
};

const setupContactForm = () => {
  const form = document.getElementById('contact-form');

  if (!form) {
    return;
  }

  const nameField = form.querySelector('#field-name');
  const areaField = form.querySelector('#field-area');
  const detailsField = form.querySelector('#field-details');
  const nameError = form.querySelector('#error-name');
  const areaError = form.querySelector('#error-area');

  const setError = (field, errorElement, message) => {
    errorElement.textContent = message;
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
  };

  nameField.addEventListener('input', () => setError(nameField, nameError, ''));
  areaField.addEventListener('change', () => setError(areaField, areaError, ''));

  form.addEventListener('submit', event => {
    event.preventDefault();

    const name = nameField.value.trim();
    const area = areaField.value;
    const details = detailsField.value.trim();
    const invalidFields = [];

    if (name.length < 2) {
      setError(nameField, nameError, 'Informe o seu nome para começarmos a conversa.');
      invalidFields.push(nameField);
    } else {
      setError(nameField, nameError, '');
    }

    if (!area) {
      setError(areaField, areaError, 'Escolha o assunto mais próximo do seu caso.');
      invalidFields.push(areaField);
    } else {
      setError(areaField, areaError, '');
    }

    if (invalidFields.length) {
      invalidFields[0].focus();
      return;
    }

    let message = `Olá, meu nome é ${name}. Gostaria de falar sobre: ${area}.`;

    if (details) {
      message += ` Resumo do caso: ${details}`;
    }

    window.open(buildWhatsappUrl(message), '_blank', 'noopener');
  });
};

const setupYear = () => {
  document.querySelectorAll('[data-year]').forEach(element => {
    element.textContent = new Date().getFullYear();
  });
};

setupWhatsappLinks();
setupHeader();
setupMenu();
splitHeadings();
setupReveal();
setupDock();
setupFlipCards();
setupCarousel();
setupContactForm();
setupYear();
