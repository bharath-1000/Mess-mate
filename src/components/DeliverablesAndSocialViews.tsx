import React, { useState, useEffect } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  Download,
  Share2,
  ShieldAlert,
  FileWarning,
  ArrowLeft,
} from 'lucide-react';
import { DeliverableFile, SocialStudioResponse } from '../types/messmate';
import { apiFetch } from '../utils/api';

const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'] as const;

export function DeliverablesExplorerView() {
  const [files, setFiles] = useState<DeliverableFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('messmate/README.md');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ files?: DeliverableFile[] }>('/api/deliverables').then((res) => {
      setLoading(false);
      if (res.ok && res.data.files) {
        setFiles(res.data.files);
        const readme = res.data.files.find((f) => f.path.endsWith('README.md'));
        if (readme) setSelectedPath(readme.path);
        else if (res.data.files.length > 0) setSelectedPath(res.data.files[0].path);
      }
    });
  }, []);

  const currentFile = files.find((f) => f.path === selectedPath) || files[0];

  function handleCopyContent() {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleDownloadCurrentFile() {
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.path.split('/').pop() || 'file.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-slate-500">
            Complete Java / Servlet / JSP / JDBC / MySQL Project Source Tree (/messmate/)
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Java Web Application Deliverables & MySQL Scripts
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Inspect or download every source file required to build <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">messmate.war</code> with Apache Maven, MySQL 8.0, and Apache Tomcat 10.1.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-600 shrink-0">
          {files.length} complete project files on disk
        </div>
      </div>

      {loading ? (
        <div className="p-8 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
          Loading Java &amp; MySQL project deliverables from /messmate/...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File Tree List */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-4 max-h-[680px] overflow-y-auto space-y-4">
            {[
              'Configuration & Docs',
              'MySQL Schema & Seed SQL',
              'Java Servlets, DAOs, Filters & Models',
              'JSP Views, CSS & web.xml',
            ].map((cat) => {
              const catFiles = files.filter((f) => f.category === cat);
              if (catFiles.length === 0) return null;
              return (
                <div key={cat}>
                  <h2 className="text-xs font-bold text-slate-500 mb-1.5 px-2">{cat}</h2>
                  <div className="space-y-1">
                    {catFiles.map((file) => {
                      const active = file.path === currentFile?.path;
                      return (
                        <button
                          key={file.path}
                          type="button"
                          onClick={() => setSelectedPath(file.path)}
                          className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                            active
                              ? 'bg-slate-900 text-white font-semibold'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{file.path.replace(/^messmate\//, '')}</span>
                          <span className="text-[11px] opacity-70 shrink-0 tabular-nums">
                            {Math.max(1, Math.round(file.size / 1024))} KB
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Code Viewer */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden">
            {currentFile && (
              <>
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode2 className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="text-xs font-mono font-semibold text-slate-900 truncate">
                      {currentFile.path}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyContent}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy Code'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCurrentFile}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-800 overflow-x-auto max-h-[600px] leading-relaxed bg-slate-50/40">
                  <code>{currentFile.content}</code>
                </pre>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const INITIAL_SOCIAL_RESULT: SocialStudioResponse = {
  idea: 'Sunday Special South Indian Feast & Zero-Waste Campus Mess Initiative',
  tone: 'professional',
  imageSize: '1K',
  textModel: 'gemini-3.8-flash',
  imageModel: 'gemini-3-pro-image-preview',
  posts: {
    linkedin: {
      headline: 'Elevating Campus Dining: Sunday South Indian Feast & Zero-Waste Operations',
      body: 'How do you serve 1,200+ students fresh, piping-hot meals while cutting kitchen food waste by 38%?\n\n1. Real-Time Student Feedback Loops: Every rating on taste, quality, quantity, and hygiene directly informs next week’s prep batch.\n2. Small-Batch Live Stations: Freshly fermented Masala Dosa and arachuvitta sambar prepared in staggered 20-minute intervals.\n3. Transparent Quality Metrics: All meal ratings and corrective kitchen actions are tracked openly in MessMate.\n\nOperational excellence in campus hospitality starts with listening to every plate served.',
      callToAction: 'How does your campus or organization measure daily service quality? Share below.',
      imagePrompt: 'Editorial wide-angle photo of a modern college dining hall serving South Indian Masala Dosa',
      aspectRatio: '16:9',
      imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0F172A"/><stop offset="100%" stop-color="#1E293B"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g1)"/><circle cx="1060" cy="160" r="210" fill="#38BDF8" fill-opacity="0.14"/><rect x="96" y="96" width="1088" height="528" rx="20" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.15" stroke-width="2"/><text x="150" y="210" fill="#38BDF8" font-family="Plus Jakarta Sans, sans-serif" font-size="24" font-weight="700" letter-spacing="2">LINKEDIN EDITORIAL · PROFESSIONAL · 16:9 (1K)</text><text x="150" y="330" fill="#F8FAFC" font-family="Plus Jakarta Sans, sans-serif" font-size="42" font-weight="700">Sunday South Indian Feast &amp; Zero-Waste</text><text x="150" y="405" fill="#94A3B8" font-family="Public Sans, sans-serif" font-size="24">Data-Driven Campus Hospitality · Verified Student Ratings</text></svg>`
      )}`,
    },
    twitter: {
      headline: 'Quick Dispatch · Campus Dining Upgrade',
      body: 'Crisp Masala Dosa on the griddle + 38% less food waste in the kitchen. Every student rating in MessMate directly shapes our daily prep batches. Zero guesswork, 100% accountability.',
      hashtags: ['#CampusDining', '#OperationalExcellence', '#MessMate'],
      imagePrompt: 'High-contrast studio shot of crisp Masala Dosa with coconut chutney and sambar',
      aspectRatio: '16:9',
      imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#090D16"/><stop offset="100%" stop-color="#111827"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g2)"/><circle cx="1040" cy="180" r="190" fill="#F59E0B" fill-opacity="0.14"/><rect x="96" y="96" width="1088" height="528" rx="20" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.15" stroke-width="2"/><text x="150" y="210" fill="#F59E0B" font-family="Plus Jakarta Sans, sans-serif" font-size="24" font-weight="700" letter-spacing="2">X / TWITTER DISPATCH · PROFESSIONAL · 16:9 (1K)</text><text x="150" y="330" fill="#F8FAFC" font-family="Plus Jakarta Sans, sans-serif" font-size="42" font-weight="700">Zero Guesswork. 100% Kitchen Accountability.</text><text x="150" y="405" fill="#94A3B8" font-family="Public Sans, sans-serif" font-size="24">Live Menu Ratings · Instant Feedback Loops</text></svg>`
      )}`,
    },
    instagram: {
      headline: 'Visual Story · Sunday Mess Showcase',
      body: 'Golden, crisp Masala Dosa meets fresh coconut chutney and piping-hot sambar.\n\nSwipe to see how your daily 1–5 ratings in MessMate help our kitchen team craft better meals while keeping campus dining sustainable.',
      hashtags: [
        '#CampusLife',
        '#SouthIndianFeast',
        '#MessMate',
        '#SustainableDining',
        '#StudentVoice',
        '#FreshlyServed',
      ],
      imagePrompt: 'Overhead 1:1 square studio food photography of Masala Dosa platter on travertine stone',
      aspectRatio: '1:1',
      imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#18181B"/><stop offset="100%" stop-color="#27272A"/></linearGradient></defs><rect width="1080" height="1080" fill="url(#g3)"/><circle cx="840" cy="240" r="240" fill="#10B981" fill-opacity="0.14"/><rect x="90" y="140" width="900" height="800" rx="24" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.15" stroke-width="2"/><text x="140" y="290" fill="#10B981" font-family="Plus Jakarta Sans, sans-serif" font-size="26" font-weight="700" letter-spacing="2">INSTAGRAM VISUAL STORY · 1:1 (1K)</text><text x="140" y="470" fill="#F8FAFC" font-family="Plus Jakarta Sans, sans-serif" font-size="46" font-weight="700">Golden Crisp Dosa &amp;</text><text x="140" y="535" fill="#F8FAFC" font-family="Plus Jakarta Sans, sans-serif" font-size="46" font-weight="700">Zero-Waste Kitchen</text><text x="140" y="650" fill="#94A3B8" font-family="Public Sans, sans-serif" font-size="26">#CampusLife #MessMate #StudentVoice</text></svg>`
      )}`,
    },
  },
};

export function SocialCampaignStudioView() {
  const [idea, setIdea] = useState(INITIAL_SOCIAL_RESULT.idea);
  const [tone, setTone] = useState<'professional' | 'witty' | 'urgent'>('professional');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [linkedinRatio, setLinkedinRatio] = useState<string>('16:9');
  const [twitterRatio, setTwitterRatio] = useState<string>('16:9');
  const [instagramRatio, setInstagramRatio] = useState<string>('1:1');
  const [textModel, setTextModel] = useState<string>('gemini-3.8-flash');
  const [imageModel, setImageModel] = useState<string>('gemini-3-pro-image-preview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SocialStudioResponse>(INITIAL_SOCIAL_RESULT);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!idea.trim()) {
      setError('Please enter a campaign idea or announcement topic.');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await apiFetch<SocialStudioResponse & { error?: string }>('/api/social/generate', {
      method: 'POST',
      body: JSON.stringify({
        idea: idea.trim(),
        tone,
        imageSize,
        linkedinRatio,
        twitterRatio,
        instagramRatio,
        textModel,
        imageModel,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.data.error || 'Could not generate social content.');
      return;
    }
    setResult(res.data);
  }

  function copyPostText(platform: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 1500);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <p className="text-xs font-mono text-slate-500">
              Cross-Platform Content &amp; Aspect-Ratio Visual Studio
            </p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Multi-Platform Social Media Content Generator
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Enter an announcement or campaign idea, choose your tone (Professional, Witty, Urgent), and simultaneously draft posts and platform-sized visuals for LinkedIn, X/Twitter, and Instagram.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {[
              {
                label: 'Sunday Dosa Feast',
                prompt: 'Sunday Special Masala Dosa & Filter Coffee Bar at Hostel Mess',
              },
              {
                label: '94% Hygiene Milestone',
                prompt: 'Monthly Mess Quality Report: 94% Hygiene Satisfaction Achieved',
              },
              {
                label: 'High-Protein Menu',
                prompt: 'New High-Protein Sprouted Moong & Paneer Menu Launch',
              },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setIdea(preset.prompt)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer whitespace-nowrap shrink-0"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="mt-5 space-y-4">
          <div>
            <label htmlFor="social-idea-input" className="block text-sm font-semibold text-slate-800 mb-1">
              Content Idea or Announcement Topic *
            </label>
            <textarea
              id="social-idea-input"
              rows={2}
              required
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your product launch, campus announcement, or content idea..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Desired Tone Selector */}
            <div>
              <label htmlFor="social-tone" className="block text-xs font-semibold text-slate-700 mb-1">
                Desired Tone
              </label>
              <select
                id="social-tone"
                value={tone}
                onChange={(e) => setTone(e.target.value as 'professional' | 'witty' | 'urgent')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md font-medium"
              >
                <option value="professional">Professional</option>
                <option value="witty">Witty</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Image Resolution (1K, 2K, 4K) */}
            <div>
              <label htmlFor="social-image-size" className="block text-xs font-semibold text-slate-700 mb-1">
                Image Size (Resolution)
              </label>
              <select
                id="social-image-size"
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value as '1K' | '2K' | '4K')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md font-mono"
              >
                <option value="1K">1K (Standard Studio)</option>
                <option value="2K">2K (High Detail)</option>
                <option value="4K">4K (Ultra HD)</option>
              </select>
            </div>

            {/* Gemini Text Model */}
            <div>
              <label htmlFor="gemini-model-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Gemini Intelligence Model
              </label>
              <select
                id="gemini-model-select"
                value={textModel}
                onChange={(e) => setTextModel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md font-mono"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (General)</option>
                <option value="gemini-4-argon">gemini-4-argon (Complex)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
              </select>
            </div>

            {/* Gemini Image Model */}
            <div>
              <label htmlFor="gemini-image-model-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Gemini Image Model
              </label>
              <select
                id="gemini-image-model-select"
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md font-mono"
              >
                <option value="gemini-3-pro-image-preview">gemini-3-pro-image-preview</option>
                <option value="gemini-nano-banana-2.1">gemini-nano-banana-2.1</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* LinkedIn Aspect Ratio */}
            <div>
              <label htmlFor="linkedin-ratio" className="block text-xs font-semibold text-slate-700 mb-1">
                LinkedIn Aspect Ratio
              </label>
              <select
                id="linkedin-ratio"
                value={linkedinRatio}
                onChange={(e) => setLinkedinRatio(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md font-mono"
              >
                {ASPECT_RATIOS.map((r) => (
                  <option key={r} value={r}>
                    {r} {r === '16:9' ? '(Optimal Landscape)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Twitter/X Aspect Ratio */}
            <div>
              <label htmlFor="twitter-ratio" className="block text-xs font-semibold text-slate-700 mb-1">
                Twitter/X Aspect Ratio
              </label>
              <select
                id="twitter-ratio"
                value={twitterRatio}
                onChange={(e) => setTwitterRatio(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md font-mono"
              >
                {ASPECT_RATIOS.map((r) => (
                  <option key={r} value={r}>
                    {r} {r === '16:9' ? '(Optimal Stream)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Instagram Aspect Ratio */}
            <div>
              <label htmlFor="instagram-ratio" className="block text-xs font-semibold text-slate-700 mb-1">
                Instagram Aspect Ratio
              </label>
              <select
                id="instagram-ratio"
                value={instagramRatio}
                onChange={(e) => setInstagramRatio(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md font-mono"
              >
                {ASPECT_RATIOS.map((r) => (
                  <option key={r} value={r}>
                    {r} {r === '1:1' ? '(Square Feed)' : r === '9:16' ? '(Reels/Story)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>
                {loading
                  ? 'Generating LinkedIn, X/Twitter & Instagram Posts...'
                  : 'Generate Cross-Platform Campaign'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* 3 Simultaneous Platform Cards: LinkedIn, Twitter/X, Instagram */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LinkedIn Long-Form Card */}
          <article className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">LinkedIn · Long-Form</h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Tone: {result.tone} · Aspect: {result.posts.linkedin.aspectRatio} · {result.imageSize}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyPostText(
                      'linkedin',
                      `${result.posts.linkedin.headline}\n\n${result.posts.linkedin.body}\n\n${result.posts.linkedin.callToAction}`
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                >
                  {copiedPlatform === 'linkedin' ? 'Copied!' : 'Copy Post'}
                </button>
              </div>

              <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-900">
                <img
                  src={result.posts.linkedin.imageUrl}
                  alt={`LinkedIn visual for ${result.idea}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-44 object-cover"
                />
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                {result.posts.linkedin.headline}
              </h3>
              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {result.posts.linkedin.body}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-slate-800">
              CTA: {result.posts.linkedin.callToAction}
            </div>
          </article>

          {/* Twitter / X Short & Punchy Card */}
          <article className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Twitter / X · Short &amp; Punchy</h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Tone: {result.tone} · Aspect: {result.posts.twitter.aspectRatio} · {result.imageSize}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyPostText(
                      'twitter',
                      `${result.posts.twitter.body}\n\n${result.posts.twitter.hashtags.join(' ')}`
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                >
                  {copiedPlatform === 'twitter' ? 'Copied!' : 'Copy Post'}
                </button>
              </div>

              <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-900">
                <img
                  src={result.posts.twitter.imageUrl}
                  alt={`Twitter visual for ${result.idea}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-44 object-cover"
                />
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                {result.posts.twitter.headline}
              </h3>
              <p className="text-sm text-slate-800 leading-relaxed">
                {result.posts.twitter.body}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs font-mono text-slate-600">
              {result.posts.twitter.hashtags.join(' · ')}
            </div>
          </article>

          {/* Instagram Visual-Focused Card */}
          <article className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Instagram · Visual &amp; Hashtags</h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Tone: {result.tone} · Aspect: {result.posts.instagram.aspectRatio} · {result.imageSize}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyPostText(
                      'instagram',
                      `${result.posts.instagram.body}\n\n${result.posts.instagram.hashtags.join(' ')}`
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                >
                  {copiedPlatform === 'instagram' ? 'Copied!' : 'Copy Post'}
                </button>
              </div>

              <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-900">
                <img
                  src={result.posts.instagram.imageUrl}
                  alt={`Instagram visual for ${result.idea}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-44 object-cover"
                />
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                {result.posts.instagram.headline}
              </h3>
              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {result.posts.instagram.body}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs font-mono text-slate-600">
              {result.posts.instagram.hashtags.join(' ')}
            </div>
          </article>
        </div>
      )}
    </div>
  );
}

export function AccessDeniedView({
  reason,
  onNavigate,
}: {
  reason?: string;
  onNavigate: (route: string) => void;
}) {
  return (
    <div className="max-w-lg mx-auto my-16 px-4">
      <div className="bg-white border border-red-200 rounded-lg p-8 space-y-4">
        <div className="flex items-center gap-2.5 text-red-700">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <h1 className="text-xl font-bold">403 — Access Denied</h1>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          {reason ||
            'You are not authorized to access this route. Server-side role verification strictly separates Student and Administrator privileges.'}
        </p>
        <div className="pt-3 border-t border-slate-200 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotFoundView({ onNavigate }: { onNavigate: (route: string) => void }) {
  return (
    <div className="max-w-lg mx-auto my-16 px-4">
      <div className="bg-white border border-slate-200 rounded-lg p-8 space-y-4">
        <div className="flex items-center gap-2.5 text-slate-800">
          <FileWarning className="w-6 h-6 shrink-0" />
          <h1 className="text-xl font-bold">404 — Page Not Found</h1>
        </div>
        <p className="text-sm text-slate-600">
          The requested page or route does not exist in MessMate.
        </p>
        <div className="pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
