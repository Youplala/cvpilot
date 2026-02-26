import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font, pdf } from '@react-pdf/renderer';
import { useAppStore } from '../stores/appStore';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';
import type { GeneratedCV } from '../types';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff2', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: { fontFamily: 'Inter', fontSize: 10, padding: 40, color: '#1f2937' },
  header: { marginBottom: 20 },
  name: { fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 4 },
  contact: { fontSize: 9, color: '#6b7280' },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: '#4f46e5', marginTop: 16, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 1 },
  summary: { fontSize: 10, lineHeight: 1.5, color: '#374151', marginBottom: 4 },
  expHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginBottom: 2 },
  expTitle: { fontSize: 10, fontWeight: 600 },
  expCompany: { fontSize: 10, color: '#6366f1' },
  expDate: { fontSize: 9, color: '#9ca3af' },
  bullet: { fontSize: 9.5, color: '#4b5563', marginLeft: 8, marginBottom: 2, lineHeight: 1.4 },
  skillsRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 4 },
  skill: { fontSize: 9, backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', marginVertical: 6 },
});

function CVDocument({ cv, profile }: { cv: GeneratedCV; profile: { fullName: string; email: string; phone: string; location: string } }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{profile.fullName}</Text>
          <Text style={styles.contact}>
            {[profile.email, profile.phone, profile.location].filter(Boolean).join('  •  ')}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.summary}>{cv.sections.summary}</Text>

        <Text style={styles.sectionTitle}>Experience</Text>
        {cv.sections.experiences.map((exp, i) => (
          <View key={i} style={{ marginBottom: 10 }}>
            <View style={styles.expHeader}>
              <View>
                <Text style={styles.expTitle}>{exp.title}</Text>
                <Text style={styles.expCompany}>{exp.company}</Text>
              </View>
              <Text style={styles.expDate}>
                {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
              </Text>
            </View>
            {exp.highlights.map((h, j) => (
              <Text key={j} style={styles.bullet}>• {h}</Text>
            ))}
          </View>
        ))}

        {cv.sections.education.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Education</Text>
            {cv.sections.education.map((edu, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <View style={styles.expHeader}>
                  <View>
                    <Text style={styles.expTitle}>{edu.degree} in {edu.field}</Text>
                    <Text style={styles.expCompany}>{edu.school}</Text>
                  </View>
                  <Text style={styles.expDate}>{edu.startDate} — {edu.endDate}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {cv.sections.skills.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsRow}>
              {cv.sections.skills.map((s, i) => (
                <Text key={i} style={styles.skill}>{s}</Text>
              ))}
            </View>
          </>
        )}

        {cv.sections.languages.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.summary}>{cv.sections.languages.join('  •  ')}</Text>
          </>
        )}
      </Page>
    </Document>
  );
}

export default function Export() {
  const { cvId } = useParams<{ cvId: string }>();
  const navigate = useNavigate();
  const { cvs, profile } = useAppStore();
  const cv = cvs.find((c) => c.id === cvId);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!cv || !profile) return;
    const doc = <CVDocument cv={cv} profile={profile} />;
    pdf(doc).toBlob().then((blob) => {
      setPreviewUrl(URL.createObjectURL(blob));
    });
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cv, profile]);

  if (!cv || !profile) {
    return (
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">CV not found.</p>
          <Button className="mt-4" onClick={() => navigate('/cvs')}>Back</Button>
        </div>
      </PageTransition>
    );
  }

  const filename = `CV_${profile.fullName.replace(/\s+/g, '_')}_${cv.company.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Export PDF</h1>
            <p className="text-sm text-gray-500 mt-1">{filename}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/editor/${cv.id}`)}>
              Back to Editor
            </Button>
            <PDFDownloadLink
              document={<CVDocument cv={cv} profile={profile} />}
              fileName={filename}
            >
              {({ loading: pdfLoading }) => (
                <Button loading={pdfLoading}>
                  Download PDF
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-100 rounded-xl border border-gray-200 overflow-hidden" style={{ minHeight: '80vh' }}>
          {previewUrl ? (
            <iframe src={previewUrl} className="w-full" style={{ height: '80vh' }} title="CV Preview" />
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-400">
              Generating preview...
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
