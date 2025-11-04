// /api/youtube.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const query = req.query.q;
    const maxResults = req.query.maxResults || 5;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "Missing YouTube API key." });
    }

    if (!query) {
      return res.status(400).json({ error: "Missing 'q' parameter." });
    }

    // Step 1: Search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
      query
    )}&maxResults=${maxResults}&key=${apiKey}`;

    const searchResp = await fetch(searchUrl);
    const searchData = await searchResp.json();

    if (!searchData.items || searchData.items.length === 0) {
      return res.status(404).json({ error: "No videos found for this query." });
    }

    const videoIds = searchData.items.map(item => item.id.videoId).join(",");
    if (!videoIds) {
      return res.status(404).json({ error: "No valid video IDs returned from search." });
    }

    // Step 2: Get video details
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status,player&id=${videoIds}&key=${apiKey}`;
    const detailsResp = await fetch(detailsUrl);
    const detailsData = await detailsResp.json();

    if (!detailsResp.ok) {
      console.error("YouTube Details API Error:", detailsData);
      return res.status(detailsResp.status).json({ error: "Failed to fetch video details." });
    }

    // Step 3: Filter only embeddable and public videos
    const playableVideos = detailsData.items.filter(video => {
      const status = video.status || {};
      return status.embeddable && status.privacyStatus === "public";
    });

    res.status(200).json({ items: playableVideos });
  } catch (error) {
    console.error("YouTube Search Error:", error);
    res.status(500).json({ error: "Failed to fetch videos from YouTube API." });
  }
}
