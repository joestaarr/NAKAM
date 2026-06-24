const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src');

const dirs = [
  'pages',
  'components',
  'store',
  'services',
  'utils',
  'types',
  'data'
];

dirs.forEach(d => fs.mkdirSync(path.join(src, d), { recursive: true }));

// Move folders first
const folders = [
  ['app/components/ui', 'components/ui'],
  ['app/components/figma', 'components/figma'],
];

folders.forEach(([from, to]) => {
  const fromPath = path.join(src, from);
  const toPath = path.join(src, to);
  if (fs.existsSync(fromPath)) {
    fs.renameSync(fromPath, toPath);
  }
});

// Move files
const moves = [
  ['app/store.tsx', 'store/store.tsx'],
  ['app/data.ts', 'data/mockData.ts'],
  ['app/supabase.ts', 'services/supabase.ts'],
  ['app/supabaseData.ts', 'services/supabaseData.ts'],
  ['app/App.tsx', 'App.tsx'],
  ['app/components/AdminPanel.tsx', 'pages/AdminPanel.tsx'],
  ['app/components/HistoryTab.tsx', 'pages/HistoryTab.tsx'],
  ['app/components/HomeMap.tsx', 'pages/HomeMap.tsx'],
  ['app/components/HomeTab.tsx', 'pages/HomeTab.tsx'],
  ['app/components/Login.tsx', 'pages/Login.tsx'],
  ['app/components/MerchantDashboard.tsx', 'pages/MerchantDashboard.tsx'],
  ['app/components/Profile.tsx', 'pages/Profile.tsx'],
  ['app/components/RestaurantsTab.tsx', 'pages/RestaurantsTab.tsx'],
  ['app/components/Navigator.tsx', 'pages/Navigator.tsx'],
  ['app/components/BottomNavBar.tsx', 'components/BottomNavBar.tsx'],
  ['app/components/Logo.tsx', 'components/Logo.tsx'],
  ['app/components/Splash.tsx', 'components/Splash.tsx'],
  ['app/components/Wallet.tsx', 'components/Wallet.tsx'],
  ['app/components/EateryDetail.tsx', 'components/EateryDetail.tsx'],
];

moves.forEach(([from, to]) => {
  const fromPath = path.join(src, from);
  const toPath = path.join(src, to);
  if (fs.existsSync(fromPath)) {
    fs.renameSync(fromPath, toPath);
  }
});

// Remove old directories
try { fs.rmdirSync(path.join(src, 'app/components')); } catch(e) {}
try { fs.rmdirSync(path.join(src, 'app')); } catch(e) {}

// Process all files
function processFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) {
      processFiles(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const importMap = {
        'store': '@/store/store',
        'data': '@/data/mockData',
        'supabase': '@/services/supabase',
        'supabaseData': '@/services/supabaseData',
        'AdminPanel': '@/pages/AdminPanel',
        'HistoryTab': '@/pages/HistoryTab',
        'HomeMap': '@/pages/HomeMap',
        'HomeTab': '@/pages/HomeTab',
        'Login': '@/pages/Login',
        'MerchantDashboard': '@/pages/MerchantDashboard',
        'Profile': '@/pages/Profile',
        'RestaurantsTab': '@/pages/RestaurantsTab',
        'Navigator': '@/pages/Navigator',
        'BottomNavBar': '@/components/BottomNavBar',
        'Logo': '@/components/Logo',
        'Splash': '@/components/Splash',
        'Wallet': '@/components/Wallet',
        'EateryDetail': '@/components/EateryDetail',
        'fmtRp': '@/utils/format', 
      };
      
      content = content.replace(/from\s+['"]([^'"]+)['"]/g, (match, importPath) => {
        if (!importPath.startsWith('.')) return match; 
        const basename = path.basename(importPath).replace(/\.tsx?$/, '');
        
        for (const [key, alias] of Object.entries(importMap)) {
          if (basename === key) {
            return `from "${alias}"`;
          }
        }
        
        // Handle shadcn UI imports
        if (importPath.includes('/ui/')) {
            const uiComponent = basename;
            return `from "@/components/ui/${uiComponent}"`;
        }
        
        return match;
      });

      if (fullPath.endsWith('main.tsx')) {
         content = content.replace(/from\s+['"]\.\/app\/App['"]/g, 'from "./App"');
      }

      fs.writeFileSync(fullPath, content);
    }
  }
}

processFiles(src);
console.log("Refactoring done!");
