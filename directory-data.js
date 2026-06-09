/* ===== Zipline Jobs — directory mock data ===== */
(function () {
  const COMPANIES = [
    { name: 'Stripe',     initial: 'S', color: '#635BFF', industry: 'Payments',        hq: 'San Francisco, CA' },
    { name: 'Figma',      initial: 'F', color: '#F24E1E', industry: 'Design tools',    hq: 'San Francisco, CA' },
    { name: 'Notion',     initial: 'N', color: '#1A1A1A', industry: 'Productivity',    hq: 'San Francisco, CA' },
    { name: 'Linear',     initial: 'L', color: '#5E6AD2', industry: 'Dev tools',       hq: 'Remote' },
    { name: 'Airbnb',     initial: 'A', color: '#FF5A5F', industry: 'Travel',          hq: 'San Francisco, CA' },
    { name: 'Vercel',     initial: 'V', color: '#111111', industry: 'Dev tools',       hq: 'San Francisco, CA' },
    { name: 'Spotify',    initial: 'S', color: '#1DB954', industry: 'Media',           hq: 'Stockholm' },
    { name: 'GitHub',     initial: 'G', color: '#24292F', industry: 'Dev tools',       hq: 'Remote' },
    { name: 'Shopify',    initial: 'S', color: '#5FA827', industry: 'E-commerce',      hq: 'Ottawa' },
    { name: 'Anthropic',  initial: 'A', color: '#D97757', industry: 'AI',              hq: 'San Francisco, CA' },
    { name: 'Datadog',    initial: 'D', color: '#632CA6', industry: 'Observability',   hq: 'New York, NY' },
    { name: 'Ramp',       initial: 'R', color: '#E8C547', industry: 'Fintech',         hq: 'New York, NY' },
    { name: 'Plaid',      initial: 'P', color: '#000000', industry: 'Fintech',         hq: 'San Francisco, CA' },
    { name: 'Canva',      initial: 'C', color: '#00C4CC', industry: 'Design tools',    hq: 'Sydney' },
    { name: 'Atlassian',  initial: 'A', color: '#2684FF', industry: 'Productivity',    hq: 'Sydney' },
    { name: 'Airtable',   initial: 'A', color: '#FCB400', industry: 'Productivity',    hq: 'San Francisco, CA' },
    { name: 'Retool',     initial: 'R', color: '#3D5AFE', industry: 'Dev tools',       hq: 'San Francisco, CA' },
    { name: 'Mercury',    initial: 'M', color: '#5A31F4', industry: 'Fintech',         hq: 'San Francisco, CA' },
  ];

  const ROLE_POOL = {
    'Engineering': ['Senior Software Engineer','Frontend Engineer','Backend Engineer','Staff Engineer, Platform','Engineering Manager','Site Reliability Engineer','iOS Engineer','Security Engineer','Full-Stack Engineer'],
    'Design':      ['Product Designer','Senior Product Designer','Brand Designer','Design Systems Lead','UX Researcher'],
    'Product':     ['Product Manager','Senior Product Manager','Group Product Manager','Technical Program Manager'],
    'Data':        ['Data Scientist','Data Engineer','Analytics Engineer','Machine Learning Engineer'],
    'Go-to-Market':['Account Executive','Sales Engineer','Customer Success Manager','Growth Marketer','Content Strategist'],
    'Operations':  ['Recruiter','People Partner','Finance Analyst','Workplace Experience Lead'],
  };
  const DEPTS = Object.keys(ROLE_POOL);

  const LOCATIONS = [
    { city: 'San Francisco, CA', country: 'United States', remote: false },
    { city: 'New York, NY',      country: 'United States', remote: false },
    { city: 'London',            country: 'United Kingdom', remote: false },
    { city: 'Berlin',            country: 'Germany',        remote: false },
    { city: 'Singapore',         country: 'Singapore',      remote: false },
    { city: 'Toronto',           country: 'Canada',         remote: false },
    { city: 'Dublin',            country: 'Ireland',        remote: false },
    { city: 'Sydney',            country: 'Australia',      remote: false },
    { city: 'Remote — US',       country: 'United States',  remote: true },
    { city: 'Remote — Europe',   country: 'United Kingdom', remote: true },
    { city: 'Remote — Global',   country: 'Remote',         remote: true },
  ];

  // deterministic pseudo-random
  function seeded(n) { let x = Math.sin(n * 99.71) * 43758.5453; return x - Math.floor(x); }

  let jobId = 0;
  const JOBS = [];
  COMPANIES.forEach((co, ci) => {
    const count = 3 + Math.floor(seeded(ci + 1) * 7); // 3–9 roles
    const usedTitles = new Set();
    for (let j = 0; j < count; j++) {
      const s = seeded((ci + 1) * 31 + j * 7);
      const dept = DEPTS[Math.floor(seeded((ci + 3) * 13 + j * 5) * DEPTS.length)];
      const titles = ROLE_POOL[dept];
      let title = titles[Math.floor(s * titles.length)];
      let guard = 0;
      while (usedTitles.has(title) && guard < 12) { title = titles[Math.floor(seeded((ci+1)*j*3 + guard*17) * titles.length)]; guard++; }
      usedTitles.add(title);
      // bias location toward HQ country sometimes
      let loc = LOCATIONS[Math.floor(seeded((ci + 5) * 17 + j * 11) * LOCATIONS.length)];
      const posted = 1 + Math.floor(seeded((ci + 7) * 19 + j * 23) * 28); // days ago
      JOBS.push({
        id: ++jobId,
        company: co.name,
        title: title,
        dept: dept,
        city: loc.city,
        country: loc.country,
        remote: loc.remote,
        posted: posted,
      });
    }
    co.roleCount = count;
    co.added = ci; // recency order (lower = added earlier)
  });

  // attach derived: countries & remote per company
  COMPANIES.forEach(co => {
    const js = JOBS.filter(j => j.company === co.name);
    co.countries = [...new Set(js.map(j => j.country))];
    co.hasRemote = js.some(j => j.remote);
    co.depts = [...new Set(js.map(j => j.dept))];
  });

  window.ZIPLINE = { COMPANIES, JOBS };
})();
