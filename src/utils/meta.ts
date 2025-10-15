export function getMeta(name: string): string | null {
  const el =
    document.querySelector(`meta[name="${name}"]`) ||
    document.querySelector(`meta[property="${name}"]`);
  return el?.getAttribute("content") || null;
}

export function extractOpenGraph(): Record<string, string> {
  const data: Record<string, string> = {};
  document.querySelectorAll('meta[property^="og:"]').forEach((m) => {
    const prop = m.getAttribute("property");
    const content = m.getAttribute("content");
    if (prop && content) data[prop] = content;
  });
  return data;
}

export function extractTwitter(): Record<string, string> {
  const data: Record<string, string> = {};
  document.querySelectorAll('meta[name^="twitter:"]').forEach((m) => {
    const prop = m.getAttribute("name");
    const content = m.getAttribute("content");
    if (prop && content) data[prop] = content;
  });
  return data;
}
