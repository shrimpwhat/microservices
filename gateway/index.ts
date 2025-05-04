import fs from "fs";
import { sign, verify } from "jsonwebtoken";

const auth: Record<string, string> = JSON.parse(
  fs.readFileSync("auth.json", "utf8").toString()
);

const jwtSecret = import.meta.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET is not set");
}

const getCookie = (req: Request) => {
  const cookies = req.headers.get("cookie");
  const jwt = cookies?.split("=")[1];
  return jwt;
};

const isLoggedIn = (req: Request) => {
  const jwt = getCookie(req);
  if (!jwt) {
    return false;
  }

  try {
    verify(jwt, jwtSecret);
    return true;
  } catch {
    return false;
  }
};

const handleLogin = async (req: Request) => {
  const body = await req.formData();

  const username = body.get("username")?.toString();
  const password = body.get("password")?.toString();

  if (!username || !password) {
    return new Response("Invalid credentials", { status: 400 });
  }

  if (await Bun.password.verify(password, auth[username])) {
    const token = sign({ username }, jwtSecret);
    return new Response("Logged in", {
      headers: {
        "Set-Cookie": `jwt=${token}; HttpOnly;`,
      },
    });
  } else {
    return new Response("Invalid credentials", { status: 400 });
  }
};

Bun.serve({
  routes: {
    "/login": {
      POST: handleLogin,
    },
  },
});
