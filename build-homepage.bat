@echo off
echo 🔨 Building EnigmaRoom homepage...

cd homepage
if errorlevel 1 (
  echo ❌ Could not enter homepage folder.
  exit /b 1
)

call npm install
if errorlevel 1 (
  echo ❌ npm install failed.
  exit /b 1
)

call npm run build
if errorlevel 1 (
  echo ❌ Build failed.
  exit /b 1
)

cd ..
echo 🧹 Cleaning previous landing folder...
rmdir /S /Q static\landing
mkdir static\landing
mkdir static\landing\assets

echo 📁 Copying new build into static\landing...
xcopy /E /I /Y homepage\dist\assets static\landing\assets
copy homepage\dist\index.html static\landing\
copy homepage\dist\*.ico static\landing\
copy homepage\dist\*.svg static\landing\
copy homepage\dist\*.txt static\landing\

echo ✅ Homepage built and deployed to static\landing!
