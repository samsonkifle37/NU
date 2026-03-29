export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-800">
            <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-6 h-14 overflow-x-auto whitespace-nowrap text-sm font-medium">
                        <a href="/admin/foundry" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Listing Foundry</a>
                        <a href="/admin/image-center" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Image Center</a>
                        <a href="/admin/host-listings" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Host Listings</a>
                        <a href="/admin/debug-images" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Debug Images</a>
                        <a href="/admin/import" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Import DB</a>
                    </div>
                </div>
            </nav>
            {children}
        </div>
    );
}
