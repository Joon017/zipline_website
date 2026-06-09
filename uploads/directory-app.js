/* ===== Zipline Jobs — directory app ===== */
(function () {
  const { COMPANIES, JOBS } = window.ZIPLINE;

  const state = {
    view: 'companies',
    search: '',
    country: 'all',
    industry: 'all',
    remote: false,
    company: 'all',      // crumb filter when drilling into a company
    sort: 'az',
  };

  const $ = (s) => document.querySelector(s);
  const root = $('#view-root');

  // ---- populate selects ----
  const countries = ['all', ...[...new Set(JOBS.map(j => j.country))].sort()];
  const industries = ['all', ...[...new Set(COMPANIES.map(c => c.industry))].sort()];

  function fillSelect(el, values, labelFn) {
    el.innerHTML = values.map(v => `<option value="${v}">${labelFn(v)}</option>`).join('');
  }
  fillSelect($('#country'), countries, v => v === 'all' ? 'All countries' : v);
  fillSelect($('#industry'), industries, v => v === 'all' ? 'All industries' : v);

  const SORTS = {
    companies: [
      ['az', 'Sort: A → Z'],
      ['za', 'Sort: Z → A'],
      ['most', 'Most open roles'],
      ['fewest', 'Fewest open roles'],
      ['newest', 'Recently added'],
    ],
    jobs: [
      ['newest', 'Newest first'],
      ['oldest', 'Oldest first'],
      ['company', 'Company A → Z'],
      ['title', 'Role A → Z'],
    ],
  };
  function fillSort() {
    const opts = SORTS[state.view];
    $('#sort').innerHTML = opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    // pick sensible default per view
    state.sort = opts[0][0];
    $('#sort').value = state.sort;
  }

  // ---- stats ----
  $('#stat-co').textContent = COMPANIES.length;
  $('#stat-jobs').textContent = JOBS.length;
  $('#seg-co').textContent = COMPANIES.length;
  $('#seg-jobs').textContent = JOBS.length;

  // ---- filtering ----
  function matchSearch(text) {
    if (!state.search) return true;
    return text.toLowerCase().includes(state.search.toLowerCase());
  }

  function filteredCompanies() {
    let list = COMPANIES.filter(co => {
      if (state.industry !== 'all' && co.industry !== state.industry) return false;
      if (state.country !== 'all' && !co.countries.includes(state.country)) return false;
      if (state.remote && !co.hasRemote) return false;
      if (!matchSearch(co.name + ' ' + co.industry)) return false;
      return true;
    });
    const s = state.sort;
    list.sort((a, b) => {
      if (s === 'az') return a.name.localeCompare(b.name);
      if (s === 'za') return b.name.localeCompare(a.name);
      if (s === 'most') return b.roleCount - a.roleCount || a.name.localeCompare(b.name);
      if (s === 'fewest') return a.roleCount - b.roleCount || a.name.localeCompare(b.name);
      if (s === 'newest') return b.added - a.added;
      return 0;
    });
    return list;
  }

  function filteredJobs() {
    let list = JOBS.filter(j => {
      if (state.company !== 'all' && j.company !== state.company) return false;
      if (state.country !== 'all' && j.country !== state.country) return false;
      if (state.remote && !j.remote) return false;
      const co = COMPANIES.find(c => c.name === j.company);
      if (state.industry !== 'all' && co.industry !== state.industry) return false;
      if (!matchSearch(j.title + ' ' + j.company + ' ' + j.dept + ' ' + j.city)) return false;
      return true;
    });
    const s = state.sort;
    list.sort((a, b) => {
      if (s === 'newest') return a.posted - b.posted;
      if (s === 'oldest') return b.posted - a.posted;
      if (s === 'company') return a.company.localeCompare(b.company) || a.title.localeCompare(b.title);
      if (s === 'title') return a.title.localeCompare(b.title);
      return 0;
    });
    return list;
  }

  // ---- rendering ----
  function mono(co) {
    return `<div class="mono" style="background:${co.color}">${co.initial}</div>`;
  }
  function postedLabel(d) {
    if (d <= 1) return 'Posted today';
    if (d <= 7) return `${d}d ago`;
    if (d <= 14) return '1w ago';
    if (d <= 21) return '2w ago';
    return '3w+ ago';
  }
  const companyBy = {};
  COMPANIES.forEach(c => companyBy[c.name] = c);

  function renderCompanies() {
    const list = filteredCompanies();
    $('#count').innerHTML = `<b>${list.length}</b> ${list.length === 1 ? 'company' : 'companies'}` +
      (state.search || state.country !== 'all' || state.industry !== 'all' || state.remote ? ' match your filters' : ' tracked');
    if (!list.length) return renderEmpty();
    root.innerHTML = `<div class="comp-grid">` + list.map(co => {
      const tags = [co.hq, ...(co.hasRemote ? ['Remote-friendly'] : [])].slice(0, 3);
      return `
      <div class="comp-card" data-company="${co.name}">
        <div class="comp-card-top">
          ${mono(co)}
          <div><div class="comp-name">${co.name}</div><div class="comp-ind">${co.industry}</div></div>
        </div>
        <div class="comp-tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="comp-foot">
          <span class="comp-roles"><span class="pulse"></span>${co.roleCount} open role${co.roleCount === 1 ? '' : 's'}</span>
          <span class="comp-view">View roles <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        </div>
      </div>`;
    }).join('') + `</div>`;
    root.querySelectorAll('.comp-card').forEach(card => {
      card.addEventListener('click', () => {
        state.company = card.dataset.company;
        setView('jobs');
      });
    });
  }

  function renderJobs() {
    const list = filteredJobs();
    const scope = state.company !== 'all' ? ` at <b>${state.company}</b>` : '';
    $('#count').innerHTML = `<b>${list.length}</b> open role${list.length === 1 ? '' : 's'}${scope}`;
    if (!list.length) return renderEmpty();
    const ctaRow = `
      <div class="submit-cta-row">
        <p><b>Don't see the company you want?</b> Nominate its career page and we'll start tracking it.</p>
        <a href="submit.html" class="btn btn-primary">Submit a company</a>
      </div>`;
    root.innerHTML = ctaRow + `<div class="jobs-list">` + list.map(j => {
      const co = companyBy[j.company];
      return `
      <div class="job-row">
        <div class="job-co">
          ${mono(co)}
          <div><div class="job-co-name">${j.company}</div><div class="job-co-dept">${j.dept}</div></div>
        </div>
        <div class="job-main">
          <div class="job-title">${j.title}</div>
          <div class="job-sub">${co.industry}<span class="sep"></span>${j.remote ? 'Remote' : 'On-site / Hybrid'}</div>
        </div>
        <div class="job-loc">${j.city}<div class="posted">${postedLabel(j.posted)}</div></div>
        <a class="job-apply" href="#" onclick="return false;">Apply <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      </div>`;
    }).join('') + `</div>`;
  }

  function renderEmpty() {
    root.innerHTML = `
      <div class="empty">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#B7C3D0" stroke-width="1.6"/><path d="M16 16l5 5" stroke="#B7C3D0" stroke-width="1.6" stroke-linecap="round"/></svg>
        <h3>Nothing matches those filters</h3>
        <p>Try clearing a filter — or submit the company you're looking for.</p>
        <div style="margin-top:22px; display:flex; gap:12px; justify-content:center;">
          <button class="btn btn-ghost" id="reset-empty">Clear filters</button>
          <a href="submit.html" class="btn btn-primary">Submit a company</a>
        </div>
      </div>`;
    const r = $('#reset-empty');
    if (r) r.addEventListener('click', resetFilters);
  }

  function renderCrumb() {
    const el = $('#crumb');
    if (state.view === 'jobs' && state.company !== 'all') {
      el.innerHTML = `<span class="chip">${state.company}</span><span class="clear" id="clear-co"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>All companies</span>`;
      $('#clear-co').addEventListener('click', () => { state.company = 'all'; render(); });
    } else {
      el.innerHTML = '';
    }
  }

  function render() {
    renderCrumb();
    if (state.view === 'companies') renderCompanies();
    else renderJobs();
  }

  function setView(v) {
    state.view = v;
    document.querySelectorAll('#view-seg button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
    fillSort();
    if (v === 'companies') state.company = 'all';
    render();
  }

  function resetFilters() {
    state.search = ''; state.country = 'all'; state.industry = 'all'; state.remote = false; state.company = 'all';
    $('#search').value = '';
    $('#country').value = 'all';
    $('#industry').value = 'all';
    $('#remote-toggle').classList.remove('on');
    render();
  }

  // ---- events ----
  document.querySelectorAll('#view-seg button').forEach(b => {
    b.addEventListener('click', () => setView(b.dataset.view));
  });
  $('#search').addEventListener('input', e => { state.search = e.target.value; render(); });
  $('#country').addEventListener('change', e => { state.country = e.target.value; render(); });
  $('#industry').addEventListener('change', e => { state.industry = e.target.value; render(); });
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
  $('#remote-toggle').addEventListener('click', () => {
    state.remote = !state.remote;
    $('#remote-toggle').classList.toggle('on', state.remote);
    render();
  });

  // init
  fillSort();
  render();
})();
