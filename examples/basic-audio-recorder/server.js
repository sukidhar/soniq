const PORT = 4500;
console.log(`Server running at http://localhost:${PORT}`);
Bun.serve({
  port: PORT,
  fetch(req) {
    const path = new URL(req.url).pathname;
    // Only serve bundle.js if specifically requested, otherwise serve index.html
    if (path === "/dist/bundle.js") {
      return new Response(Bun.file("dist/bundle.js"));
    }
    return new Response(Bun.file("index.html"));
  }
}); 