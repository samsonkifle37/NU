import { PlaceGrid } from "@/components/PlaceGrid";

export const metadata = {
    title: "Tours & Experiences — NU",
    description: "Discover guided tours, museums, parks, markets, and cultural experiences across Ethiopia.",
};

export default function ToursPage() {
    return (
        <PlaceGrid
            title="Tours & Experiences"
            types="tour,tour_operator,guide,experience"
            filterOptions={[
                { value: "", label: "All Tours" },
                { value: "tour", label: "Day Tours" },
                { value: "tour_operator", label: "Operators" },
            ]}
            searchPlaceholder="Lalibela, Omo Valley, city tours..."
            areaOptions={[
                { value: "Bole", label: "Bole", emoji: "🏙️ " },
                { value: "Kazanchis", label: "Kazanchis", emoji: "🏨 " },
                { value: "Piazza", label: "Piazza", emoji: "🕌 " },
                { value: "Kirkos", label: "Kirkos", emoji: "🌆 " },
                { value: "Sarbet", label: "Sarbet", emoji: "🌿 " },
                { value: "Arat Kilo", label: "Arat Kilo", emoji: "🏛️ " },
                { value: "Mercato", label: "Mercato", emoji: "🛍️ " },
            ]}
            accentColor="orange-500"
        />
    );
}
