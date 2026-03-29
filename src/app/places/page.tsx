import { PlaceGrid } from "@/components/PlaceGrid";

export const metadata = {
    title: "Places — NU",
    description: "Discover parks, markets, museums, and points of interest in Ethiopia.",
};

export default function PlacesPage() {
    return (
        <PlaceGrid
            title="Explore Places"
            types="park,market,museum,culture,landmark,place,religious,religious site"
            filterOptions={[
                { value: "", label: "All Places" },
                { value: "museum", label: "Museums" },
                { value: "park", label: "Parks & Nature" },
                { value: "market", label: "Markets" },
                { value: "landmark", label: "Landmarks" },
                { value: "religious", label: "Religious" },
            ]}
            searchPlaceholder="National Museum, Parks..."
            accentColor="ethiopia-yellow"
        />
    );
}
