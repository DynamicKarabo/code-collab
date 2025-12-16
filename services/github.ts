import { File } from '../types';

interface GitHubContent {
    name: string;
    path: string;
    type: 'file' | 'dir';
    url: string;
    download_url: string | null;
}

export const githubService = {
    fetchRepoContents: async (owner: string, repo: string, path = ''): Promise<File[]> => {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.statusText}`);
            }

            const contents: GitHubContent[] = await response.json();
            let files: File[] = [];

            for (const item of contents) {
                if (item.type === 'file' && item.download_url) {
                    // Fetch file content
                    const fileRes = await fetch(item.download_url);
                    const content = await fileRes.text();

                    files.push({
                        id: crypto.randomUUID(),
                        name: item.name,
                        language: getLanguageFromExtension(item.name),
                        content: content
                        // File type in types.ts does not have roomId, so we omit it here.
                        // It gets added when saving to DB via db.saveFile params.
                    });
                } else if (item.type === 'dir') {
                    // Recursively fetch directory
                    const innerFiles = await githubService.fetchRepoContents(owner, repo, item.path);
                    files = [...files, ...innerFiles];
                }
            }

            return files;
        } catch (error) {
            console.error("Failed to fetch repo:", error);
            throw error;
        }
    }
};

const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'ts':
        case 'tsx': return 'typescript';
        case 'js':
        case 'jsx': return 'javascript';
        case 'html': return 'html';
        case 'css': return 'css';
        case 'json': return 'json';
        case 'py': return 'python';
        case 'md': return 'markdown';
        default: return 'plaintext';
    }
};
