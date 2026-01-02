# Cómo Mantener el Clipping App Activo

## Estado Actual
✅ La aplicación está corriendo en segundo plano  
✅ Scheduler configurado: Scraper 07:00 AM | Email 07:55 AM (Lun-Vie)  
✅ Puerto: 3000

## Verificar si está corriendo

```bash
# Ver procesos
lsof -Pi :3000 -sTCP:LISTEN

# Ver logs en tiempo real
tail -f logs/app.log
```

## Comandos Útiles

### Iniciar la aplicación
```bash
./start.sh
# o manualmente:
nohup node index.js > logs/app.log 2>&1 &
```

### Detener la aplicación
```bash
# Encontrar el proceso
lsof -Pi :3000 -sTCP:LISTEN -t

# Detenerlo
kill $(lsof -Pi :3000 -sTCP:LISTEN -t)
```

### Reiniciar la aplicación
```bash
# Detener
kill $(lsof -Pi :3000 -sTCP:LISTEN -t)
# Esperar 2 segundos
sleep 2
# Iniciar
nohup node index.js > logs/app.log 2>&1 &
```

## Mantenimiento Recomendado

### Opción 1: PM2 (Recomendado para producción)
PM2 reinicia automáticamente si la app falla y puede configurarse para iniciar al arranque del sistema.

```bash
# Instalar PM2 (requiere sudo)
sudo npm install -g pm2

# Iniciar con PM2
pm2 start index.js --name clipping-app

# Configurar inicio automático
pm2 startup
pm2 save

# Monitorear
pm2 status
pm2 logs clipping-app
```

### Opción 2: Mantener Terminal Abierta
Si cierras la terminal donde corriste `nohup`, la app sigue corriendo. Solo asegúrate de no apagar la computadora.

### Opción 3: LaunchAgent (macOS)
Crea un archivo en `~/Library/LaunchAgents/com.clipping.app.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.clipping.app</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/mac/clipping-app/index.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/mac/clipping-app/logs/app.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/mac/clipping-app/logs/error.log</string>
    <key>WorkingDirectory</key>
    <string>/Users/mac/clipping-app</string>
</dict>
</plist>
```

Luego ejecutar:
```bash
launchctl load ~/Library/LaunchAgents/com.clipping.app.plist
```

## Monitoreo

### Verificar que el scheduler esté funcionando
Los logs mostrarán mensajes como:
- `Scheduler started.`
- `Next Scrape: [fecha]`
- `Next Email: [fecha]`

### Revisar envíos programados
```bash
grep -i "scheduled" logs/app.log
```

## Solución de Problemas

### La app no está corriendo
```bash
# Verificar puerto
lsof -Pi :3000

# Si no hay respuesta, iniciar
nohup node index.js > logs/app.log 2>&1 &
```

### Errores en los logs
```bash
# Ver últimos errores
tail -n 50 logs/app.log | grep -i error
```

### MongoDB no conecta
Asegurarse de que MongoDB esté corriendo:
```bash
# macOS con Homebrew
brew services start mongodb-community
```
