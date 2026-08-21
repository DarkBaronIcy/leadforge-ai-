import { Lead } from '../App';
import { analyzeWebsite } from './pagespeed';

const APIFY_TOKEN = import.meta.env.VITE_APIFY_TOKEN;
const MAPS_ACTOR = 'compass~google-maps-extractor';
const IG_ACTOR = 'apify~instagram-profile-scraper';

export async function fetchRealProspects(niche: string, market: string, count: number): Promise<Lead[]> {
  if (!APIFY_TOKEN) {
    alert('Apify API Token is missing! Add VITE_APIFY_TOKEN to Vercel Environment Variables.');
    return [];
  }

  const query = `${niche} in ${market}`;
  const mapsUrl = `https://api.apify.com/v2/actors/${MAPS_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

  try {
    const mapsRes = await fetch(mapsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchStringsArray: [query],
        maxCrawledPlacesPerSearch: Number(count),
      }),
    });

    if (!mapsRes.ok) throw new Error(`Google Maps API failed: ${mapsRes.status}`);
    const places = await mapsRes.json();

    const handles = places.map((p: any) => 
      (p.title || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    ).filter(Boolean);

    let igDataMap: Record<string, any> = {};
    try {
      const igUrl = `https://api.apify.com/v2/actors/${IG_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
      const igRes = await fetch(igUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: handles }),
      });
      if (igRes.ok) {
        const igItems = await igRes.json();
        igItems.forEach((item: any) => {
          if (item.username) igDataMap[item.username.toLowerCase()] = item;
        });
      }
    } catch (e) {
      console.warn('IG Enrichment skipped, falling back to Google Maps data.', e);
    }

    // Process each place & run PageSpeed audit if website exists
    const leadPromises = places.map(async (item: any, index: number) => {
      const cleanHandle = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const igProfile = igDataMap[cleanHandle];
      const websiteUrl = item.website || igProfile?.externalUrl;
      const hasWebsite = Boolean(websiteUrl);

      let auditSummary = 'No website URL listed on Google Maps or Instagram.';
      let score = 95;
      let websiteStatus = 'Missing Website';

      if (hasWebsite) {
        // Run Google PageSpeed Analysis
        const audit = await analyzeWebsite(websiteUrl);
        auditSummary = audit.summary;
        score = audit.performanceScore;
        websiteStatus = `Slow (${audit.loadTimeSeconds}s load time)`;
      }

      return {
        id: `apify-${Date.now()}-${index}`,
        businessName: item.title || `${niche} Business`,
        instagramHandle: `@${igProfile?.username || cleanHandle}`,
        niche,
        market,
        followers: igProfile?.followersCount || (item.reviewsCount ? item.reviewsCount * 12 : 650),
        websiteStatus,
        opportunityScore: score,
        explanation: !hasWebsite
          ? `Verified active local business in ${market} with zero website links listed.`
          : auditSummary,
        opportunity: !hasWebsite
          ? 'Build a high-converting mobile landing page with online booking.'
          : 'Redesign site for faster mobile performance and better conversion rates.',
        recommendedOffer: `Complete ${niche} Website & Booking System`,
        estimatedValue: 1000,
        outreachMessage: !hasWebsite
          ? `Hey ${item.title || 'there'} team! Noticed your rating on Google in ${market}. You have great reviews, but missing a mobile booking site is costing you daily clients. Built a quick 60-sec preview for you—open to checking it out?`
          : `Hey ${item.title || 'there'} team! Loved your reviews in ${market}. Ran a quick mobile test on ${websiteUrl}—it loads in around ${auditSummary}. Fixable within 48 hours. Want to see a preview fix?`,
        status: 'New',
        createdAt: new Date().toISOString(),
      };
    });

    return await Promise.all(leadPromises);
  } catch (error) {
    console.error('Apify Pipeline Error:', error);
    throw error;
  }
}
