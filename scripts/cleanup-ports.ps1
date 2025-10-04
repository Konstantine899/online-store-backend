# Скрипт для очистки портов от конфликтующих процессов Node.js
# Использование: .\scripts\cleanup-ports.ps1 [port] [--force]

param(
    [int]$Port = 5000,
    [switch]$Force,
    [switch]$AllNodeProcesses,
    [switch]$Help
)

# Функция для отображения справки
function Show-Help {
    Write-Host "Скрипт очистки портов для online-store-backend" -ForegroundColor Green
    Write-Host ""
    Write-Host "Использование:" -ForegroundColor Yellow
    Write-Host "  .\scripts\cleanup-ports.ps1 [параметры]"
    Write-Host ""
    Write-Host "Параметры:" -ForegroundColor Yellow
    Write-Host "  -Port <номер>          Порт для очистки (по умолчанию: 5000)"
    Write-Host "  -AllNodeProcesses      Завершить все процессы Node.js"
    Write-Host "  -Force                 Завершить без подтверждения"
    Write-Host "  -Help                  Показать эту справку"
    Write-Host ""
    Write-Host "Примеры:" -ForegroundColor Yellow
    Write-Host "  .\scripts\cleanup-ports.ps1                    # Очистить порт 5000"
    Write-Host "  .\scripts\cleanup-ports.ps1 -Port 3001         # Очистить порт 3001"
    Write-Host "  .\scripts\cleanup-ports.ps1 -AllNodeProcesses  # Завершить все Node.js процессы"
    Write-Host "  .\scripts\cleanup-ports.ps1 -Force             # Без подтверждения"
}

# Отображение справки
if ($Help) {
    Show-Help
    exit 0
}

Write-Host "=== Скрипт очистки портов ===" -ForegroundColor Green

# Функция для проверки занятости порта
function Test-PortInUse {
    param([int]$PortNumber)
    
    $connections = netstat -ano | Select-String ":$PortNumber\s"
    return $connections.Count -gt 0
}

# Функция для получения процессов на порту
function Get-ProcessesOnPort {
    param([int]$PortNumber)
    
    $connections = netstat -ano | Select-String ":$PortNumber\s"
    $processIds = @()
    
    foreach ($connection in $connections) {
        $parts = $connection.Line -split '\s+' | Where-Object { $_ -ne '' }
        if ($parts.Length -ge 5) {
            $processIds += $parts[-1]
        }
    }
    
    return $processIds | Sort-Object -Unique
}

# Функция для получения информации о процессе
function Get-ProcessInfo {
    param([string]$ProcessId)
    
    try {
        $process = Get-Process -Id $ProcessId -ErrorAction Stop
        return @{
            Id = $process.Id
            Name = $process.ProcessName
            StartTime = $process.StartTime
            Path = $process.Path
        }
    }
    catch {
        return $null
    }
}

# Основная логика
if ($AllNodeProcesses) {
    Write-Host "Поиск всех процессов Node.js..." -ForegroundColor Yellow
    
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    
    if ($nodeProcesses.Count -eq 0) {
        Write-Host "Процессы Node.js не найдены." -ForegroundColor Green
        exit 0
    }
    
    Write-Host "Найдено процессов Node.js: $($nodeProcesses.Count)" -ForegroundColor Yellow
    
    foreach ($process in $nodeProcesses) {
        Write-Host "  PID: $($process.Id), Путь: $($process.Path)" -ForegroundColor Cyan
    }
    
    if (-not $Force) {
        $confirmation = Read-Host "Завершить все процессы Node.js? (y/N)"
        if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
            Write-Host "Операция отменена." -ForegroundColor Yellow
            exit 0
        }
    }
    
    Write-Host "Завершение всех процессов Node.js..." -ForegroundColor Yellow
    try {
        Stop-Process -Name "node" -Force -ErrorAction Stop
        Write-Host "Все процессы Node.js успешно завершены." -ForegroundColor Green
    }
    catch {
        Write-Host "Ошибка при завершении процессов: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "Проверка порта $Port..." -ForegroundColor Yellow
    
    if (-not (Test-PortInUse -PortNumber $Port)) {
        Write-Host "Порт $Port свободен." -ForegroundColor Green
        exit 0
    }
    
    $processIds = Get-ProcessesOnPort -PortNumber $Port
    Write-Host "Найдено процессов на порту $Port`: $($processIds.Count)" -ForegroundColor Yellow
    
    foreach ($processId in $processIds) {
        $processInfo = Get-ProcessInfo -ProcessId $processId
        if ($processInfo) {
            Write-Host "  PID: $($processInfo.Id), Имя: $($processInfo.Name), Путь: $($processInfo.Path)" -ForegroundColor Cyan
        }
        else {
            Write-Host "  PID: $processId (процесс недоступен)" -ForegroundColor Red
        }
    }
    
    if (-not $Force) {
        $confirmation = Read-Host "Завершить процессы на порту $Port? (y/N)"
        if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
            Write-Host "Операция отменена." -ForegroundColor Yellow
            exit 0
        }
    }
    
    Write-Host "Завершение процессов на порту $Port..." -ForegroundColor Yellow
    
    $successCount = 0
    $errorCount = 0
    
    foreach ($processId in $processIds) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "  Процесс $processId завершен." -ForegroundColor Green
            $successCount++
        }
        catch {
            Write-Host "  Ошибка при завершении процесса $processId`: $($_.Exception.Message)" -ForegroundColor Red
            $errorCount++
        }
    }
    
    Write-Host "Результат: $successCount успешно завершено, $errorCount ошибок." -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Yellow" })
    
    # Проверяем, освободился ли порт
    Start-Sleep -Seconds 2
    if (Test-PortInUse -PortNumber $Port) {
        Write-Host "Внимание: порт $Port все еще занят." -ForegroundColor Yellow
    }
    else {
        Write-Host "Порт $Port успешно освобожден." -ForegroundColor Green
    }
}

Write-Host "=== Очистка завершена ===" -ForegroundColor Green
