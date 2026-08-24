import { rest } from "msw";
import { mockDomainOwners, mockCondominiums } from "@/fixtures/domain";
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
    return res(
      ctx.status(200),
      ctx.json(
        mockDomainOwners.map((o) => ({
          id: o.id,
          fullName: o.fullName,
          email: o.contacts.email,
        })),
      ),
    );
  }),
  rest.get("/api/properties", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockCondominiums.map((c) => ({ id: c.id, name: c.name }))),
    );
  }),
  rest.get("/api/occurrences", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([...mockOccurrences]));
  }),
];
