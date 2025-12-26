const { google } = require('googleapis');
const readline = require('readline');

// Instructions for the user
console.log(`
--- GENERADOR DE TOKENS DE GMAIL API ---

Para usar este script necesitas tu 'Client ID' y 'Client Secret' de Google Cloud Console.

1. Ve a https://console.cloud.google.com/
2. Crea un proyecto (o usa uno existente).
3. Habilita la "Gmail API" en "APIs y servicios" > "Biblioteca".
4. Ve a "Pantalla de consentimiento de OAuth":
   - Tipo de usuario: Externo (para pruebas) o Interno.
   - Agrega tu correo como "Usuario de prueba" si está en modo prueba.
5. Ve a "Credenciales" > "Crear credenciales" > "ID de cliente de OAuth".
   - Tipo de aplicación: Aplicación de escritorio.
6. Copia el Client ID y Client Secret.
`);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Ingresa tu Client ID: ', (clientId) => {
    rl.question('Ingresa tu Client Secret: ', (clientSecret) => {

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            'https://developers.google.com/oauthplayground' // Redirect URI for easy copy-paste or localhost
            // Actually for Desktop app "urn:ietf:wg:oauth:2.0:oob" or localhost is better, 
            // but let's try standard out-of-band if supported or manual copy.
            // Google deprecated OOB. Use http://localhost:3000/oauth2callback usually.
            // For simplicity here, let's try the specialized manual copy link or just localhost and tell user to copy code from URL.
        );

        // Access scopes for Gmail
        const scopes = [
            'https://www.googleapis.com/auth/gmail.send'
        ];

        // Generate the url that will be used for authorization
        const authorizationUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // Essential for Refresh Token
            scope: scopes,
            include_granted_scopes: true
        });

        console.log('\nVisita esta URL para autorizar la app:\n');
        console.log(authorizationUrl);
        console.log('\nDespués de autorizar, serás redirigido a una página (puede que de error de conexión si es localhost, no importa).');
        console.log('Copia el CÓDIGO que aparece en la URL de la barra de direcciones (busca ?code=...)');

        rl.question('\nIngresa el código aquí: ', async (code) => {
            try {
                const { tokens } = await oauth2Client.getToken(code);
                console.log('\n¡ÉXITO! Aquí están tus credenciales para el archivo .env:\n');
                console.log(`GMAIL_CLIENT_ID=${clientId}`);
                console.log(`GMAIL_CLIENT_SECRET=${clientSecret}`);
                console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
                console.log(`GMAIL_USER_EMAIL= (tu correo)`);

                if (!tokens.refresh_token) {
                    console.warn('\n[ATENCIÓN] No se recibió un Refresh Token. Esto suele pasar si ya autorizaste la app antes.');
                    console.warn('Ve a https://myaccount.google.com/permissions y elimina el acceso a tu app, luego intenta de nuevo.');
                }
            } catch (error) {
                console.error('Error obteniendo el token:', error.message);
            } finally {
                rl.close();
            }
        });
    });
});
