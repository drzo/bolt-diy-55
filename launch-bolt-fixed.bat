@echo off
echo Starting Bolt DIY with Fix...
cd "%~dp0\dist\win-unpacked"
start "" "Bolt Local.exe" --allow-file-access-from-files --js-flags="--max-old-space-size=4096" --disable-features=OutOfBlinkCors --patch-remix-routes
echo Bolt DIY launched! If you still encounter issues, please check the logs. 