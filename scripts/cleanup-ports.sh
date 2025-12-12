#!/bin/bash

# Скрипт для очистки портов от конфликтующих процессов Node.js
# Использование: ./scripts/cleanup-ports.sh [port] [--force] [--all-node] [--help]

set -e

# Параметры по умолчанию
PORT=5000
FORCE=false
ALL_NODE=false
HELP=false

# Функция для отображения справки
show_help() {
    echo "Скрипт очистки портов для online-store-backend"
    echo ""
    echo "Использование:"
    echo "  ./scripts/cleanup-ports.sh [параметры]"
    echo ""
    echo "Параметры:"
    echo "  -p, --port <номер>      Порт для очистки (по умолчанию: 5000)"
    echo "  -a, --all-node          Завершить все процессы Node.js"
    echo "  -f, --force             Завершить без подтверждения"
    echo "  -h, --help              Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  ./scripts/cleanup-ports.sh                    # Очистить порт 5000"
    echo "  ./scripts/cleanup-ports.sh -p 3001           # Очистить порт 3001"
    echo "  ./scripts/cleanup-ports.sh --all-node        # Завершить все Node.js процессы"
    echo "  ./scripts/cleanup-ports.sh --force           # Без подтверждения"
}

# Парсинг аргументов
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -a|--all-node)
            ALL_NODE=true
            shift
            ;;
        -h|--help)
            HELP=true
            shift
            ;;
        *)
            echo "Неизвестный параметр: $1"
            echo "Используйте --help для получения справки"
            exit 1
            ;;
    esac
done

# Отображение справки
if [ "$HELP" = true ]; then
    show_help
    exit 0
fi

echo "=== Скрипт очистки портов ==="

# Функция для проверки занятости порта
test_port_in_use() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:$port >/dev/null 2>&1
    elif command -v netstat >/dev/null 2>&1; then
        netstat -tuln | grep -q ":$port "
    else
        echo "Ошибка: не найдены команды lsof или netstat для проверки портов"
        exit 1
    fi
}

# Функция для получения процессов на порту
get_processes_on_port() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:$port 2>/dev/null
    elif command -v netstat >/dev/null 2>&1; then
        netstat -tulnp | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | sort -u
    fi
}

# Функция для получения информации о процессе
get_process_info() {
    local pid=$1
    if [ -f "/proc/$pid/comm" ]; then
        local name=$(cat "/proc/$pid/comm" 2>/dev/null || echo "unknown")
        local path=$(readlink "/proc/$pid/exe" 2>/dev/null || echo "unknown")
        echo "PID: $pid, Имя: $name, Путь: $path"
    else
        echo "PID: $pid (процесс недоступен)"
    fi
}

# Основная логика
if [ "$ALL_NODE" = true ]; then
    echo "Поиск всех процессов Node.js..."
    
    # Получаем все процессы Node.js
    node_pids=$(pgrep -f "node" 2>/dev/null || true)
    
    if [ -z "$node_pids" ]; then
        echo "Процессы Node.js не найдены."
        exit 0
    fi
    
    node_count=$(echo "$node_pids" | wc -l)
    echo "Найдено процессов Node.js: $node_count"
    
    for pid in $node_pids; do
        get_process_info $pid
    done
    
    if [ "$FORCE" = false ]; then
        read -p "Завершить все процессы Node.js? (y/N): " confirmation
        if [ "$confirmation" != "y" ] && [ "$confirmation" != "Y" ]; then
            echo "Операция отменена."
            exit 0
        fi
    fi
    
    echo "Завершение всех процессов Node.js..."
    
    success_count=0
    error_count=0
    
    for pid in $node_pids; do
        if kill -TERM "$pid" 2>/dev/null; then
            echo "  Процесс $pid завершен."
            success_count=$((success_count + 1))
        else
            echo "  Ошибка при завершении процесса $pid"
            error_count=$((error_count + 1))
        fi
    done
    
    # Ждем завершения процессов
    sleep 2
    
    # Принудительное завершение, если нужно
    remaining_pids=$(pgrep -f "node" 2>/dev/null || true)
    if [ -n "$remaining_pids" ]; then
        echo "Принудительное завершение оставшихся процессов..."
        for pid in $remaining_pids; do
            kill -KILL "$pid" 2>/dev/null || true
        done
    fi
    
    echo "Результат: $success_count успешно завершено, $error_count ошибок."
else
    echo "Проверка порта $PORT..."
    
    if ! test_port_in_use $PORT; then
        echo "Порт $PORT свободен."
        exit 0
    fi
    
    process_pids=$(get_processes_on_port $PORT)
    process_count=$(echo "$process_pids" | wc -l)
    
    echo "Найдено процессов на порту $PORT: $process_count"
    
    for pid in $process_pids; do
        get_process_info $pid
    done
    
    if [ "$FORCE" = false ]; then
        read -p "Завершить процессы на порту $PORT? (y/N): " confirmation
        if [ "$confirmation" != "y" ] && [ "$confirmation" != "Y" ]; then
            echo "Операция отменена."
            exit 0
        fi
    fi
    
    echo "Завершение процессов на порту $PORT..."
    
    success_count=0
    error_count=0
    
    for pid in $process_pids; do
        if kill -TERM "$pid" 2>/dev/null; then
            echo "  Процесс $pid завершен."
            success_count=$((success_count + 1))
        else
            echo "  Ошибка при завершении процесса $pid"
            error_count=$((error_count + 1))
        fi
    done
    
    # Ждем завершения процессов
    sleep 2
    
    # Принудительное завершение, если нужно
    remaining_pids=$(get_processes_on_port $PORT)
    if [ -n "$remaining_pids" ]; then
        echo "Принудительное завершение оставшихся процессов..."
        for pid in $remaining_pids; do
            kill -KILL "$pid" 2>/dev/null || true
        done
    fi
    
    echo "Результат: $success_count успешно завершено, $error_count ошибок."
    
    # Проверяем, освободился ли порт
    sleep 2
    if test_port_in_use $PORT; then
        echo "Внимание: порт $PORT все еще занят."
    else
        echo "Порт $PORT успешно освобожден."
    fi
fi

echo "=== Очистка завершена ==="
