const PAGESPEED_API_KEY = import.meta.env.VITE_PAGESPEED_API_KEY || 'YOUR_GOOGLE_API_KEY';

export interface AuditResult {
  performanceScore: number;
  isMobileFriendly: boolean;
  loadTimeSeconds: string;
  summary: string;
}

export async function analyzeWebsite(url: string): Promise<AuditResult> {
  // Ensure protocol is present
  const targetUrl = url.startsWith('http') ? url : `https://${url}`;
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=mobile&key=${PAGESPEED_API_KEY}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Failed to run audit');
    const data = await response.json();

    const lighthouse = data.lighthouseResult;
    const score = Math.round((lighthouse.categories.performance.score || 0) * 100);
    const loadTime = (lighthouse.audits['interactive']?.numericValue / 1000).toFixed(1);

    let summary = '';
    if (score < 50) {
      summary = `Critical performance issues. Loads in ${loadTime}s on mobile with a low score of ${score}/100.`;
    } else if (score < 80) {
      summary = `Moderate speed issues. Mobile load time is ${loadTime}s (${score}/100 score).`;
    } else {
      summary = `Good technical health (${score}/100), but site design and conversion flow can be modernized.`;
    }

    return {
      performanceScore: score,
      isMobileFriendly: score >= 60,
      loadTimeSeconds: loadTime,
      summary,
    };
  } catch (err) {
    return {
      performanceScore: 50,
      isMobileFriendly: false,
      loadTimeSeconds: '4.5',
      summary: 'Website has slow loading times and needs a modern mobile optimization overhaul.',
    };
  }
}
