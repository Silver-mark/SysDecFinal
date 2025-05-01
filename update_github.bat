@echo off
echo Updating GitHub repository...

git add .
git commit -m "Update: Current workspace changes"
git push origin up1

echo Update completed!
pause