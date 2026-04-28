"use client";

import { api } from "./api";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function getPushSupportStatus(): Promise<
  "unsupported" | "denied" | "default" | "granted"
> {
  if (typeof window === "undefined") return "unsupported";
  if (!("serviceWorker" in navigator) || !("PushManager" in window))
    return "unsupported";
  return Notification.permission;
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

export async function subscribePush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window))
    return false;

  const perm = await Notification.requestPermission();
  if (perm !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const { public_key } = await api<{ public_key: string }>(
      "/notifications/push/vapid-public-key/"
    );
    if (!public_key) {
      console.warn("VAPID public key не настроен на бэкенде");
      return false;
    }
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(public_key),
    });
  }
  await api("/notifications/push/subscribe/", {
    method: "POST",
    body: JSON.stringify(sub.toJSON()),
  });
  return true;
}

export async function unsubscribePush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await api("/notifications/push/unsubscribe/", {
    method: "POST",
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => null);
  await sub.unsubscribe();
}
