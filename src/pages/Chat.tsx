import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../stores/appStore';
import { streamChat, parseCV } from '../services/gemini';
import { extractTextFromPDF } from '../services/pdf';
import Button from '../components/Button';
import type { ChatMessage, UserProfile } from '../types';

const SYSTEM_PROMPT = `You are CVPilot, a friendly and professional career assistant. Your job is to help users build their professional profile.

On first interaction:
1. Introduce yourself briefly
2. Ask the user to upload their CV (PDF) or describe their background
3. When they share info, confirm what you understood and ask follow-up questions for gaps
4. After you have enough info, say "Your profile is ready! You can now go to the Jobs tab to add job listings." and include [PROFILE_READY] in your response.

Be conversational, warm, and concise. Don't use bullet points excessively. Feel like a career coach chat.`;

export default function Chat() {
  const { messages, addMessage, profile, setProfile, addToast } = useAppStore();
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Send initial greeting if no messages
  useEffect(() => {
    if (messages.length === 0 && !streaming) {
      sendBotMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendBotMessage(userMsg?: string) {
    const allMsgs = [...messages];
    if (userMsg) {
      allMsgs.push({ id: '', role: 'user' as const, content: userMsg, timestamp: 0 });
    } else {
      // Trigger greeting
      allMsgs.push({ id: '', role: 'user' as const, content: 'Hi! I want to build my CV profile.', timestamp: 0 });
    }

    setStreaming(true);
    setStreamingContent('');
    let fullContent = '';

    try {
      const chatMsgs = allMsgs.map((m) => ({ role: m.role, content: m.content }));
      for await (const chunk of streamChat(chatMsgs, SYSTEM_PROMPT)) {
        fullContent += chunk;
        setStreamingContent(fullContent);
      }

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
      };
      await addMessage(botMsg);
      setStreamingContent('');

      if (fullContent.includes('[PROFILE_READY]')) {
        addToast('Profile ready! 🎉', 'success');
        setTimeout(() => navigate('/profile'), 2000);
      }
    } catch (err) {
      addToast(`Error: ${(err as Error).message}`, 'error');
    } finally {
      setStreaming(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || streaming) return;
    const text = input.trim();
    setInput('');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    await addMessage(userMsg);
    await sendBotMessage(text);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      let text: string;
      try {
        text = await extractTextFromPDF(file);
      } catch (pdfErr) {
        addToast(`Failed to read PDF: ${(pdfErr as Error).message}`, 'error');
        setUploading(false);
        return;
      }
      const parsed = await parseCV(text);

      const newProfile: UserProfile = {
        id: profile?.id || crypto.randomUUID(),
        fullName: parsed.fullName || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        location: parsed.location || '',
        linkedinUrl: parsed.linkedinUrl || '',
        websiteUrl: parsed.websiteUrl || '',
        summary: parsed.summary || '',
        experiences: (parsed.experiences || []).map((e) => ({ ...e, id: crypto.randomUUID() })),
        education: (parsed.education || []).map((e) => ({ ...e, id: crypto.randomUUID() })),
        skills: parsed.skills || [],
        languages: parsed.languages || [],
        certifications: parsed.certifications || [],
        projects: (parsed.projects || []).map((p) => ({ ...p, id: crypto.randomUUID() })),
        targetRole: parsed.targetRole || '',
        rawCvText: text,
        updatedAt: Date.now(),
      };
      await setProfile(newProfile);

      const uploadMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: `I've uploaded my CV (${file.name}). Here's what was extracted:\n\nName: ${newProfile.fullName}\nExperience: ${newProfile.experiences.length} positions\nEducation: ${newProfile.education.length} entries\nSkills: ${newProfile.skills.map((s) => s.name).join(', ')}`,
        timestamp: Date.now(),
      };
      await addMessage(uploadMsg);
      addToast('CV parsed successfully!', 'success');
      await sendBotMessage(uploadMsg.content);
    } catch (err) {
      const errMsg = (err as Error).message;
      if (errMsg.includes('429') || errMsg.includes('Resource exhausted')) {
        addToast('Rate limited by Gemini API. Wait a minute and try again.', 'error');
      } else {
        addToast(`Failed to analyze CV: ${errMsg}`, 'error');
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const displayMessages = messages.filter(
    (m) => !(m === messages[0] && m.role === 'user' && m.content.includes('I want to build my CV profile'))
  );

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {displayMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-accent-500 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {msg.content.replace('[PROFILE_READY]', '')}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming message */}
          {streaming && streamingContent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-md bg-gray-100 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                {streamingContent.replace('[PROFILE_READY]', '')}
              </div>
            </motion.div>
          )}

          {/* Typing indicator */}
          {streaming && !streamingContent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gray-100 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 bg-white px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-2 items-end">
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileRef.current?.click()}
            loading={uploading}
            className="shrink-0"
          >
            📎 PDF
          </Button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400"
            />
          </div>
          <Button onClick={handleSend} disabled={!input.trim() || streaming} size="sm" className="shrink-0">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
