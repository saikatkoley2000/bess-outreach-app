/**
 * Utility functions for Company intelligence & Web links
 */

export function getCompanyWebsiteUrl(account) {
  if (!account) return '#';

  // 1. If explicit website is provided and not an expo directory link
  if (account.website && account.website.trim()) {
    const w = account.website.trim();
    if (!w.includes('thebatteryshowindia') && !w.includes('renewableenergyindiaexpo')) {
      return w.startsWith('http') ? w : `https://${w}`;
    }
  }

  // 2. Check if primary email has official corporate domain
  if (account.primary_email && account.primary_email.includes('@')) {
    const domain = account.primary_email.split('@')[1].trim().toLowerCase();
    const publicDomains = [
      'gmail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 
      'hotmail.com', 'rediffmail.com', 'icloud.com', 'proton.me', 'aol.com'
    ];
    if (!publicDomains.includes(domain)) {
      return `https://www.${domain.replace(/^www\./, '')}`;
    }
  }

  // 3. Check evidence URLs if they point to an official corporate website
  const urls = [account.evidence_url_1, account.evidence_url_2, account.evidence_url_3].filter(Boolean);
  for (const u of urls) {
    if (
      u.startsWith('http') && 
      !u.includes('thebatteryshowindia') && 
      !u.includes('renewableenergyindiaexpo') && 
      !u.includes('linkedin.com') && 
      !u.includes('economictimes')
    ) {
      try {
        const parsed = new URL(u);
        return parsed.origin;
      } catch {
        return u;
      }
    }
  }

  // 4. If website was an expo directory link, use it if nothing better
  if (account.website && account.website.trim()) {
    const w = account.website.trim();
    return w.startsWith('http') ? w : `https://${w}`;
  }

  // 5. If evidence URL exists (even LinkedIn or expo), use it
  if (account.evidence_url_1 && account.evidence_url_1.trim().startsWith('http')) {
    return account.evidence_url_1.trim();
  }

  // 6. Direct Google search fallback for company official website
  return `https://www.google.com/search?q=${encodeURIComponent((account.company_name || '') + ' official website')}`;
}

export function getCompanyDisplayDomain(account) {
  const url = getCompanyWebsiteUrl(account);
  try {
    const u = new URL(url);
    if (u.hostname.includes('google.com')) return 'Google Search';
    return u.hostname.replace(/^www\./, '');
  } catch {
    return 'Website';
  }
}
