// script.js
(function(){
  const root = document.querySelector('[data-imw]');
  if (!root) return;

  const COPY = {
    cultural: [
      "An Indigenous Commissioner who is culturally capable; commissioned evaluation is adaptable to the community context, utilising their relationships and fostering trust.",
      "Commissioner trusts Indigenous Service Providers to commission an evaluation that respects and has relationships with Indigenous people, therefore evaluation is adaptable to the community context.",
      "Cultural capability of Commissioner grows through relationships with Indigenous peoples, enhancing community responsiveness and fostering trust. There may be compromises in stakeholders' preferred approaches.",
      "Commissioner’s limited cultural capability reduces cultural responsiveness of an evaluation leading to an evaluation which lacks respect for the community context undermining Indigenous people’s trust.",
      "Commissioner has no cultural capability, resulting in an evaluation that lacks any cultural responsiveness and fails to respect Indigenous community context, undermining trust."
    ],
    power: [
      "Indigenous led and self-determined, with accountability to Indigenous people and communities.",
      "Commissioner delegates evaluation responsibilities to Indigenous Service Providers. Service Providers are primarily accountable to Indigenous people rather than the Commissioner.",
      "Equal partnerships between Commissioners and Service Provider(s) with accountability to each other and Indigenous communities. There may be compromises in stakeholders' preferred approaches.",
      "Little engagement and no partnership with Indigenous people. Power is maintained by the Commissioner. Commissioners have no accountability to Indigenous people or organisations.",
      "No, or tokenistic, engagement with Indigenous people. Power is maintained by the Commissioner. Commissioners have no accountability to Indigenous people or organisations."
    ],
    reciprocity: [
      "An Indigenous organisation, as Commissioner, has responsibility to Indigenous people to ensure the evaluation benefits them and develops community capability.",
      "The Indigenous Service Providers(s) have the authority to commission the evaluation. They oversee an evaluation that is of benefit to Indigenous people and incorporates capability building.",
      "Equal partnership fosters two-way learning, allowing for an understanding of commissioning evaluations that benefits the community. Also builds capability. There may be compromises in stakeholders' preferred approaches.",
      "Superficial hospitality towards the Indigenous people or Service Providers; limited benefit to the community, two-way learning, or capability building.",
      "Commissioner demonstrates little to no reciprocity/ hospitality towards the Indigenous people or Service Providers. Little benefit to the community, two-way learning, or capability building."
    ]
  };
  const STAGES = ["Indigenous Led","Delegative","Co-Design","Participatory","Top Down"];
  const THEME_LABELS = {
    cultural: 'Cultural Safety',
    power: 'Power',
    reciprocity: 'Reciprocity'
  };

  const guideTop  = document.getElementById('guideTop');
  const guideBot  = document.getElementById('guideBottom');
  const baseline  = document.getElementById('baseline');
  const midRow    = document.getElementById('midRow');
  const dotline   = midRow ? midRow.querySelector('.dotline') : null;
  if (!guideTop || !guideBot || !baseline || !midRow || !dotline) return;

  const stageGroups = Array.from(dotline.querySelectorAll('.stage-group'));
  const dots        = Array.from(dotline.querySelectorAll('.dot'));

  const floatEl    = document.getElementById('titleFloat');
  const popover    = document.getElementById('imw-popover');
  const card       = popover ? popover.querySelector('.popover-card') : null;
  const titleEl    = document.getElementById('imw-popover-title');
  const textEl     = document.getElementById('imw-popover-text');
  const closeBtn   = popover ? popover.querySelector('[data-close]') : null;
  const liveRegion = document.getElementById('imw-live');

  if (!floatEl || !popover || !card || !titleEl || !textEl || !closeBtn) return;

  const verticalQuery = window.matchMedia('(max-width: 900px)');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const titleMap = {};
  document.querySelectorAll('.col-title').forEach(n => { titleMap[Number(n.dataset.stageTitle)] = n; });

  let activeDot = null;
  let activeStageGroup = null;
  let lastTrigger = null;
  let disabledButtons = [];
  let isModalOpen = false;

  function setHoverStage(stage){
    if (stage === null || stage === undefined || stage === ''){
      if (!isModalOpen) root.removeAttribute('data-hover-col');
      return;
    }
    const value = Number(stage);
    if (Number.isNaN(value)) return;
    root.setAttribute('data-hover-col', String(value));
  }

  function centerXForStage(stage){
    const btn = dotline.querySelector(`.dot[data-stage="${stage}"][data-theme="power"]`);
    if (!btn) return 0;
    const r = btn.getBoundingClientRect();
    const m = midRow.getBoundingClientRect();
    return r.left - m.left + r.width/2;
  }

  function placeFloatingTitle(stage, theme, cardRect){
    const defaultTitle = titleMap[stage];
    if (!defaultTitle) return;

    defaultTitle.style.visibility = 'hidden';

    floatEl.innerHTML = `<span>${STAGES[stage]}</span><span class="title-arrows">↔</span>`;
    floatEl.dataset.theme = theme;
    floatEl.classList.add('active');

    floatEl.style.transform = 'translate(-9999px,-9999px)';
    floatEl.style.display   = 'block';

    const m  = midRow.getBoundingClientRect();
    const fr = floatEl.getBoundingClientRect();

    const cx   = centerXForStage(stage);
    const left = Math.max(8, Math.min(cx - fr.width/2, m.width - fr.width - 8));
    const margin = 10;
    const top = (theme === 'reciprocity')
      ? (cardRect.bottom - m.top + margin)
      : (cardRect.top    - m.top - fr.height - margin);

    floatEl.style.left = left + 'px';
    floatEl.style.top  = top  + 'px';
    floatEl.style.transform = 'none';
  }

  function clearFloatingTitle(){
    floatEl.classList.remove('active');
    delete floatEl.dataset.theme;
    floatEl.style.transform = 'translate(-9999px,-9999px)';
    floatEl.style.display   = 'block';
    Object.values(titleMap).forEach(n => { if (n) n.style.visibility = ''; });
  }

  function markActiveDot(btn, theme){
    if (activeDot && activeDot !== btn) activeDot.classList.remove('is-active');
    activeDot = btn;
    if (activeDot) activeDot.classList.add('is-active');
  }

  function markActiveStage(stage, theme){
    if (activeStageGroup){
      activeStageGroup.classList.remove('is-active');
      delete activeStageGroup.dataset.activeTheme;
    }
    const next = stageGroups.find(group => Number(group.dataset.stageGroup) === stage);
    activeStageGroup = next || null;
    if (activeStageGroup){
      activeStageGroup.classList.add('is-active');
      activeStageGroup.dataset.activeTheme = theme;
    }
  }

  function announce(theme, stage){
    if (!liveRegion) return;
    const label = THEME_LABELS[theme] || theme;
    liveRegion.textContent = `${label} — ${STAGES[stage]}: ${COPY[theme][stage]}`;
  }

  function disableBackgroundFocus(){
    disabledButtons = Array.from(root.querySelectorAll('button')).filter(btn => !popover.contains(btn));
    disabledButtons.forEach(btn => {
      btn.dataset.prevTabIndex = btn.hasAttribute('tabindex') ? btn.getAttribute('tabindex') : '';
      btn.setAttribute('tabindex', '-1');
    });
    root.setAttribute('data-modal-open', 'true');
  }

  function restoreBackgroundFocus(){
    disabledButtons.forEach(btn => {
      const prev = btn.dataset.prevTabIndex;
      if (prev === undefined) return;
      if (prev && prev.length){
        btn.setAttribute('tabindex', prev);
      } else {
        btn.removeAttribute('tabindex');
      }
      delete btn.dataset.prevTabIndex;
    });
    disabledButtons = [];
    root.removeAttribute('data-modal-open');
  }

  function scrollCardIntoView(){
    if (prefersReducedMotion.matches){
      card.scrollIntoView({ block:'nearest' });
    } else {
      card.scrollIntoView({ block:'nearest', behavior:'smooth' });
    }
  }

  function layoutPopover(trigger, stage, theme){
    clearFloatingTitle();

    if (verticalQuery.matches){
      popover.hidden = false;
      card.style.left = 'auto';
      card.style.top  = 'auto';
      requestAnimationFrame(scrollCardIntoView);
      return;
    }

    const rDot  = trigger.getBoundingClientRect();
    const rMid  = midRow.getBoundingClientRect();
    const rTop  = guideTop.getBoundingClientRect();
    const rBot  = guideBot.getBoundingClientRect();
    const rBase = baseline.getBoundingClientRect();

    popover.hidden = false;
    card.style.left = '0px';
    card.style.top  = '0px';

    const rCard0 = card.getBoundingClientRect();

    const desiredLeft = rDot.left - rMid.left - (rCard0.width / 2) + (rDot.width / 2);
    const maxLeft     = rMid.width - rCard0.width - 24;
    const minLeft     = 24;
    const left        = Math.max(minLeft, Math.min(desiredLeft, maxLeft));

    const laneUpMin  = rTop.bottom  - rMid.top + 12;
    const laneUpMax  = rBase.top    - rMid.top - rCard0.height - 12;
    const laneDnMin  = rBase.bottom - rMid.top + 12;
    const laneDnMax  = rBot.top     - rMid.top - rCard0.height - 12;

    const preferredUp = rDot.top    - rMid.top - rCard0.height - 12;
    const preferredDn = rDot.bottom - rMid.top + 12;

    const top = (theme === 'reciprocity')
      ? Math.max(laneDnMin, Math.min(preferredDn, laneDnMax))
      : Math.max(laneUpMin, Math.min(preferredUp, laneUpMax));

    card.style.left = left + 'px';
    card.style.top  = top  + 'px';

    const rCard = card.getBoundingClientRect();
    placeFloatingTitle(stage, theme, rCard);
  }

  function openPopover(btn){
    const stage = Number(btn.getAttribute('data-stage'));
    const theme = btn.getAttribute('data-theme');
    if (Number.isNaN(stage) || !theme) return;

    lastTrigger = btn;
    markActiveDot(btn, theme);
    markActiveStage(stage, theme);
    isModalOpen = true;
    setHoverStage(stage);

    const themeLabel = THEME_LABELS[theme] || theme;
    titleEl.textContent = `${themeLabel} — ${STAGES[stage]}`;
    textEl.textContent  = COPY[theme][stage];
    card.dataset.theme  = theme;

    announce(theme, stage);
    disableBackgroundFocus();
    layoutPopover(btn, stage, theme);

    closeBtn.focus();
    document.addEventListener('keydown', onEsc);
  }

  function closePopover(){
    if (popover.hidden) return;
    popover.hidden = true;
    isModalOpen = false;

    if (liveRegion) liveRegion.textContent = '';

    if (activeDot){
      activeDot.classList.remove('is-active');
      activeDot = null;
    }
    if (activeStageGroup){
      activeStageGroup.classList.remove('is-active');
      delete activeStageGroup.dataset.activeTheme;
      activeStageGroup = null;
    }

    clearFloatingTitle();
    setHoverStage(null);
    document.removeEventListener('keydown', onEsc);
    restoreBackgroundFocus();

    const returnFocus = lastTrigger;
    lastTrigger = null;
    if (returnFocus){
      requestAnimationFrame(() => returnFocus.focus());
    }
  }

  function onEsc(e){
    if (e.key === 'Escape'){
      e.preventDefault();
      closePopover();
    }
  }

  closeBtn.addEventListener('click', closePopover);

  dots.forEach(btn => {
    btn.type = 'button';
    const stage = btn.getAttribute('data-stage');
    btn.addEventListener('mouseenter', () => {
      if (!isModalOpen) setHoverStage(stage);
    });
    btn.addEventListener('mouseleave', () => {
      if (!isModalOpen) setHoverStage(null);
    });
    btn.addEventListener('focus', () => setHoverStage(stage));
    btn.addEventListener('blur', () => {
      if (!isModalOpen || btn !== activeDot){
        setHoverStage(null);
      }
    });
    btn.addEventListener('click', () => openPopover(btn));
  });

  stageGroups.forEach(group => {
    const stage = group.dataset.stageGroup;
    group.addEventListener('mouseenter', () => {
      if (!isModalOpen) setHoverStage(stage);
    });
    group.addEventListener('mouseleave', () => {
      if (!isModalOpen) setHoverStage(null);
    });
  });

  dotline.addEventListener('mouseleave', () => {
    if (!isModalOpen) setHoverStage(null);
  });

  const onLayoutChange = () => {
    if (!popover.hidden && activeDot){
      const stage = Number(activeDot.getAttribute('data-stage'));
      const theme = activeDot.getAttribute('data-theme');
      layoutPopover(activeDot, stage, theme);
    }
  };

  if (typeof verticalQuery.addEventListener === 'function'){
    verticalQuery.addEventListener('change', onLayoutChange);
  } else if (typeof verticalQuery.addListener === 'function'){
    verticalQuery.addListener(onLayoutChange);
  }
  window.addEventListener('resize', onLayoutChange);
})();
