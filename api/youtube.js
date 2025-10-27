export default async function handler(req, res) {
  const query = req.query.q;
  const maxResults = req.query.maxResults || 5;
  const apiKey = process.env.YOUTUBE_API_KEY;

  // Step 1: Search videos
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`;
  const searchResp = await fetch(searchUrl);
  const searchData = await searchResp.json();

  const videoIds = searchData.items.map(item => item.id.videoId).join(",");

  // Step 2: Get video details
  const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status,player&id=${videoIds}&key=${apiKey}`;
  const detailsResp = await fetch(detailsUrl);
  const detailsData = await detailsResp.json();

  // Step 3: Filter only embeddable and public videos
  const playableVideos = detailsData.items.filter(video => {
    const status = video.status;
    return status.embeddable && status.privacyStatus === "public";
  });

  res.status(200).json({ items: playableVideos });
}
