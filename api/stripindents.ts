export function stripIndents(str: string): string {
  const lines = str.split('\n');
  const firstLine = lines[0];
  const indent = firstLine.match(/^(\s*)/)?.[1] || '';
  
  return lines
    .map(line => line.startsWith(indent) ? line.slice(indent.length) : line)
    .join('\n');
}
