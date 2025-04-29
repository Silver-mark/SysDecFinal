@echo off
echo Setting up Node.js authentication system...
echo.

:: Install Node.js modules
echo Installing required npm packages...
npm install express mongoose dotenv cors bcryptjs jsonwebtoken morgan colors
echo.

:: Install dev dependencies
echo Installing development dependencies...
npm install -D nodemon
echo.

:: Create basic .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    echo NODE_ENV=development>>.env
    echo PORT=5000>>.env
    echo MONGO_URI=mongodb://localhost:27017/recspicy>>.env
    echo JWT_SECRET=your_jwt_secret_key_here>>.env
) else (
    echo .env file already exists - skipping creation
)
echo.

:: Start MongoDB service (requires MongoDB to be installed)
echo Attempting to start MongoDB...
net start MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    echo MongoDB started successfully
) else (
    echo MongoDB could not be started - make sure it's installed
)
echo.

:: Start the Node.js server
echo Starting Node.js server...
start cmd /k "node server.js"
echo.

echo Setup complete!
echo You can now access:
echo - Signup: http://localhost:5000/signup.html
echo - Signin: http://localhost:5000/signin.html
pause