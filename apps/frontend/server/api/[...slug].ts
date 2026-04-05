import { proxyRequest } from "h3";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const backendUrl = config.backendUrl as string;
  return proxyRequest(event, `${backendUrl}${event.path}`);
});
