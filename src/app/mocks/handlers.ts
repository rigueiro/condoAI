import { rest } from "msw";
import { mockOwners } from "@/app/[locale]/owners-management/__fixtures__/mock-owners";
import { mockProperties } from "@/app/[locale]/owners-management/__fixtures__/mock-properties";
import { mockOccurrences } from "@/app/[locale]/occurrences/__fixtures__/mock-occurrences";

export const handlers = [
  rest.get("/api/user", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ id: 123, name: "Mocked user", email: "mock@example.com" }),
    );
  }),
  rest.post("/api/login", async (req, res, ctx) => {
    const { username } = await req.json();
    if (username === "bad") {
      return res(ctx.status(401), ctx.json({ error: "Invalid credentials" }));
    }
    return res(ctx.status(200), ctx.json({ token: "fake-jwt-token" }));
  }),
  rest.get("/api/owners", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([...mockOwners]));
  }),
  rest.get("/api/user", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([...mockOwners]));
  }),
  rest.get("/api/properties", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([...mockProperties]));
  }),
  rest.get("/api/occurrences", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([...mockOccurrences]));
  }),
];
