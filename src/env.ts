import { defineEnvVars } from '@sveltejs/kit/env';

// All variables are optional (string | undefined), matching the previous
// `$env/dynamic/private` behaviour. Defaults are applied at the call sites.
const optional = (input: string | undefined) => input;

export const variables = defineEnvVars({
	ORIGIN: { schema: optional },
	BETTER_AUTH_SECRET: { schema: optional },
	API_GATEWAY_URL: { schema: optional },
	QF_CLIENT_ID: { schema: optional },
	QF_CLIENT_SECRET: { schema: optional },
	QF_OAUTH_URL: { schema: optional },
	QF_USER_CLIENT_ID: { schema: optional },
	QF_USER_CLIENT_SECRET: { schema: optional },
	QF_USER_OAUTH_URL: { schema: optional },
	QF_USER_API_URL: { schema: optional },
	R2_ACCESS_KEY_ID: { schema: optional },
	R2_SECRET_ACCESS_KEY: { schema: optional },
	R2_ENDPOINT: { schema: optional },
	R2_BUCKET: { schema: optional },
	R2_PUBLIC_URL: { schema: optional },
	DATABASE_URL: { schema: optional }
});
