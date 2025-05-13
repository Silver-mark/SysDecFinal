@echo off
echo Updating GitHub repository...

git add .
git commit -m "Update: Current workspace changes"
git push origin mealplans

echo Update completed!
pause