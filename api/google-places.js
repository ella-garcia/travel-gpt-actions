// /api/google-places.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const {
      input,
      inputtype = "textquery",
      fields = "place_id,name,formatted_address,formatted_phone_number,website,opening_hours,rating,reviews",
    } = req.query;

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "Missing Google API key." });
    }

    if (!input) {
      return res.status(400).json({ error: "Missing 'input' parameter." });
    }

    // Step 1: Find the place_id from text
    const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      input
    )}&inputtype=${inputtype}&fields=place_id&key=${apiKey}`;
    const findResponse = await fetch(findUrl);
    const findData = await findResponse.json();

    if (!findData.candidates || findData.candidates.length === 0) {
      return res.status(404).json({ error: "Place not found." });
    }

    const placeId = findData.candidates[0].place_id;

    // Step 2: Retrieve details including reviews
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (!detailsResponse.ok) {
      console.error("Google Places Details Error:", detailsData);
      return res.status(detailsResponse.status).json({
        error: detailsData.error_message || "Failed to fetch place details.",
      });
    }

    // Step 3: Clean and format the response
    const result = detailsData.result || {};
    const reviews = (result.reviews || []).map(r => ({
      author_name: r.author_name,
      rating: r.rating,
      relative_time_description: r.relative_time_description,
      text: r.text,
      profile_photo_url: r.profile_photo_url,
    }));

    const formatted = {
      name: result.name,
      formatted_address: result.formatted_address,
      formatted_phone_number: result.formatted_phone_number,
      website: result.website,
      rating: result.rating,
      opening_hours: result.opening_hours?.weekday_text || [],
      reviews,
    };

    res.status(200).json({ result: formatted });
  } catch (error) {
    console.error("Google Places Proxy Error:", error);
    res.status(500).json({ error: "Failed to fetch from Google Places API." });
  }
}
