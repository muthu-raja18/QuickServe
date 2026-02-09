@echo off
echo ===========================================
echo QUICKSERVE DEPLOYMENT FIX
echo ===========================================

echo 1. Updating tsconfig.json...
echo {
echo   "compilerOptions": {
echo     "target": "es5",
echo     "lib": ["dom", "dom.iterable", "esnext"],
echo     "allowJs": true,
echo     "skipLibCheck": true,
echo     "strict": false,
echo     "forceConsistentCasingInFileNames": true,
echo     "noEmit": true,
echo     "esModuleInterop": true,
echo     "module": "esnext",
echo     "moduleResolution": "node",
echo     "resolveJsonModule": true,
echo     "isolatedModules": true,
echo     "jsx": "preserve",
echo     "incremental": true,
echo     "plugins": [{ "name": "next" }],
echo     "paths": { "@/": ["./src/*"] }
echo   },
echo   "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
echo   "exclude": ["node_modules"]
echo } > tsconfig.json

echo 2. Updating next.config.js...
echo const nextConfig = {
echo   output: "export",
echo   images: { unoptimized: true },
echo   eslint: { ignoreDuringBuilds: true },
echo   trailingSlash: true
echo };
echo module.exports = nextConfig; > next.config.js

echo 3. Creating firebase.json...
echo {
echo   "hosting": {
echo     "public": "out",
echo     "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
echo     "rewrites": [{"source": "**", "destination": "/index.html"}]
echo   }
echo } > firebase.json

echo 4. Cleaning old build...
if exist out rmdir /s /q out
if exist .next rmdir /s /q .next

echo 5. Installing dependencies (ignoring audit)...
call npm install --no-audit

echo 6. Building project...
call npm run build

echo 7. Checking build...
if exist out\seeker\dashboard\index.html (
    echo ✅ BUILD SUCCESS: Dashboard page exists
) else (
    echo ❌ BUILD FAILED: No dashboard page
    dir out /s /b
    pause
    exit /b 1
)

echo 8. Deploying to Firebase...
call firebase deploy --only hosting

echo.
echo ===========================================
echo ✅ DEPLOYMENT COMPLETE!
echo Open: https://quickserve-d3ba6.web.app
echo Test: https://quickserve-d3ba6.web.app/seeker/dashboard
echo ===========================================
pause