@echo off
title Servidor Felis API (Node.js + PostgreSQL + MinIO)
cd /d "%~dp0backend"
echo ============================================================
echo   🐱 SERVIDOR FELIS API (ESP32 + POSTGRESQL + MINIO)
echo ============================================================
node server.js
pause
