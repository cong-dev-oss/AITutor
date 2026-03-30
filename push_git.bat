@echo off
git init
git add .
git commit -m "Initial commit AI Tutor"
git branch -M main
git remote remove origin
git remote add origin "https://github.com/cong-dev-oss/AITutor.git"
git push -u origin main
