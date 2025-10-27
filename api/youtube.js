export default async function handler(req, res) {
  const query = req.query.q;
  const maxResults = req.query.maxResults || 5;

  const apiKey = process.env.YOUTUBE_API_KEY;

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();
  res.status(200).json(data);
}
