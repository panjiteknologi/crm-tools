const { ConvexHttpClient } = require("convex/browser");
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function seedUsers() {
  try {
    const result = await convex.mutation("seed", {});
    console.log("Seeding result:", result);
  } catch (error) {
    console.error("Error seeding users:", error);
  }
}

seedUsers();