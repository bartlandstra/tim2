/**
 * GitHub OAuth — Stap 1: Stuur gebruiker naar GitHub login
 *
 * Decap CMS roept dit endpoint aan wanneer je op "Login met GitHub" klikt.
 * Het stuurt je door naar GitHub's OAuth autorisatiepagina.
 */
export async function onRequestGet(context) {
  const clientId = context.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return new Response('GITHUB_CLIENT_ID is not configured', { status: 500 });
  }

  // Bouw de callback URL op basis van het huidige domein
  const url = new URL(context.request.url);
  const redirectUri = `${url.origin}/api/callback`;

  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('scope', 'repo,user');

  return Response.redirect(githubAuthUrl.toString(), 302);
}
