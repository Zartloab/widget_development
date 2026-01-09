// script.js

(function () {
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
  const STAGES = ["Indigenous Led", "Delegative", "Co-Design", "Participatory", "Top Down"];

  const guideTop = document.getElementById('guideTop');
  const guideBot = document.getElementById('guideBottom');
  const baseline = document.getElementById('baseline');
  const midRow = document.getElementById('midRow');
  const dotline = midRow.querySelector('.dotline');

  const floatEl = document.getElementById('titleFloat');
  const popover = document.getElementById('imw-popover');
  const card = popover.querySelector('.popover-card');
  const titleEl = document.getElementById('imw-popover-title');
  const textEl = document.getElementById('imw-popover-text');

  const titleMap = {};
  let lastTrigger = null;
  document.querySelectorAll('.col-title').forEach(n => { titleMap[Number(n.dataset.stageTitle)] = n; });

  // column hover colorization (mouse)
  dotline.addEventListener('mousemove', (e) => {
    const r = dotline.getBoundingClientRect();
    const x = e.clientX - r.left;
    const col = Math.min(4, Math.max(0, Math.floor((x / r.width) * 5)));
    root.setAttribute('data-hover-col', String(col));
  });
  dotline.addEventListener('mouseleave', () => root.removeAttribute('data-hover-col'));

  // keyboard parity
  root.querySelectorAll('.dot').forEach(btn => {
    btn.addEventListener('focus', () => root.setAttribute('data-hover-col', btn.getAttribute('data-stage')));
    btn.addEventListener('blur', () => root.removeAttribute('data-hover-col'));
  });

  function centerXForStage(stage) {
    // middle (power) dot is the anchor
    const btn = dotline.querySelector(`.dot[data-stage="${stage}"][data-theme="power"]`);
    const r = btn.getBoundingClientRect();
    const m = midRow.getBoundingClientRect();
    return r.left - m.left + r.width / 2;
  }

  function placeFloatingTitle(stage, theme, cardRect) {
    const defaultTitle = titleMap[stage];
    if (!defaultTitle) return;

    // hide the default title while floating
    defaultTitle.style.visibility = 'hidden';

    // set content + theme-highlighting
    floatEl.innerHTML = `<span>${STAGES[stage]}</span><span class="title-arrows">↔</span>`;
    floatEl.dataset.theme = theme;
    floatEl.classList.add('active');

    // measure and place
    floatEl.style.transform = 'translate(-9999px,-9999px)';
    floatEl.style.display = 'block';

    const m = midRow.getBoundingClientRect();
    const fr = floatEl.getBoundingClientRect();

    const cx = centerXForStage(stage);
    const left = Math.max(8, Math.min(cx - fr.width / 2, m.width - fr.width - 8));
    const margin = 10;
    const top = (theme === 'reciprocity')
      ? (cardRect.bottom - m.top + margin)
      : (cardRect.top - m.top - fr.height - margin);

    floatEl.style.left = left + 'px';
    floatEl.style.top = top + 'px';
    floatEl.style.transform = 'none';
  }

  function clearFloatingTitle() {
    floatEl.classList.remove('active');
    delete floatEl.dataset.theme;
    floatEl.style.transform = 'translate(-9999px,-9999px)';
    floatEl.style.display = 'block';
    // restore all defaults
    Object.values(titleMap).forEach(n => n.style.visibility = '');
  }

  function openPopover(btn) {
    clearFloatingTitle();
    root.querySelectorAll('.dot').forEach(dot => dot.classList.remove('active'));
    lastTrigger = btn;

    const stage = Number(btn.getAttribute('data-stage'));
    const theme = btn.getAttribute('data-theme');

    titleEl.textContent = STAGES[stage];
    textEl.textContent = COPY[theme][stage];
    card.dataset.theme = theme;

    // A) Show popover + reset card
    popover.hidden = false;
    card.style.left = '0px';
    card.style.top = '0px';

    // B) Get dot center in VIEWPORT coordinates (absolute truth)
    const rDot = btn.getBoundingClientRect();
    const dotCenterX = rDot.left + rDot.width / 2;

    // C) Get reference rects
    const rDots = dotline.getBoundingClientRect();
    const rCard = card.getBoundingClientRect();
    const cardWidth = rCard.width;
    const cardHeight = rCard.height;

    // D) Decide side based on dot position within dotline
    const dotRelativeX = dotCenterX - rDots.left;
    const dotlineWidth = rDots.width;
    const side = (dotRelativeX <= dotlineWidth / 2) ? 'left' : 'right';

    // E) Set direction based on theme
    const direction = (theme === 'reciprocity') ? 'up' : 'down';
    card.setAttribute('data-pointer-side', side);
    card.setAttribute('data-pointer-direction', direction);

    // F) Calculate target VIEWPORT positions for the sharp corner
    const targetCornerX = dotCenterX;  // Corner must be at dot center X
    let targetCornerY;

    if (theme === 'reciprocity') {
      // Green: popup BELOW dots, sharp corner on TOP
      // Place corner just below the dotline (small gap)
      targetCornerY = rDots.bottom + 8;  // 8px gap from dotline bottom
    } else {
      // Blue/Orange: popup ABOVE dots, sharp corner on BOTTOM
      // Place corner just above the dotline (small gap)
      targetCornerY = rDots.top - 8;  // 8px gap from dotline top
    }

    // G) Calculate card top-left position based on which corner is sharp
    let cardLeft, cardTop;

    if (side === 'left') {
      // Sharp corner is on LEFT edge
      cardLeft = targetCornerX;
    } else {
      // Sharp corner is on RIGHT edge
      cardLeft = targetCornerX - cardWidth;
    }

    if (direction === 'up') {
      // Sharp corner is on TOP edge (green popups)
      cardTop = targetCornerY;
    } else {
      // Sharp corner is on BOTTOM edge (blue/orange popups)
      cardTop = targetCornerY - cardHeight;
    }

    // H) Convert viewport coordinates to offsetParent coordinates
    const op = card.offsetParent;
    const rOP = op.getBoundingClientRect();
    const left = cardLeft - rOP.left;
    const top = cardTop - rOP.top;

    // I) Apply position
    card.style.left = left + 'px';
    card.style.top = top + 'px';

    // J) VERIFY and CORRECT using viewport coordinates
    const rCardFinal = card.getBoundingClientRect();
    const actualCornerX = (side === 'left') ? rCardFinal.left : rCardFinal.right;
    const actualCornerY = (direction === 'up') ? rCardFinal.top : rCardFinal.bottom;

    const errorX = dotCenterX - actualCornerX;
    const errorY = targetCornerY - actualCornerY;

    // Apply corrections if needed
    if (Math.abs(errorX) > 0.5 || Math.abs(errorY) > 0.5) {
      card.style.left = (left + errorX) + 'px';
      card.style.top = (top + errorY) + 'px';
    }

    // K) Place floating title
    const rCardForTitle = card.getBoundingClientRect();
    placeFloatingTitle(stage, theme, rCardForTitle);

    // Highlight active dot
    btn.classList.add('active');

    // Add click-outside listener
    document.addEventListener('click', onClickOutside);
    document.addEventListener('keydown', onEsc);
  }

  function closePopover() {
    popover.hidden = true;
    clearFloatingTitle();
    document.removeEventListener('keydown', onEsc);
    document.removeEventListener('click', onClickOutside); // Remove click-outside listener
    if (lastTrigger) {
      lastTrigger.classList.remove('active'); // Remove active class
      lastTrigger.blur(); // Remove focus to prevent outline
      lastTrigger = null;
    }
  }

  function onClickOutside(e) {
    if (!popover.contains(e.target) && !lastTrigger.contains(e.target)) {
      closePopover();
    }
  }

  function onEsc(e) {
    if (e.key === 'Escape') closePopover();
  }

  // Removed closeBtn.addEventListener('click', closePopover);

  // click handlers
  root.querySelectorAll('.dot').forEach(btn => {
    btn.type = 'button';
    btn.addEventListener('click', () => openPopover(btn));
  });
})();
