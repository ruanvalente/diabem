import { expect, test } from "@playwright/test";

test("manifest expõe metadados instaláveis e ícones válidos", async ({
  request,
}) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();

  const manifest = await response.json();
  expect(manifest.name).toBe("DiaBem - Acompanhamento Pessoal de Diabetes");
  expect(manifest.short_name).toBe("DiaBem");
  expect(manifest.description).toContain("offline");
  expect(manifest.lang).toBe("pt-BR");
  expect(manifest.start_url).toBe("/?source=pwa");
  expect(manifest.scope).toBe("/");
  expect(manifest.display).toBe("standalone");
  expect(manifest.theme_color).toBe("#005a71");
  expect(manifest.categories).toContain("health");

  expect(manifest.icons.length).toBeGreaterThanOrEqual(4);
  for (const icon of manifest.icons) {
    expect(icon.type).toBe("image/png");
    const iconResponse = await request.get(icon.src);
    expect(iconResponse.ok()).toBeTruthy();
    expect(iconResponse.headers()["content-type"]).toContain("image/png");
  }

  const supported = manifest.icons.filter(
    (icon: { purpose?: string }) => icon.purpose === "maskable",
  );
  expect(supported.length).toBeGreaterThanOrEqual(1);
});

test("service worker registra, controla a página e usa caches versionados", async ({
  page,
}) => {
  await page.goto("/");

  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker não suportado neste navegador");
    }
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) {
      throw new Error("Service Worker não ativo");
    }
  });

  // A second load is served under SW control and the shell is cached.
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);

  const cacheState = await page.evaluate(async () => {
    const keys = await caches.keys();
    const staticKey = keys.find((key) => key.startsWith("diabem-static-"));
    const runtimeKey = keys.find((key) => key.startsWith("diabem-runtime-"));
    if (!staticKey || !runtimeKey) {
      return { staticKey, runtimeKey, precached: {} };
    }
    const staticCache = await caches.open(staticKey);
    const precached = await Promise.all(
      ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"].map(
        async (url) => [url, Boolean(await staticCache.match(url))] as const,
      ),
    );
    return { staticKey, runtimeKey, precached: Object.fromEntries(precached) };
  });

  expect(cacheState.staticKey).toMatch(/^diabem-static-v\d+$/);
  expect(cacheState.runtimeKey).toMatch(/^diabem-runtime-v\d+$/);
  for (const [url, isCached] of Object.entries(cacheState.precached)) {
    expect(isCached, `${url} deveria estar pré-armazenado`).toBe(true);
  }
});