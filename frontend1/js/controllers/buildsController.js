import { getAvailableBuilds } from "../services/buildsService.js";

function normalizeBuild(build) {
  return {
    id: Number(build.id || 0),
    name: String(build.name || "Build sans nom"),
    category: build.category ? String(build.category) : null,
    description: build.description ? String(build.description) : null,
    buy_price: Number(build.buy_price || 0)
  };
}

export async function loadAvailableBuilds() {
  const builds = await getAvailableBuilds();

  if (!Array.isArray(builds)) {
    throw new Error("Format de reponse invalide pour les builds disponibles");
  }

  return builds.map(normalizeBuild);
}
