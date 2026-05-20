import { env } from '$env/dynamic/private';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getContentToken(): Promise<string | null> {
	const { QF_CLIENT_ID, QF_CLIENT_SECRET, QF_OAUTH_URL } = env;
	if (!QF_CLIENT_ID || !QF_CLIENT_SECRET || !QF_OAUTH_URL) return null;
	if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

	try {
		const res = await fetch(`${QF_OAUTH_URL}/oauth2/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Basic ${btoa(`${QF_CLIENT_ID}:${QF_CLIENT_SECRET}`)}`
			},
			body: 'grant_type=client_credentials&scope=content'
		});
		if (!res.ok) return null;
		const data = await res.json() as { access_token?: string; expires_in?: number };
		cachedToken = data.access_token ?? null;
		tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
		return cachedToken;
	} catch {
		return null;
	}
}

const QF_API = 'https://api.quran.com/api/v4';

export async function fetchVerseText(verseKey: string, token: string | null): Promise<string> {
	const headers: Record<string, string> = {};
	if (token) headers['Authorization'] = `Bearer ${token}`;
	const res = await fetch(`${QF_API}/verses/by_key/${verseKey}?fields=text_uthmani`, { headers });
	if (!res.ok) throw new Error(`Failed to fetch verse ${verseKey}: ${res.status}`);
	const data = await res.json() as { verse: { text_uthmani: string } };
	return data.verse.text_uthmani;
}
