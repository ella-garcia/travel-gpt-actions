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
      fields = "place_id,name,formatted_address",
    } = req.query;

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "Missing Google API key." });
    }

    if (!input) {
      return res.status(400).json({ error: "Missing 'input' parameter." });
    }

    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      input
    )}&inputtype=${inputtype}&fields=${fields}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("Google Places API Error:", data);
      return res.status(response.status).json({ error: data.error_message || "Google Places API error" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Google Places Proxy Error:", error);
    res.status(500).json({ error: "Failed to fetch from Google Places API." });
  }
}
