// Cross-browser API compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

let favoriterHeart = null;

function createHeartIcon() {
  if (favoriterHeart) return;
  
  favoriterHeart = document.createElement('div');
  favoriterHeart.id = 'favoriter-heart';
  favoriterHeart.innerHTML = '♥';
  favoriterHeart.className = 'favoriter-heart';
  
  favoriterHeart.addEventListener('click', toggleFavorite);
  document.body.appendChild(favoriterHeart);
  
  updateHeartState();
  setupFullscreenListeners();
}

function setupFullscreenListeners() {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
}

function handleFullscreenChange() {
  if (!favoriterHeart) return;
  
  const isFullscreen = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
  
  if (isFullscreen) {
    favoriterHeart.style.display = 'none';
  } else {
    favoriterHeart.style.display = 'flex';
  }
}

function getFavicon() {
  const favicon = document.querySelector('link[rel*="icon"]');
  if (favicon) {
    return favicon.href;
  }
  
  const domain = new URL(window.location.href).origin;
  return `${domain}/favicon.ico`;
}

function getCurrentPageData() {
  return {
    url: window.location.href,
    title: document.title,
    favicon: getFavicon(),
    timestamp: Date.now()
  };
}

async function toggleFavorite() {
  console.log('Heart clicked!');
  const pageData = getCurrentPageData();
  console.log('Page data:', pageData);
  const result = await browserAPI.storage.local.get(['favorites']);
  const favorites = result.favorites || {};
  console.log('Current favorites:', favorites);
  
  if (favorites[pageData.url]) {
    delete favorites[pageData.url];
    favoriterHeart.classList.remove('favoriter-liked');
    console.log('Removed from favorites');
  } else {
    favorites[pageData.url] = pageData;
    favoriterHeart.classList.add('favoriter-liked');
    console.log('Added to favorites');
  }
  
  await browserAPI.storage.local.set({ favorites });
  console.log('Favorites saved:', favorites);
}

async function updateHeartState() {
  const pageData = getCurrentPageData();
  const result = await browserAPI.storage.local.get(['favorites']);
  const favorites = result.favorites || {};
  
  if (favorites[pageData.url]) {
    favoriterHeart.classList.add('favoriter-liked');
  } else {
    favoriterHeart.classList.remove('favoriter-liked');
  }
}

// Listen for URL changes (for SPAs and navigation)
let currentUrl = window.location.href;

function handleUrlChange() {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    if (favoriterHeart) {
      updateHeartState();
    }
  }
}

// Monitor for URL changes
setInterval(handleUrlChange, 500);

// Listen for browser navigation events
window.addEventListener('popstate', handleUrlChange);

// Override pushState and replaceState to catch programmatic navigation
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function() {
  originalPushState.apply(history, arguments);
  setTimeout(handleUrlChange, 0);
};

history.replaceState = function() {
  originalReplaceState.apply(history, arguments);
  setTimeout(handleUrlChange, 0);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createHeartIcon);
} else {
  createHeartIcon();
}