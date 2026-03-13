import * as http from "http";
import * as https from "https";

export interface FetchResult {
  status: number;
  body: string;
  headers: Record<string, string>;
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: Buffer;
  timeoutMs?: number;
}

export function fetchUrl(
  url: string,
  timeoutMs = 8000
): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () =>
        resolve({
          status: res.statusCode || 0,
          body,
          headers: res.headers as Record<string, string>,
        })
      );
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
  });
}


export function httpRequest(
  url: string,
  options: RequestOptions = {}
): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const { method = "GET", headers = {}, body, timeoutMs = 8000 } = options;

    const allHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
      ...(body ? { "Content-Length": body.length.toString() } : {}),
    };

    const urlObj = new URL(url);
    const reqOptions: http.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: allHeaders,
      timeout: timeoutMs,
    };

    const client = url.startsWith("https") ? https : http;
    const req = client.request(reqOptions, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => (responseBody += chunk));
      res.on("end", () =>
        resolve({
          status: res.statusCode || 0,
          body: responseBody,
          headers: res.headers as Record<string, string>,
        })
      );
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    if (body) req.write(body);
    req.end();
  });
}

export function stripHtmlToText(html: string, maxLength = 8000): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}