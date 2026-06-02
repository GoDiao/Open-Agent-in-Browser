import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Iris',
    description: 'Precision viewport control for the active DOM',
    permissions: [
      'activeTab',
      'debugger',
      'storage',
      'tabs',
      'sidePanel',
      'bookmarks',
      'history',
      'tabGroups',
      'downloads',
      'scripting',
      'alarms',
    ],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'Iris',
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
    chrome_url_overrides: {
      newtab: 'newtab.html',
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
})
