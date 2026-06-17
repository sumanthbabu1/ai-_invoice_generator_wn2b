"use client";
import { useState, useEffect } from "react";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";

// --- 1. PDF STYLES ---
const styles = StyleSheet.create({
page: { padding: 40, fontFamily: "Helvetica", fontSize: 12, color: "#333" },
header: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#000" },
clientInfo: { marginBottom: 30, paddingBottom: 10, borderBottom: "1px solid #eee" },
tableHeader: { flexDirection: "row", borderBottom: "2px solid #000", paddingBottom: 5, marginBottom: 10, fontWeight: "bold" },
tableRow: { flexDirection: "row", paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid #eee" },
colDesc: { flex: 3 },
colQty: { flex: 1, textAlign: "center" },
colPrice: { flex: 1, textAlign: "right" },
totals: { marginTop: 20, paddingTop: 10, borderTop: "2px solid #000", alignItems: "flex-end" },
totalText: { fontSize: 14, fontWeight: "bold", marginTop: 5 }
});

// --- 2. PDF DOCUMENT TEMPLATE ---
const InvoicePDF = ({ data }: { data: any }) => (


INVOICE

  <View style={styles.clientInfo}>
    <Text style={{ color: "#666", marginBottom: 4 }}>Billed To:</Text>
    <Text style={{ fontSize: 16, fontWeight: "bold", color: "#000" }}>{data.clientName}</Text>
  </View>

  <View style={styles.tableHeader}>
    <Text style={styles.colDesc}>Description</Text>
    <Text style={styles.colQty}>Qty</Text>
    <Text style={styles.colPrice}>Price</Text>
  </View>

  {data.items.map((item: any, i: number) => (
    <View key={i} style={styles.tableRow}>
      <Text style={styles.colDesc}>{item.description}</Text>
      <Text style={styles.colQty}>{item.quantity}</Text>
      <Text style={styles.colPrice}>${item.price.toFixed(2)}</Text>
    </View>
  ))}

  <View style={styles.totals}>
    <Text>Tax Rate: {(data.taxRate * 100).toFixed(0)}%</Text>
    <Text style={styles.totalText}>Total Amount: ${data.totalAmount.toFixed(2)}</Text>
  </View>
</Page>


// --- 3. MAIN UI ---
export default function Home() {
const [prompt, setPrompt] = useState("I did a logo design for Startup Inc. Flat fee of $500. Add a 10% tax.");
const [result, setResult] = useState(null);
const [loading, setLoading] = useState(false);
const [isClient, setIsClient] = useState(false);

// This ensures the PDF library only loads on the client side to prevent Next.js errors
useEffect(() => {
setIsClient(true);
}, []);

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
if (data.error) throw new Error(data.error);
setResult(data);
} catch (error) {
alert("Error generating invoice. Check console.");
}
setLoading(false);
};

return (
<div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
<h2 style={{ marginBottom: "10px" }}>⚡ AI Invoice Generator
<p style={{ color: "#666", marginBottom: "20px" }}>
Type your project details below. Gemini will extract the data and generate a PDF.


  <textarea
    value={prompt}
    onChange={(e) => setPrompt(e.target.value)}
    rows={4}
    style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #ccc", color: "black" }}
  />
  
  <button
    onClick={handleGenerate}
    disabled={loading}
    style={{ padding: "12px 24px", background: loading ? "#ccc" : "#000", color: "#fff", cursor: loading ? "not-allowed" : "pointer", borderRadius: "5px", border: "none", fontWeight: "bold", width: "100%" }}
  >
    {loading ? "Generating Invoice..." : "Create Invoice"}
  </button>

  {/* Show the Download Button when the AI is done */}
  {result && isClient && (
    <div style={{ marginTop: "30px", background: "#f4f4f4", padding: "20px", borderRadius: "8px", border: "1px solid #ddd", textAlign: "center" }}>
      <h3 style={{ color: "black", marginTop: 0, marginBottom: "15px" }}>🎉 Invoice Ready!</h3>
      
      <PDFDownloadLink 
        document={<InvoicePDF data={result} />} 
        fileName={`${result.clientName.replace(/\s+/g, '_')}_Invoice.pdf`}
        style={{ display: "inline-block", padding: "10px 20px", background: "#2563eb", color: "white", textDecoration: "none", borderRadius: "5px", fontWeight: "bold" }}
      >
        {({ loading }) => (loading ? "Preparing PDF..." : "📥 Download PDF Invoice")}
      </PDFDownloadLink>
    </div>
  )}
</div>


);
}