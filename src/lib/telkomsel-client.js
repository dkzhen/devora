/**
 * Telkomsel API Client — updated for manual token config
 * 6 token fields: xDevice, authorization, accessAuth, webMsisdn, hash, transactionId
 */

const BASE_URL = 'https://tdw.telkomsel.com';

export function buildHeaders(session) {
    const formatBearer = (token) => {
        if (!token) return '';
        return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    };

    return {
        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:148.0) Gecko/20100101 Firefox/148.0',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Referer': 'https://my.telkomsel.com/',
        'authserver': '2',
        'CHANNELID': 'WEB',
        'language': 'id',
        'MYTELKOMSEL-WEB-APP-VERSION': '2.0.0',
        'x-device': session.xDevice || '',
        'AccessAuthorization': formatBearer(session.accessAuth),
        'web-msisdn': session.webMsisdn || '',
        'HASH': session.hash || '',
        'TRANSACTIONID': session.transactionId || '',
        'Content-Type': 'application/json',
        'Origin': 'https://my.telkomsel.com',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'Authorization': formatBearer(session.authorization),
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'TE': 'trailers'
    };
}

export async function doGet(endpoint, session) {
    return doRequest('GET', endpoint, session, null);
}

export async function doPost(endpoint, session, body) {
    return doRequest('POST', endpoint, session, body);
}

async function doRequest(method, endpoint, session, body, attempt = 0) {
    const MAX_RETRIES = 2;
    const url = endpoint.startsWith('http') ? endpoint : (BASE_URL + endpoint);
    const headers = buildHeaders(session);


    try {
        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(url, opts);

        if (res.status === 401) throw new Error('UNAUTHORIZED');

        if (!res.ok) {
            const errorText = await res.text();
            if (attempt < MAX_RETRIES) {
                await sleep(2000 * (attempt + 1));
                return doRequest(method, endpoint, session, body, attempt + 1);
            }
            throw new Error(`Telkomsel API ${method} ${url} failed with status ${res.status}: ${errorText}`);
        }

        return await res.json();
    } catch (err) {
        if (err.message === 'UNAUTHORIZED') throw err;
        if (attempt < MAX_RETRIES) {
            await sleep(2000 * (attempt + 1));
            return doRequest(method, endpoint, session, body, attempt + 1);
        }
        throw new Error(`Telkomsel API ${method} ${url} failed: ${err.message}`);
    }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
