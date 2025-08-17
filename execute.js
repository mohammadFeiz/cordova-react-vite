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
    console.error("❌ دستور اشتباه!\nمثال: cordova-react-vite Boxit Tracker boxitsoft.ir");
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

  console.log(`🚀 ایجاد پروژه ${displayName}`);
  console.log(`📦 npm name: ${npmName}`);
  console.log(`📱 cordova id: ${cordovaId}`);
  console.log(`📱 cordova name: ${cordovaName}`);

  // ---- React Vite ----
  console.log("📦 ایجاد پروژه React (Vite)...");
  run(`npm create vite@latest react -- --template react`, rootPath);
  run(`npm install`, path.join(rootPath, "react"));

  // اضافه کردن <script src="cordova.js"> به index.html
  const indexHtmlPath = path.join(rootPath, "react", "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    let html = fs.readFileSync(indexHtmlPath, "utf8");
    if (!html.includes('cordova.js')) {
      html = html.replace("</body>", "  <script src=\"cordova.js\"></script>\n</body>");
      fs.writeFileSync(indexHtmlPath, html, "utf8");
      console.log("✔ <script src=\"cordova.js\"> به index.html اضافه شد");
    }
  }

  // ---- Cordova ----
  console.log("📱 ایجاد پروژه Cordova...");
  run(`npx cordova create cordova ${cordovaId} "${cordovaName}"`, rootPath);

  // ---- Android platform ----
  console.log("📱 اضافه کردن Android platform...");
  run(`npx cordova platform add android`, path.join(rootPath, "cordova"));

  // ---- package.json روت ----
  console.log("🛠 ایجاد package.json روت...");
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

  console.log("✅ پروژه آماده شد!");
  console.log(`📂 ساختار پروژه:
${npmName}/
  ├─ react/       ← پروژه React Vite
  ├─ cordova/     ← پروژه Cordova (${cordovaId}, Android platform اضافه شد)
  └─ package.json ← مدیریت مشترک build
`);
}

main();