export async function scrapeUrl(url: string): Promise<string> {
  const response = await fetch(`https://r.jina.ai/${url}`, {
    headers: { Accept: 'text/markdown' },
  });
  if (!response.ok) throw new Error(`Failed to scrape: ${response.statusText}`);
  return response.text();
}
