import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFileLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'go': 'go',
    'rs': 'go', // Map rs to go or plain text if rust isn't supported, monaco supports rust though
    'java': 'java',
    'cpp': 'java', // generic fallback
    'c': 'cpp',
    'sh': 'shell',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'sql': 'sql',
  };
  return map[ext] || 'plaintext';
}

export function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return 'code';
  if (['html', 'css'].includes(ext)) return 'layout';
  if (['json', 'yaml', 'yml'].includes(ext)) return 'database';
  if (ext === 'md') return 'file-text';
  return 'file';
}
