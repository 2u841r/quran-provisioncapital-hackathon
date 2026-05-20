import { env } from '$env/dynamic/private';

// Pre-live client for user OAuth (Authorization Code + PKCE)
export const QF_USER_CLIENT_ID = env.QF_USER_CLIENT_ID ?? '';
export const QF_USER_CLIENT_SECRET = env.QF_USER_CLIENT_SECRET ?? '';
export const QF_USER_OAUTH_URL =
	env.QF_USER_OAUTH_URL ?? 'https://oauth2.quran.foundation';
export const QF_USER_API_URL = env.QF_USER_API_URL ?? 'https://apis.quran.foundation';

export const QF_USER_SCOPES =
	'openid offline_access bookmark reading_session goal activity_day streak note preference';

export const MUSHAF_ID = 2; // HAFS (standard Arabic Quran)

const FONT_TO_MUSHAF_ID: Record<string, number> = {
	code_v1: 2,
	code_v2: 1,
	tajweed_v4: 19,
	text_uthmani: 4,
	text_indopak: 3,
	qpc_uthmani_hafs: 5,
	tajweed: 11,
};

export async function qfGetMushafId(accessToken: string): Promise<number> {
	try {
		const prefs = await qfApiFetch<Record<string, Record<string, string>>>(
			'preferences',
			accessToken
		);
		const styles = prefs?.quranReaderStyles ?? {};
		const font = styles.quranFont ?? 'qpc_uthmani_hafs';
		const lines = styles.mushafLines ?? '';
		if (font === 'text_indopak') {
			if (lines === '15_lines') return 6;
			if (lines === '16_lines') return 7;
		}
		return FONT_TO_MUSHAF_ID[font] ?? 5;
	} catch {
		return 5;
	}
}

export interface QfPagedResponse<T> {
	success: boolean;
	data: T[];
	pagination: {
		hasNextPage: boolean;
		hasPreviousPage: boolean;
		endCursor: string | null;
		startCursor: string | null;
	};
}

function qfHeaders(accessToken: string): Record<string, string> {
	return {
		'x-auth-token': accessToken,
		'x-client-id': QF_USER_CLIENT_ID
	};
}

export async function qfApiFetch<T>(
	path: string,
	accessToken: string,
	params?: Record<string, string | number>
): Promise<T> {
	const url = new URL(`${QF_USER_API_URL}/auth/v1/${path}`);
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			url.searchParams.set(k, String(v));
		}
	}
	const res = await fetch(url.toString(), { headers: qfHeaders(accessToken) });
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`QF API ${path} failed ${res.status}: ${text}`);
	}
	return res.json();
}

/** Fetch all pages of a paginated endpoint.
 *  style 'first-after' (default): uses first=20 + after=cursor  (bookmarks, activity-days)
 *  style 'limit-cursor': uses limit=20 + cursor=cursor           (notes)
 */
export async function qfApiFetchAll<T>(
	path: string,
	accessToken: string,
	params: Record<string, string | number> = {},
	style: 'first-after' | 'limit-cursor' = 'first-after'
): Promise<T[]> {
	const all: T[] = [];
	let cursor: string | null = null;

	for (let i = 0; i < 50; i++) {
		const p: Record<string, string | number> = { ...params };
		if (style === 'limit-cursor') {
			p.limit = 20;
			if (cursor) p.cursor = cursor;
		} else {
			p.first = 20;
			if (cursor) p.after = cursor;
		}

		const page = await qfApiFetch<QfPagedResponse<T>>(path, accessToken, p);
		all.push(...page.data);
		if (!page.pagination.hasNextPage || !page.pagination.endCursor) break;
		cursor = page.pagination.endCursor;
	}

	return all;
}

export async function qfApiPost<T>(
	path: string,
	accessToken: string,
	body: unknown,
	params?: Record<string, string | number>
): Promise<T> {
	const url = new URL(`${QF_USER_API_URL}/auth/v1/${path}`);
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			url.searchParams.set(k, String(v));
		}
	}
	const res = await fetch(url.toString(), {
		method: 'POST',
		headers: { ...qfHeaders(accessToken), 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`QF API POST ${path} failed ${res.status}: ${text}`);
	}
	return res.json();
}

export async function qfApiPatch<T>(
	path: string,
	accessToken: string,
	body: unknown,
	params?: Record<string, string | number>
): Promise<T> {
	const url = new URL(`${QF_USER_API_URL}/auth/v1/${path}`);
	if (params) {
		for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
	}
	const res = await fetch(url.toString(), {
		method: 'PATCH',
		headers: { ...qfHeaders(accessToken), 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`QF API PATCH ${path} failed ${res.status}: ${text}`);
	}
	return res.json();
}

export async function qfApiDelete(
	path: string,
	accessToken: string,
	params?: Record<string, string | number>
): Promise<void> {
	const url = new URL(`${QF_USER_API_URL}/auth/v1/${path}`);
	if (params) {
		for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
	}
	const res = await fetch(url.toString(), {
		method: 'DELETE',
		headers: qfHeaders(accessToken)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`QF API DELETE ${path} failed ${res.status}: ${text}`);
	}
}

function toBase64Url(input: ArrayBuffer | Uint8Array): string {
	const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
	let str = '';
	for (const b of bytes) str += String.fromCharCode(b);
	return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generatePkce(): Promise<{ verifier: string; challenge: string }> {
	const arr = new Uint8Array(48);
	crypto.getRandomValues(arr);
	const verifier = toBase64Url(arr);
	const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
	return { verifier, challenge: toBase64Url(hash) };
}

export function randomToken(bytes = 32): string {
	const arr = new Uint8Array(bytes);
	crypto.getRandomValues(arr);
	return toBase64Url(arr);
}

export function decodeJwt(token: string): Record<string, unknown> | null {
	try {
		const parts = token.split('.');
		if (parts.length < 2) return null;
		const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		const pad = '='.repeat((4 - (payload.length % 4)) % 4);
		return JSON.parse(atob(payload + pad));
	} catch {
		return null;
	}
}

export function buildAuthorizeUrl(p: {
	state: string;
	nonce: string;
	challenge: string;
	redirectUri: string;
}): string {
	const url = new URL('/oauth2/auth', QF_USER_OAUTH_URL);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('client_id', QF_USER_CLIENT_ID);
	url.searchParams.set('redirect_uri', p.redirectUri);
	url.searchParams.set('scope', QF_USER_SCOPES);
	url.searchParams.set('state', p.state);
	url.searchParams.set('nonce', p.nonce);
	url.searchParams.set('code_challenge', p.challenge);
	url.searchParams.set('code_challenge_method', 'S256');
	return url.toString();
}

export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	id_token: string;
	scope: string;
}

async function tokenRequest(body: URLSearchParams): Promise<TokenResponse> {
	const res = await fetch(`${QF_USER_OAUTH_URL}/oauth2/token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${btoa(`${QF_USER_CLIENT_ID}:${QF_USER_CLIENT_SECRET}`)}`,
		},
		body: body.toString(),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`QF token request failed ${res.status}: ${text}`);
	}
	return res.json();
}

export function exchangeCode(
	code: string,
	codeVerifier: string,
	redirectUri: string
): Promise<TokenResponse> {
	return tokenRequest(
		new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, code_verifier: codeVerifier })
	);
}

export function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
	return tokenRequest(
		new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
	);
}

/**
 * Produce a Better Auth-compatible signed cookie value.
 * Format: `${token}.${base64(HMAC-SHA256(token, secret))}`
 * SvelteKit's cookies.set will encodeURIComponent this; better-call's parseCookies
 * will decodeURIComponent on read — matching the exact flow of better-call's own
 * serializeSignedCookie / getSignedCookie pair.
 */
export async function signForBetterAuth(token: string, secret: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(token));
	const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
	return `${token}.${b64}`;
}
