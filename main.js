// ─── ASSETS ──────────────────────────────────────────────────────────────────
const ASSETS = {
  model: (() => {
    const base = document.baseURI || window.location.href;
    const basePath = base.substring(0, base.lastIndexOf('/') + 1);
    return basePath + 'porsche.glb';
  })(),
  modelFallbacks: [
    './porsche.glb',
    '../porsche.glb',
    '/porsche.glb'
  ],
  video: (() => {
    const base = document.baseURI || window.location.href;
    const basePath = base.substring(0, base.lastIndexOf('/') + 1);
    return basePath + 'bmw-bg.mp4';
  })(),
  reel: 'https://www.instagram.com/reel/DWJ-rvfDF3d/embed'
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────
const SETTINGS = {
  mobileMaxWidth:    820,
  desktopScale:      2.6,
  mobileScale:       1.8,
  desktopPixelRatio: Math.min(window.devicePixelRatio || 1, 2),
  mobilePixelRatio:  1,
  routeThresholds:   [0.12, 0.35, 0.62, 0.88],
  routeHeightMax:    100,
  mouseRotX:  0.18,
  mouseRotY:  0.32,
  mouseLerp:  0.055
};

// ─── STATE ───────────────────────────────────────────────────────────────────
const STATE = {
  isMobile:       /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= SETTINGS.mobileMaxWidth,
  lenis:          null,
  scene:          null,
  camera:         null,
  renderer:       null,
  carModel:       null,
  routeProgress:  null,
  routePoints:    null,
  storySection:   null,
  magneticCursor: null,
  bgVideo:        null,
  rafRunning:     false,
  mouse:          { x: 0, y: 0 },
  mouseTarget:    { x: 0, y: 0 }
};

// ─── DOM ─────────────────────────────────────────────────────────────────────
const DOM = {
  body:        document.body,
  heroView:    document.querySelector('.hero-viewport'),
  chatPanel:   document.getElementById('chatPanel'),
  chatFab:     document.getElementById('chatFab'),
  chatSend:    document.getElementById('chatSend'),
  chatInput:   document.getElementById('chatInput'),
  contactForm: document.getElementById('contactForm')
};

// ─── SMART CHATBOT ────────────────────────────────────────────────────────────
const chatBot = {
  rules: [
    {
      keywords: ['здравей','здрасти','хей','hey','hello','hi','добърден','добро утро'],
      responses: [
        'Здравейте! Добре дошли в n%d auto. Как мога да ви помогна днес?',
        'Здравейте! Аз съм консиержът на n%d auto. Кажете ми — за кой автомобил мечтаете?',
        'Добре дошли! Готов съм да ви помогна с всякакви въпроси за вноса на вашия автомобил.'
      ]
    },
    {
      keywords: ['цена','цени','колко струва','колко чини','бюджет','price','cost','how much'],
      responses: [
        'Цената зависи от модела, годината и произхода. За точна оферта се свържете с нас на +359 882 356 746.',
        'Всяка кола е индивидуален случай — марка, спецификация, произход и мито се калкулират заедно. Изпратете ни запитване и ще получите детайлна цена до 24ч.',
        'За да ви дадем честна цена — попълнете формата за запитване или ни пишете директно.'
      ]
    },
    {
      keywords: ['колко време','срок','доставка','кога','седмици','месеци','timeline','delivery','how long'],
      responses: [
        'От Южна Корея — около 6–8 седмици. От USA — 4–6 седмици. От Европа — 2–4 седмици. Включва инспекция, транспорт и митническо оформяне.',
        'Стандартният срок е 4 до 8 седмици в зависимост от произхода. Ще знаете точно къде е колата ви по всяко време.',
        'Доставката от Корея отнема около 6–8 седмици, а от Европа — около 2–4. Уведомяваме ви на всяка стъпка.'
      ]
    },
    {
      keywords: ['корея','южна корея','korea','korean'],
      responses: [
        'Южна Корея е един от нашите основни пазари. Оттам внасяме Genesis, Hyundai, Kia, а понякога и корейски спецификации на BMW и Mercedes.',
        'От Корея работим с проверени партньори и всяка кола минава подробна инспекция преди изпращане.'
      ]
    },
    {
      keywords: ['usa','америка','щати','america','american'],
      responses: [
        'От USA внасяме Porsche, BMW, Mercedes-AMG и др. с американска спецификация. Проверяваме съвместимостта с европейски изисквания.',
        'Американският пазар предлага страхотни сделки, особено за Porsche и луксозни SUV-та. Ние се грижим за цялата документация.'
      ]
    },
    {
      keywords: ['европа','europe','европейски','german','германия'],
      responses: [
        'Европейският внос е най-бързият — 2–4 седмици. Работим с Германия, Холандия и Белгия. Европейска спецификация улеснява регистрацията.',
        'От Европа доставката е най-лесна. Кажете ни конкретния модел и ще го намерим.'
      ]
    },
    {
      keywords: ['porsche','порше'],
      responses: [
        'Porsche е нашата специалност. Внасяме 911, Cayenne, Macan, Panamera и Taycan от Корея, USA и Европа. Кой модел ви интересува?',
        'Porsche е емблематичната марка в нашето портфолио. Разполагаме с достъп до редки конфигурации трудно намираеми в България.',
        'За Porsche — кажете ни модел, година и спецификация и ще намерим точното за вас.'
      ]
    },
    {
      keywords: ['bmw','бмв'],
      responses: [
        'BMW е сред нашите топ марки. Внасяме M-серия, 7-серия, X5, X7 и iX от различни пазари.',
        'От BMW разполагаме с M-спортни конфигурации трудни за намиране тук. Пишете ни за оферта.'
      ]
    },
    {
      keywords: ['mercedes','мерцедес','amg'],
      responses: [
        'Mercedes-AMG е специалитет — внасяме C63, E63, GLE 63 и S-Class от европейски и корейски пазари.',
        'За Mercedes се свържете с нас на +359 882 356 746 и ще намерим точния модел.'
      ]
    },
    {
      keywords: ['genesis','джинезис'],
      responses: [
        'Genesis от Корея е изключително изгоден. GV80, GV70 и G80 са особено търсени — цени под европейските дилъри.',
        'Genesis е един от най-добрите баланси между лукс и цена. Кажете ни модела.'
      ]
    },
    {
      keywords: ['hyundai','kia','хюндай','киа'],
      responses: [
        'Hyundai и Kia от Корея са сред най-изгодните варианти — корейската спецификация е по-богата от европейската.',
        'Внасяме Hyundai Ioniq 5/6, Santa Fe, Kia EV6, Sportage и Stinger. Пишете ни за наличности.'
      ]
    },
    {
      keywords: ['мито','митница','данък','регистрация','документи','customs','tax'],
      responses: [
        'Митото зависи от възрастта и стойността на автомобила. Ние се грижим за цялото оформяне — без изненади по разходите.',
        'Митническото оформяне е наша работа — вие получавате колата готова за регистрация.'
      ]
    },
    {
      keywords: ['инспекция','проверка','качество','inspection','quality'],
      responses: [
        'Всеки автомобил минава детайлна техническа инспекция — каросерия, механика, електроника. Получавате пълен доклад с снимки.',
        'Качеството е приоритет. Работим само с проверени партньори и всяка кола е инспектирана лично от наш представител.'
      ]
    },
    {
      keywords: ['електрически','ev','electric','хибрид','hybrid'],
      responses: [
        'Внасяме и електрически автомобили — Porsche Taycan, Hyundai Ioniq 5/6, Kia EV6, Genesis GV60.',
        'EV вносът изисква проверка на батерийния капацитет и зарядния стандарт. Ние се грижим за всичко.'
      ]
    },
    {
      keywords: ['контакт','телефон','обади','пиши','contact','call','phone','instagram'],
      responses: [
        'Достигнете до нас на +359 882 356 746 или чрез Instagram @n.and.d.auto. Отговаряме до 24 часа.',
        'Обадете ни се на +359 882 356 746 или попълнете формата за запитване.'
      ]
    },
    {
      keywords: ['запитване','оферта','quote','inquiry','поръчка'],
      responses: [
        'Изпратете запитване чрез формата — посочете марка, модел, година и произход, и ще получите оферта до 24 часа.',
        'За персонална оферта — попълнете формата долу или ни пишете на +359 882 356 746.'
      ]
    },
    {
      keywords: ['благодаря','мерси','супер','перфектно','thanks','thank you','perfect','great'],
      responses: [
        'Благодарим ви! За допълнителни въпроси сме на +359 882 356 746.',
        'Винаги насреща! Ако имате още въпроси — не се колебайте.',
        'С удоволствие! Очакваме да ви помогнем да намерите перфектния автомобил.'
      ]
    }
  ],
  fallbacks: [
    'Чудесен въпрос. За точна информация свържете се с нас на +359 882 356 746.',
    'Това е по-специфично запитване — нашите специалисти ще ви помогнат на +359 882 356 746.',
    'За детайли попълнете формата за запитване и ще отговорим до 24 часа.',
    'Нашият екип е готов на +359 882 356 746 или чрез @n.and.d.auto в Instagram.'
  ],
  getResponse(input) {
    const text = input.toLowerCase().trim();
    for (const rule of this.rules) {
      if (rule.keywords.some(kw => text.includes(kw))) {
        const r = rule.responses;
        return r[Math.floor(Math.random() * r.length)];
      }
    }
    return this.fallbacks[Math.floor(Math.random() * this.fallbacks.length)];
  }
};

// ─── BACKGROUND VIDEO ─────────────────────────────────────────────────────────
const videoManager = {
  init() {
    const vid = document.createElement('video');
    vid.src         = ASSETS.video;
    vid.autoplay    = true;
    vid.loop        = true;
    vid.muted       = true;
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.setAttribute('muted', '');
    Object.assign(vid.style, {
      position:        'fixed',
      top:             '50%',
      left:            '50%',
      minWidth:        '130vw',
      minHeight:       '130vh',
      width:           '130vw',
      height:          'auto',
      objectFit:       'cover',
      opacity:         '0.22',
      zIndex:          '-1',
      pointerEvents:   'none',
      willChange:      'transform',
      transform:       'translate(-50%, -50%) translateY(0px) scale(1.15)',
      transformOrigin: 'center center',
      transition:      'none'
    });
    document.body.prepend(vid);
    STATE.bgVideo = vid;
    vid.play().catch(() => {});
  },
  update(scrollY) {
    if (!STATE.bgVideo) return;
    const offset = -(scrollY * 0.35);
    STATE.bgVideo.style.transform = `translate(-50%, -50%) translateY(${offset}px) scale(1.15)`;
  }
};

// ─── ASSET MANAGER ───────────────────────────────────────────────────────────
const assetManager = {
  init() {
    document.querySelectorAll('.reel-frame').forEach(frame => {
      frame.src = frame.dataset.reelSrc || ASSETS.reel;
    });
  }
};

// ─── 3D SCENE ────────────────────────────────────────────────────────────────
const sceneManager = {
  _modelLoadAttempt: 0,

  init() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) {
      console.warn('⚠️  #three-canvas not found — skipping 3D scene.');
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias:       true,
      alpha:           true,
      powerPreference: 'high-performance'
    });
    const pixelRatio = STATE.isMobile ? SETTINGS.mobilePixelRatio : SETTINGS.desktopPixelRatio;
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);

    if ('outputColorSpace' in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if ('outputEncoding' in renderer) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }

    renderer.shadowMap.enabled   = true;
    renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 200);
    camera.position.set(0, 1.2, 6.0);
    camera.lookAt(0, 0, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));

    const key = new THREE.SpotLight(0x9ef4ff, 3.5, 20, 0.50, 0.40, 1.2);
    key.position.set(5.0, 7.0, 5.0);
    key.castShadow = true;
    key.shadow.mapSize.width  = 2048;
    key.shadow.mapSize.height = 2048;
    key.shadow.bias           = -0.0012;
    scene.add(key);
    scene.add(key.target);

    const fill = new THREE.DirectionalLight(0xffd580, 1.0);
    fill.position.set(-4.0, 3.0, -4.0);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x6ee7ff, 0.6);
    rim.position.set(0, 2.0, -5.0);
    scene.add(rim);

    // Cyan glow disc only — no opaque floor
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 64),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.09 })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.055;
    glow.name = 'floorGlow';
    scene.add(glow);

    STATE.scene    = scene;
    STATE.camera   = camera;
    STATE.renderer = renderer;

    this.resize();
    window.addEventListener('resize', this.resize.bind(this), { passive: true });

    if (!STATE.isMobile) {
      window.addEventListener('mousemove', e => {
        STATE.mouseTarget.x =  (e.clientX / window.innerWidth  - 0.5) * 2;
        STATE.mouseTarget.y = -(e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }

    this.loadModel();
  },

  positionCamera(model) {
    const box    = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    const size   = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    const maxDim   = Math.max(size.x, size.y, size.z);
    const fovRad   = (STATE.camera.fov * Math.PI) / 180;
    const distance = (maxDim / (2 * Math.tan(fovRad / 2))) * 1.55;
    STATE.camera.position.set(center.x, center.y + size.y * 0.15, center.z + distance);
    STATE.camera.lookAt(center.x, center.y, center.z);
    STATE.camera.near = distance * 0.01;
    STATE.camera.far  = distance * 10;
    STATE.camera.updateProjectionMatrix();
  },

  loadModel() {
    const LoaderClass = THREE.GLTFLoader || (window.THREE && window.THREE.GLTFLoader);
    if (!LoaderClass) {
      console.error('❌ THREE.GLTFLoader not available.');
      this._spawnFallbackCube();
      return;
    }

    const loader  = new LoaderClass();
    const paths   = [ASSETS.model, ...ASSETS.modelFallbacks];
    const attempt = this._modelLoadAttempt;

    if (attempt >= paths.length) {
      console.error('❌ All model paths exhausted — using fallback geometry.');
      this._spawnFallbackCube();
      return;
    }

    const path = paths[attempt];
    console.log(`🔄 Loading model (attempt ${attempt + 1}): ${path}`);

    loader.load(
      path,
      gltf => {
        const model = gltf.scene;
        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow    = true;
            child.receiveShadow = true;
            if (child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach(mat => { if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace; });
            }
          }
        });

        const box  = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim     = Math.max(size.x, size.y, size.z);
        const targetSize = STATE.isMobile ? SETTINGS.mobileScale : SETTINGS.desktopScale;
        model.scale.setScalar(targetSize / maxDim);

        const centeredBox = new THREE.Box3().setFromObject(model);
        const center      = new THREE.Vector3();
        centeredBox.getCenter(center);
        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y -= centeredBox.min.y;
        model.rotation.y  = Math.PI * 0.45;

        STATE.scene.add(model);
        STATE.carModel = model;
        this.positionCamera(model);
        console.log('✅ 3D model loaded:', path);

        if (!STATE.rafRunning) {
          STATE.rafRunning = true;
          requestAnimationFrame(t => scrollManager.raf(t));
        }
      },
      xhr => { if (xhr.total > 0) console.log(`📦 Model: ${Math.round((xhr.loaded / xhr.total) * 100)}%`); },
      _err => {
        console.warn(`⚠️  Failed: ${path} — trying next fallback…`);
        this._modelLoadAttempt++;
        this.loadModel();
      }
    );
  },

  _spawnFallbackCube() {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.7, 2.8),
      new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.7, roughness: 0.25 })
    );
    cube.castShadow = cube.receiveShadow = true;
    STATE.scene.add(cube);
    STATE.carModel = cube;
    if (!STATE.rafRunning) {
      STATE.rafRunning = true;
      requestAnimationFrame(t => scrollManager.raf(t));
    }
  },

  resize() {
    if (!STATE.renderer || !STATE.camera || !DOM.heroView) return;
    const { width, height } = DOM.heroView.getBoundingClientRect();
    const w = Math.max(width, 16);
    const h = Math.max(height, 16);
    STATE.renderer.setSize(w, h, true);
    STATE.camera.aspect = w / h;
    STATE.camera.updateProjectionMatrix();
  },

  render() {
    if (!STATE.renderer || !STATE.scene || !STATE.camera) return;

    if (STATE.carModel) {
      const sp = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 1.5)));

      if (!STATE.isMobile) {
        STATE.mouse.x += (STATE.mouseTarget.x - STATE.mouse.x) * SETTINGS.mouseLerp;
        STATE.mouse.y += (STATE.mouseTarget.y - STATE.mouse.y) * SETTINGS.mouseLerp;
        const baseY = Math.PI * 0.45 + sp * 0.32;
        STATE.carModel.rotation.y +=
          ((baseY + STATE.mouse.x * SETTINGS.mouseRotY) - STATE.carModel.rotation.y) * 0.14;
        STATE.carModel.rotation.x +=
          ((STATE.mouse.y * SETTINGS.mouseRotX) - STATE.carModel.rotation.x) * 0.14;
      } else {
        STATE.carModel.rotation.y +=
          ((Math.PI * 0.35 + sp * 0.32) - STATE.carModel.rotation.y) * 0.06;
      }

      STATE.carModel.position.z += ((-0.2 + sp * 0.25) - STATE.carModel.position.z) * 0.06;

      const glowMesh = STATE.scene.getObjectByName('floorGlow');
      if (glowMesh && glowMesh.material) {
        glowMesh.material.opacity = 0.08 + Math.sin(Date.now() * 0.002) * 0.018;
      }
    }

    STATE.renderer.render(STATE.scene, STATE.camera);
  }
};

// ─── REEL / INSTAGRAM SHOWCASE ────────────────────────────────────────────────
const reelManager = {
  init() {
    const section = document.getElementById('reel');
    if (!section) return;
    const frame = section.querySelector('.reel-phone, .phone-frame, .smartphone-frame, .reel-wrapper');
    if (frame) frame.classList.add('reel-neon-frame');
    const clipWrappers = section.querySelectorAll('.reel-clip-wrapper, .reel-frame-wrapper, .reel-container, .reel-phone');
    clipWrappers.forEach(el => el.classList.add('reel-scroll-reveal'));
    if (clipWrappers.length === 0) section.classList.add('reel-scroll-reveal');
    this._bindIntersectionObserver();
    this._injectAnimatedBorderCanvas(section);
  },
  _bindIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reel-scroll-reveal').forEach(el => el.classList.add('reel-visible'));
      return;
    }
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { entry.target.classList.add('reel-visible'); io.unobserve(entry.target); }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.reel-scroll-reveal').forEach(el => io.observe(el));
  },
  _injectAnimatedBorderCanvas(section) {
    section.style.position = 'relative';
    section.style.overflow = 'visible';
    const halo = document.createElement('div');
    halo.className = 'reel-halo';
    halo.setAttribute('aria-hidden', 'true');
    section.prepend(halo);
  }
};

// ─── ROUTE MANAGER ───────────────────────────────────────────────────────────
const routeManager = {
  init() {
    STATE.routeProgress = document.getElementById('routeProgress');
    STATE.routePoints   = Array.from(document.querySelectorAll('.step-card'));
    STATE.storySection  = document.getElementById('story');
    this.update();
  },
  update() {
    if (!STATE.storySection || !STATE.routeProgress) return;
    const rect     = STATE.storySection.getBoundingClientRect();
    const sectionH = Math.max(rect.height, 1);
    const entered  = window.innerHeight - rect.top;
    const raw      = entered / (sectionH + window.innerHeight);
    const progress = Math.min(1, Math.max(0, raw));
    STATE.routeProgress.style.height = `${progress * SETTINGS.routeHeightMax}%`;
    STATE.routePoints.forEach((card, i) =>
      card.classList.toggle('active', progress >= SETTINGS.routeThresholds[i])
    );
  }
};

// ─── SCROLL MANAGER ──────────────────────────────────────────────────────────
const scrollManager = {
  init() {
    if (typeof Lenis !== 'undefined') {
      STATE.lenis = new Lenis({
        duration:        0.6,
        easing:          t => 1 - Math.pow(1 - t, 4),
        smooth:          true,
        smoothTouch:     false,
        touchMultiplier: 2.4,
        wheelMultiplier: 1.8,
        lerp:            0.12
      });
      STATE.lenis.on('scroll', ({ scroll }) => {
        routeManager.update();
        videoManager.update(scroll);
      });
      if (!STATE.rafRunning) {
        STATE.rafRunning = true;
        requestAnimationFrame(t => this.raf(t));
      }
    } else {
      window.addEventListener('scroll', () => {
        routeManager.update();
        videoManager.update(window.scrollY);
      }, { passive: true });
      if (!STATE.rafRunning) {
        STATE.rafRunning = true;
        requestAnimationFrame(t => this.raf(t));
      }
    }
  },
  raf(time) {
    if (STATE.lenis) STATE.lenis.raf(time);
    sceneManager.render();
    requestAnimationFrame(t => this.raf(t));
  },
  scrollTo(target) {
    if (STATE.lenis) STATE.lenis.scrollTo(target, { duration: 0.7 });
    else window.scrollTo({ top: target, behavior: 'smooth' });
  }
};

// ─── UI MANAGER ──────────────────────────────────────────────────────────────
const uiManager = {
  init() {
    this.bindNav();
    this.bindContact();
    this.bindChat();
    this.bindTouchRipple();
    this.bindMagneticCursor();
  },
  bindNav() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', event => {
        const href   = link.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        scrollManager.scrollTo(target.getBoundingClientRect().top + window.scrollY - 72);
      });
    });
  },
  bindContact() {
    if (!DOM.contactForm) return;
    DOM.contactForm.addEventListener('submit', event => {
      event.preventDefault();
      const button = DOM.contactForm.querySelector('button');
      if (!button) return;
      button.disabled = true;
      const span = button.querySelector('span');
      if (span) span.textContent = 'Sending…';
      setTimeout(() => {
        if (span) span.textContent = 'Sent ✓';
        button.style.opacity = '0.9';
        alert('Inquiry submitted. We will contact you within 24 hours.');
      }, 900);
    });
  },
  bindChat() {
    if (DOM.chatFab) {
      DOM.chatFab.addEventListener('click', () => {
        DOM.chatPanel.classList.toggle('open');
        if (DOM.chatPanel.classList.contains('open')) DOM.chatInput.focus();
      });
    }
    if (DOM.chatSend) DOM.chatSend.addEventListener('click', this.sendChat.bind(this));
    if (DOM.chatInput) {
      DOM.chatInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') { event.preventDefault(); this.sendChat(); }
      });
    }
  },
  sendChat() {
    const text = DOM.chatInput.value.trim();
    if (!text) return;
    this.addMessage(text, 'user');
    DOM.chatInput.value = '';
    const typing = document.getElementById('chatTyping');
    if (typing) typing.classList.add('on');
    setTimeout(() => {
      if (typing) typing.classList.remove('on');
      this.addMessage(chatBot.getResponse(text), 'bot');
    }, 600 + Math.random() * 500);
  },
  addMessage(text, role) {
    const container = document.getElementById('chatMsgs');
    if (!container) return;
    const bubble = document.createElement('div');
    bubble.className   = `chat-msg ${role}`;
    bubble.textContent = text;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  },
  bindTouchRipple() {
    window.addEventListener('touchstart', event => {
      const target = event.target.closest('.btn-frost, .cta-nav, .phone-float, .chat-fab');
      if (!target) return;
      const ripple = document.createElement('div');
      ripple.className = 'touch-ripple';
      ripple.style.left = `${event.touches[0].clientX}px`;
      ripple.style.top  = `${event.touches[0].clientY}px`;
      document.body.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    }, { passive: true });
  },
  bindMagneticCursor() {
    if (STATE.isMobile) return;
    const cursor = document.createElement('div');
    cursor.className = 'magnetic-cursor';
    document.body.appendChild(cursor);
    STATE.magneticCursor = cursor;
    document.addEventListener('mousemove', e => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top  = `${e.clientY}px`;
    });
    document.querySelectorAll('.magnetic-link').forEach(target => {
      target.addEventListener('mouseenter', () => cursor.classList.add('active'));
      target.addEventListener('mouseleave', () => cursor.classList.remove('active'));
      target.addEventListener('mousemove', e => {
        const rect = target.getBoundingClientRect();
        const x    = (e.clientX - (rect.left + rect.width  / 2)) / rect.width;
        const y    = (e.clientY - (rect.top  + rect.height / 2)) / rect.height;
        target.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
      });
      target.addEventListener('mouseleave', () => { target.style.transform = ''; });
    });
  }
};

// ─── MAP MANAGER ─────────────────────────────────────────────────────────────
const mapManager = {
  init() {
    const mapEl = document.getElementById('leaflet-map');
    if (!mapEl || typeof L === 'undefined') return;
    const map = L.map('leaflet-map', {
      center: [42.6977, 23.3219],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,   // ← zoom с колелото на мишката
      dragging: true,           // ← плъзгане с мишка
      touchZoom: true,          // ← pinch-to-zoom на телефон
      tap: false                // ← предотвратява конфликт с page scroll на мобилен
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const icon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:3.4rem;height:3.4rem;display:grid;place-items:center;
                    border-radius:50%;background:rgba(0,229,255,0.16);
                    border:1px solid rgba(0,229,255,0.3);
                    box-shadow:0 0 1.5rem rgba(0,229,255,0.24);">
          <div style="width:1rem;height:1rem;border-radius:50%;background:#00e5ff;
                      box-shadow:0 0 1rem rgba(0,229,255,0.9);"></div>
        </div>
        <div style="position:absolute;top:-2.2rem;left:50%;transform:translateX(-50%);
                    background:rgba(6,8,10,0.92);color:#00e5ff;padding:0.35rem 0.75rem;
                    border-radius:999px;font-size:0.65rem;white-space:nowrap;
                    border:1px solid rgba(0,229,255,0.18);">n%d auto</div>`
    });
    L.marker([42.6977, 23.3219], { icon }).addTo(map);
  }
};

// ─── STYLE MANAGER ───────────────────────────────────────────────────────────
const styleManager = {
  init() {
    const style = document.createElement('style');
    style.textContent = `
      .hero-section { display:flex; align-items:center; justify-content:center; flex-direction:column; text-align:center; min-height:100svh; }
      .hero-copy { display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; max-width:760px; margin:0 auto; }
      .hero-title { text-align:center; margin-left:auto; margin-right:auto; }
      .hero-actions { display:flex; align-items:center; justify-content:center; gap:1rem; flex-wrap:wrap; }
      .hero-meta { display:flex; align-items:center; justify-content:center; gap:1rem; flex-wrap:wrap; }
      .hero-copy-text { text-align:center; max-width:600px; margin-left:auto; margin-right:auto; }

      .reel-scroll-reveal { opacity:0; transform:translateY(40px); transition:opacity 0.85s cubic-bezier(0.22,1,0.36,1), transform 0.85s cubic-bezier(0.22,1,0.36,1); will-change:opacity,transform; }
      .reel-scroll-reveal.reel-visible { opacity:1; transform:translateY(0); }

      .reel-neon-frame { position:relative; border-radius:2rem; box-shadow:0 0 0 1px rgba(0,229,255,0.18),0 0 24px rgba(0,229,255,0.14),0 0 60px rgba(0,180,220,0.08),inset 0 0 20px rgba(0,229,255,0.04); animation:reelGlowPulse 4s ease-in-out infinite; }
      @keyframes reelGlowPulse {
        0%,100% { box-shadow:0 0 0 1px rgba(0,229,255,0.18),0 0 24px rgba(0,229,255,0.14),0 0 60px rgba(0,180,220,0.08),inset 0 0 20px rgba(0,229,255,0.04); }
        50%     { box-shadow:0 0 0 1px rgba(0,229,255,0.35),0 0 40px rgba(0,229,255,0.28),0 0 90px rgba(0,180,220,0.18),inset 0 0 32px rgba(0,229,255,0.08); }
      }

      .reel-halo { position:absolute; inset:-80px; z-index:-1; pointer-events:none; background:radial-gradient(ellipse 70% 55% at 50% 55%,rgba(0,229,255,0.07) 0%,rgba(0,80,120,0.04) 45%,transparent 75%); animation:haloShift 8s ease-in-out infinite alternate; border-radius:50%; filter:blur(20px); }
      @keyframes haloShift { from{opacity:0.6;transform:scale(1.0);} to{opacity:1.0;transform:scale(1.08);} }

      .reel-neon-frame::before { content:''; position:absolute; inset:-2px; border-radius:inherit; z-index:-1; padding:2px; background:conic-gradient(from var(--reel-angle,0deg),transparent 0deg,rgba(0,229,255,0.55) 60deg,rgba(100,200,255,0.3) 120deg,transparent 180deg,rgba(0,180,220,0.4) 240deg,rgba(0,229,255,0.6) 300deg,transparent 360deg); animation:reelRotateBorder 6s linear infinite; mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0); mask-composite:exclude; -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0); -webkit-mask-composite:destination-out; }
      @property --reel-angle { syntax:'<angle>'; initial-value:0deg; inherits:false; }
      @keyframes reelRotateBorder { to { --reel-angle:360deg; } }

      @media (max-width:820px) {
        .hero-section { flex-direction:column; }
        .hero-media   { width:100%; }
        .reel-neon-frame::before { animation-duration:9s; }
      }
    `;
    document.head.appendChild(style);
  }
};

// ─── INIT ─────────────────────────────────────────────────────────────────────
function init() {
  styleManager.init();
  videoManager.init();
  assetManager.init();
  sceneManager.init();
  reelManager.init();
  routeManager.init();
  uiManager.init();
  mapManager.init();
  scrollManager.init();
}

window.addEventListener('DOMContentLoaded', init);

window.addEventListener('resize', () => {
  STATE.isMobile = window.innerWidth <= SETTINGS.mobileMaxWidth;
  routeManager.update();
}, { passive: true });
