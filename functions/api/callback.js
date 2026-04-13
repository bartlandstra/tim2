/**
 * GitHub OAuth — Stap 2: Ontvang code van GitHub, ruil in voor token
 *
 * Na login bij GitHub stuurt GitHub de gebruiker terug naar dit endpoint
 * met een tijdelijke code. We ruilen die code in voor een access token
 * en sturen het token terug naar Decap CMS via een postMessage.
 */
export async function onRequestGet(context) {
  const clientId = context.env.GITHUB_CLIENT_ID;
  const clientSecret = context.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('GitHub OAuth credentials not configured', { status: 500 });
  }

  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  try {
    // Ruil de code in voor een access token bij GitHub
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(`OAuth error: ${tokenData.error_description || tokenData.error}`, {
        status: 401,
      });
    }

    // Stuur het token terug naar Decap CMS via postMessage
    // Dit is het standaard mechanisme dat Decap CMS verwacht
    const body = `
<!doctype html>
<html>
<head><title>Authenticatie geslaagd</title></head>
<body>
  <script>
    (function() {
      function recieveMessage(e) {
        console.log("recieveMessage %o", e);
        // Send message to main window with the auth token
        window.opener.postMessage(
          'authorization:github:success:${JSON.stringify({ token: tokenData.access_token, provider: 'github' })}',
          e.origin
        );
      }
      window.addEventListener("message", recieveMessage, false);
      // Let the main window know we're ready
      window.opener.postMessage("authorizing:github", "*");
    })();
  </script>
</body>
</html>`;

    return new Response(body, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
  } catch (error) {
    return new Response(`Authentication failed: ${error.message}`, { status: 500 });
  }
}
