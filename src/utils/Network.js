import { getObjByKey } from "./Storage";
import { getApiLanguageHeaders, withLanguageParam } from "../i18n/apiLanguage";

const buildHeaders = async (token = false, extra = {}) => {
  let headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...getApiLanguageHeaders(),
    ...extra,
  };

  if (token) {
    const loginRes = await getObjByKey("loginResponse");
    const authToken =
      loginRes?.token ||
      (typeof loginRes?.data === "string" ? loginRes.data : loginRes?.data?.token) ||
      loginRes?.data;
    if (authToken) {
      headers = { ...headers, Authorization: `Bearer ${authToken}` };
    }
  }

  return headers;
};

/** Parse fetch body safely — avoids crash when server returns HTML error pages. */
const parseResponseBody = async (response) => {
  const status = response.status;
  const contentType = (response.headers.get("content-type") || "").toLowerCase();

  let text = "";
  try {
    text = await response.text();
  } catch {
    return {
      success: false,
      status,
      message: "Failed to read server response",
    };
  }

  const trimmed = text.trim();

  if (!trimmed) {
    return {
      success: response.ok,
      status,
      message: response.ok ? "Empty response" : `Request failed (${status})`,
    };
  }

  const looksLikeJson =
    contentType.includes("application/json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[");

  if (looksLikeJson) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return { success: response.ok, httpStatus: status, data: parsed };
      }
      if (parsed && typeof parsed === "object") {
        return {
          ...parsed,
          httpStatus: status,
          status: parsed.status ?? (response.ok ? parsed.status : status),
        };
      }
      return { success: response.ok, httpStatus: status, data: parsed };
    } catch {
      return {
        success: false,
        status,
        message: "Invalid JSON from server",
      };
    }
  }

  // HTML / plain-text error (often starts with "<")
  return {
    success: false,
    status,
    message: response.ok
      ? "Unexpected response format from server"
      : `Request failed (${status})`,
  };
};

const request = async (url, options = {}, { attachLangQuery = false } = {}) => {
  const finalUrl = attachLangQuery ? withLanguageParam(url) : url;

  try {
    const response = await fetch(finalUrl, options);
    return await parseResponseBody(response);
  } catch (error) {
    console.error("Network request failed:", error?.message || error);
    return {
      success: false,
      message: error?.message || "Network error",
      error: true,
    };
  }
};

export const POSTNETWORK = async (url, payload, token = false) => {
  const headers = await buildHeaders(token);
  return request(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
};

export const POSTNETWORKFORM = async (url, payload, token = false) => {
  const headers = await buildHeaders(token, { "Content-Type": "multipart/form-data" });
  return request(url, {
    method: "POST",
    headers,
    body: payload,
    redirect: "follow",
  });
};

export const GETNETWORK = async (url, token = false) => {
  const headers = await buildHeaders(token);
  return request(url, {
    method: "GET",
    headers,
  });
};

export const PUTNETWORK = async (url, payload, token = false) => {
  const headers = await buildHeaders(token);
  return request(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });
};

export const DELETENETWORK = async (url, token = false) => {
  const headers = await buildHeaders(token);
  return request(url, {
    method: "DELETE",
    headers,
  });
};
