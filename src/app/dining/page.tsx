import { PlaceGrid } from "@/components/PlaceGrid";

export const metadata = {
    title: "Dining — NU",
    description: "Find the best restaurants, cafes, and nightlife in Ethiopia.",
};

export default function DiningPage() {
    return (
        <PlaceGrid
            title="Dining & Nightlife"
            types="restaurant,coffee,club,nightlife"
            filterOptions={[
                { value: "", label: "All Dining" },
                { value: "restaurant", label: "Restaurants" },
                { value: "coffee", label: "Coffee Shops" },
                { value: "club", label: "Nightlife" },
            ]}
            searchPlaceholder="Bole, restaurants, coffee..."
            areaOptions={[
                { value: "Bole", label: "Bole", emoji: "🏙️ " },
                { value: "Kazanchis", label: "Kazanchis", emoji: "🏨 " },
                { value: "Piazza", label: "Piazza", emoji: "🕌 " },
                { value: "Kirkos", label: "Kirkos", emoji: "🌆 " },
                { value: "Sarbet", label: "Sarbet", emoji: "🌿 " },
                { value: "Arat Kilo", label: "Arat Kilo", emoji: "🏛️ " },
                { value: "Mercato", label: "Mercato", emoji: "🛍️ " },
            ]}
            accentColor="ethiopia-red"
        />
    );
}
