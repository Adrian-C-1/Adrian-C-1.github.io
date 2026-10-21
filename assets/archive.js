const form = document.querySelector('.archive-controls');
const query = form.elements.q;
const sort = form.elements.sort;
const eventFilter = form.elements.event;
const list = document.querySelector('#archive-list');
const entries = [...list.querySelectorAll('.post-entry')];
const clear = document.querySelector('.clear-search');
const empty = document.querySelector('.archive-empty');
const count = document.querySelector('.archive-result-count');

function normalize(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function restoreFilters() {
  const parameters = new URLSearchParams(location.search);
  query.value = parameters.get('q') || '';
  const kind = parameters.get('kind');
  const requestedEvent = parameters.get('event') || '';
  eventFilter.value = [...eventFilter.options].some((option) => option.value === requestedEvent) ? requestedEvent : '';
  form.elements.kind.value = ['article', 'ctf'].includes(kind) ? kind : eventFilter.value ? 'ctf' : 'all';
  sort.value = parameters.get('sort') === 'oldest' ? 'oldest' : 'newest';
}

function filterEntries(updateUrl = true) {
  const kind = form.elements.kind.value;
  eventFilter.disabled = kind === 'article';
  if (eventFilter.disabled) eventFilter.value = '';
  const words = normalize(query.value.trim()).split(/\s+/).filter(Boolean);
  const ordered = [...entries].sort((first, second) => {
    const order = second.dataset.date.localeCompare(first.dataset.date);
    return (sort.value === 'oldest' ? -order : order) || entries.indexOf(first) - entries.indexOf(second);
  });
  let visible = 0;
  for (const entry of ordered) {
    const matches = (kind === 'all' || entry.dataset.kind === kind) && (!eventFilter.value || entry.dataset.event === eventFilter.value) && words.every((word) => normalize(entry.dataset.search).includes(word));
    entry.hidden = !matches;
    if (matches) visible++;
    list.append(entry);
  }
  count.textContent = `${visible} ${visible === 1 ? 'entry' : 'entries'}${words.length || kind !== 'all' || eventFilter.value ? ` of ${entries.length}` : ''}`;
  clear.hidden = !query.value;
  empty.hidden = visible > 0 || entries.length === 0;
  document.querySelectorAll('[data-nav-kind]').forEach((link) => {
    if (link.dataset.navKind === kind) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (updateUrl) {
    const url = new URL(location.href);
    for (const [key, value, fallback] of [['q', query.value.trim(), ''], ['kind', kind, 'all'], ['event', eventFilter.value, ''], ['sort', sort.value, 'newest']]) {
      if (value === fallback) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    history.replaceState(null, '', url);
  }
}

form.addEventListener('submit', (event) => { event.preventDefault(); filterEntries(); });
form.addEventListener('input', () => filterEntries());
form.addEventListener('change', (event) => {
  if (event.target === eventFilter && eventFilter.value) form.elements.kind.value = 'ctf';
  filterEntries();
});
clear.addEventListener('click', () => { query.value = ''; filterEntries(); query.focus(); });
document.querySelector('.reset-archive').addEventListener('click', () => {
  form.reset();
  filterEntries();
  query.focus();
});
window.addEventListener('popstate', () => { restoreFilters(); filterEntries(false); });
restoreFilters();
filterEntries(false);