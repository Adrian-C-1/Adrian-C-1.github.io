document.documentElement.classList.add('js');

const copySvg = '<svg aria-hidden="true" width="16" height="16"><use href="assets/icons.svg#copy"></use></svg>';
const checkSvg = '<svg aria-hidden="true" width="16" height="16"><use href="assets/icons.svg#check"></use></svg>';
const status = document.querySelector('#reader-status');

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Clipboard unavailable');
}

document.querySelectorAll('.copy-code').forEach((button) => {
  const icon = button.querySelector('.copy-icon');
  const label = button.querySelector('.copy-label');
  icon.innerHTML = copySvg;
  let reset;
  button.addEventListener('click', async () => {
    try {
      await copyText(button.closest('.code-block').querySelector('code').textContent);
      icon.innerHTML = checkSvg;
      label.textContent = 'Copied';
      status.textContent = 'Code copied to clipboard.';
    } catch {
      label.textContent = 'Select';
      const range = document.createRange();
      range.selectNodeContents(button.closest('.code-block').querySelector('code'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Clipboard unavailable. Code selected for manual copying.';
    }
    clearTimeout(reset);
    reset = setTimeout(() => { label.textContent = 'Copy'; icon.innerHTML = copySvg; }, 2200);
  });
});

const progress = document.querySelector('.reading-progress span');
const article = document.querySelector('article');
const headings = [...document.querySelectorAll('.article-body h2, .article-body h3')];
const tocLinks = [...document.querySelectorAll('[data-heading]')];
let scheduled = false;

function updateReadingPosition() {
  if (!article || !progress) return;
  const articleEnd = article.offsetTop + article.offsetHeight - window.innerHeight;
  const percentage = Math.max(0, Math.min(1, window.scrollY / Math.max(1, articleEnd)));
  progress.style.transform = `scaleX(${percentage})`;
  let current = headings[0]?.id;
  for (const heading of headings) {
    if (heading.getBoundingClientRect().top <= 140) current = heading.id;
    else break;
  }
  for (const link of tocLinks) {
    const active = link.dataset.heading === current;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  scheduled = false;
}
function scheduleUpdate() {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateReadingPosition); }
}
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);
window.addEventListener('load', scheduleUpdate);
updateReadingPosition();

const mobileButton = document.querySelector('.mobile-toc-button');
const mobileContents = document.querySelector('#mobile-toc');
mobileButton?.addEventListener('click', () => { mobileContents.showModal(); mobileButton.setAttribute('aria-expanded', 'true'); });
mobileContents?.addEventListener('close', () => mobileButton.setAttribute('aria-expanded', 'false'));
mobileContents?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => mobileContents.close()));
document.querySelector('.library-button').addEventListener('click', () => document.querySelector('#library').showModal());

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
  new MutationObserver(() => { if (dialog.open) document.body.style.overflow = 'hidden'; }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
});

const viewer = document.querySelector('#image-viewer');
document.querySelectorAll('.prose img').forEach((image) => {
  image.tabIndex = 0;
  image.setAttribute('role', 'button');
  image.setAttribute('aria-label', `Enlarge image: ${image.alt}`);
  const openImage = () => {
    viewer.querySelector('img').src = image.currentSrc || image.src;
    viewer.querySelector('img').alt = image.alt;
    viewer.querySelector('p').textContent = image.title || image.alt;
    viewer.showModal();
  };
  image.addEventListener('click', openImage);
  image.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openImage(); }
  });
});

document.querySelectorAll('.prose table').forEach((table) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'table-scroll';
  wrapper.tabIndex = 0;
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-label', 'Scrollable table');
  table.replaceWith(wrapper);
  wrapper.append(table);
});

document.addEventListener('click', (event) => {
  const menu = document.querySelector('.template-menu');
  if (menu && !menu.contains(event.target)) menu.open = false;
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const menu = document.querySelector('.template-menu');
    if (menu) menu.open = false;
    const dialog = document.querySelector('dialog[open]');
    if (dialog) { event.preventDefault(); dialog.close(); }
  }
});