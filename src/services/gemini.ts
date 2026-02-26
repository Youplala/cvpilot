import { GoogleGenerativeAI } from '@google/generative-ai';
import type { UserProfile, JobListing, GeneratedCV, CVSections, AnalysisDetails } from '../types';

function getClient() {
  const key = localStorage.getItem('gemini_api_key');
  if (!key) throw new Error('No API key configured');
  return new GoogleGenerativeAI(key);
}

function getModel() {
  return getClient().getGenerativeModel({ model: 'gemini-2.0-flash' });
}

export async function testApiKey(key: string): Promise<boolean> {
  try {
    const client = new GoogleGenerativeAI(key);
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    await model.generateContent('Say "ok"');
    return true;
  } catch {
    return false;
  }
}

export async function* streamChat(
  messages: { role: string; content: string }[],
  systemPrompt: string
): AsyncGenerator<string> {
  const model = getModel();
  const chat = model.startChat({
    history: messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] },
  });

  const lastMsg = messages[messages.length - 1];
  const result = await chat.sendMessageStream(lastMsg.content);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

export async function parseCV(cvText: string): Promise<Partial<UserProfile>> {
  const model = getModel();
  const prompt = `Parse this CV/resume text and extract structured data. Return ONLY valid JSON with this exact structure:
{
  "fullName": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedinUrl": "",
  "websiteUrl": "",
  "summary": "",
  "experiences": [{"company":"","title":"","startDate":"","endDate":"","current":false,"description":"","highlights":[]}],
  "education": [{"school":"","degree":"","field":"","startDate":"","endDate":"","description":""}],
  "skills": [{"name":"","level":3,"category":""}],
  "languages": [{"name":"","level":"fluent"}],
  "certifications": [{"name":"","issuer":"","date":""}],
  "projects": [{"name":"","description":"","url":"","technologies":[]}],
  "targetRole": ""
}

CV Text:
${cvText}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse CV');
  return JSON.parse(jsonMatch[0]);
}

export async function parseJobListing(markdown: string): Promise<Partial<JobListing>> {
  const model = getModel();
  const prompt = `Extract structured job listing data from this page content. Return ONLY valid JSON:
{
  "company": "",
  "title": "",
  "location": "",
  "type": "remote|hybrid|onsite",
  "description": "",
  "requirements": [],
  "niceToHaves": [],
  "responsibilities": [],
  "salary": ""
}

Content:
${markdown.slice(0, 15000)}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse job listing');
  return JSON.parse(jsonMatch[0]);
}

export async function generateTailoredCV(
  profile: UserProfile,
  job: JobListing
): Promise<{ sections: CVSections; analysis: AnalysisDetails }> {
  const model = getModel();
  const prompt = `You are an expert CV writer. Given the candidate profile and the target job listing, generate:
1. A compatibility analysis
2. A tailored CV optimized for this specific job

Candidate Profile:
${JSON.stringify(profile, null, 2)}

Job Listing:
${JSON.stringify(job, null, 2)}

Return ONLY valid JSON with this structure:
{
  "analysis": {
    "hardSkills": 0-100,
    "softSkills": 0-100,
    "experienceLevel": 0-100,
    "educationFit": 0-100,
    "strengths": ["..."],
    "gaps": ["..."],
    "recommendations": ["..."]
  },
  "sections": {
    "summary": "A tailored professional summary for this specific role",
    "experiences": [{"company":"","title":"","startDate":"","endDate":"","current":false,"highlights":["achievement-oriented bullets tailored to job"]}],
    "education": [{"school":"","degree":"","field":"","startDate":"","endDate":""}],
    "skills": ["relevant skills ordered by importance for this job"],
    "languages": ["Language - Level"]
  }
}

Important: Only use real data from the profile. Never invent experience. Reword and emphasize what's most relevant.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to generate CV');
  const parsed = JSON.parse(jsonMatch[0]);
  return { sections: parsed.sections, analysis: parsed.analysis };
}

export async function improveSection(
  sectionName: string,
  sectionContent: string,
  jobContext: string
): Promise<string> {
  const model = getModel();
  const prompt = `Improve this CV section for the given job context. Make it more impactful, concise, and tailored. Return ONLY the improved text, no JSON, no explanation.

Section: ${sectionName}
Content: ${sectionContent}
Job Context: ${jobContext}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
