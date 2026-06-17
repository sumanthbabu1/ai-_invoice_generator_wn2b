"use client";
import { useState } from "react";

export default function Home() {
const [prompt, setPrompt] = useState("I did a logo design for Startup Inc. Flat fee of $500. Add a 10% tax.");
const [result, setResult] = useState(null);
const [loading, setLoading] = useState(false);

const handleGenerate = async () => {
setLoading(true);
try {
const res = await fetch("/api/generate", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ prompt }),
});

  const data = await res.json();
  setResult(data); 
} catch (error) {
  alert("Error connecting to API. Check your terminal for errors.");
}
setLoading(false);


};

return (
<div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
<h2 style={{ marginBottom: "10px" }}>🧪 Test Gemini AI Extractor
<p style={{ color: "#666", marginBottom: "20px" }}>
Type a messy sentence below and watch Gemini convert it into perfect database JSON.


  <textarea
    value={prompt}
    onChange={(e) => setPrompt(e.target.value)}
    rows={4}
    style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #ccc", color: "black" }}
  />
  
  <button
    onClick={handleGenerate}
    disabled={loading}
    style={{ 
      padding: "10px 20px", 
      background: loading ? "#ccc" : "#000", 
      color: "#fff", 
      cursor: loading ? "not-allowed" : "pointer",
      borderRadius: "5px",
      border: "none",
      fontWeight: "bold"
    }}
  >
    {loading ? "Gemini is thinking..." : "Test AI Extraction"}
  </button>

  {result && (
    <div style={{ marginTop: "30px", background: "#f4f4f4", padding: "20px", borderRadius: "8px", border: "1px solid #ddd" }}>
      <h3 style={{ color: "black", marginTop: 0 }}>AI Output (Clean JSON):</h3>
      <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", color: "#333", margin: 0 }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  )}
</div>


);
}