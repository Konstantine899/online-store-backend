# Скрипт запуска dev сервера с автоматической установкой UTF-8 кодировки для Windows
# Использование: .\scripts\start-dev.ps1

# Устанавливаем UTF-8 кодировку для PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host "✓ UTF-8 кодировка установлена" -ForegroundColor Green
Write-Host "Запуск dev сервера..." -ForegroundColor Cyan

# Запускаем dev сервер
npm run start:dev
