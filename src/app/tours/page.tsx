import { PlaceGrid } from "@/components/PlaceGrid";

export const metadata = {
    title: "Tours & Experiences — AddisView",
    description: "Discover guided tours, museums, parks, markets, and cultural experiences across Ethiopia.",
};

export default function ToursPage() {
    return (
        <PlaceGrid
            title="Tours & Experiences"
            types="tour,park,market,coffee,museum,culture,nightlife,tour_operator"
            filterOptions={[
                { value: "", label: "All" },
                { value: "must-see", label: "Must-See" },
                { value: "tour", label: "Tours" },
                { value: "park", label: "Parks" },
                { value: "market", label: "Markets" },
                { value: "coffee", label: "Coffee" },
                { value: "museum", label: "Culture" },
            ]}
            searchPlaceholder="Lalibela, parks, coffee..."
            accentColor="orange-500"
        />
    );
}
