"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Dynamic Import for PDF engine to prevent Vercel Build crashes
const DownloadButton = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <button className="px-4 py-2 bg-gray-300 rounded">Loading PDF Engine...</button> }
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  itemRow: { flexDirection: 'row', borderBottom: '1px solid #eee', paddingVertical: 8 }
});

const InvoicePDF = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>INVOICE</Text>
      <Text>Billed To: {data.clientName}</Text>
      {data.items?.map((item: any, i: number) => (
        <View key={i} style={styles.itemRow}>
          <Text>{item.description} - ${item.price}</Text>
        </View>
      ))}
    </Page>
  </Document>
);

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <main className="max-w-3xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-6">AI Invoice Generator</h1>
      <textarea 
        className="w-full p-4 border rounded mb-4 text-black"
        placeholder="Enter invoice details..."
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button 
        onClick={handleGenerate}
        className="px-6 py-2 bg-blue-600 text-white rounded font-bold"
      >
        {loading ? "Generating..." : "Generate PDF"}
      </button>

      {result && (
        <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded">
          <DownloadButton 
            document={<InvoicePDF data={result} />} 
            fileName="invoice.pdf"
            className="px-6 py-2 bg-green-600 text-white rounded font-bold"
          >
            {({ loading }: any) => (loading ? 'Generating...' : '⬇️ Download PDF')}
          </DownloadButton>
        </div>
      )}
    </main>
  );
}