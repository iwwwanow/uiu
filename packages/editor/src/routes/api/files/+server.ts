import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative, join, extname } from 'node:path';

const FILES_ROOT = resolve(process.env.FILES_ROOT ?? 'sample');

const CONTENT_TYPES: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8'
};

function resolveSafe(relPath: string): string {
	const target = resolve(FILES_ROOT, relPath);
	const rel = relative(FILES_ROOT, target);
	if (rel.startsWith('..') || rel.includes('\0')) {
		error(400, 'Path escapes FILES_ROOT');
	}
	return target;
}

async function listHtmlFiles(dir: string, base = ''): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const relPath = base ? `${base}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			files.push(...(await listHtmlFiles(join(dir, entry.name), relPath)));
		} else if (extname(entry.name) === '.html') {
			files.push(relPath);
		}
	}
	return files;
}

export const GET: RequestHandler = async ({ url }) => {
	const path = url.searchParams.get('path');

	if (path) {
		const target = resolveSafe(path);
		let content: string;
		try {
			content = await readFile(target, 'utf-8');
		} catch {
			error(404, 'File not found');
		}
		const contentType = CONTENT_TYPES[extname(target)] ?? 'text/plain; charset=utf-8';
		return new Response(content, { headers: { 'content-type': contentType } });
	}

	const files = await listHtmlFiles(FILES_ROOT);
	return json({ files });
};
