import { proxyRequest, sendRedirect, getRequestURL, getMethod } from "h3";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const backendUrl = config.backendUrl as string;

  if (event.path.startsWith("/api/auth/") && getMethod(event) === "GET") {
    const url = getRequestURL(event);
    const target = `${backendUrl}${url.pathname}${url.search}`;
    const res = await fetch(target, { redirect: "manual" });

    if (res.status === 302 || res.status === 301) {
      const location = res.headers.get("location");
      if (location) return sendRedirect(event, location, res.status);
    }
  }

  return proxyRequest(event, `${backendUrl}${event.path}`);
});
