/* Титаны-Драйва — Аренда (cinematic) · p2.js */
(function () {
  'use strict';
  var hasGSAP = typeof window.gsap !== 'undefined';
  if (!hasGSAP) document.documentElement.classList.add('no-gsap');

  /* ---- nav shrink ---- */
  var nav = document.getElementById('pnav');
  function onScroll(){ if(nav) nav.classList.toggle('scrolled', window.scrollY > 60); }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  /* ---- Card thumbs fill the whole card (cover). Booking photo keeps full-frame + blurred backdrop ---- */
  (function(){
    function bgUrl(el){ var s=el.style.backgroundImage||''; var m=s.match(/url\((.*?)\)/); if(!m) return null; return m[1].replace(/^['"]|['"]$/g,''); }
    document.querySelectorAll('.bcard__photo').forEach(function(box){
      var img=box.querySelector('img'); if(!img) return;
      var blur=document.createElement('div'); blur.className='bcard__blur'; blur.style.backgroundImage='url("'+img.getAttribute('src')+'")';
      box.insertBefore(blur, img);
    });
  })();

  /* ---- Lazy-load tour card backgrounds as they enter the viewport ---- */
  (function(){
    var els=[].slice.call(document.querySelectorAll('.lazy-bg[data-bg]'));
    if(!els.length) return;
    function load(el){
      var u=el.getAttribute('data-bg'); if(!u) return;
      el.removeAttribute('data-bg');
      var pre=new Image();
      pre.onload=pre.onerror=function(){ el.style.backgroundImage='url("'+u+'")'; el.classList.add('is-loaded'); };
      pre.src=u;
    }
    if(!('IntersectionObserver' in window)){ els.forEach(load); return; }
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ load(e.target); io.unobserve(e.target); } });
    }, { rootMargin:'300px 0px' });
    els.forEach(function(el){ io.observe(el); });
  })();

  /* ---- Lenis smooth scroll ---- */
  var lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ lerp:0.1, smoothWheel:true });
    if (hasGSAP && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      // Drive Lenis from GSAP's ticker so smooth-scroll and scrub animations
      // share ONE clock. A separate rAF loop desyncs them by a frame, which is
      // what made the page jerk/stutter while scrolling.
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ---- anchor links via Lenis ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var tgt = document.querySelector(id);
      if (!tgt) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(tgt, { offset:-70 });
      else tgt.scrollIntoView({ behavior:'smooth' });
    });
  });

  /* ---- GSAP animations ---- */
  if (hasGSAP && window.ScrollTrigger) {
    gsap.registerPlugin(window.ScrollTrigger);

    // hero photo: subtle cinematic zoom on load (stays covering, no edge reveal)
    gsap.from('.phero__bg', { scale:1.08, duration:1.6, ease:'power2.out' });

    // generic reveals
    gsap.utils.toArray('[data-reveal]').forEach(function (el) {
      gsap.from(el, { y:44, opacity:0, duration:1, ease:'power3.out',
        scrollTrigger:{ trigger:el, start:'top 86%' } });
    });

    // parallax layers (.ph inside media)
    gsap.utils.toArray('[data-parallax]').forEach(function (el) {
      var sp = parseFloat(el.getAttribute('data-parallax')) || 12;
      gsap.fromTo(el, { yPercent:-sp }, { yPercent:sp, ease:'none',
        scrollTrigger:{ trigger: el.closest('.fleet__media,.tour__media,.pgal__item,.about') || el, start:'top bottom', end:'bottom top', scrub:true } });
    });

    // about words highlight on scroll
    var about = document.querySelector('.about__text');
    if (about) gsap.from(about, { opacity:.15, duration:1.2, ease:'power2.out', scrollTrigger:{ trigger:about, start:'top 80%' } });
  }

  /* ---- Gallery lightbox ---- */
  var lb = document.getElementById('plb');
  var lbImg = lb ? lb.querySelector('.plb__img') : null;
  document.querySelectorAll('[data-full]').forEach(function (item) {
    item.addEventListener('click', function () {
      if (!lb) return;
      lbImg.style.backgroundImage = 'url("' + item.getAttribute('data-full') + '")';
      lb.classList.add('open');
      if (lenis) lenis.stop();
    });
  });
  function closeLb(){ if(!lb) return; lb.classList.remove('open'); if(lenis) lenis.start(); }
  if (lb) {
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('plb__close')) closeLb(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
  }

  /* ---- Booking: live preview + channel + submit ---- */
  var form = document.getElementById('bform');
  if (form) {
    var chan = 'tg';
    var links = { tg:'https://t.me/TitansDrive', vk:'https://vk.com/club221913025', max:'https://t.me/TitansDrive' };
    var labels = { tg:'Telegram', vk:'VK', max:'MAX' };

    function setPrev(key, val) {
      var el = form.parentNode.parentNode.querySelector('[data-prev="' + key + '"]');
      if (!el) el = document.querySelector('[data-prev="' + key + '"]');
      if (!el) return;
      if (val && val.trim()) { el.textContent = val; el.classList.remove('empty'); }
      else { el.textContent = '—'; el.classList.add('empty'); }
    }
    function sync() {
      setPrev('name', form.name.value);
      setPrev('phone', form.phone.value);
      var d = form.date.value, t = form.time.value;
      setPrev('datetime', (d || t) ? ((d||'') + (t ? ' · ' + t : '')) : '');
      setPrev('type', form.type.value);
      setPrev('comment', form.comment.value);
    }
    form.addEventListener('input', sync);
    form.addEventListener('change', sync);

    document.querySelectorAll('.bchan').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.bchan').forEach(function (x){ x.classList.remove('active'); });
        b.classList.add('active');
        chan = b.getAttribute('data-chan');
        var sub = form.querySelector('.bsubmit');
        if (sub) sub.textContent = '🏍 Отправить в ' + labels[chan];
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var hint = document.getElementById('bhint');
      if (!form.name.value.trim() || !form.phone.value.trim()) {
        if (hint) hint.textContent = 'Укажите имя и телефон — остальное по желанию.';
        return;
      }
      var msg = 'Заявка на заезд — Титаны-Драйва%0A' +
        'Имя: ' + enc(form.name.value) + '%0A' +
        'Телефон: ' + enc(form.phone.value) + '%0A' +
        'Дата/время: ' + enc((form.date.value||'—') + ' ' + (form.time.value||'')) + '%0A' +
        'Что интересует: ' + enc(form.type.value||'—') + '%0A' +
        'Комментарий: ' + enc(form.comment.value||'—');
      // try to copy summary for convenience
      try { navigator.clipboard && navigator.clipboard.writeText(decodeURIComponent(msg)); } catch (er) {}
      window.open(links[chan] || links.tg, '_blank');
      if (hint) hint.textContent = 'Открыли ' + labels[chan] + '. Текст заявки скопирован — вставьте и отправьте.';
    });
    function enc(s){ return encodeURIComponent(s); }
  }

  /* ---- Tours: подробнее + модалка с галереей ---- */
  var TOURS = {
    'Свободный заезд': { photos:['img/tours/svoboda-1.webp','img/tours/svoboda-2.webp','img/tours/svoboda-3.webp'], eyebrow:'Без гида · свободный формат', meta:[['Формат','Свободный'],['Время','от 1 часа'],['Уровень','Любой'],['Цена','от 1 500 ₽/час']], desc:'Берёшь мотоцикл или квадроцикл и катаешься сам по подготовленной территории — без гида, в своём темпе. Идеально, чтобы почувствовать технику, потренироваться в управлении и получить порцию адреналина.', feats:['Подготовленная и безопасная территория','Полная экипировка входит в стоимость','Короткий инструктаж для новичков','Можно продлевать время по ходу заезда','Фото и видео на память — по желанию'] },
    'Петра Гронского + Малые Гроны': { photos:['img/tours/petra-1.webp','img/tours/petra-2.webp','img/tours/petra-3.webp','img/tours/petra-4.webp','img/tours/petra-5.webp','img/tours/petra-6.webp','img/tours/petra-7.webp'], eyebrow:'Тур с гидом', meta:[['Время','4–5 часов'],['Дистанция','~60 км'],['Уровень','Начальный+'],['Цена','9 000 ₽']], desc:'Классический уральский маршрут к скалам Петра Гронского и урочищу Малые Гроны. Лесные грунтовки, хвойный воздух и открыточные виды с вершин — отличный первый тур.', feats:['Сопровождение опытного гида','Остановка и фотосессия на скалах','Лесные грунтовки без экстрима','Экипировка и топливо включены','Подходит новичкам после инструктажа'] },
    'Чёртово Городище + Малые Черти': { photos:['img/tours/gorodishe-1.webp','img/tours/gorodishe-2.webp','img/tours/gorodishe-3.webp','img/tours/gorodishe-4.webp','img/tours/gorodishe-5.webp','img/tours/gorodishe-6.webp'], eyebrow:'Тур с гидом', meta:[['Время','5–6 часов'],['Дистанция','~75 км'],['Уровень','Средний'],['Цена','8 000 ₽']], desc:'Легендарные скалы Чёртово Городище и извилистые тропы Малых Чертей. Маршрут с характером: техничные участки, подъёмы и живописные каменные гряды на вершине.', feats:['Подъём к знаменитым скалам-останцам','Техничные лесные тропы','Гид и замыкающий на маршруте','Привал с перекусом','Драйв для уверенных райдеров'] },
    'Обучение': { photos:['img/tours/pesok-1.webp','img/tours/pesok-2.webp','img/tours/pitbike-1.webp','img/tours/pitbike-2.webp','img/tours/kvadro2-1.webp','img/tours/pesok-3.webp'], eyebrow:'Обучение с нуля', meta:[['Формат','Индивидуально'],['Время','1–2 часа'],['Уровень','С нуля'],['Цена','4 000 ₽']], desc:'Научим уверенно управлять мотоциклом с полного нуля — даже если ты ни разу не садился за руль. Начинаем с азов: посадка, газ, сцепление, трогание с места, повороты и торможение. Дальше — уверенные заезды по площадке и лёгкому бездорожью. Инструктор рядом на каждом этапе.', feats:['Обучение с полного нуля, без опыта','Индивидуально с инструктором','Мотоцикл и экипировка включены','От основ управления до первых заездов','Спокойный темп на безопасной площадке','Подходит взрослым и подросткам'] },
    'Берёзовские пески': { photos:['img/tours/berez-1.webp',{src:'img/tours/berez-2.webp',pos:'50% 68%'},{src:'img/tours/berez-3.webp',pos:'50% 68%'}], eyebrow:'Тур с гидом', meta:[['Время','3–4 часа'],['Дистанция','~40 км'],['Уровень','Любой'],['Цена','6 000 ₽']], desc:'Просторные песчаные карьеры Берёзовского — раздолье для газа, прыжков и дрифта. Много открытого пространства и рельефа под любой уровень катания.', feats:['Огромные открытые пространства','Рельеф под любой уровень','Прыжки и дрифт по песку','Сопровождение гида','Фото/видео на память'] },
    'Автобус': { photos:['img/tours/aduy-1.webp','img/tours/zabkar-1.webp','img/tours/staropyshminsk-1.webp','img/tours/maloe-1.webp','img/tours/aduy-2.webp','img/tours/zabkar-2.webp'], eyebrow:'Короткая покатушка', meta:[['Время','1.5–2 часа'],['Дистанция','~18 км'],['Уровень','Любой'],['Цена','3 500 ₽']], desc:'Короткая, но зрелищная покатушка к заброшенному автобусу в лесу — необычная локация и атмосферные кадры. Отличный вариант, когда времени мало, а драйва хочется.', feats:['Быстрый выезд, немного времени','Атмосферная заброшенная локация','Классные кадры для соцсетей','Простая лесная дорога','Подходит новичкам'] },
    'Голубой карьер': { photos:['img/tours/goluboy-1.webp','img/tours/goluboy-2.webp','img/tours/goluboy-3.webp'], eyebrow:'Тур с гидом', meta:[['Время','4–5 часов'],['Дистанция','~55 км'],['Уровень','Средний'],['Цена','5 500 ₽']], desc:'Бирюзовая вода затопленного карьера и грунтовые серпантины вокруг него. Один из самых фотогеничных маршрутов — виды, от которых захватывает дух.', feats:['Виды на бирюзовый карьер','Грунтовые серпантины','Остановка для фото и купания летом','Сопровождение гида','Экипировка и топливо включены'] },
    '7 Братьев + озеро Таватуй': { photos:['img/tours/tavatuy-1.webp','img/tours/tavatuy-2.webp','img/tours/tavatuy-3.webp','img/tours/tavatuy-4.webp','img/tours/tavatuy-5.webp','img/tours/tavatuy-6.webp'], eyebrow:'Тур на весь день', meta:[['Время','8–9 часов'],['Дистанция','~140 км'],['Уровень','Средний+'],['Цена','14 000 ₽']], desc:'Большое приключение на целый день: скалы Семь Братьев и живописное озеро Таватуй. Много километров, смена ландшафтов и настоящий вкус дальнего мототура.', feats:['Целый день в седле','Скалы Семь Братьев и озеро Таватуй','Обед-привал на маршруте','Гид и техподдержка','Для тех, кто хочет дистанцию'] },
    'Заброшенный карьер + Тропа Тролля': { photos:['img/tours/zabkar-1.webp','img/tours/zabkar-2.webp','img/tours/zabkar-3.webp'], eyebrow:'Техничный офф-роуд', meta:[['Время','5–6 часов'],['Дистанция','~70 км'],['Уровень','Продвинутый'],['Цена','4 500 ₽']], desc:'Техничный офф-роуд: заброшенный карьер и знаменитая Тропа Тролля с крутыми участками и перепадами высот. Маршрут для тех, кто уже уверенно управляет мотоциклом.', feats:['Техничные участки и перепады высот','Знаменитая Тропа Тролля','Настоящий хардэндуро-вкус','Гид, который знает каждый поворот','Только для подготовленных райдеров'] },
    'Комбо: Петра Гронского + Чёртово Городище': { photos:['img/tours/petra-1.webp','img/tours/petra-2.webp','img/tours/petra-3.webp','img/tours/gorodishe-1.webp','img/tours/gorodishe-2.webp','img/tours/gorodishe-3.webp'], eyebrow:'Комбо-тур на весь день', meta:[['Время','7–8 часов'],['Дистанция','~120 км'],['Уровень','Средний'],['Цена','10 500 ₽']], desc:'Два топовых направления в одном большом маршруте: Петра Гронского и Чёртово Городище за один день. Максимум видов, скал и километров для насыщенного заезда.', feats:['Два культовых места за день','Максимум видов и локаций','Привал с перекусом','Сопровождение гида','Оптимально по цене за такой объём'] },
    'Квадроциклы 4×4': { photos:['img/tours/kvadro-1.webp','img/tours/kvadro-2.webp','img/tours/kvadro-3.webp'], eyebrow:'Аренда · полный привод', meta:[['Формат','Аренда'],['Время','от 1 часа'],['Привод','4×4'],['Цена','от 2 000 ₽/час']], desc:'Мощные полноприводные квадроциклы 4×4 для уверенного покорения бездорожья: грязь, подъёмы, броды — квадрик вывезет там, где сложно. Отличный вариант для тех, кто хочет драйва без опыта управления мотоциклом.', feats:['Полный привод 4×4 для любого бездорожья','Просто освоить — справится новичок','Экипировка входит в стоимость','Короткий инструктаж перед стартом','Можно вдвоём — водитель и пассажир'] },
    'Старопышминск': { photos:['img/tours/staropyshminsk-1.webp','img/tours/staropyshminsk-2.webp'], eyebrow:'Тур с гидом · тест на прочность', meta:[['Время','4–5 часов'],['Дистанция','~50 км'],['Уровень','Средний+'],['Цена','5 000 ₽']], desc:'Маршрут вокруг Старопышминска — настоящий тест райдера на прочность. Крутые подъёмы, техничные спуски и разнообразный рельеф, который проверит и тебя, и технику. Драйв для тех, кто хочет челлендж.', feats:['Техничный рельеф и перепады высот','Настоящий тест выносливости','Сопровождение опытного гида','Экипировка и топливо включены','Для уверенных райдеров'] },
    'Малое Чёртово Городище': { photos:['img/tours/maloe-1.webp','img/tours/maloe-2.webp','img/tours/maloe-3.webp','img/tours/maloe-4.webp'], eyebrow:'Тур с гидом', meta:[['Время','4–5 часов'],['Дистанция','~55 км'],['Уровень','Средний'],['Цена','6 500 ₽']], desc:'Компактная, но насыщенная версия маршрута к скалам-останцам: лесные тропы, каменные гряды и живописные виды. Отличный тур средней сложности с яркими локациями.', feats:['Скалы-останцы и каменные гряды','Живописные лесные тропы','Сопровождение гида','Привал с перекусом','Подходит после инструктажа'] },
    'Мотоциклы для соревнований': { photos:['img/tours/sorevnovaniya-1.webp','img/tours/sorevnovaniya-2.webp','img/tours/sorevnovaniya-3.webp','img/tours/sorevnovaniya-4.webp'], eyebrow:'Спорт · аренда под старт', meta:[['Формат','Аренда под старт'],['Класс','Эндуро'],['Подготовка','Спортивная'],['Цена','по запросу']], desc:'Готовы предоставить подготовленный мотоцикл для участия в эндуро-соревнованиях. Обслуженная и настроенная техника, готовая к нагрузкам старта — тебе остаётся только показать результат. Класс мотоцикла и условия подберём под конкретный этап.', feats:['Спортивно подготовленные эндуро-мотоциклы','Техника обслужена и настроена к старту','Подбор под класс и регламент соревнований','Возможна помощь в сервисе на этапе','Условия аренды — индивидуально'] },
    'Песочница': { photos:['img/tours/pesok-1.webp','img/tours/pesok-2.webp','img/tours/pesok-3.webp',{src:'img/tours/pesok-4.webp',pos:'50% 0%'},'img/tours/pesok-5.webp','img/tours/pesok-6.webp'], eyebrow:'Покатушка · тренировка', meta:[['Формат','Свободный'],['Время','от 1 часа'],['Уровень','С нуля'],['Цена','4 000 ₽']], desc:'Идеальная площадка, чтобы почувствовать технику на мягком грунте: песчаная зона без препятствий, где можно спокойно отработать газ, повороты и торможение. Отличный старт перед выездом на настоящий маршрут.', feats:['Мягкий грунт — падать не страшно','Отработка базовых навыков управления','Экипировка входит в стоимость','Инструктаж для новичков','Подходит взрослым и детям'] },
    'Каменный цветок': { photos:['img/tours/kamenny-1.webp','img/tours/kamenny-2.webp',{src:'img/tours/kamenny-3.webp',pos:'50% 0%'},'img/tours/kamenny-4.webp','img/tours/kamenny-5.webp',{src:'img/tours/kamenny-6.webp',pos:'50% 100%'}], eyebrow:'Тур с гидом', meta:[['Время','5–6 часов'],['Дистанция','~70 км'],['Уровень','Средний'],['Цена','7 000 ₽']], desc:'Живописный маршрут к скалам Каменный цветок: лесные грунтовки, каменные останцы и панорамные виды. Красивый и разнообразный тур, который зайдёт и новичкам после инструктажа, и опытным райдерам.', feats:['Скалы-останцы и панорамные виды','Разнообразные лесные грунтовки','Сопровождение гида','Привал с перекусом','Экипировка и топливо включены'] },
    'Заброшенный аэродром Адуй': { photos:['img/tours/aduy-1.webp','img/tours/aduy-2.webp','img/tours/aduy-3.webp','img/tours/aduy-4.webp','img/tours/aduy-5.webp','img/tours/aduy-6.webp'], eyebrow:'Простор · открытый офф-роуд', meta:[['Время','4–5 часов'],['Дистанция','~60 км'],['Уровень','Любой'],['Цена','5 500 ₽']], desc:'Огромный заброшенный аэродром Адуй — бетонные полосы и открытые поля, где можно разогнаться, отработать управление и накататься без ограничений. Простор для драйва под любой уровень.', feats:['Огромные открытые пространства','Разгон и отработка навыков','Подходит и новичкам, и опытным','Сопровождение гида','Отличные кадры для соцсетей'] },
    'Соколиный камень': { photos:['img/tours/sokol-1.webp','img/tours/sokol-2.webp','img/tours/sokol-3.webp'], eyebrow:'Тур с гидом', meta:[['Время','4–5 часов'],['Дистанция','~55 км'],['Уровень','Начальный+'],['Цена','6 000 ₽']], desc:'Популярный маршрут к Соколиному камню через сосновый лес. Приятные грунтовки, скальный выход с видом на тайгу и атмосфера настоящего Урала. Отличный тур для первого знакомства с эндуро.', feats:['Скальный выход с видом на тайгу','Сосновый лес и мягкие грунтовки','Сопровождение гида','Подходит новичкам после инструктажа','Экипировка и топливо включены'] },
    'Аренда дорожных мотоциклов': { photos:['img/tours/doroga-1.webp','img/tours/doroga-2.webp','img/tours/doroga-3.webp'], eyebrow:'Аренда · дорожный круизёр', meta:[['Мотоцикл','Honda Steed 400'],['Класс','Круизёр'],['Формат','Аренда'],['Цена','от 2 500 ₽/час']], desc:'Дорожный круизёр Honda Steed 400 в аренду — для спокойных прогулок по городу и трассе в классическом круизёрном стиле. Низкая посадка, ровная тяга и комфорт на каждый день. Нужны права категории A.', feats:['Классический круизёр Honda Steed 400','Комфортная низкая посадка','Для города и трассы','Экипировка по запросу','Требуются права категории A'] },
    'Квадроцикл 200-250 (задний привод)': { photos:['img/tours/kvadro2-1.webp','img/tours/kvadro2-2.webp','img/tours/kvadro2-3.webp'], eyebrow:'Аренда · задний привод', meta:[['Формат','Аренда'],['Двигатель','200–250 см³'],['Привод','Задний'],['Цена','от 1 800 ₽/час']], desc:'Лёгкий и манёвренный квадроцикл 200–250 см³ с задним приводом — идеальный вариант для первого знакомства с техникой и весёлых покатушек по грунтовкам. Простой в управлении и дружелюбный к новичкам.', feats:['Задний привод, 200–250 см³','Лёгкий и манёвренный','Прост в освоении для новичков','Экипировка входит в стоимость','Короткий инструктаж перед стартом'] },
    'Красноуфимск: Тёплая пещера и Марьин Утёс': { photos:['img/tours/krasnouf-1.webp','img/tours/krasnouf-2.webp','img/tours/krasnouf-3.webp','img/tours/krasnouf-4.webp','img/tours/krasnouf-5.webp','img/tours/krasnouf-6.webp'], eyebrow:'Тур на весь день', meta:[['Время','Целый день'],['Дистанция','~150 км'],['Уровень','Средний+'],['Цена','13 000 ₽']], desc:'Большое путешествие в Красноуфимск: загадочная Тёплая пещера и величественный Марьин Утёс над рекой. Смена ландшафтов, длинные перегоны и открытки-виды — настоящий дальний мототур для тех, кто хочет масштаба.', feats:['Тёплая пещера и Марьин Утёс','Целый день в седле','Обед-привал на маршруте','Гид и техподдержка','Смена ландшафтов и яркие виды'] },
    'Аренда питбайков': { photos:['img/tours/pitbike-1.webp',{src:'img/tours/pitbike-2.webp',pos:'50% 0%'},{src:'img/tours/pitbike-3.webp',pos:'50% 25%'},{src:'img/tours/pitbike-4.webp',pos:'30% 50%'}], eyebrow:'Аренда · питбайки', meta:[['Формат','Аренда'],['Техника','Питбайк'],['Уровень','Любой'],['Цена','от 1 200 ₽/час']], desc:'Компактные и лёгкие питбайки в аренду — максимум веселья на площадке и лёгком бездорожье. Идеально, чтобы попробовать себя в управлении и научиться базе — подходит и детям, и взрослым.', feats:['Лёгкие и манёвренные питбайки','Подходят детям и взрослым','Отличны для обучения базе','Экипировка входит в стоимость','Короткий инструктаж перед стартом'] }
  };

  var modal = document.getElementById('tmodal');
  if (modal) {
    var track = document.getElementById('tgalTrack');
    var curEl = document.getElementById('tgalCur');
    var totEl = document.getElementById('tgalTotal');
    var dotsEl = document.getElementById('tgalDots');
    var idx = 0, total = 0;
    var grads = ['#1a1a20','#201a1c','#181c20','#1c1a20','#201d18','#1a201c','#181a1e'];

    function render(){
      if (track) track.style.transform = 'translateX(' + (-idx*100) + '%)';
      if (curEl) curEl.textContent = (idx+1);
      if (dotsEl) Array.prototype.forEach.call(dotsEl.children, function(d,i){ d.classList.toggle('active', i===idx); });
    }
    function go(n){ if(total<1) return; idx = (n%total+total)%total; render(); }

    function buildSlides(t){
      var photos = (t.photos && t.photos.length) ? t.photos : null;
      total = photos ? photos.length : 6;
      var html = '';
      for (var i=0;i<total;i++){
        if (photos){
          var _p = photos[i]; var _src = (typeof _p === 'string') ? _p : _p.src; var _pos = (typeof _p !== 'string' && _p.pos) ? (';background-position:' + _p.pos) : '';
          html += '<div class="tgal__slide" data-full="' + _src + '"><div class="tgal__bg" style="background-image:url(\'' + _src + '\')"></div><div class="tgal__fg" style="background-image:url(\'' + _src + '\')' + _pos + '"></div></div>';
        } else {
          html += '<div class="tgal__slide tgal__slide--ph" style="background:radial-gradient(130% 130% at 50% 0%, ' + grads[i%grads.length] + ', #0b0b0d)"><div class="tgal__phinner"><span class="tgal__phicon">\uD83D\uDCF7</span><span class="tgal__phlabel">\u0424\u043E\u0442\u043E ' + (i+1) + ' / ' + total + '</span><span class="tgal__phsub">\u0417\u0430\u0433\u043B\u0443\u0448\u043A\u0430 \u2014 \u0437\u0430\u043C\u0435\u043D\u0438\u043C \u043D\u0430 \u0432\u0430\u0448\u0438 \u0444\u043E\u0442\u043E</span></div></div>';
        }
      }
      if (track) track.innerHTML = html;
      if (totEl) totEl.textContent = total;
      if (dotsEl){
        var d='';
        for (var j=0;j<total;j++){ d += '<button class="tgal__dot" type="button" data-i="'+j+'" aria-label="\u0424\u043E\u0442\u043E '+(j+1)+'"></button>'; }
        dotsEl.innerHTML = d;
        Array.prototype.forEach.call(dotsEl.children, function(dot){ dot.addEventListener('click', function(e){ e.stopPropagation(); go(parseInt(dot.getAttribute('data-i'),10)); }); });
      }
      if (track) Array.prototype.forEach.call(track.children, function(sl){ sl.addEventListener('click', function(){ openZoom(sl); }); });
      idx=0; render();
    }

    function openTour(name){
      var t = TOURS[name] || {};
      var card = null;
      document.querySelectorAll('.tours__grid .tour').forEach(function(c){ var n=c.querySelector('.tour__name'); if(n && n.textContent.trim()===name) card=c; });
      var titleEl=document.getElementById('tmTitle'); if(titleEl) titleEl.textContent = name;
      var eyeEl=document.getElementById('tmEyebrow'); if(eyeEl) eyeEl.textContent = t.eyebrow || '\u041C\u0430\u0440\u0448\u0440\u0443\u0442';
      var descText = t.desc || (card && card.querySelector('.tour__desc') ? card.querySelector('.tour__desc').textContent : '');
      var descEl=document.getElementById('tmDesc'); if(descEl) descEl.textContent = descText;
      var meta = t.meta || [];
      var mh=''; meta.forEach(function(m){ mh += '<div class="tmodal__chip"><span class="k">'+m[0]+'</span><span class="v">'+m[1]+'</span></div>'; });
      var metaEl=document.getElementById('tmMeta'); if(metaEl) metaEl.innerHTML = mh;
      var feats = t.feats || [];
      var fh=''; feats.forEach(function(f){ fh += '<li>'+f+'</li>'; });
      var featsEl=document.getElementById('tmFeats'); if(featsEl) featsEl.innerHTML = fh;
      var subh=modal.querySelector('.tmodal__subh'); if(subh) subh.style.display = feats.length ? '' : 'none';
      buildSlides(t);
      modal.classList.add('open');
      modal.setAttribute('aria-hidden','false');
      document.body.classList.add('tmodal-open');
      if (lenis) lenis.stop();
    }
    function closeTour(){ closeZoom(); modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.classList.remove('tmodal-open'); if(lenis) lenis.start(); }

    // Fullscreen photo zoom inside the modal (tap a slide to expand, Back to return)
    var zoom=document.getElementById('tzoom'), zoomImg=document.getElementById('tzoomImg'), zoomBack=document.getElementById('tzoomBack');
    var zoomPrev=document.getElementById('tzoomPrev'), zoomNext=document.getElementById('tzoomNext');
    var zoomIdx=0;
    function showZoom(i){
      if(!zoom||!zoomImg||!track) return;
      var slides=track.children; if(!slides.length) return;
      zoomIdx=(i%slides.length+slides.length)%slides.length;
      var sl=slides[zoomIdx];
      idx=zoomIdx; render();
      if(sl.classList.contains('tgal__slide--ph')){
        zoomImg.classList.add('tzoom__img--ph'); zoomImg.style.backgroundImage=''; zoomImg.innerHTML=sl.innerHTML;
      } else {
        zoomImg.classList.remove('tzoom__img--ph'); zoomImg.innerHTML=''; zoomImg.style.backgroundImage='url("'+(sl.getAttribute('data-full')||'')+'")';
      }
    }
    function openZoom(sl){
      if(!zoom||!zoomImg||!sl||!track) return;
      var i=Array.prototype.indexOf.call(track.children, sl); if(i<0) i=0;
      showZoom(i);
      zoom.classList.add('open'); zoom.setAttribute('aria-hidden','false');
    }
    function closeZoom(){ if(!zoom) return; zoom.classList.remove('open'); zoom.setAttribute('aria-hidden','true'); }
    if(zoomBack) zoomBack.addEventListener('click', function(e){ e.stopPropagation(); closeZoom(); });
    if(zoomPrev) zoomPrev.addEventListener('click', function(e){ e.stopPropagation(); showZoom(zoomIdx-1); });
    if(zoomNext) zoomNext.addEventListener('click', function(e){ e.stopPropagation(); showZoom(zoomIdx+1); });

    var pv=document.getElementById('tgalPrev'), nx=document.getElementById('tgalNext');
    if(pv) pv.addEventListener('click', function(e){ e.stopPropagation(); go(idx-1); });
    if(nx) nx.addEventListener('click', function(e){ e.stopPropagation(); go(idx+1); });
    modal.addEventListener('click', function(e){ if(e.target.closest('[data-close]')) closeTour(); });
    var cta=modal.querySelector('.tmodal__cta'); if(cta) cta.addEventListener('click', function(){ closeTour(); });
    document.addEventListener('keydown', function(e){
      if(!modal.classList.contains('open')) return;
      var zoomOpen = zoom && zoom.classList.contains('open');
      if(e.key==='Escape'){ if(zoomOpen) closeZoom(); else closeTour(); }
      else if(e.key==='ArrowLeft'){ if(zoomOpen) showZoom(zoomIdx-1); else go(idx-1); }
      else if(e.key==='ArrowRight'){ if(zoomOpen) showZoom(zoomIdx+1); else go(idx+1); }
    });

    document.querySelectorAll('.tours__grid .tour').forEach(function(card){
      var body = card.querySelector('.tour__body');
      var nameEl = card.querySelector('.tour__name');
      if(!body || !nameEl) return;
      var name = nameEl.textContent.trim();
      var zap = body.querySelector('.tour__btn');
      var btns = document.createElement('div'); btns.className='tour__btns';
      var more = document.createElement('button'); more.type='button'; more.className='tour__more'; more.innerHTML='\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435 <span>&rarr;</span>';
      if(zap){ body.insertBefore(btns, zap); btns.appendChild(more); btns.appendChild(zap); }
      else { body.appendChild(btns); btns.appendChild(more); }
      card.classList.add('tour--interactive');
      more.addEventListener('click', function(e){ e.stopPropagation(); openTour(name); });
      card.addEventListener('click', function(e){ if(e.target.closest('.tour__btn')) return; openTour(name); });
    });

    window.__openTour = openTour;
  }

  /* ---- Custom red dropdowns + calendar ---- */
  (function(){
    var bf=document.getElementById('bform'); if(!bf) return;
    function fire(el,t){ var ev; try{ev=new Event(t,{bubbles:true});}catch(e){ev=document.createEvent('Event');ev.initEvent(t,true,true);} el.dispatchEvent(ev); }
    var closers=[]; function closeAll(ex){ for(var i=0;i<closers.length;i++) closers[i](ex); }
    function enhance(sel){
      var wrap=document.createElement('div'); wrap.className='csel'+(sel.name==='time'?' csel--time':'');
      sel.parentNode.insertBefore(wrap,sel); wrap.appendChild(sel); sel.classList.add('csel__native'); sel.tabIndex=-1;
      var field=document.createElement('button'); field.type='button'; field.className='csel__field';
      var panel=document.createElement('div'); panel.className='csel__panel'; wrap.appendChild(field); wrap.appendChild(panel);
      function addOpt(op){ if(!op.value) return; var b=document.createElement('button'); b.type='button'; b.className='csel__opt'+(op.value===sel.value?' sel':''); b.textContent=op.text; b.addEventListener('click',function(e){ e.stopPropagation(); sel.value=op.value; fire(sel,'change'); close(); render(); }); panel.appendChild(b); }
      function render(){ var empty=!sel.value; field.innerHTML=''; var v=document.createElement('span'); v.className='csel__val'; v.textContent=empty?sel.options[0].text:sel.options[sel.selectedIndex].text; var a=document.createElement('span'); a.className='csel__arw'; field.appendChild(v); field.appendChild(a); field.classList.toggle('is-empty',empty); panel.innerHTML=''; Array.prototype.forEach.call(sel.children,function(node){ if(node.tagName==='OPTGROUP'){ var g=document.createElement('div'); g.className='csel__group'; g.textContent=node.label; panel.appendChild(g); Array.prototype.forEach.call(node.children,addOpt); } else addOpt(node); }); }
      function open(){ closeAll(wrap); wrap.classList.add('open'); } function close(){ wrap.classList.remove('open'); }
      closers.push(function(ex){ if(ex!==wrap) close(); });
      field.addEventListener('click',function(e){ e.stopPropagation(); wrap.classList.contains('open')?close():open(); });
      sel.addEventListener('change',render); render();
    }
    Array.prototype.forEach.call(bf.querySelectorAll('select'),enhance);
    var dinp=bf.querySelector('input[data-cal]');
    if(dinp){
      var MON=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
      var GEN=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
      var WD=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
      dinp.readOnly=true;
      var cw=document.createElement('div'); cw.className='caldd'; dinp.parentNode.insertBefore(cw,dinp); cw.appendChild(dinp);
      var cal=document.createElement('div'); cal.className='cal'; cw.appendChild(cal);
      var today=new Date(); today.setHours(0,0,0,0);
      var view=new Date(today.getFullYear(),today.getMonth(),1); var chosen=null;
      function draw(){ var y=view.getFullYear(),m=view.getMonth(); var sd=(new Date(y,m,1).getDay()+6)%7; var dn=new Date(y,m+1,0).getDate();
        var h='<div class="cal__head"><button type="button" class="cal__nav" data-d="-1">\u2039</button><span class="cal__title">'+MON[m]+' '+y+'</span><button type="button" class="cal__nav" data-d="1">\u203A</button></div><div class="cal__wd">';
        for(var w=0;w<7;w++) h+='<span>'+WD[w]+'</span>'; h+='</div><div class="cal__grid">';
        for(var i=0;i<sd;i++) h+='<span class="cal__cell empty"></span>';
        for(var d=1;d<=dn;d++){ var dt=new Date(y,m,d); var c='cal__cell'; if(dt<today)c+=' past'; if(dt.getTime()===today.getTime())c+=' today'; if(chosen&&dt.getTime()===chosen.getTime())c+=' sel'; h+='<button type="button" class="'+c+'" data-day="'+d+'"'+(dt<today?' disabled':'')+'>'+d+'</button>'; }
        h+='</div>'; cal.innerHTML=h; }
      function openC(){ closeAll(); draw(); cw.classList.add('open'); } function closeC(){ cw.classList.remove('open'); }
      closers.push(function(ex){ if(ex!==cw) closeC(); });
      dinp.addEventListener('click',function(e){ e.stopPropagation(); cw.classList.contains('open')?closeC():openC(); });
      cal.addEventListener('click',function(e){ e.stopPropagation(); var nav=e.target.closest('.cal__nav'); if(nav){ view.setMonth(view.getMonth()+parseInt(nav.getAttribute('data-d'),10)); draw(); return; } var cell=e.target.closest('.cal__cell'); if(!cell||cell.classList.contains('empty')||cell.disabled) return; var d=parseInt(cell.getAttribute('data-day'),10); chosen=new Date(view.getFullYear(),view.getMonth(),d); dinp.value=d+' '+GEN[view.getMonth()]; fire(dinp,'input'); fire(dinp,'change'); closeC(); });
    }
    document.addEventListener('click',function(){ closeAll(); });
  })();
})();
