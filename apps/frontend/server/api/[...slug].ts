import { proxyRequest, getRequestURL, getMethod } from "h3";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const backendUrl = config.backendUrl as string;

  if (event.path.startsWith("/api/auth/") && getMethod(event) === "GET") {
    const url = getRequestURL(event);
    const target = `${backendUrl}${url.pathname}${url.search}`;
    const res = await fetch(target, { redirect: "manual" });

    if (res.status === 302 || res.status === 301) {
      const location = res.headers.get("location");
      if (location) {
        const headers = new Headers({ location });
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) headers.set("set-cookie", setCookie);
        return new Response(null, { status: res.status, headers });
      }
    }
  }

  return proxyRequest(event, `${backendUrl}${event.path}`);
});
