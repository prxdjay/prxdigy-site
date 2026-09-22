(() => {
  'use strict';

  const config = window.PRXDIGY_CONFIG || {};
  const hasConfig = /^https:\/\//.test(config.supabaseUrl || '') &&
    config.supabaseAnonKey &&
    !config.supabaseUrl.includes('YOUR_') &&
    !config.supabaseAnonKey.includes('YOUR_');

  const screens = {
    boot: document.getElementById('bootScreen'),
    config: document.getElementById('configScreen'),
    auth: document.getElementById('authScreen'),
    pending: document.getElementById('pendingScreen'),
    rejected: document.getElementById('rejectedScreen'),
    portal: document.getElementById('portalApp')
  };

  const pages = {
    home: document.getElementById('pageHome'),
    menu: document.getElementById('pageMenu'),
    playbook: document.getElementById('pagePlaybook'),
    team: document.getElementById('pageTeam')
  };

  const viewDefinitions = {
    brooklyn: {
      page: 'menu',
      division: 'studio',
      location: 'brooklyn',
      eyebrow: 'PRXDIGY STUDIO / 01',
      title: 'Brooklyn',
      subtitle: 'Studio services, loyalty rates, newcomer offers, and recurring plans.',
      badge: 'BROOKLYN / CONFIRMED'
    },
    'long-island': {
      page: 'menu',
      division: 'studio',
      location: 'long_island',
      eyebrow: 'PRXDIGY STUDIO / 02',
      title: 'Long Island',
      subtitle: 'Location-specific recording prices and clearly marked confirmation items.',
      badge: 'LONG ISLAND / LOCATION-SPECIFIC'
    },
    creative: {
      page: 'menu',
      division: 'creative',
      location: 'all',
      eyebrow: 'PRXDIGY CREATIVE PROJECTS / 03',
      title: 'Creative Projects',
      subtitle: 'Selected artist development, business content, campaigns, and commercial production.',
      badge: 'ARTISTS + BRANDS'
    }
  };

  const audienceNames = {
    loyalty: 'Loyalty',
    newcomer: 'Newcomers',
    artist_project: 'Artist Projects',
    small_business: 'Small Business',
    large_business: 'Large Business'
  };

  let client;
  let state = {
    session: null,
    profile: null,
    services: [],
    notes: [],
    currentView: 'home',
    activeAudience: 'all',
    query: ''
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function showOnlyScreen(name) {
    Object.entries(screens).forEach(([key, node]) => { node.hidden = key !== name; });
  }

  function setAuthMessage(message, success = false) {
    const node = document.getElementById('authMessage');
    node.textContent = message || '';
    node.classList.toggle('success', success);
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { toast.hidden = true; }, 3600);
  }

  function friendlyError(error) {
    const message = (error && error.message) || 'Something went wrong.';
    if (/invalid login/i.test(message)) return 'Email or password is incorrect.';
    if (/email not confirmed/i.test(message)) return 'Confirm your email before signing in.';
    if (/already registered/i.test(message)) return 'An account already exists for this email.';
    return message;
  }

  async function withBusy(form, task) {
    const button = $('button[type="submit"]', form);
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span>Working…</span><b>·</b>';
    try { await task(); } finally { button.disabled = false; button.innerHTML = original; }
  }

  function switchAuthMode(mode) {
    const login = mode === 'login';
    document.getElementById('loginForm').hidden = !login;
    document.getElementById('signupForm').hidden = login;
    document.getElementById('loginTab').classList.toggle('is-active', login);
    document.getElementById('signupTab').classList.toggle('is-active', !login);
    document.getElementById('loginTab').setAttribute('aria-selected', String(login));
    document.getElementById('signupTab').setAttribute('aria-selected', String(!login));
    setAuthMessage('');
  }

  async function loadProfile(userId, attempts = 4) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      if (data) return data;
      await new Promise(resolve => setTimeout(resolve, 350 * (attempt + 1)));
    }
    return null;
  }

  async function loadPortalData() {
    const [servicesResult, notesResult] = await Promise.all([
      client.from('services').select('*').order('sort_order').order('name'),
      client.from('portal_notes').select('*').order('sort_order')
    ]);
    if (servicesResult.error) throw servicesResult.error;
    if (notesResult.error) throw notesResult.error;
    state.services = servicesResult.data || [];
    state.notes = notesResult.data || [];
  }

  async function handleSession(session) {
    state.session = session;
    if (!session) {
      state.profile = null;
      showOnlyScreen('auth');
      return;
    }

    showOnlyScreen('boot');
    try {
      const profile = await loadProfile(session.user.id);
      if (!profile) throw new Error('Your staff profile could not be created. Contact an administrator.');
      state.profile = profile;

      if (profile.status === 'pending') {
        document.getElementById('pendingEmail').textContent = session.user.email || 'Signed-in account';
        showOnlyScreen('pending');
        return;
      }
      if (profile.status !== 'approved') {
        showOnlyScreen('rejected');
        return;
      }

      await loadPortalData();
      hydrateMemberUI();
      renderPlaybookNotes();
      showOnlyScreen('portal');
      navigate('home');
    } catch (error) {
      await client.auth.signOut();
      showOnlyScreen('auth');
      setAuthMessage(friendlyError(error));
    }
  }

  function hydrateMemberUI() {
    const name = state.profile.full_name || state.session.user.email || 'Team member';
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'P';
    document.getElementById('memberName').textContent = name;
    document.getElementById('memberRole').textContent = state.profile.role;
    document.getElementById('memberAvatar').textContent = initials;
    document.getElementById('topRole').textContent = state.profile.role.toUpperCase();
    const isAdmin = state.profile.role === 'admin';
    document.getElementById('teamAccessNav').hidden = !isAdmin;
  }

  function navigate(view) {
    if (view === 'team' && state.profile.role !== 'admin') return;
    state.currentView = view;
    state.query = '';
    state.activeAudience = 'all';
    document.getElementById('serviceSearch').value = '';

    Object.values(pages).forEach(page => { page.hidden = true; });
    if (viewDefinitions[view]) {
      pages.menu.hidden = false;
      setupMenuView(viewDefinitions[view]);
    } else if (view === 'playbook') {
      pages.playbook.hidden = false;
    } else if (view === 'team') {
      pages.team.hidden = false;
      loadTeamMembers();
    } else {
      pages.home.hidden = false;
    }

    $$('.rail-link').forEach(link => link.classList.toggle('is-active', link.dataset.nav === view));
    if (viewDefinitions[view]) {
      const matchingRail = $(`.rail-link[data-nav="${view}"]`);
      if (matchingRail) matchingRail.classList.add('is-active');
    }
    document.querySelector('.side-rail').classList.remove('is-open');
    document.getElementById('mobileMenu').setAttribute('aria-expanded', 'false');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setupMenuView(definition) {
    document.getElementById('menuEyebrow').textContent = definition.eyebrow;
    document.getElementById('menuTitle').textContent = definition.title;
    document.getElementById('menuSubtitle').textContent = definition.subtitle;
    document.getElementById('locationBadge').textContent = definition.badge;
    renderAudienceTabs(definition);
    renderServices(definition);
  }

  function servicesForView(definition) {
    if (definition.location !== 'long_island') {
      return state.services.filter(service => service.division === definition.division && service.location === definition.location);
    }

    const confirmed = state.services.filter(service => service.division === 'studio' && service.location === 'long_island');
    const confirmedKeys = new Set(confirmed.map(service => `${service.audience}|${service.category}|${service.name}`));
    const confirmationCards = state.services
      .filter(service => service.division === 'studio' && service.location === 'brooklyn')
      .filter(service => !confirmedKeys.has(`${service.audience}|${service.category}|${service.name}`))
      .map(service => ({
        ...service,
        id: `confirm-${service.id}`,
        location: 'long_island',
        price_label: 'Confirm rate',
        badge: 'Long Island',
        requires_confirmation: true,
        terms: 'Do not quote a price until the Long Island rate is confirmed by an administrator.'
      }));
    return [...confirmed, ...confirmationCards].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }

  function renderAudienceTabs(definition) {
    const container = document.getElementById('audienceTabs');
    const audiences = [...new Set(servicesForView(definition).map(item => item.audience))];
    container.replaceChildren();
    [{ key: 'all', label: 'All offers' }, ...audiences.map(key => ({ key, label: audienceNames[key] || key }))].forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `audience-tab${state.activeAudience === item.key ? ' is-active' : ''}`;
      button.textContent = item.label;
      button.addEventListener('click', () => {
        state.activeAudience = item.key;
        $$('.audience-tab', container).forEach(tab => tab.classList.remove('is-active'));
        button.classList.add('is-active');
        renderServices(definition);
      });
      container.append(button);
    });
  }

  function serviceMatchesQuery(service) {
    if (!state.query) return true;
    const haystack = [service.name, service.category, service.description, service.price_label, service.best_for, service.recommend_when, ...(service.package_items || [])].join(' ').toLowerCase();
    return haystack.includes(state.query.toLowerCase());
  }

  function renderServices(definition) {
    const services = servicesForView(definition)
      .filter(service => state.activeAudience === 'all' || service.audience === state.activeAudience)
      .filter(serviceMatchesQuery);

    const summary = document.getElementById('serviceSummary');
    summary.textContent = `${services.length} ${services.length === 1 ? 'offer' : 'offers'} · ${state.activeAudience === 'all' ? 'all client types' : (audienceNames[state.activeAudience] || state.activeAudience)}`;
    const container = document.getElementById('serviceGroups');
    const empty = document.getElementById('emptyServices');
    container.replaceChildren();
    empty.hidden = services.length > 0;

    const categories = new Map();
    services.forEach(service => {
      if (!categories.has(service.category)) categories.set(service.category, []);
      categories.get(service.category).push(service);
    });

    [...categories.entries()].forEach(([category, items], groupIndex) => {
      const section = document.createElement('section');
      const header = document.createElement('header');
      header.className = 'service-group-header';
      header.innerHTML = `<span>${String(groupIndex + 1).padStart(2, '0')}</span><h2>${escapeHtml(category)}</h2>`;
      const grid = document.createElement('div');
      grid.className = 'service-grid';
      items.forEach(service => grid.append(buildServiceCard(service)));
      section.append(header, grid);
      container.append(section);
    });
  }

  function buildServiceCard(service) {
    const card = document.getElementById('serviceCardTemplate').content.firstElementChild.cloneNode(true);
    card.classList.toggle('needs-confirmation', service.requires_confirmation);
    $('.service-price', card).textContent = service.price_label;
    $('.service-name', card).textContent = service.name;
    $('.service-description', card).textContent = service.description || 'Internal offer details.';
    $('.best-for', card).textContent = service.best_for || 'Confirm fit during qualification.';
    $('.recommend-when', card).textContent = service.recommend_when || 'Use after the client’s goal and scope are clear.';
    $('.next-offer', card).textContent = service.next_offer || 'Choose the next relevant step.';
    $('.service-terms', card).textContent = service.terms || 'Standard terms apply.';

    const badges = $('.service-badges', card);
    [audienceNames[service.audience] || service.audience, service.badge].filter(Boolean).forEach((label, index) => {
      const badge = document.createElement('span');
      badge.className = `service-badge${index === 0 ? ' hot' : ''}`;
      badge.textContent = label;
      badges.append(badge);
    });
    if (service.requires_confirmation) {
      const badge = document.createElement('span');
      badge.className = 'service-badge warn';
      badge.textContent = 'Confirm rate';
      badges.append(badge);
    }

    const list = $('.package-items', card);
    const packageItems = service.package_items || [];
    list.hidden = packageItems.length === 0;
    packageItems.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      list.append(li);
    });
    return card;
  }

  function renderPlaybookNotes() {
    const container = document.getElementById('playbookNotes');
    container.replaceChildren();
    state.notes.filter(note => note.section === 'playbook' || note.section === 'terms').forEach(note => {
      const article = document.createElement('article');
      article.className = 'note-card glass-panel';
      const label = document.createElement('div');
      label.className = 'panel-label';
      label.textContent = note.section.toUpperCase();
      const title = document.createElement('h3');
      title.textContent = note.title;
      const body = document.createElement('p');
      body.textContent = note.body;
      article.append(label, title, body);
      container.append(article);
    });
  }

  async function loadTeamMembers() {
    const list = document.getElementById('teamList');
    list.innerHTML = '<div class="glass-panel empty-state">Loading team access…</div>';
    const { data, error } = await client.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) {
      list.innerHTML = `<div class="glass-panel empty-state">${escapeHtml(friendlyError(error))}</div>`;
      return;
    }
    list.replaceChildren();
    (data || []).forEach(member => list.append(buildMemberRow(member)));
  }

  function buildMemberRow(member) {
    const row = document.createElement('article');
    row.className = 'team-member';
    const identity = document.createElement('div');
    identity.className = 'team-identity';
    const initials = (member.full_name || 'P').split(/\s+/).filter(Boolean).slice(0,2).map(part => part[0]).join('').toUpperCase();
    identity.innerHTML = `<span class="member-avatar">${escapeHtml(initials)}</span><div><strong>${escapeHtml(member.full_name || 'Unnamed member')}</strong><small>${escapeHtml(member.email || 'No email')} · ${escapeHtml(member.status)} · requested ${new Date(member.created_at).toLocaleDateString()}</small></div>`;

    const controls = document.createElement('div');
    controls.className = 'team-controls';
    const select = document.createElement('select');
    select.setAttribute('aria-label', `Role for ${member.full_name || 'member'}`);
    ['staff', 'sales', 'studio', 'creative', 'admin'].forEach(role => {
      const option = document.createElement('option');
      option.value = role;
      option.textContent = role[0].toUpperCase() + role.slice(1);
      option.selected = member.role === role;
      select.append(option);
    });
    const approve = document.createElement('button');
    approve.type = 'button';
    approve.className = 'approve';
    approve.textContent = member.status === 'approved' ? 'Update' : 'Approve';
    approve.addEventListener('click', () => updateMember(member.id, 'approved', select.value));
    const reject = document.createElement('button');
    reject.type = 'button';
    reject.className = 'reject';
    reject.textContent = 'Reject';
    reject.addEventListener('click', () => updateMember(member.id, 'rejected', select.value));
    if (member.id === state.profile.id) {
      select.disabled = true;
      approve.disabled = true;
      approve.textContent = 'Current account';
      reject.disabled = true;
    }
    controls.append(select, approve, reject);
    row.append(identity, controls);
    return row;
  }

  async function updateMember(memberId, status, role) {
    const { error } = await client.rpc('admin_set_member_status', {
      target_user: memberId,
      next_status: status,
      next_role: role
    });
    if (error) {
      showToast(friendlyError(error));
      return;
    }
    showToast(`Team access ${status}.`);
    await loadTeamMembers();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function bindEvents() {
    document.getElementById('loginTab').addEventListener('click', () => switchAuthMode('login'));
    document.getElementById('signupTab').addEventListener('click', () => switchAuthMode('signup'));

    document.getElementById('loginForm').addEventListener('submit', event => {
      event.preventDefault();
      setAuthMessage('');
      withBusy(event.currentTarget, async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) setAuthMessage(friendlyError(error));
      });
    });

    document.getElementById('signupForm').addEventListener('submit', event => {
      event.preventDefault();
      setAuthMessage('');
      withBusy(event.currentTarget, async () => {
        const fullName = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        if (fullName.length < 2) return setAuthMessage('Enter the staff member’s full name.');
        if (password.length < 10) return setAuthMessage('Password must contain at least 10 characters.');
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
            data: { full_name: fullName }
          }
        });
        if (error) return setAuthMessage(friendlyError(error));
        if (data.session) {
          setAuthMessage('Account created. An administrator must approve access.', true);
        } else {
          setAuthMessage('Account created. Check your email to confirm it, then wait for approval.', true);
        }
        event.currentTarget.reset();
      });
    });

    $$('[data-nav]').forEach(button => button.addEventListener('click', event => {
      event.preventDefault();
      navigate(button.dataset.nav);
    }));

    $$('[data-placeholder]').forEach(button => button.addEventListener('click', () => {
      showToast(`${button.dataset.placeholder} is reserved for a future portal module.`);
    }));

    const signOut = () => client.auth.signOut();
    document.getElementById('signOutButton').addEventListener('click', signOut);
    document.getElementById('pendingSignOut').addEventListener('click', signOut);
    document.getElementById('rejectedSignOut').addEventListener('click', signOut);

    document.getElementById('serviceSearch').addEventListener('input', event => {
      state.query = event.target.value.trim();
      const definition = viewDefinitions[state.currentView];
      if (definition) renderServices(definition);
    });

    document.getElementById('mobileMenu').addEventListener('click', event => {
      const rail = document.querySelector('.side-rail');
      const open = rail.classList.toggle('is-open');
      event.currentTarget.setAttribute('aria-expanded', String(open));
    });

    window.setInterval(() => {
      document.getElementById('clockLabel').textContent = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' }).format(new Date());
    }, 1000);
  }

  async function init() {
    if (!hasConfig || !window.supabase) {
      showOnlyScreen('config');
      return;
    }
    client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    bindEvents();
    const { data, error } = await client.auth.getSession();
    if (error) {
      showOnlyScreen('auth');
      setAuthMessage(friendlyError(error));
      return;
    }
    client.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token !== state.session?.access_token || !session) handleSession(session);
    });
    await handleSession(data.session);
  }

  init();
})();
