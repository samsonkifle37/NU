'use client';

import { useState } from 'react';
import { approveListing, rejectListing, rerunImageLookup, bulkPublish } from './actions';

export default function FoundryClient({ initialListings }: { initialListings: any[] }) {
    const [listings, setListings] = useState(initialListings);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    // Filters
    const [filterCategory, setFilterCategory] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterConfidence, setFilterConfidence] = useState('');

    const filteredListings = listings.filter(l => {
        if (filterCategory && l.category !== filterCategory) return false;
        if (filterCity && l.city !== filterCity) return false;
        if (filterConfidence) {
            const conf = l.confidenceScore;
            if (filterConfidence === 'high' && conf < 0.7) return false;
            if (filterConfidence === 'med' && (conf < 0.5 || conf >= 0.7)) return false;
            if (filterConfidence === 'low' && conf >= 0.5) return false;
        }
        return true;
    });

    const toggleSelect = (id: string) => {

        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        setLoading(true);
        // Call server action for each
        for (const id of Array.from(selectedIds)) {
            await approveListing(id);
        }
        // optimistic update
        setListings(listings.map(l => selectedIds.has(l.id) ? { ...l, status: 'PUBLISHED' } : l));
        setSelectedIds(new Set());
        setLoading(false);
    };

    const handleApprove = async (id: string) => {
        setLoading(true);
        await approveListing(id);
        setListings(listings.map(l => l.id === id ? { ...l, status: 'PUBLISHED' } : l));
        setLoading(false);
    };

    const handleReject = async (id: string) => {
        setLoading(true);
        await rejectListing(id);
        setListings(listings.map(l => l.id === id ? { ...l, status: 'REJECTED' } : l));
        setLoading(false);
    };

    const handleRerunImage = async (id: string) => {
        setLoading(true);
        await rerunImageLookup(id);
        alert('Added to secondary Image lookup queue');
        setLoading(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            {/* Filters */}
            <div className="flex gap-4 mb-4 flex-wrap">
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                    <option value="">All Categories</option>
                    <option value="hotel">Hotels</option>
                    <option value="restaurant">Restaurants</option>
                    <option value="coffee">Coffee</option>
                    <option value="museum">Museums</option>
                    <option value="park">Parks</option>
                </select>
                <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                    <option value="">All Cities</option>
                    {Array.from(new Set(listings.map(l => l.city))).map((city: any) => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                </select>
                <select value={filterConfidence} onChange={(e) => setFilterConfidence(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                    <option value="">All Confidences</option>
                    <option value="high">High (&gt;70%)</option>
                    <option value="med">Medium (50-70%)</option>
                    <option value="low">Low (&lt;50%)</option>

                </select>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-4">
                <button
                    onClick={handleBulkApprove}
                    disabled={selectedIds.size === 0 || loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50 transition"
                >
                    Bulk Publish ({selectedIds.size})
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase font-medium">
                        <tr>
                            <th className="px-4 py-3">
                                <input
                                    type="checkbox"
                                    onChange={e => setSelectedIds(e.target.checked ? new Set(filteredListings.map(l => l.id)) : new Set())}
                                    checked={selectedIds.size === filteredListings.length && filteredListings.length > 0}
                                />
                            </th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Location</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Confidence</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Provenance & AI</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredListings.map(l => (
                            <tr key={l.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(l.id)}
                                        onChange={() => toggleSelect(l.id)}
                                    />
                                </td>
                                <td className="px-4 py-3 font-medium">
                                    {l.name}
                                    {l.tags && l.tags.length > 0 && <div className="text-xs text-gray-500 mt-1">{l.tags.join(', ')}</div>}
                                </td>
                                <td className="px-4 py-3">{l.city}, {l.district || 'Unknown'}</td>
                                <td className="px-4 py-3">{l.category}</td>
                                <td className="px-4 py-3">
                                    <div className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${l.confidenceScore > 0.7 ? 'bg-green-100 text-green-800' : l.confidenceScore < 0.5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {(l.confidenceScore * 100).toFixed(0)}%
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">{l.status}</span>
                                </td>
                                <td className="px-4 py-3 text-xs">
                                    {l.sourceProvenance?.fields?.raw_osm?.osm_type ? "OSM Validated ✓" : "Weak Source ⚠"}<br />
                                    <span className="truncate max-w-[150px] inline-block" title={l.shortDescription}>{l.shortDescription ? 'AI ✓' : 'AI Pending'}</span>
                                </td>
                                <td className="px-4 py-3 flex gap-2">
                                    <button onClick={() => handleApprove(l.id)} disabled={loading || l.status === 'PUBLISHED'} className={`text-white px-2 py-1 rounded text-xs ${l.status === 'PUBLISHED' ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>Approve</button>
                                    <button onClick={() => handleReject(l.id)} disabled={loading || l.status === 'REJECTED' || l.status === 'PUBLISHED'} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs disabled:opacity-50">Reject</button>
                                    <button onClick={() => handleRerunImage(l.id)} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs disabled:opacity-50">Refresh Img</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredListings.length === 0 && <div className="p-8 text-center text-gray-500">No raw listings found. Run the ingestion worker to populate this table or change filters.</div>}
            </div>
        </div>
    );
}
