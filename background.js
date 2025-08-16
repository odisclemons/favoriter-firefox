chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ favorites: {} });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.favorites) {
    console.log('Favorites updated');
  }
});