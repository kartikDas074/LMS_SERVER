const { createStrapi } = require("@strapi/strapi");

async function run() {
  const app = await createStrapi().load();
  const plugin = app.plugin("users-permissions");
  console.log("Plugin Routes Keys:", Object.keys(plugin.routes));
  console.log("Content API Route Type:", typeof plugin.routes["content-api"]);
  if (typeof plugin.routes["content-api"] === "function") {
    const routes = plugin.routes["content-api"]({ strapi: app });
    console.log("Is array of routes?", Array.isArray(routes));
    console.log("Routes count:", routes.length);
    const regRoute = routes.find(r => r.path === "/auth/local/register");
    console.log("Register Route:", regRoute);
  } else {
    console.log("Content-api:", plugin.routes["content-api"]);
  }
  await app.destroy();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
