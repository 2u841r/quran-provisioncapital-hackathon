import { AwsClient } from 'aws4fetch';
import { env } from '$env/dynamic/private';

function client() {
	return new AwsClient({
		accessKeyId: env.R2_ACCESS_KEY_ID ?? '',
		secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? '',
		region: 'auto',
		service: 's3'
	});
}

export async function uploadToR2(
	key: string,
	body: ArrayBuffer,
	contentType: string
): Promise<string> {
	const r2 = client();
	const url = `${env.R2_ENDPOINT}/${env.R2_BUCKET}/${key}`;

	const res = await r2.fetch(url, {
		method: 'PUT',
		body,
		headers: { 'Content-Type': contentType }
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`R2 upload failed: ${res.status} ${text}`);
	}

	return `${env.R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
	const r2 = client();
	const url = `${env.R2_ENDPOINT}/${env.R2_BUCKET}/${key}`;
	await r2.fetch(url, { method: 'DELETE' });
}
