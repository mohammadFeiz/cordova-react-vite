#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(cmd, cwd = process.cwd()) {
  console.log(`▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd, shell: true });
}

function toKebab(str) {
  return str.toLowerCase().replace(/\s+/g, "-");
}

function toCamel(str) {
  return str.replace(/\s+/g, "").toLowerCase();
}

function reverseDomain(domain, appName) {
  const parts = domain.split(".").reverse();
  return [...parts, toCamel(appName)].join(".");
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("❌ wrong statement example: cordova-react-vite Boxit Tracker boxitsoft.ir");
    process.exit(1);
  }

  const domain = args[args.length - 1];
  const appNameParts = args.slice(0, -1);
  const displayName = appNameParts.join(" ");
  const npmName = toKebab(displayName);
  const cordovaId = reverseDomain(domain, displayName);
  const cordovaName = displayName;

  const rootPath = path.join(process.cwd(), npmName);
  if (!fs.existsSync(rootPath)) fs.mkdirSync(rootPath);

  console.log(`🚀 create project ${displayName}`);
  console.log(`📦 npm name: ${npmName}`);
  console.log(`📱 cordova id: ${cordovaId}`);
  console.log(`📱 cordova name: ${cordovaName}`);

  // ---- React Vite ----
  console.log("📦 create project React (Vite)...");
  run(`npm create vite@latest react -- --template react-ts`, rootPath);
  run(`npm install`, path.join(rootPath, "react"));
  // install react packages
  console.log("📦 install aio-cordova in React...");
  run(`npm install aio-cordova aio-utils aio-date aio-apis aio-input aio-popup aio-table tailwindcss @tailwindcss/vite`, path.join(rootPath, "react"));
  // add <script src="cordova.js"> to index.html
  const indexHtmlPath = path.join(rootPath, "react", "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    let html = fs.readFileSync(indexHtmlPath, "utf8");
    if (!html.includes('cordova.js')) {
      html = html.replace("</body>", "  <script src=\"cordova.js\"></script>\n</body>");
      fs.writeFileSync(indexHtmlPath, html, "utf8");
      console.log("✔ <script src=\"cordova.js\"> added to index.html");
    }
  }
  // ---- overwrite App.tsx ----
  const appTsxPath = path.join(rootPath, "react", "src", "App.tsx");
  const appTsxContent = `import { FC } from "react";
import { FC } from "react";
import { AIOCordovaComponent, AIOCordova } from "aio-cordova";

const App: FC = () => {
  return (
    <AIOCordovaComponent
      startWindows={() => <WindowsApp />}
      startAndroid={(aioCordova) => <AndroidApp cordova={aioCordova} />}
    />
  )
}
export default App;

const WindowsApp: FC = () => {
    return null;
}
const AndroidApp: FC<{cordova:AIOCordova}> = ({cordova}) => {
    return null;
}
`;
  const appCssPath = path.join(rootPath, "react", "src", "App.css");
  const appCssContent = `
  @import "tailwindcss";

  @font-face {
  font-family: IRANSans-light;
  font-style: normal;
  font-weight: 300;
  src: url('./assets/iransans/eot/IRANSansWeb(FaNum)_Light.eot');
  src: url('./assets/iransans/eot/IRANSansWeb(FaNum)_Light.eot');
  src: url('./assets/iransans/eot/IRANSansWeb(FaNum)_Light.eot?#iefix') format('embedded-opentype'),
    url('./assets/iransans/woff2/IRANSansWeb(FaNum)_Light.woff2') format('woff2'),
    url('./assets/iransans/woff/IRANSansWeb(FaNum)_Light.woff') format('woff'),
    url('./assets/iransans/ttf/IRANSansWeb(FaNum)_Light.ttf') format('truetype');
}

@font-face {
  font-family: IRANSans-ultra-light;
  font-style: normal;
  font-weight: 200;
  src: url('./assets/iransans/eot/IRANSansWeb(FaNum)_UltraLight.eot');
  src: url('./assets/iransans/eot/IRANSansWeb(FaNum)_UltraLight.eot?#iefix') format('embedded-opentype'),
    url('./assets/iransans/woff2/IRANSansWeb(FaNum)_UltraLight.woff2') format('woff2'),
    url('./assets/iransans/woff/IRANSansWeb(FaNum)_UltraLight.woff') format('woff'),
    url('./assets/iransans/ttf/IRANSansWeb(FaNum)_UltraLight.ttf') format('truetype');
}

@font-face {
  font-family: IRANSans-Medium;
  font-style: normal;
  font-weight: 200;
  src: url('./assets/iransans/eot/IRANSansWeb(FaNum)_Medium.eot');
  src: url('./assets/iransans/eot/IRANSansWeb(FaNum)_Medium.eot?#iefix') format('embedded-opentype'),
    url('./assets/iransans/woff2/IRANSansWeb(FaNum)_Medium.woff2') format('woff2'),
    url('./assets/iransans/woff/IRANSansWeb(FaNum)_Medium.woff') format('woff'),
    url('./assets/iransans/ttf/IRANSansWeb(FaNum)_Medium.ttf') format('truetype');
}
body{
  font-family:IRANSans-light;
}`
  const viteConfigPath = path.join(rootPath, "react", "src", "vite.config.ts");
  const viteConfigContent = `
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'
  import tailwindcss from '@tailwindcss/vite'
  export default defineConfig({
    plugins: [react(),tailwindcss()]
  })`

  fs.writeFileSync(appTsxPath, appTsxContent, "utf8");
  console.log("✔ src/App.tsx changed");
  fs.writeFileSync(appCssPath, appCssContent, "utf8");
  console.log("✔ src/App.css changed");
  fs.writeFileSync(viteConfigPath, viteConfigContent, "utf8");
  console.log("✔ src/vite.config.ts changed");

  // ---- Cordova ----
  console.log("creating cordova project");
  run(`npx cordova create cordova ${cordovaId} "${cordovaName}"`, rootPath);

  // ---- Android platform ----
  console.log("add android platform");
  run(`npx cordova platform add android`, path.join(rootPath, "cordova"));

  // ---- Cordova Plugins ----
  console.log("add cordova plugins...");
  run(`npx cordova plugin add cordova-sqlite-storage`, path.join(rootPath, "cordova"));

  // ---- package.json root ----
  console.log("create root package.json");
  const rootPkg = {
    name: npmName,
    version: "1.0.0",
    description: `${cordovaName} - React + Cordova project`,
    scripts: {
      "react:build": "cd react && npm run build",
      "sync:build": "rimraf cordova\\www && xcopy react\\dist cordova\\www /E /H /C /I",
      "cordova:build": "cd cordova && cordova build android",
      "move:apk": "xcopy cordova\\platforms\\android\\app\\build\\outputs\\apk\\debug\\app-debug.apk . /Y",
      "build": "npm run react:build && npm run sync:build && npm run cordova:build && npm run move:apk",
      "start": "cd react && npm run dev"
    },
    devDependencies: {
      rimraf: "^5.0.0"
    }
  };

  fs.writeFileSync(
    path.join(rootPath, "package.json"),
    JSON.stringify(rootPkg, null, 2)
  );
  // ---- install root package.json dependencies ----
  console.log("📦 install root package.json dependencies...");
  run(`npm install`, rootPath);
  console.log("✅ project is ready!");
}
main();