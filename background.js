// Cross-browser API compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.runtime.onInstalled.addListener(() => {
  browserAPI.storage.local.set({ favorites: {} });
});

browserAPI.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.favorites) {
    console.log('Favorites updated');
  }
});