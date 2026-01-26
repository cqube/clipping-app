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

## Problemas Comunes de Autenticación (Gmail)

### Error: `invalid_grant` (Token Expirado o Inválido)
Si ves este error, el `GMAIL_REFRESH_TOKEN` ya no es válido.

**Posibles Causas:**
1. **Modo Testing (Más común):** Si la app en Google Cloud está en "Testing", el token expira en 7 días.
   - *Solución:* Publicar la app a "Production".
2. **Cambio de Contraseña:** Si cambias la contraseña de la cuenta de Google (`pescaboletin@gmail.com`), todos los tokens se revocan.
3. **Revocación Manual:** Si alguien quita el acceso a la app en los ajustes de seguridad de Google.
4. **Límite de Tokens:** Existe un límite de 50 refresh tokens por cuenta/app. Si se generan muchos, los más antiguos se borran.

**Solución General:**
Independientemente de la causa, la solución es generar un nuevo token:
1. Corre `node scripts/generate_auth_url.js` localmente.
2. Visita el link, autoriza y obtén el `code`.
3. Pega el código en `scripts/exchange_code.js` y corre `node scripts/exchange_code.js`.
4. Actualiza la variable `GMAIL_REFRESH_TOKEN` en tu archivo `.env` y en el **Dashboard de Railway**.

