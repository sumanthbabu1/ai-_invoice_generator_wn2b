"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from '@supabase/supabase-js';

// 1. VERCEL FIX: Notice PDFDownloadLink is completely REMOVED from these curly braces!
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// 2. We dynamically import it and rename it to 'DownloadButton' to bypass Vercel's strict TS errors
const DownloadButton = dynamic(
  // @ts-ignore
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <button style={{ padding: "10px 20px", background: "#e5e7eb", borderRadius: "5px", border: "none" }}>Loading PDF Engine...</button> }
);

// --- DATABASE CONNECTION ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- PDF TEMPLATE STYLES ---
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center', color: '#333', fontWeight: 'bold' },
  client: { fontSize: 14, marginBottom: 20, color: '#555' },
  itemRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 },
  description: { flex: 1, fontSize: 12 },
  qty: { width: 50, fontSize: 12, textAlign: 'center' },
  price: { width: 80, fontSize: 12, textAlign: 'right' },
  totalRow: { flexDirection: 'row', marginTop: 20, paddingTop: 10, borderTopWidth: 2, borderTopColor: '#333' },
  totalLabel: { flex: 1, fontSize: 14, fontWeight: 'bold', textAlign: 'right', paddingRight: 10 },
  totalValue: { width: 80, fontSize: 14, fontWeight: 'bold', textAlign: 'right' }
});

// --- PDF DOCUMENT COMPONENT ---
const InvoicePDF = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>INVOICE</Text>
      <Text style={styles.client}>Billed To: {data.clientName}</Text>
      <View style={[styles.itemRow, { backgroundColor: '#f9f9f9' }]}>
        <Text style={styles.description}>Description</Text>
        <Text style={styles.qty}>Qty</Text>
        <Text style={styles.price}>Price</Text>
      </View>
      {data.items?.map((item: any, i: number) => (
        <View key={i} style={styles.itemRow}>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.qty}>{item.quantity}</Text>
          <Text style={styles.price}>${item.price?.toFixed(2)}</Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Due:</Text>
        <Text style={styles.totalValue}>${data.totalAmount?.toFixed(2)}</Text>
      </View>
    </Page>
  </Document>
);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  const [prompt, setPrompt] = useState("I did a logo design for Startup Inc. Flat fee of $500.");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) fetchHistory(session.user.id);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) fetchHistory(session.user.id);
    });
    
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchHistory = async (userId: string) => {
    const { data } = await supabase.from('invoices').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handleSignUp = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Success! Check your email or log in.");
    setAuthLoading(false);
  };

  const handleLogin = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setResult(null);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResult(data);

      if (user) {
        await supabase.from('invoices').insert({
          user_id: user.id, client_name: data.clientName, total_amount: data.totalAmount
        });
        fetchHistory(user.id);
      }
    } catch (error) {
      alert("Error generating invoice.");
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "400px", margin: "100px auto", textAlign: "center", border: "1px solid #ddd", borderRadius: "10px" }}>
        <h2>Welcome to AI Invoice SaaS</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>Log in or sign up to generate and save invoices.</p>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #ccc", color: "black" }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "20px", borderRadius: "5px", border: "1px solid #ccc", color: "black" }} />
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleLogin} disabled={authLoading} style={{ flex: 1, padding: "10px", background: "#000", color: "#fff", borderRadius: "5px", cursor: "pointer", border: "none" }}>Log In</button>
          <button onClick={handleSignUp} disabled={authLoading} style={{ flex: 1, padding: "10px", background: "#fff", color: "#000", border: "1px solid #000", borderRadius: "5px", cursor: "pointer" }}>Sign Up</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "20px", marginBottom: "20px" }}>
        <h2>🤖 AI Invoice Generator</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span style={{ fontSize: "14px", color: "#666" }}>{user.email}</span>
          <button onClick={handleLogout} style={{ padding: "8px 16px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Log Out</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 500px" }}>
          <h3>Create New Invoice</h3>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #ccc", color: "black", fontFamily: "inherit" }} />
          <button onClick={handleGenerate} disabled={loading} style={{ padding: "10px 20px", background: loading ? "#ccc" : "#2563eb", color: "#fff", cursor: loading ? "not-allowed" : "pointer", borderRadius: "5px", border: "none", fontWeight: "bold" }}>
            {loading ? "Generating..." : "Generate Invoice"}
          </button>

          {result && (
            <div style={{ marginTop: "20px", background: "#f0fdf4", padding: "20px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
              <h3 style={{ color: "#166534", marginTop: 0 }}>✅ Success!</h3>
              <p style={{ color: "#15803d", marginBottom: "15px" }}>Invoice for {result.clientName} is ready.</p>
              
              <DownloadButton document={<InvoicePDF data={result} />} fileName="invoice.pdf" style={{ display: "inline-block", background: "#16a34a", color: "white", padding: "10px 20px", borderRadius: "5px", textDecoration: "none", fontWeight: "bold" }}>
                {/* @ts-ignore */}
                {({ loading }: any) => (loading ? 'Generating Document...' : '⬇️ Download PDF')}
              </DownloadButton>

            </div>
          )}
        </div>

        <div style={{ flex: "1 1 250px", background: "#f9fafb", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb", alignSelf: "flex-start" }}>
          <h3 style={{ marginTop: 0 }}>Past Invoices</h3>
          {history.length === 0 ? <p style={{ color: "#6b7280", fontSize: "14px" }}>No invoices yet.</p> : null}
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {history.map((inv) => (
              <div key={inv.id} style={{ background: "#fff", padding: "10px", border: "1px solid #e5e7eb", borderRadius: "5px", marginBottom: "10px" }}>
                <div style={{ fontWeight: "bold", fontSize: "14px", color: "#111" }}>{inv.client_name}</div>
                <div style={{ color: "#059669", fontWeight: "bold", fontSize: "14px" }}>${inv.total_amount}</div>
                <div style={{ color: "#9ca3af", fontSize: "12px", marginTop: "5px" }}>{new Date(inv.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}