import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Send,
  Kanban,
  Zap,
  Target,
  DollarSign,
  Search,
  Copy,
  CheckCircle,
  X,
  Instagram,
  Globe,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { fetchRealProspects } from './src/services/apify';

export type PipelineStatus = 'New' | 'Qualified' | 'Contacted' | 'Interested' | 'Closed' | 'Lost';

export interface Lead {
  id: string;
  businessName: string;
  instagramHandle: string;
  niche: string;
  market: string;
  followers: number;
  websiteStatus: 'Missing' | 'Outdated' | 'Slow / Not Mobile Friendly' | 'Decent' | string;
  opportunityScore: number;
  explanation: string;
  opportunity: string;
  recommendedOffer: string;
  estimatedValue: number;
  outreachMessage: string;
  status: PipelineStatus;
  createdAt: string;
}

const NICHES = [
  'Barber Shops & Men Grooming',
  'Fine Dining & Local Restaurants',
  'Real Estate Agencies & Realtors',
  'MedSpas & Aesthetic Clinics',
  'High-End Auto Detailing',
  'Roofing & HVAC Contractors',
  'Luxury Kitchen & Bath Remodelers',
  'Personal Injury Law Firms',
  'Cosmetic Dentists',
  'Boutique Gyms & CrossFit',
  'Luxury Interior Designers',
  'Custom Home Builders',
  'Chiropractors & Physical Therapies',
  'Plastic Surgery Clinics',
  'Epoxy Flooring Installers',
  'Private Wealth & Financial Advisors',
];

const MARKETS = [
  // Nigeria & Africa
  'Lagos, Nigeria',
  'Abuja, Nigeria',
  'Port Harcourt, Nigeria',
  'Ibadan, Nigeria',
  'Johannesburg, South Africa',
  'Cape Town, South Africa',
  'Nairobi, Kenya',

  // Europe
  'London, UK',
  'Manchester, UK',
  'Berlin, Germany',
  'Paris, France',
  'Amsterdam, Netherlands',
  'Dublin, Ireland',
  'Madrid, Spain',
  'Milan, Italy',

  // Australia
  'Sydney, Australia',
  'Melbourne, Australia',
  'Brisbane, Australia',
  'Perth, Australia',

  // US & Canada
  'Austin, TX',
  'Miami, FL',
  'Scottsdale, AZ',
  'New York, NY',
  'Toronto, ON',
];

const STORAGE_KEY = 'leadforge_leads';

const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    businessName: 'Aura Aesthetic MedSpa',
    instagramHandle: '@aura.aesthetics.atx',
    niche: 'MedSpas & Aesthetic Clinics',
    market: 'Austin, TX',
    followers: 14200,
    websiteStatus: 'Slow / Not Mobile Friendly',
    opportunityScore: 92,
    explanation:
      'High social engagement (14.2k highly active followers) but their custom booking link leads to a non-responsive Wix 1.0 desktop site with broken mobile forms.',
    opportunity: 'Redesign into a high-converting mobile-first booking funnel with direct Calendly integration.',
    recommendedOffer: 'Custom MedSpa Conversion Funnel + VIP Booking System',
    estimatedValue: 4500,
    outreachMessage:
      'Hey Aura team! Loved your recent reel on skin rejuvenations. Noticed your IG bio link goes to a non-mobile friendly page where booking CTA buttons get cut off on iPhones. You are likely dropping 20-30% of paid IG traffic. Built a quick mockup fix for you — open to seeing it?',
    status: 'Qualified',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lead-2',
    businessName: 'Iron Vault Athletics',
    instagramHandle: '@ironvault_gym',
    niche: 'Boutique Gyms & Crossfit',
    market: 'Miami, FL',
    followers: 8900,
    websiteStatus: 'Missing',
    opportunityScore: 96,
    explanation:
      "Rapidly growing crossfit community with zero dedicated domain or landing page. Linktree only points to a PDF schedule.",
    opportunity: 'Full brand strategy + membership portal website to directly capture free trial signups.',
    recommendedOffer: 'Gym Member Acquisition Site + Lead Magnet Integration',
    estimatedValue: 3500,
    outreachMessage:
      "Hey guys! Massive respect on the 8.9k Miami lifting community you built. Noticed you don't have an official site yet and rely on Linktree PDFs. We could easily automate 15-20 free trial passes a week with a dedicated landing page. Mind if I send a 2-min video idea?",
    status: 'New',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lead-3',
    businessName: 'Vanguard Interior Studio',
    instagramHandle: '@vanguard_interiors',
    niche: 'Luxury Interior Designers',
    market: 'Los Angeles, CA',
    followers: 22100,
    websiteStatus: 'Outdated',
    opportunityScore: 84,
    explanation:
      'High-end project photos on Instagram, but website was built in 2017 using low-res images and slow load times.',
    opportunity: 'Interactive Portfolio Showcase with WebGL luxury aesthetics & client intake form.',
    recommendedOffer: 'Luxury Architectural Web Experience',
    estimatedValue: 6000,
    outreachMessage:
      'Hi Vanguard team, your modern minimalism projects on IG are breathtaking! However, your website portfolio takes 5+ seconds to load hi-res images and lacks a streamlined client intake form. I made a fast, modern prototype for high-end LA interior studios like yours — worth a quick peek?',
    status: 'Contacted',
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'outreach' | 'pipeline'>('dashboard');
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Lead[]) : INITIAL_LEADS;
    } catch {
      return INITIAL_LEADS;
    }
  });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [selectedNiche, setSelectedNiche] = useState(NICHES[0]);
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [prospectCount, setProspectCount] = useState<number>(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads]);

  const handleGenerateProspects = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const generated = await fetchRealProspects(selectedNiche, selectedMarket, prospectCount);

      if (!generated || generated.length === 0) {
        setGenerationError(
          'No prospects found for that niche/market. Try a different combination, or double-check your Apify token.'
        );
      } else {
        setLeads((prev) => [...generated, ...prev]);
      }
    } catch (error) {
      console.error('Prospect generation failed:', error);
      setGenerationError(
        error instanceof Error ? error.message : 'Something went wrong generating prospects. Check the console for details.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const updateLeadStatus = (id: string, newStatus: PipelineStatus) => {
    setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, status: newStatus } : lead)));
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalProspects = leads.length;
  const highPriority = leads.filter((l) => l.opportunityScore >= 85).length;
  const inOutreach = leads.filter((l) => l.status === 'Contacted' || l.status === 'Interested').length;
  const totalPipelineValue = leads
    .filter((l) => l.status !== 'Lost')
    .reduce((acc, curr) => acc + curr.estimatedValue, 0);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.instagramHandle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.market.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses: PipelineStatus[] = ['New', 'Qualified', 'Contacted', 'Interested', 'Closed', 'Lost'];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-container">
          <Zap className="logo-icon" size={28} />
          <span className="logo-text">LeadForge AI</span>
        </div>
        <ul className="nav-menu">
          <li>
            <button
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`}
              onClick={() => setActiveTab('leads')}
            >
              <Users size={18} />
              Leads Database
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${activeTab === 'outreach' ? 'active' : ''}`}
              onClick={() => setActiveTab('outreach')}
            >
              <Send size={18} />
              Outreach Hub
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${activeTab === 'pipeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('pipeline')}
            >
              <Kanban size={18} />
              Sales Pipeline
            </button>
          </li>
        </ul>
      </aside>

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <div>
            <div className="header">
              <div>
                <h1 className="page-title">Prospecting Command Center</h1>
                <p className="subtitle">Discover, score, and close high-ticket web design leads.</p>
              </div>
            </div>

            <div className="generator-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Sparkles size={20} color="var(--accent-primary)" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Social Prospecting Engine</h2>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Target Niche</label>
                  <select value={selectedNiche} onChange={(e) => setSelectedNiche(e.target.value)}>
                    {NICHES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Market / City</label>
                  <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)}>
                    {MARKETS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <select value={prospectCount} onChange={(e) => setProspectCount(Number(e.target.value))}>
                    <option value={1}>1 Prospect</option>
                    <option value={3}>3 Prospects</option>
                    <option value={5}>5 Prospects</option>
                    <option value={10}>10 Prospects</option>
                    <option value={15}>15 Prospects</option>
                    <option value={20}>20 Prospects</option>
                  </select>
                </div>
                <button className="btn" onClick={handleGenerateProspects} disabled={isGenerating}>
                  {isGenerating ? 'Scanning Instagram...' : 'Discover Prospects'}
                  <ArrowRight size={16} />
                </button>
              </div>
              {generationError && (
                <p style={{ color: 'var(--accent-warning, #f59e0b)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                  {generationError}
                </p>
              )}
            </div>

            <div className="grid-4">
              <div className="card">
                <div className="kpi-header">
                  <span>TOTAL PROSPECTS</span>
                  <Users size={18} color="var(--accent-primary)" />
                </div>
                <div className="kpi-value">{totalProspects}</div>
              </div>
              <div className="card">
                <div className="kpi-header">
                  <span>HIGH PRIORITY (85+ SCORE)</span>
                  <Target size={18} color="var(--accent-success)" />
                </div>
                <div className="kpi-value">{highPriority}</div>
              </div>
              <div className="card">
                <div className="kpi-header">
                  <span>IN OUTREACH</span>
                  <Send size={18} color="var(--accent-warning)" />
                </div>
                <div className="kpi-value">{inOutreach}</div>
              </div>
              <div className="card">
                <div className="kpi-header">
                  <span>EST. PIPELINE VALUE</span>
                  <DollarSign size={18} color="var(--accent-cyan)" />
                </div>
                <div className="kpi-value">${totalPipelineValue.toLocaleString()}</div>
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
                Highest-Scoring Opportunities
              </h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Niche</th>
                      <th>Followers</th>
                      <th>Website Problem</th>
                      <th>Score</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads
                      .slice()
                      .sort((a, b) => b.opportunityScore - a.opportunityScore)
                      .slice(0, 5)
                      .map((lead) => (
                        <tr key={lead.id} className="clickable-row" onClick={() => setSelectedLead(lead)}>
                          <td>
                            <strong>{lead.businessName}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {lead.instagramHandle}
                            </div>
                          </td>
                          <td>{lead.niche}</td>
                          <td>{lead.followers.toLocaleString()}</td>
                          <td>{lead.websiteStatus}</td>
                          <td>
                            <span
                              className={`badge ${lead.opportunityScore >= 85 ? 'badge-score-high' : 'badge-score-med'}`}
                            >
                              {lead.opportunityScore} / 100
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLead(lead);
                              }}
                            >
                              View Analysis
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div>
            <div className="header">
              <div>
                <h1 className="page-title">Lead Database</h1>
                <p className="subtitle">Search, filter, and inspect discovered prospects.</p>
              </div>
            </div>

            <div
              className="card"
              style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: '240px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Search size={18} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search business, handle, or market..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div style={{ minWidth: '180px' }}>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Pipeline Statuses</option>
                  <option value="New">New</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Interested">Interested</option>
                  <option value="Closed">Closed</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
            </div>

            <div className="card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Business Name</th>
                      <th>Market</th>
                      <th>Followers</th>
                      <th>Website Status</th>
                      <th>Opportunity Score</th>
                      <th>Recommended Offer</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <strong>{lead.businessName}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {lead.instagramHandle}
                          </div>
                        </td>
                        <td>{lead.market}</td>
                        <td>{lead.followers.toLocaleString()}</td>
                        <td>{lead.websiteStatus}</td>
                        <td>
                          <span
                            className={`badge ${lead.opportunityScore >= 85 ? 'badge-score-high' : 'badge-score-med'}`}
                          >
                            {lead.opportunityScore}
                          </span>
                        </td>
                        <td>{lead.recommendedOffer}</td>
                        <td>
                          <span className="badge badge-status">{lead.status}</span>
                        </td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedLead(lead)}>
                            Analyze
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                          No leads matched your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'outreach' && (
          <div>
            <div className="header">
              <div>
                <h1 className="page-title">Outreach Workspace</h1>
                <p className="subtitle">Ready-to-send personalized messages for qualified leads.</p>
              </div>
            </div>
            <div className="outreach-grid">
              {leads
                .filter((l) => l.status === 'Qualified' || l.status === 'New')
                .map((lead) => (
                  <div key={lead.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{lead.businessName}</h3>
                      <span className="badge badge-status">{lead.status}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      {lead.instagramHandle} • {lead.market}
                    </p>
                    <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      <strong>Offer:</strong> {lead.recommendedOffer} (${lead.estimatedValue})
                    </div>

                    <div className="copy-box">{lead.outreachMessage}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        className="btn btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleCopy(lead.outreachMessage, lead.id)}
                      >
                        {copiedId === lead.id ? <CheckCircle size={14} /> : <Copy size={14} />}
                        {copiedId === lead.id ? 'Copied' : 'Copy Pitch'}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => updateLeadStatus(lead.id, 'Contacted')}
                      >
                        Mark Contacted
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div>
            <div className="header">
              <div>
                <h1 className="page-title">Sales Pipeline</h1>
                <p className="subtitle">Track prospect conversions through every pipeline stage.</p>
              </div>
            </div>
            <div className="pipeline-board">
              {statuses.map((colStatus) => {
                const stageLeads = leads.filter((l) => l.status === colStatus);
                return (
                  <div key={colStatus} className="pipeline-col">
                    <div className="pipeline-col-header">
                      <span>{colStatus.toUpperCase()}</span>
                      <span>({stageLeads.length})</span>
                    </div>
                    <div>
                      {stageLeads.map((lead) => (
                        <div key={lead.id} className="lead-card" onClick={() => setSelectedLead(lead)}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                            {lead.businessName}
                          </div>
                          <div
                            style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}
                          >
                            ${lead.estimatedValue} • {lead.opportunityScore} Score
                          </div>
                          <select
                            value={lead.status}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value as PipelineStatus)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                          >
                            <option value="New">New</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Interested">Interested</option>
                            <option value="Closed">Closed</option>
                            <option value="Lost">Lost</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {selectedLead && (
        <div className="modal-overlay" onClick={() => setSelectedLead(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedLead(null)}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span
                className={`badge ${selectedLead.opportunityScore >= 85 ? 'badge-score-high' : 'badge-score-med'}`}
              >
                Score: {selectedLead.opportunityScore} / 100
              </span>
              <span className="badge badge-status">{selectedLead.status}</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {selectedLead.businessName}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {selectedLead.niche} • {selectedLead.market}
            </p>
            <div
              className="grid-4"
              style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}
            >
              <div className="card">
                <div className="kpi-header">INSTAGRAM</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                  <Instagram size={16} /> {selectedLead.instagramHandle}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {selectedLead.followers.toLocaleString()} Followers
                </div>
              </div>
              <div className="card">
                <div className="kpi-header">WEBSITE STATUS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                  <Globe size={16} /> {selectedLead.websiteStatus}
                </div>
              </div>
              <div className="card">
                <div className="kpi-header">EST. DEAL VALUE</div>
                <div style={{ fontWeight: 600, color: 'var(--accent-success)' }}>
                  ${selectedLead.estimatedValue}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                AI ANALYSIS & AUDIT EXPLANATION
              </h4>
              <p
                style={{
                  fontSize: '0.95rem',
                  background: '#0b0f19',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                {selectedLead.explanation}
              </p>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                RECOMMENDED OFFER
              </h4>
              <div
                style={{
                  background: '#0b0f19',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontWeight: 600,
                }}
              >
                {selectedLead.recommendedOffer}
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                PERSONALIZED OUTREACH COPY
              </h4>
              <div className="copy-box" style={{ margin: 0 }}>
                {selectedLead.outreachMessage}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn"
                onClick={() => handleCopy(selectedLead.outreachMessage, `modal-${selectedLead.id}`)}
              >
                {copiedId === `modal-${selectedLead.id}` ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedId === `modal-${selectedLead.id}` ? 'Copied' : 'Copy Pitch'}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
                <select
                  value={selectedLead.status}
                  onChange={(e) => updateLeadStatus(selectedLead.id, e.target.value as PipelineStatus)}
                  style={{ width: 'auto' }}
                >
                  <option value="New">New</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Interested">Interested</option>
                  <option value="Closed">Closed</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
