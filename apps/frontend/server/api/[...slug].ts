import { proxyRequest, sendRedirect, getRequestURL } from "h3";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const backendUrl = config.backendUrl as string;

  if (event.path.startsWith("/api/auth/google")) {
    const incoming = getRequestURL(event);
    const target = `${backendUrl}${incoming.pathname}${incoming.search}`;
    return sendRedirect(event, target, 302);
  }

  return proxyRequest(event, `${backendUrl}${event.path}`);
});
