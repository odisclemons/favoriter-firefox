document.addEventListener('DOMContentLoaded', async () => {
  await loadFavorites();
  
  document.getElementById('clearAll').addEventListener('click', clearAllFavorites);
});

async function loadFavorites() {
  const result = await chrome.storage.local.get(['favorites']);
  const favorites = result.favorites || {};
  const favoritesList = document.getElementById('favoritesList');
  const countElement = document.querySelector('.count');
  
  const favoriteCount = Object.keys(favorites).length;
  countElement.textContent = `${favoriteCount} favorite${favoriteCount !== 1 ? 's' : ''}`;
  
  if (favoriteCount === 0) {
    favoritesList.innerHTML = `
      <div class="empty-state">
        <p>No favorites yet!</p>
        <p>Click the ♥ icon on any webpage to add it here.</p>
      </div>
    `;
    return;
  }
  
  const sortedFavorites = Object.values(favorites).sort((a, b) => b.timestamp - a.timestamp);
  
  // Group favorites by domain
  const groupedFavorites = {};
  sortedFavorites.forEach(favorite => {
    const domain = new URL(favorite.url).hostname;
    if (!groupedFavorites[domain]) {
      groupedFavorites[domain] = [];
    }
    groupedFavorites[domain].push(favorite);
  });
  
  favoritesList.innerHTML = Object.entries(groupedFavorites).map(([domain, domainFavorites]) => {
    const firstFavorite = domainFavorites[0];
    
    if (domainFavorites.length === 1) {
      // Single item - display normally
      return `
        <div class="favorite-item" data-url="${firstFavorite.url}" title="${firstFavorite.title}\n${firstFavorite.url}">
          <div class="favorite-favicon">
            <img src="${firstFavorite.favicon || '/favicon.ico'}" alt="" onerror="this.style.display='none'">
          </div>
          <div class="favorite-content">
            <div class="favorite-title">${firstFavorite.title}</div>
            <div class="favorite-url">${firstFavorite.url}</div>
          </div>
          <button class="remove-btn" data-url="${firstFavorite.url}">×</button>
        </div>
      `;
    }
    
    // Multiple items - create group with submenu
    const groupId = domain.replace(/\./g, '-');
    return `
      <div class="domain-group">
        <div class="domain-header" data-domain="${groupId}" title="${domain}\n${domainFavorites.length} pages from this website">
          <div class="favorite-favicon">
            <img src="${firstFavorite.favicon || '/favicon.ico'}" alt="" onerror="this.style.display='none'">
          </div>
          <div class="favorite-content">
            <div class="favorite-title">${domain}</div>
            <div class="favorite-url">${domainFavorites.length} pages</div>
          </div>
          <span class="expand-icon">▼</span>
        </div>
        <div class="submenu" id="submenu-${groupId}">
          ${domainFavorites.map(favorite => `
            <div class="submenu-item" data-url="${favorite.url}" title="${favorite.title}\n${favorite.url}">
              <div class="submenu-content">
                <div class="favorite-title">${favorite.title}</div>
                <div class="favorite-url">${favorite.url}</div>
              </div>
              <button class="remove-btn" data-url="${favorite.url}">×</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
  
  // Handle clicks on single favorites
  favoritesList.querySelectorAll('.favorite-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('remove-btn')) {
        const url = item.dataset.url;
        chrome.tabs.create({ url });
      }
    });
  });
  
  // Handle clicks on domain headers (expand/collapse)
  favoritesList.querySelectorAll('.domain-header').forEach(header => {
    header.addEventListener('click', (e) => {
      if (!e.target.classList.contains('remove-btn')) {
        const domain = header.dataset.domain;
        const submenu = document.getElementById(`submenu-${domain}`);
        const icon = header.querySelector('.expand-icon');
        
        if (submenu.style.display === 'none' || !submenu.style.display) {
          submenu.style.display = 'block';
          icon.textContent = '▲';
        } else {
          submenu.style.display = 'none';
          icon.textContent = '▼';
        }
      }
    });
  });
  
  // Handle clicks on submenu items
  favoritesList.querySelectorAll('.submenu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('remove-btn')) {
        const url = item.dataset.url;
        chrome.tabs.create({ url });
      }
    });
  });
  
  // Handle remove buttons
  favoritesList.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFavorite(btn.dataset.url);
    });
  });
}

async function removeFavorite(url) {
  const result = await chrome.storage.local.get(['favorites']);
  const favorites = result.favorites || {};
  delete favorites[url];
  await chrome.storage.local.set({ favorites });
  await loadFavorites();
}

async function clearAllFavorites() {
  if (confirm('Are you sure you want to clear all favorites?')) {
    await chrome.storage.local.set({ favorites: {} });
    await loadFavorites();
  }
}