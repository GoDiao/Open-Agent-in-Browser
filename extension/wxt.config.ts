import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Open Agent',
    description: 'AI Agent for your browser',
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
    ],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'Open Agent',
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
})
