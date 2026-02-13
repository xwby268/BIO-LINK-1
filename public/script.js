// Global state
let localData = {
    texts: {},
    links: [],
    sidebar: [],
    socials: [],
    customPages: [],
    images: {},
    config: {}
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadContent();
    setupEventListeners();
});

function initializeApp() {
    // Clock update
    updateClock();
    setInterval(updateClock, 1000);

    // Check if on dashboard page
    if (window.location.pathname === '/dashboard') {
        initializeDashboard();
    }
}

function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit', 
            hour12: false 
        });
        clockEl.textContent = timeString;
    }
}

function setupEventListeners() {
    // Close sidebar when clicking backdrop
    document.addEventListener('click', (e) => {
        if (e.target.id === 'sidebar-backdrop') {
            toggleSidebar();
        }
    });

    // Handle escape key for sidebar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('sidebar-hidden')) {
                toggleSidebar();
            }
        }
    });
}

// Sidebar Functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    sidebar.classList.toggle('sidebar-hidden');

    if (!sidebar.classList.contains('sidebar-hidden') && window.innerWidth < 1024) {
        createBackdrop();
    } else {
        removeBackdrop();
    }
}

function createBackdrop() {
    if (!document.getElementById('sidebar-backdrop')) {
        const backdrop = document.createElement('div');
        backdrop.id = 'sidebar-backdrop';
        backdrop.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity';
        backdrop.onclick = toggleSidebar;
        document.body.appendChild(backdrop);
        setTimeout(() => backdrop.style.opacity = '1', 10);
    }
}

function removeBackdrop() {
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) {
        backdrop.style.opacity = '0';
        setTimeout(() => backdrop.remove(), 300);
    }
}

// Admin Functions
function showAdmin() {
    const modal = document.getElementById('admin-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeAdmin() {
    const modal = document.getElementById('admin-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

async function loginAdmin() {
    const passwordInput = document.getElementById('admin-pw');
    if (!passwordInput) return;

    const password = passwordInput.value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (res.ok) {
            document.getElementById('admin-login').classList.add('hidden');
            document.getElementById('admin-panel').classList.remove('hidden');
            renderAdminPanel();
            showNotification('Login successful', 'success');
        } else {
            const data = await res.json();
            showNotification(data.error || 'Wrong password', 'error');
        }
    } catch (error) {
        showNotification('Login failed', 'error');
    }
}

function renderAdminPanel() {
    // Images
    setInputValue('img-desktop', localData.images?.desktop);
    setInputValue('img-mobile', localData.images?.mobile);
    setInputValue('img-profile', localData.images?.profile);

    // Profile Info
    setInputValue('profile-name', localData.texts?.title);
    setInputValue('profile-username', localData.texts?.username);
    setInputValue('profile-bio', localData.texts?.bio);

    // Web Config
    setInputValue('cfg-site-title', localData.config?.siteTitle);
    setInputValue('cfg-meta-desc', localData.config?.metaDesc);
    setInputValue('cfg-meta-keys', localData.config?.metaKeys);

    // Render all editable lists
    renderTextEditList();
    renderLinksEditList();
    renderSidebarEditList();
    renderSocialsEditList();
    renderPagesEditList();
}

function setInputValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
}

function renderTextEditList() {
    const textList = document.getElementById('text-edit-list');
    if (!textList) return;

    textList.innerHTML = '';
    document.querySelectorAll('[data-editable]').forEach(el => {
        const id = el.getAttribute('data-editable');
        const val = el.innerText;
        textList.innerHTML += `
            <div class="space-y-1">
                <label class="text-[10px] text-gray-500 font-bold uppercase">${id}</label>
                <input type="text" value="${escapeHtml(val)}" data-id="${id}" class="admin-text-input w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm">
            </div>
        `;
    });
}

function renderLinksEditList() {
    const linksList = document.getElementById('links-edit-list');
    if (!linksList) return;

    linksList.innerHTML = '';
    localData.links.forEach((link, i) => {
        linksList.innerHTML += createLinkEditor(link, i);
    });
}

function createLinkEditor(link, i) {
    return `
        <div class="ios-panel p-4 rounded-2xl space-y-2 relative" data-index="${i}">
            <input type="text" placeholder="Title" value="${escapeHtml(link.title || '')}" onchange="updateLink(${i}, 'title', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
            <input type="text" placeholder="Subtitle" value="${escapeHtml(link.sub || '')}" onchange="updateLink(${i}, 'sub', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
            <input type="text" placeholder="URL" value="${escapeHtml(link.url || '#')}" onchange="updateLink(${i}, 'url', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
            <input type="text" placeholder="Icon (FontAwesome)" value="${escapeHtml(link.icon || 'fa-solid fa-link')}" onchange="updateLink(${i}, 'icon', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
            <button onclick="removeLink(${i})" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-[10px] flex items-center justify-center hover:bg-red-600 transition-colors">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `;
}

function renderSidebarEditList() {
    const sidebarList = document.getElementById('sidebar-edit-list');
    if (!sidebarList) return;

    sidebarList.innerHTML = '';
    localData.sidebar.forEach((btn, i) => {
        sidebarList.innerHTML += `
            <div class="ios-panel p-4 rounded-2xl space-y-2 relative">
                <input type="text" placeholder="Label" value="${escapeHtml(btn.label || '')}" onchange="updateSidebarBtn(${i}, 'label', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                <input type="text" placeholder="URL" value="${escapeHtml(btn.url || '#')}" onchange="updateSidebarBtn(${i}, 'url', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                <input type="text" placeholder="Icon" value="${escapeHtml(btn.icon || 'fa-solid fa-circle')}" onchange="updateSidebarBtn(${i}, 'icon', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                <button onclick="removeSidebarBtn(${i})" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-[10px] flex items-center justify-center hover:bg-red-600">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
    });
}

function renderSocialsEditList() {
    const socialsList = document.getElementById('socials-edit-list');
    if (!socialsList) return;

    socialsList.innerHTML = '';
    localData.socials.forEach((social, i) => {
        socialsList.innerHTML += `
            <div class="ios-panel p-4 rounded-2xl space-y-2 relative">
                <input type="text" placeholder="URL" value="${escapeHtml(social.url || '#')}" onchange="updateSocial(${i}, 'url', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                <input type="text" placeholder="Icon" value="${escapeHtml(social.icon || 'fa-brands fa-instagram')}" onchange="updateSocial(${i}, 'icon', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                <button onclick="removeSocial(${i})" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-[10px] flex items-center justify-center hover:bg-red-600">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
    });
}

function renderPagesEditList() {
    const pagesList = document.getElementById('pages-edit-list');
    if (!pagesList) return;

    pagesList.innerHTML = '';
    if (!localData.customPages) localData.customPages = [];

    localData.customPages.forEach((page, i) => {
        pagesList.innerHTML += createPageEditor(page, i);
    });
}

function createPageEditor(page, i) {
    const isHTML = page.type === 'HTML';

    return `
        <div class="ios-panel p-4 rounded-2xl space-y-3 relative border border-white/5 bg-white/5">
            <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                    <label class="text-[10px] text-gray-500 font-bold uppercase">Title</label>
                    <input type="text" placeholder="Page Title" value="${escapeHtml(page.title || '')}" onchange="updatePage(${i}, 'title', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                </div>
                <div class="space-y-1">
                    <label class="text-[10px] text-gray-500 font-bold uppercase">Slug</label>
                    <input type="text" placeholder="slug" value="${escapeHtml(page.slug || '')}" onchange="updatePage(${i}, 'slug', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                    <label class="text-[10px] text-gray-500 font-bold uppercase">Type</label>
                    <select onchange="updatePage(${i}, 'type', this.value); renderAdminPanel();" class="w-full bg-black border border-white/10 p-2 rounded-lg text-sm text-white">
                        <option value="URL" ${page.type === 'URL' ? 'selected' : ''}>URL Redirect</option>
                        <option value="HTML" ${page.type === 'HTML' ? 'selected' : ''}>Custom HTML</option>
                    </select>
                </div>
                <div class="space-y-1">
                    <label class="text-[10px] text-gray-500 font-bold uppercase">Status</label>
                    <select onchange="updatePage(${i}, 'status', this.value)" class="w-full bg-black border border-white/10 p-2 rounded-lg text-sm text-white">
                        <option value="active" ${page.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="non-active" ${page.status === 'non-active' ? 'selected' : ''}>Non-Active</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div class="flex items-center gap-2">
                    <input type="checkbox" ${page.showInMain ? 'checked' : ''} onchange="updatePage(${i}, 'showInMain', this.checked)" class="w-4 h-4">
                    <label class="text-[10px] text-gray-500 font-bold uppercase">Show in Main</label>
                </div>
                <div class="flex items-center gap-2">
                    <input type="checkbox" ${page.showInSidebar ? 'checked' : ''} onchange="updatePage(${i}, 'showInSidebar', this.checked)" class="w-4 h-4">
                    <label class="text-[10px] text-gray-500 font-bold uppercase">Show in Sidebar</label>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                    <label class="text-[10px] text-gray-500 font-bold uppercase">Icon</label>
                    <input type="text" placeholder="fa-solid fa-link" value="${escapeHtml(page.icon || 'fa-solid fa-link')}" onchange="updatePage(${i}, 'icon', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                </div>
                <div class="space-y-1">
                    <label class="text-[10px] text-gray-500 font-bold uppercase">Subtitle</label>
                    <input type="text" placeholder="Optional" value="${escapeHtml(page.sub || '')}" onchange="updatePage(${i}, 'sub', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                </div>
            </div>

            ${isHTML ? `
                <div class="space-y-1">
                    <label class="text-[10px] text-gray-500 font-bold uppercase">HTML Code</label>
                    <textarea placeholder="Paste your HTML here..." onchange="updatePage(${i}, 'htmlCode', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm h-32 font-mono">${escapeHtml(page.htmlCode || '')}</textarea>
                </div>
            ` : `
                <div class="space-y-1">
                    <label class="text-[10px] text-gray-500 font-bold uppercase">Redirect URL</label>
                    <input type="text" placeholder="https://..." value="${escapeHtml(page.url || '')}" onchange="updatePage(${i}, 'url', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                </div>
            `}

            <button onclick="removePage(${i})" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-[10px] flex items-center justify-center hover:bg-red-600">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `;
}

// Update Functions
function updateSocial(i, key, val) { 
    if (!localData.socials[i]) localData.socials[i] = {};
    localData.socials[i][key] = val; 
}

function addSocial() { 
    localData.socials.push({ url: '#', icon: 'fa-brands fa-instagram' }); 
    renderAdminPanel(); 
}

function removeSocial(i) { 
    localData.socials.splice(i, 1); 
    renderAdminPanel(); 
}

function updateLink(i, key, val) { 
    if (!localData.links[i]) localData.links[i] = {};
    localData.links[i][key] = val; 
}

function addLink() { 
    localData.links.push({ 
        title: 'New Link', 
        sub: 'Subtitle', 
        url: '#', 
        icon: 'fa-solid fa-link' 
    }); 
    renderAdminPanel(); 
}

function removeLink(i) { 
    localData.links.splice(i, 1); 
    renderAdminPanel(); 
}

function updateSidebarBtn(i, key, val) { 
    if (!localData.sidebar[i]) localData.sidebar[i] = {};
    localData.sidebar[i][key] = val; 
}

function addSidebarBtn() { 
    localData.sidebar.push({ 
        label: 'New Item', 
        url: '#', 
        icon: 'fa-solid fa-circle' 
    }); 
    renderAdminPanel(); 
}

function removeSidebarBtn(i) { 
    localData.sidebar.splice(i, 1); 
    renderAdminPanel(); 
}

function updatePage(i, key, val) { 
    if (!localData.customPages) localData.customPages = [];
    if (!localData.customPages[i]) localData.customPages[i] = {};
    localData.customPages[i][key] = val; 
}

function addCustomPage() { 
    if (!localData.customPages) localData.customPages = [];
    localData.customPages.push({ 
        title: 'New Page', 
        slug: 'new-page', 
        type: 'HTML', 
        htmlCode: '<h1 class="text-2xl font-bold">Hello World</h1>', 
        status: 'active',
        showInMain: false,
        showInSidebar: false,
        icon: 'fa-solid fa-link',
        sub: 'Custom page'
    }); 
    renderAdminPanel(); 
}

function removePage(i) { 
    localData.customPages.splice(i, 1); 
    renderAdminPanel(); 
}

// Save Function
async function saveAdmin() {
    showLoading(true);

    try {
        // Collect text edits
        const texts = {};
        document.querySelectorAll('.admin-text-input').forEach(input => {
            const id = input.getAttribute('data-id');
            if (id) texts[id] = input.value;
        });

        // Profile fields
        const profileName = document.getElementById('profile-name')?.value;
        const profileUsername = document.getElementById('profile-username')?.value;
        const profileBio = document.getElementById('profile-bio')?.value;

        if (profileName) texts.title = profileName;
        if (profileUsername) texts.username = profileUsername;
        if (profileBio) texts.bio = profileBio;

        // Images
        const images = {
            desktop: document.getElementById('img-desktop')?.value || '',
            mobile: document.getElementById('img-mobile')?.value || '',
            profile: document.getElementById('img-profile')?.value || ''
        };

        // Config
        const config = {
            siteTitle: document.getElementById('cfg-site-title')?.value || '',
            metaDesc: document.getElementById('cfg-meta-desc')?.value || '',
            metaKeys: document.getElementById('cfg-meta-keys')?.value || ''
        };

        const payload = { 
            texts, 
            links: localData.links, 
            sidebar: localData.sidebar, 
            socials: localData.socials, 
            images, 
            config,
            customPages: localData.customPages || []
        };

        const res = await fetch('/api/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showNotification('Changes saved successfully!', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            const data = await res.json();
            showNotification(data.error || 'Save failed', 'error');
        }
    } catch (error) {
        showNotification('Failed to save changes', 'error');
    } finally {
        showLoading(false);
    }
}

// Load Content
async function loadContent() {
    try {
        const res = await fetch('/api/content');
        const data = await res.json();

        if (data) {
            localData = { ...localData, ...data };
            updateUIFromData(data);
        }
    } catch (error) {
        console.error('Error loading content:', error);
        showNotification('Failed to load content', 'error');
    }
}

function updateUIFromData(data) {
    // Update images
    if (data.images) {
        const mobileBg = document.querySelector('.bg-mobile');
        const desktopBg = document.querySelector('.bg-desktop');
        const profileImg = document.querySelector('.profile-glow img');

        if (mobileBg && data.images.mobile) {
            mobileBg.style.backgroundImage = `url('${data.images.mobile}')`;
        }
        if (desktopBg && data.images.desktop) {
            desktopBg.style.backgroundImage = `url('${data.images.desktop}')`;
        }
        if (profileImg && data.images.profile) {
            profileImg.src = data.images.profile;
        }
    }

    // Update meta tags
    if (data.config) {
        if (data.config.siteTitle) {
            document.title = data.config.siteTitle;
        }
        if (data.config.metaDesc) {
            updateMetaTag('description', data.config.metaDesc);
        }
        if (data.config.metaKeys) {
            updateMetaTag('keywords', data.config.metaKeys);
        }
    }

    // Update editable texts
    if (data.texts) {
        Object.entries(data.texts).forEach(([id, value]) => {
            const el = document.querySelector(`[data-editable="${id}"]`);
            if (el) el.innerText = value;
        });
    }

    // Update main links
    updateMainLinks(data);

    // Update sidebar
    updateSidebar(data);

    // Update social icons
    updateSocialIcons(data);
}

function updateMetaTag(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
}

function updateMainLinks(data) {
    const container = document.getElementById('main-links');
    if (!container) return;

    // Combine regular links and custom pages
    let allLinks = [...(data.links || [])];

    if (data.customPages) {
        data.customPages.forEach(p => {
            if (p.showInMain && p.status === 'active') {
                allLinks.push({
                    title: p.title,
                    sub: p.sub || '',
                    url: '/' + p.slug,
                    icon: p.icon || 'fa-solid fa-link'
                });
            }
        });
    }

    if (allLinks.length > 0) {
        container.innerHTML = allLinks.map(link => `
            <a href="${link.url}" class="ios-button block p-5 rounded-[2.5rem] group overflow-hidden relative border-white/10">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="flex items-center gap-5 relative z-10">
                    <div class="w-12 h-12 rounded-[1.4rem] bg-blue-500/10 text-blue-400 flex items-center justify-center text-2xl group-hover:rotate-6 transition-transform">
                        <i class="${escapeHtml(link.icon)}"></i>
                    </div>
                    <div class="text-left flex-1">
                        <h3 class="font-black text-white text-lg lg:text-2xl">${escapeHtml(link.title)}</h3>
                        <p class="text-xs text-gray-400 font-bold">${escapeHtml(link.sub)}</p>
                    </div>
                    <i class="fa-solid fa-arrow-right-long text-gray-600 group-hover:text-white group-hover:translate-x-2 transition-all"></i>
                </div>
            </a>
        `).join('');
    }
}

function updateSidebar(data) {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    // Keep home link
    const homeLink = nav.firstElementChild ? nav.firstElementChild.outerHTML : '';

    // Combine sidebar items
    let sidebarItems = [...(data.sidebar || [])];

    if (data.customPages) {
        data.customPages.forEach(p => {
            if (p.showInSidebar && p.status === 'active') {
                sidebarItems.push({
                    label: p.title,
                    url: '/' + p.slug,
                    icon: p.icon || 'fa-solid fa-link'
                });
            }
        });
    }

    nav.innerHTML = homeLink + sidebarItems.map(btn => `
        <a href="${btn.url}" class="flex items-center gap-5 p-5 rounded-[2rem] hover:bg-white/5 transition-all text-gray-400 hover:text-white border border-transparent hover:border-white/10 group">
            <i class="${escapeHtml(btn.icon)} group-hover:scale-110 transition-transform"></i> 
            <span class="font-bold">${escapeHtml(btn.label)}</span>
        </a>
    `).join('');
}

function updateSocialIcons(data) {
    const container = document.getElementById('social-icons');
    if (!container || !data.socials) return;

    container.innerHTML = data.socials.map(social => `
        <a href="${escapeHtml(social.url)}" target="_blank" rel="noopener noreferrer" class="inline-block hover:scale-110 transition-transform">
            <i class="${escapeHtml(social.icon)} text-3xl text-gray-500 hover:text-white"></i>
        </a>
    `).join('');
}

// Dashboard Functions
function initializeDashboard() {
    let totalOps = 0;
    let startTime = Date.now();

    const activityList = document.getElementById('activity-list');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const totalOpsEl = document.getElementById('total-ops');
    const uptimeEl = document.getElementById('uptime');

    function updateUptime() {
        if (!uptimeEl) return;
        const diff = Math.floor((Date.now() - startTime) / 1000);
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        uptimeEl.textContent = `${h}:${m}:${s}`;
    }

    setInterval(updateUptime, 1000);

    function addActivity(data) {
        totalOps++;
        if (totalOpsEl) totalOpsEl.textContent = totalOps;

        if (!activityList) return;

        const item = document.createElement('div');
        item.className = 'activity-item p-6 flex items-center justify-between hover:bg-white/5 transition-colors';

        const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
        const methodColor = {
            'GET': 'text-blue-400',
            'POST': 'text-green-400',
            'PUT': 'text-yellow-400',
            'DELETE': 'text-red-400'
        }[data.method] || 'text-gray-400';

        item.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <i class="fa-solid fa-database text-blue-500"></i>
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-black text-sm ${methodColor}">${escapeHtml(data.method)}</span>
                        <span class="text-xs text-gray-400 font-mono">${escapeHtml(data.path)}</span>
                    </div>
                    <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">${escapeHtml(data.details || 'Database Access')}</p>
                </div>
            </div>
            <div class="text-right">
                <span class="text-xs font-mono text-gray-500">${escapeHtml(time)}</span>
            </div>
        `;

        activityList.prepend(item);
        if (activityList.children.length > 50) {
            activityList.removeChild(activityList.lastChild);
        }
    }

    function clearLogs() {
        if (activityList) {
            activityList.innerHTML = '';
        }
        totalOps = 0;
        if (totalOpsEl) totalOpsEl.textContent = '0';
    }

    // Make clearLogs globally available
    window.clearLogs = clearLogs;

    // EventSource connection
    const evtSource = new EventSource('/api/activity-stream');

    evtSource.onopen = () => {
        if (statusDot) statusDot.className = 'w-2 h-2 rounded-full bg-green-500';
        if (statusText) statusText.textContent = 'Live';
    };

    evtSource.onerror = () => {
        if (statusDot) statusDot.className = 'w-2 h-2 rounded-full bg-red-500';
        if (statusText) statusText.textContent = 'Disconnected';
    };

    evtSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            addActivity(data);
        } catch (e) {
            console.error('Error parsing SSE message:', e);
        }
    };
}

// Utility Functions
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showLoading(show) {
    const btn = document.querySelector('button[onclick="saveAdmin()"]');
    if (btn) {
        btn.disabled = show;
        btn.innerHTML = show ? 'Saving...' : 'Save All Changes';
        btn.classList.toggle('opacity-50', show);
        btn.classList.toggle('pointer-events-none', show);
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-[9999] px-6 py-4 rounded-2xl ios-panel text-white font-bold animate-slideIn ${
        type === 'success' ? 'border-green-500/50' : 
        type === 'error' ? 'border-red-500/50' : 
        'border-blue-500/50'
    }`;
    notification.style.borderWidth = '1px';
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fa-solid ${type === 'success' ? 'fa-check-circle text-green-500' : 
                                 type === 'error' ? 'fa-exclamation-circle text-red-500' : 
                                 'fa-info-circle text-blue-500'}"></i>
            <span>${escapeHtml(message)}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    .animate-slideIn {
        animation: slideIn 0.3s ease-out forwards;
    }
`;
document.head.appendChild(style);

// Export functions to global scope
window.toggleSidebar = toggleSidebar;
window.showAdmin = showAdmin;
window.closeAdmin = closeAdmin;
window.loginAdmin = loginAdmin;
window.saveAdmin = saveAdmin;
window.addLink = addLink;
window.removeLink = removeLink;
window.updateLink = updateLink;
window.addSidebarBtn = addSidebarBtn;
window.removeSidebarBtn = removeSidebarBtn;
window.updateSidebarBtn = updateSidebarBtn;
window.addSocial = addSocial;
window.removeSocial = removeSocial;
window.updateSocial = updateSocial;
window.addCustomPage = addCustomPage;
window.removePage = removePage;
window.updatePage = updatePage;