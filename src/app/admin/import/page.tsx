"use client";

import { useState } from "react";

export default function ImportPage() {
    const [status, setStatus] = useState<string>("Ready to import file.");
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<any>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatus(`Reading ${file.name}...`);

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.places || !Array.isArray(data.places)) {
                setStatus("Invalid JSON. Root must be {'places': []}");
                setLoading(false);
                return;
            }

            setStatus(`Found ${data.places.length} places. Uploading...`);

            const res = await fetch("/api/admin/places/import-v2-5", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (res.ok) {
                setStatus("Import Complete!");
                setSummary(result.summary);
            } else {
                setStatus(`Error: ${result.error || 'Failed'}`);
            }
        } catch (error) {
            setStatus("Parse Error. Not valid JSON.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-12 px-6">
            <h1 className="text-3xl font-black mb-6">Seed DB (v2.5)</h1>
            <p className="text-gray-500 mb-8">
                Upload the <code>addisview_seed_places.json</code> file to import places.
            </p>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">JSON File</label>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        disabled={loading}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    />
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className={`font-mono text-sm ${loading ? 'text-ethiopia-yellow animate-pulse' : 'text-gray-600'}`}>
                        $ {status}
                    </p>
                </div>

                {summary && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                        <h3 className="text-green-800 font-bold mb-2">Import Summary</h3>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>Total processed: {summary.total}</li>
                            <li>Inserted: <span className="font-bold">{summary.inserted}</span></li>
                            <li>Updated: <span className="font-bold">{summary.updated}</span></li>
                            <li>Skipped: <span className="font-bold">{summary.skipped}</span></li>
                        </ul>
                        {summary.skipReasons?.length > 0 && (
                            <details className="mt-4">
                                <summary className="text-xs font-bold text-green-900 cursor-pointer">View skip reasons</summary>
                                <ul className="text-xs mt-2 text-green-800 space-y-1 max-h-40 overflow-y-auto">
                                    {summary.skipReasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                                </ul>
                            </details>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
