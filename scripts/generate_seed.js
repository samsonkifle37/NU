const fs = require('fs');

const rawData = [
    // ATTRACTIONS -> museum
    { name: "National Museum of Ethiopia", category: "museum", description: "Home of the famous Lucy fossil and Ethiopia's most important archaeological artifacts." },
    { name: "Holy Trinity Cathedral", category: "museum", description: "The most important Orthodox cathedral in Ethiopia, housing the tombs of Emperor Haile Selassie." },
    { name: "Unity Park", category: "museum", description: "Located within the Grand Palace compound, featuring historical artifacts, a zoo, and beautiful gardens." },
    { name: "Menelik II Palace", category: "museum", description: "The first palace constructed in Addis Ababa, serving as the seat of the Ethiopian emperors." },
    { name: "Red Terror Martyrs Memorial Museum", category: "museum", description: "A solemn museum dedicated to the victims of the Derg regime's Red Terror campaign." },
    { name: "Ethnological Museum (Addis Ababa University)", category: "museum", description: "Housed in Haile Selassie's former palace, offering deep insights into Ethiopian culture and tribes." },
    { name: "Addis Ababa Museum", category: "museum", description: "A museum showcasing the growth and development of the capital city over the decades." },
    { name: "Africa Hall (UNECA)", category: "museum", description: "A historic landmark where the Organization of African Unity was founded." },
    { name: "St George Cathedral", category: "museum", description: "An iconic octagonal cathedral commissioned by Emperor Menelik II." },
    { name: "Yekatit 12 Monument", category: "museum", description: "A monument honoring victims of the Graziani massacre in Piazza." },

    // PARKS & NATURE -> park
    { name: "Entoto Natural Park", category: "park", description: "A vast natural retreat overlooking Addis Ababa, offering hiking, ziplining, and scenic views." },
    { name: "Sheger Riverside Park", category: "park", description: "A beautiful, newly developed park along the rivers of the city with walkways and fountains." },
    { name: "Friendship Park", category: "park", description: "A central park featuring modern landscaping, water features, and public recreation areas." },
    { name: "Entoto Maryam Church area", category: "park", description: "An ancient church at the top of Mount Entoto surrounded by eucalyptus forests." },
    { name: "Mount Entoto viewpoint", category: "park", description: "The absolute best panoramic viewing spot of the entire Addis Ababa skyline." },
    { name: "Addis Ababa Lion Zoo", category: "park", description: "A historic zoo known for housing the rare black-maned Ethiopian lions." },
    { name: "Gulele Botanical Garden", category: "park", description: "The country's first botanical garden, preserving thousands of indigenous plant species." },
    { name: "Unity Park Gardens", category: "park", description: "The beautifully curated gardens inside the historic Unity Park." },

    // MARKETS -> market
    { name: "Merkato Market", category: "market", description: "One of the largest open-air markets in Africa, where you can find absolutely anything." },
    { name: "Shola Market", category: "market", description: "A more relaxed but massive traditional market perfect for spices, pottery, and textiles." },
    { name: "Piazza Market Area", category: "market", description: "A historic Italian-influenced shopping district famous for its jewelry shops." },
    { name: "Shiromeda Market", category: "market", description: "The absolute best place in the city to buy traditional Ethiopian cotton clothing (Habesha Kemis)." },
    { name: "Sabon Tera Market", category: "market", description: "A vibrant market specializing in wholesale goods, soaps, and local commodities." },
    { name: "Atikilt Tera vegetable market", category: "market", description: "The city's main terminal market for fresh fruit, vegetables, and daily produce." },

    // COFFEE & CULTURE -> coffee
    { name: "Tomoca Coffee", category: "coffee", description: "The oldest and most famous coffee roaster in Addis Ababa with a vintage Italian feel." },
    { name: "Kaldi's Coffee (Bole branch)", category: "coffee", description: "Often called the 'Starbucks of Ethiopia', serving strong espresso and macchiatos." },
    { name: "Kaldi's Coffee (Kazanchis)", category: "coffee", description: "A bustling neighborhood branch of the beloved Ethiopian coffee chain." },
    { name: "Garden of Coffee", category: "coffee", description: "An artisan coffee shop where beans are hand-roasted in front of you." },
    { name: "Alem Bunna", category: "coffee", description: "A respected local cafe chain famous among daily commuters." },
    { name: "Galani Coffee", category: "coffee", description: "A highly aesthetically pleasing industrial-chic coffee shop in the Gerji area." },
    { name: "Moplaco Coffee Shop", category: "coffee", description: "A premium specialty coffee exporter serving exceptional brews." },

    // RESTAURANTS & CULTURAL DINING -> restaurant
    { name: "Yod Abyssinia", category: "restaurant", description: "A legendary cultural restaurant offering traditional food and incredible live dancing shows." },
    { name: "Habesha 2000", category: "restaurant", description: "Another premier traditional restaurant experience with huge platters and nightly entertainment." },
    { name: "Kategna Restaurant", category: "restaurant", description: "A modern, upscale take on traditional Ethiopian food, highly popular with locals." },
    { name: "2000 Habesha Cultural Restaurant", category: "restaurant", description: "Spacious venue offering a deep dive into Ethiopian culinary and musical traditions." },
    { name: "Sishu Restaurant", category: "restaurant", description: "Famous for serving the absolute best burgers in Addis Ababa using local ingredients." },
    { name: "Lucy Lounge", category: "restaurant", description: "A relaxed, sophisticated dining spot conveniently located near the National Museum." },
    { name: "Castelli Restaurant", category: "restaurant", description: "A historic, world-class Italian restaurant in Piazza, frequented by celebrities." },
    { name: "Five Loaves Restaurant", category: "restaurant", description: "A charming bistro and bakery known for its incredible pastries and fresh sandwiches." },
    { name: "Dashen Traditional Restaurant", category: "restaurant", description: "A quieter, more intimate traditional dining experience set in a lovely garden." },

    // HOTELS (LUXURY) -> hotel
    { name: "Sheraton Addis", category: "hotel", description: "The pinnacle of luxury in Addis Ababa, featuring majestic pools and opulent rooms." },
    { name: "Hyatt Regency Addis Ababa", category: "hotel", description: "A sleek, modern luxury hotel located centrally in Meskel Square." },
    { name: "Radisson Blu Addis Ababa", category: "hotel", description: "A top-tier business hotel in the Kazanchis diplomatic district." },
    { name: "Capital Hotel & Spa", category: "hotel", description: "A five-star experience known for its expansive fitness and spa facilities." },
    { name: "Marriott Executive Apartments Addis Ababa", category: "hotel", description: "Luxury extended-stay apartments perfect for international business travelers." },

    // HOTELS (MID RANGE) -> hotel
    { name: "Golden Tulip Addis Ababa", category: "hotel", description: "A reliable, modern upscale hotel situated in the lively Bole district." },
    { name: "Best Western Plus Addis Ababa", category: "hotel", description: "A highly-rated, comfortable western-style hotel right near the airport." },
    { name: "Jupiter International Hotel", category: "hotel", description: "A fantastic mid-range option with excellent hospitality and breakfast." },
    { name: "Harmony Hotel Addis Ababa", category: "hotel", description: "Offering spacious rooms and a large indoor swimming pool." },
    { name: "Hotel Lobelia", category: "hotel", description: "A very popular and budget-friendly choice with clean rooms and airport shuttle." },
    { name: "Bole Ambassador Hotel", category: "hotel", description: "A well-established staple in the Bole area, close to all the action." },

    // EXPERIENCES / TOURS -> tour
    { name: "Addis City Highlights Tour", category: "tour", description: "A full-day guided excursion covering the top monuments and museums in the capital." },
    { name: "Merkato Market Tour", category: "tour", description: "A guided navigation through the chaotic, vibrant aisles of Africa's largest market." },
    { name: "Coffee Ceremony Experience", category: "tour", description: "A traditional, multi-step process showing how Ethiopians roast and brew coffee at home." },
    { name: "Entoto Mountain Tour", category: "tour", description: "A scenic drive into the mountains surrounding the city, including stops at historic churches." },
    { name: "Addis Food Tour", category: "tour", description: "A culinary journey tasting injera, raw meat delicacies, and local street food safely." },
    { name: "Historical Addis Walking Tour", category: "tour", description: "Explore the Piazza district and learn about the city's foundation and Italian era." },
    { name: "Unity Park Guided Tour", category: "tour", description: "A deep dive into the history of the Ethiopian monarchy within the grand palace." },
    { name: "Addis Nightlife Tour", category: "tour", description: "Experience the vibrant clubs, azmari bets (traditional bars), and lounges of the city." },

    // TRANSPORT SERVICES -> transport
    { name: "Ride Ethiopia", category: "transport", description: "The most popular, Uber-like ride-hailing app in the country." },
    { name: "Feres Ride", category: "transport", description: "A highly competitive ride-hailing app known for offering zero percent commission to drivers." },
    { name: "ZayRide", category: "transport", description: "An early pioneer in the Ethiopian ride-hailing and taxi booking industry." },
    { name: "PickPick Taxi", category: "transport", description: "Instantly recognizable yellow and green metered taxis across the city." },
    { name: "Addis Airport Taxi", category: "transport", description: "The official yellow cabs servicing Bole International Airport arrivals." },

    // TOUR OPERATORS -> tour_operator
    { name: "ETT Tours Ethiopia", category: "tour_operator", description: "One of the most affordable and robust group-tour operators for the Danakil and beyond." },
    { name: "Green Land Tours Ethiopia", category: "tour_operator", description: "A highly experienced and premium tour operator established decades ago." },
    { name: "Ethio Travel and Tours", category: "tour_operator", description: "The leading company for comprehensive Ethiopian excursions." },
    { name: "Simien Eco Tours", category: "tour_operator", description: "Specialists in ethical, high-quality trekking tours in the Simien Mountains." },
    { name: "Travel Ethiopia", category: "tour_operator", description: "A professional agency providing curated travel experiences across the whole country." }
];

async function generate() {
    const dataset = [];

    for (const item of rawData) {
        // Generate valid google maps link
        const query = encodeURIComponent(item.name + " Addis Ababa Ethiopia");
        const googleMapLink = `https://www.google.com/maps/search/?api=1&query=${query}`;

        dataset.push({
            name: item.name,
            category: item.category,
            city: "Addis Ababa",
            country: "Ethiopia",
            description: item.description,
            official_website: "",
            google_maps_link: googleMapLink,
            image_url: "",
            image_source: ""
        });
    }

    const finalOutput = {
        "places": dataset
    };

    fs.writeFileSync('./addisview_seed_places.json', JSON.stringify(finalOutput, null, 2));
    console.log('Generated addisview_seed_places.json with ' + dataset.length + ' places.');
}

generate();
