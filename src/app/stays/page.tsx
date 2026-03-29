import { PlaceGrid } from "@/components/PlaceGrid";

export const metadata = {
    title: "Stays — NU",
    description: "Find hotels, guesthouses, apartments, and resorts across Ethiopia.",
};

export default function StaysPage() {
    return (
        <PlaceGrid
            title="Discover Stays"
            types="hotel,guesthouse,apartment,resort"
            filterOptions={[
                { value: "", label: "All Stays" },
                { value: "hotel", label: "Hotels" },
                { value: "guesthouse", label: "Guesthouses" },
                { value: "apartment", label: "Apartments" },
                { value: "resort", label: "Resorts" },
            ]}
            searchPlaceholder="Bole, hotels, apartments..."
            areaOptions={[
                { value: "Bole", label: "Bole", emoji: "🏙️ " },
                { value: "Kazanchis", label: "Kazanchis", emoji: "🏨 " },
                { value: "Piazza", label: "Piazza", emoji: "🕌 " },
                { value: "Kirkos", label: "Kirkos", emoji: "🌆 " },
                { value: "Sarbet", label: "Sarbet", emoji: "🌿 " },
                { value: "Arat Kilo", label: "Arat Kilo", emoji: "🏛️ " },
                { value: "Mercato", label: "Mercato", emoji: "🛍️ " },
            ]}
            accentColor="ethiopia-green"
        />
    );
}
