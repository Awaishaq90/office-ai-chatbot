import { JWT } from "google-auth-library";

const SEARCH_CONSOLE_SCOPE =
  "https://www.googleapis.com/auth/webmasters.readonly";

let cachedClient: JWT | null = null;

function getClient(): JWT {
  const email = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY;

  if (!(email && privateKey)) {
    throw new Error(
      "GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL / GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY are not configured."
    );
  }

  if (!cachedClient) {
    cachedClient = new JWT({
      email,
      key: privateKey.replace(/\\n/g, "\n"),
      scopes: [SEARCH_CONSOLE_SCOPE],
    });
  }

  return cachedClient;
}

/** Returns a valid bearer token for the shared Search Console service account. */
export async function getSearchConsoleAccessToken(): Promise<string> {
  const client = getClient();
  const { token } = await client.getAccessToken();

  if (!token) {
    throw new Error("Failed to obtain a Search Console access token.");
  }

  return token;
}
