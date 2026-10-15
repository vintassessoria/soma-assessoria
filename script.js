(() => {
  const WHATSAPP = '5561985011819';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- menu ----------
  const nav = document.getElementById('nav');
  const menuBtn = nav.querySelector('.nav__menu');
  const menu = document.getElementById('menu');
  const setMenu = open => {
    menu.hidden = !open;
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open);
  };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', e => { if (!nav.contains(e.target)) setMenu(false); });

  // ---------- entrada dos blocos ----------
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.up').forEach(el => {
    if (!el.style.getPropertyValue('--i')) {
      const group = [...el.parentElement.children].filter(c => c.classList.contains('up'));
      el.style.setProperty('--d', `${Math.min(group.indexOf(el), 4) * 0.1}s`);
    }
    io.observe(el);
  });

  // card do showreel: levanta e vem para frente quando entra na tela (uma vez)
  const reelCard = document.querySelector('.reel-card');
  if (reelCard) {
    const standUp = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      reelCard.classList.add('is-up');
      standUp.disconnect();
    }, { threshold: 0.3, rootMargin: '0px 0px -12% 0px' });
    standUp.observe(reelCard);
  }

  // ---------- texto que acende palavra por palavra ----------
  const reveal = document.querySelector('[data-words]');
  const words = [];
  if (reveal) {
    const text = reveal.textContent.trim();
    reveal.setAttribute('aria-label', text);
    reveal.innerHTML = text.split(/\s+/).map(w => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
    words.push(...reveal.querySelectorAll('.w'));
  }

  // ---------- etapa ativa do processo ----------
  const steps = [...document.querySelectorAll('.step')];
  const stepsBox = document.querySelector('.steps');
  const isCarousel = el => el && el.scrollWidth > el.clientWidth + 4;

  // ---------- desfoque no pé da tela: borda ondulada (máscaras em canvas) ----------
  const bl = document.querySelector('.bl');
  if (bl) {
    const L = 480, A = 160, AMP = 0.12;
    const wave = x => { const u = 2 * Math.PI * x / L; return Math.sin(u) * 0.6 + Math.sin(2 * u + 1.7) * 0.28 + Math.sin(3 * u + 0.4) * 0.12; };
    const layers = [...bl.children];
    const ok = layers.every((layer, n) => {
      const cv = document.createElement('canvas');
      cv.width = L; cv.height = A;
      const cx = cv.getContext('2d');
      if (!cx) return false;
      const im = cx.createImageData(L, A), p = im.data;
      const s0 = n * 0.0875, s1 = (n + 1) * 0.0875;
      for (let x = 0; x < L; x++) {
        const d = wave(x) * AMP;
        for (let y = 0; y < A; y++) {
          const t = Math.min(1, Math.max(0, (y / A - s0 - d) / (s1 - s0)));
          const k = (y * L + x) * 4;
          p[k] = p[k + 1] = p[k + 2] = 255; p[k + 3] = t * 255 | 0;
        }
      }
      cx.putImageData(im, 0, 0);
      const s = layer.style;
      s.webkitMaskImage = s.maskImage = `url(${cv.toDataURL('image/png')})`;
      s.webkitMaskSize = s.maskSize = `${L}px 100%`;
      s.webkitMaskRepeat = s.maskRepeat = 'repeat-x';
      s.animationDelay = `${-n * 1.6}s`; // cada camada num tempo, senão ondulam juntas
      return true;
    });
    if (ok) bl.classList.add('onda');
  }

  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const vh = innerHeight;
    // a faixa só aparece depois que a pessoa começa a rolar (no topo ela cairia
    // sobre as logos do hero) e some perto do fim, para não desfocar o formulário
    if (bl) bl.style.setProperty('--vis', scrollY < 120 || document.documentElement.scrollHeight - scrollY - vh < 180 ? '0' : '1');
    if (words.length && !reduce) {
      const r = reveal.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < lit));
    }
    if (steps.length && !isCarousel(stepsBox)) {
      let best = steps[0], dist = Infinity;
      steps.forEach(s => {
        const r = s.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - vh * 0.5);
        if (d < dist) { dist = d; best = s; }
      });
      steps.forEach(s => s.classList.toggle('is-active', s === best));
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // ---------- carrosséis do celular: bolinhas de posição ----------
  [
    ['.bento', '.scard'],
    ['.demo__grid', '.clip'],
  ].forEach(([boxSel, itemSel]) => {
    const box = document.querySelector(boxSel);
    if (!box) return;
    const items = [...box.querySelectorAll(itemSel)];
    const dots = document.createElement('div');
    dots.className = 'dots';
    dots.setAttribute('aria-hidden', 'true');
    dots.innerHTML = items.map(() => '<button tabindex="-1"></button>').join('');
    box.after(dots);
    const btns = [...dots.children];
    const offset = item => item.getBoundingClientRect().left - box.getBoundingClientRect().left + box.scrollLeft - parseFloat(getComputedStyle(box).paddingLeft);
    const current = () => {
      let best = 0, dist = Infinity;
      items.forEach((it, i) => { const d = Math.abs(offset(it) - box.scrollLeft); if (d < dist) { dist = d; best = i; } });
      return box.scrollLeft + box.clientWidth >= box.scrollWidth - 4 ? items.length - 1 : best;
    };
    let raf = 0;
    const update = () => {
      raf = 0;
      if (!isCarousel(box)) return;
      const i = current();
      btns.forEach((b, k) => b.classList.toggle('on', k === i));
    };
    box.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener('resize', update);
    btns.forEach((b, k) => b.addEventListener('click', () => box.scrollTo({ left: offset(items[k]), behavior: 'smooth' })));
    update();
  });

  // ---------- vídeos de demonstração: carregam perto da tela, tocam só quando visíveis ----------
  const clips = [...document.querySelectorAll('.clip video')];
  const visible = new Set();
  let playerOpen = false;
  const syncClips = () => clips.forEach(v => {
    if (visible.has(v) && !playerOpen && !reduce) v.play().catch(() => {});
    else v.pause();
  });
  const loader = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const v = e.target;
    if (!v.src) { v.src = v.dataset.src; v.preload = 'auto'; }
    loader.unobserve(v);
  }), { rootMargin: '400px 0px' });
  const watcher = new IntersectionObserver(entries => {
    entries.forEach(e => (e.intersectionRatio >= 0.6 ? visible.add(e.target) : visible.delete(e.target)));
    syncClips();
  }, { threshold: [0, 0.6] });
  clips.forEach(v => { loader.observe(v); watcher.observe(v); });

  // ---------- carrossel da equipe ----------
  const teamTrack = document.querySelector('.team__track');
  document.querySelectorAll('.team__nav button').forEach(b => b.addEventListener('click', () => {
    const card = teamTrack.querySelector('.member');
    teamTrack.scrollBy({ left: Number(b.dataset.dir) * (card.offsetWidth + 14), behavior: 'smooth' });
  }));

  // ---------- player de vídeo ----------
  const player = document.getElementById('player');
  const pv = player.querySelector('video');
  const closePlayer = () => { pv.pause(); pv.removeAttribute('src'); pv.load(); player.hidden = true; playerOpen = false; syncClips(); };
  document.querySelectorAll('[data-video]').forEach(b => b.addEventListener('click', () => {
    playerOpen = true;
    syncClips();
    pv.src = b.dataset.video;
    player.hidden = false;
    pv.play().catch(() => {});
  }));
  player.querySelector('.player__close').addEventListener('click', closePlayer);
  player.addEventListener('click', e => { if (e.target === player) closePlayer(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!player.hidden) closePlayer();
    if (!menu.hidden) { setMenu(false); menuBtn.focus(); }
  });

  // ---------- perguntas: uma aberta por vez ----------
  const qas = document.querySelectorAll('.qa');
  qas.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) qas.forEach(o => { if (o !== d) o.open = false; });
  }));

  // ---------- formulário -> WhatsApp ----------
  const form = document.getElementById('form');
  const select = form.querySelector('select[name="plano"]');
  const error = form.querySelector('.form__error');
  document.querySelectorAll('[data-plan]').forEach(b => b.addEventListener('click', () => { select.value = b.dataset.plan; }));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const required = [...form.querySelectorAll('[required]')];
    required.forEach(f => f.setAttribute('aria-invalid', !f.value.trim()));
    const bad = required.find(f => !f.value.trim());
    error.hidden = !bad;
    if (bad) return bad.focus();

    const d = new FormData(form);
    const line = (label, key) => (d.get(key) || '').trim() ? `*${label}:* ${d.get(key).trim()}` : null;
    const text = [
      'Olá! Vim pelo site da SOMA Assessoria.',
      '',
      line('Nome', 'nome'),
      line('Empresa', 'empresa'),
      line('Instagram', 'instagram'),
      line('Pacote', 'plano'),
      line('Mensagem', 'msg'),
    ].filter(l => l !== null).join('\n');
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
  form.querySelectorAll('[required]').forEach(f => f.addEventListener('input', () => {
    f.removeAttribute('aria-invalid');
    if (!form.querySelector('[aria-invalid="true"]')) error.hidden = true;
  }));

  document.getElementById('year').textContent = new Date().getFullYear();
  // anos de mercado contados a partir da fundação, atualiza sozinho
  document.querySelectorAll('[data-since]').forEach(el => { el.textContent = new Date().getFullYear() - Number(el.dataset.since); });
})();
