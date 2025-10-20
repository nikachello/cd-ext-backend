// src/index.ts
import app from "./app";

const port = process.env.PORT || 3005;

app.listen(port, () => {
  console.log(`✅ Server listening on http://local:${port}`);
});
