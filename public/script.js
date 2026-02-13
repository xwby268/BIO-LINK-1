let localData = {
    texts: {},
    links: [],
    sidebar: [],
    socials: [],
    customPages: []
};

// Sidebar Logic
const sidebar = document.getElementById('sidebar');

function toggleSidebar() {
    sidebar.classList.toggle('sidebar-hidden');
    if (!sidebar.classList.contains('sidebar-hidden') && window.innerWidth < 1024) {
        if (!document.getElementById('sidebar-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.id = 'sidebar-backdrop';
            backdrop.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]';
            backdrop.onclick = toggleSidebar;
            document.body.appendChild(backdrop);
        }
    } else {
        const backdrop = document.getElementById('sidebar-backdrop');
        if (backdrop) backdrop.remove();
    }
}

// Clock
function updateClock() {
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
if (document.getElementById('clock')) {
    setInterval(updateClock, 1000);
    updateClock();
}

// DB Admin Functions
function showAdmin() { document.getElementById('admin-modal').classList.remove('hidden'); }
function closeAdmin() { document.getElementById('admin-modal').classList.add('hidden'); }

async function loginAdmin() {
    const password = document.getElementById('admin-pw').value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    if (res.ok) {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        renderAdminPanel();
    } else {
        alert('Wrong password');
    }
}

function renderAdminPanel() {
    // Images
    const desktopInput = document.getElementById('img-desktop');
    const mobileInput = document.getElementById('img-mobile');
    const profileInput = document.getElementById('img-profile');
    
    if(desktopInput) desktopInput.value = localData.images?.desktop || '';
    if(mobileInput) mobileInput.value = localData.images?.mobile || '';
    if(profileInput) profileInput.value = localData.images?.profile || '';

    // Profile Info
    const nameInput = document.getElementById('profile-name');
    const usernameInput = document.getElementById('profile-username');
    const bioInput = document.getElementById('profile-bio');

    if(nameInput) nameInput.value = localData.texts?.title || '';
    if(usernameInput) usernameInput.value = localData.texts?.username || '';
    if(bioInput) bioInput.value = localData.texts?.bio || '';

    // Web Config Edit
    const siteTitleInput = document.getElementById('cfg-site-title');
    const metaDescInput = document.getElementById('cfg-meta-desc');
    const metaKeysInput = document.getElementById('cfg-meta-keys');

    if(siteTitleInput) siteTitleInput.value = localData.config?.siteTitle || '';
    if(metaDescInput) metaDescInput.value = localData.config?.metaDesc || '';
    if(metaKeysInput) metaKeysInput.value = localData.config?.metaKeys || '';

    // Pages Builder Edit
    const pagesList = document.getElementById('pages-edit-list');
    if (pagesList) {
        pagesList.innerHTML = '';
        if (!localData.customPages) localData.customPages = [];
        localData.customPages.forEach((page, i) => {
            pagesList.innerHTML += `
                <div class="ios-panel p-4 rounded-2xl space-y-3 relative border border-white/5 bg-white/5">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-1">
                            <label class="text-[10px] text-gray-500 font-bold uppercase">Title</label>
                            <input type="text" placeholder="Page Title" value="${page.title || ''}" onchange="updatePage(${i}, 'title', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] text-gray-500 font-bold uppercase">Slug (e.g. pay)</label>
                            <input type="text" placeholder="slug" value="${page.slug || ''}" onchange="updatePage(${i}, 'slug', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
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
                             <label class="text-[10px] text-gray-500 font-bold uppercase">Show in Main Links</label>
                        </div>
                        <div class="flex items-center gap-2">
                             <input type="checkbox" ${page.showInSidebar ? 'checked' : ''} onchange="updatePage(${i}, 'showInSidebar', this.checked)" class="w-4 h-4">
                             <label class="text-[10px] text-gray-500 font-bold uppercase">Show in Sidebar</label>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-1">
                            <label class="text-[10px] text-gray-500 font-bold uppercase">Icon (FontAwesome)</label>
                            <input type="text" placeholder="fa-solid fa-link" value="${page.icon || 'fa-solid fa-link'}" onchange="updatePage(${i}, 'icon', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] text-gray-500 font-bold uppercase">Subtitle (for Main Link)</label>
                            <input type="text" placeholder="Optional subtitle" value="${page.sub || ''}" onchange="updatePage(${i}, 'sub', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                        </div>
                    </div>

                    ${page.type === 'HTML' ? `
                        <div class="space-y-1">
                            <label class="text-[10px] text-gray-500 font-bold uppercase">HTML Code</label>
                            <textarea placeholder="Paste your HTML here..." onchange="updatePage(${i}, 'htmlCode', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm h-32 font-mono">${page.htmlCode || ''}</textarea>
                        </div>
                    ` : `
                        <div class="space-y-1">
                            <label class="text-[10px] text-gray-500 font-bold uppercase">Redirect URL</label>
                            <input type="text" placeholder="https://..." value="${page.url || ''}" onchange="updatePage(${i}, 'url', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                        </div>
                    `}
                    <button onclick="removePage(${i})" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-[10px] flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;
        });
    }

    // Text Edit
    const textList = document.getElementById('text-edit-list');
    if (textList) {
        textList.innerHTML = '';
        document.querySelectorAll('[data-editable]').forEach(el => {
            const id = el.getAttribute('data-editable');
            const val = el.innerText;
            textList.innerHTML += `
                <div class="space-y-1">
                    <label class="text-[10px] text-gray-500 font-bold">${id}</label>
                    <input type="text" value="${val}" data-id="${id}" class="admin-text-input w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm">
                </div>
            `;
        });
    }

    // Links Edit
    const linksList = document.getElementById('links-edit-list');
    if (linksList) {
        linksList.innerHTML = '';
        localData.links.forEach((link, i) => {
            linksList.innerHTML += `
                <div class="ios-panel p-4 rounded-2xl space-y-2 relative">
                    <input type="text" placeholder="Title" value="${link.title}" onchange="updateLink(${i}, 'title', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                    <input type="text" placeholder="Sub" value="${link.sub}" onchange="updateLink(${i}, 'sub', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                    <div class="flex gap-2">
                        <input type="text" placeholder="URL or /route" value="${link.url}" onchange="updateLink(${i}, 'url', this.value)" class="flex-1 bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                    </div>
                    <input type="text" placeholder="Icon (FontAwesome)" value="${link.icon}" onchange="updateLink(${i}, 'icon', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                    <button onclick="removeLink(${i})" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-[10px]"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;
        });
    }

    // Sidebar Edit
    const sidebarList = document.getElementById('sidebar-edit-list');
    if (sidebarList) {
        sidebarList.innerHTML = '';
        localData.sidebar.forEach((btn, i) => {
            sidebarList.innerHTML += `
                <div class="ios-panel p-4 rounded-2xl space-y-2 relative">
                    <input type="text" placeholder="Label" value="${btn.label}" onchange="updateSidebarBtn(${i}, 'label', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                    <div class="flex gap-2">
                        <input type="text" placeholder="URL or /route" value="${btn.url}" onchange="updateSidebarBtn(${i}, 'url', this.value)" class="flex-1 bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                    </div>
                    <input type="text" placeholder="Icon" value="${btn.icon}" onchange="updateSidebarBtn(${i}, 'icon', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                    <button onclick="removeSidebarBtn(${i})" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-[10px]"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;
        });
    }

    // Socials Edit
    const socialsList = document.getElementById('socials-edit-list');
    if (socialsList) {
        socialsList.innerHTML = '';
        localData.socials.forEach((social, i) => {
            socialsList.innerHTML += `
                <div class="ios-panel p-4 rounded-2xl space-y-2 relative">
                    <input type="text" placeholder="URL" value="${social.url}" onchange="updateSocial(${i}, 'url', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                    <input type="text" placeholder="Icon (e.g. fa-brands fa-instagram)" value="${social.icon}" onchange="updateSocial(${i}, 'icon', this.value)" class="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-sm">
                    <button onclick="removeSocial(${i})" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-[10px]"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;
        });
    }
}

function updateSocial(i, key, val) { localData.socials[i][key] = val; }
function addSocial() { localData.socials.push({ url: '#', icon: 'fa-brands fa-instagram' }); renderAdminPanel(); }
function removeSocial(i) { localData.socials.splice(i, 1); renderAdminPanel(); }

function updateLink(i, key, val) { localData.links[i][key] = val; }
function addLink() { localData.links.push({ title: 'New Link', sub: 'Subtitle', url: '#', icon: 'fa-solid fa-link' }); renderAdminPanel(); }
function removeLink(i) { localData.links.splice(i, 1); renderAdminPanel(); }

function updateSidebarBtn(i, key, val) { localData.sidebar[i][key] = val; }
function addSidebarBtn() { localData.sidebar.push({ label: 'New Item', url: '#', icon: 'fa-solid fa-circle' }); renderAdminPanel(); }
function removeSidebarBtn(i) { localData.sidebar.splice(i, 1); renderAdminPanel(); }

function updatePage(i, key, val) { 
    if (!localData.customPages) localData.customPages = [];
    localData.customPages[i][key] = val; 
}

function addCustomPage() { 
    if (!localData.customPages) localData.customPages = [];
    localData.customPages.push({ 
        title: 'New Page', 
        slug: 'new-page', 
        type: 'HTML', 
        htmlCode: '<h1>Hello World</h1>', 
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

async function saveAdmin() {
    const texts = {};
    document.querySelectorAll('.admin-text-input').forEach(input => {
        texts[input.getAttribute('data-id')] = input.value;
    });

    const profileName = document.getElementById('profile-name')?.value;
    const profileUsername = document.getElementById('profile-username')?.value;
    const profileBio = document.getElementById('profile-bio')?.value;

    if (profileName) texts['title'] = profileName;
    if (profileUsername) texts['username'] = profileUsername;
    if (profileBio) texts['bio'] = profileBio;

    const images = {
        desktop: document.getElementById('img-desktop')?.value || '',
        mobile: document.getElementById('img-mobile')?.value || '',
        profile: document.getElementById('img-profile')?.value || ''
    };

    const config = {
        siteTitle: document.getElementById('cfg-site-title')?.value || '',
        metaDesc: document.getElementById('cfg-meta-desc')?.value || '',
        metaKeys: document.getElementById('cfg-meta-keys')?.value || ''
    };
    
    const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            texts, 
            links: localData.links, 
            sidebar: localData.sidebar, 
            socials: localData.socials, 
            images, 
            config,
            customPages: localData.customPages || []
        })
    });
    
    if (res.ok) {
        alert('Saved!');
        location.reload();
    } else {
        alert('Save failed');
    }
}

// Load Content
async function loadContent() {
    const res = await fetch('/api/content');
    const data = await res.json();
    if (data) {
        localData = { ...localData, ...data };
        
        // Handle Images
        if (data.images) {
            const mobileBg = document.querySelector('.bg-mobile');
            const desktopBg = document.querySelector('.bg-desktop');
            const profileImg = document.querySelector('.profile-glow img');

            if (mobileBg && data.images.mobile) mobileBg.style.backgroundImage = `url('${data.images.mobile}')`;
            if (desktopBg && data.images.desktop) desktopBg.style.backgroundImage = `url('${data.images.desktop}')`;
            if (profileImg && data.images.profile) profileImg.src = data.images.profile;
        }

        // Handle Web Config
        if (data.config) {
            if (data.config.siteTitle) document.title = data.config.siteTitle;
            if (data.config.metaDesc) {
                let metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) metaDesc.setAttribute('content', data.config.metaDesc);
            }
            if (data.config.metaKeys) {
                let metaKeys = document.querySelector('meta[name="keywords"]');
                if (metaKeys) metaKeys.setAttribute('content', data.config.metaKeys);
            }
        }

        if (data.texts) {
            Object.keys(data.texts).forEach(id => {
                const el = document.querySelector(`[data-editable="${id}"]`);
                if (el) el.innerText = data.texts[id];
            });
        }

        // Combine Regular Links and Custom Pages marked for Main
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
            const container = document.getElementById('main-links');
            if (container) {
                container.innerHTML = allLinks.map(link => `
                    <a href="${link.url}" class="ios-button block p-5 rounded-[2.5rem] group overflow-hidden relative border-white/10">
                        <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div class="flex items-center gap-5 relative z-10">
                            <div class="w-12 h-12 rounded-[1.4rem] bg-blue-500/10 text-blue-400 flex items-center justify-center text-2xl group-hover:rotate-6 transition-transform">
                                <i class="${link.icon}"></i>
                            </div>
                            <div class="text-left flex-1">
                                <h3 class="font-black text-white text-lg lg:text-2xl">${link.title}</h3>
                                <p class="text-xs text-gray-400 font-bold">${link.sub}</p>
                            </div>
                            <i class="fa-solid fa-arrow-right-long text-gray-600 group-hover:text-white group-hover:translate-x-2 transition-all"></i>
                        </div>
                    </a>
                `).join('');
            }
        }

        // Combine Sidebar Items
        const nav = document.getElementById('sidebar-nav');
        if (nav) {
            const home = nav.firstElementChild ? nav.firstElementChild.outerHTML : '';
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
            nav.innerHTML = home + sidebarItems.map(btn => `
                <a href="${btn.url}" class="flex items-center gap-5 p-5 rounded-[2rem] hover:bg-white/5 transition-all text-gray-400 hover:text-white border border-transparent hover:border-white/10 group">
                    <i class="${btn.icon} group-hover:scale-110 transition-transform"></i> 
                    <span>${btn.label}</span>
                </a>
            `).join('');
        }

        if (data.socials) {
            const container = document.getElementById('social-icons');
            if (container) {
                container.innerHTML = data.socials.map(social => `
                    <a href="${social.url}" target="_blank">
                        <i class="${social.icon} text-3xl hover:text-white hover:scale-125 transition-all cursor-pointer"></i>
                    </a>
                `).join('');
            }
        }
    }
}

loadContent();