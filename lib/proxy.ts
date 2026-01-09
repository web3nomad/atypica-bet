export async function setProxy() {
    console.log(process.env.PROXY_URL)
    if (process.env.PROXY_URL) {  // If you are in China, you must use this proxy:
        const { setGlobalDispatcher, ProxyAgent } = await import("undici");
        const proxyAgent = new ProxyAgent(process.env.PROXY_URL);
        setGlobalDispatcher(proxyAgent);
    }
}