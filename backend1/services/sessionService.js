let joseModulePromise = null;
let jwks = null;

function getKeycloakConfig() {
	const realm = process.env.KEYCLOAK_REALM || "voxelmarket-realm";
	const baseUrl = process.env.KEYCLOAK_BASE_URL || "http://my-keycloak:7080";

	return {
		baseUrl,
		realm,
		issuer: process.env.KEYCLOAK_ISSUER || `http://localhost:7080/realms/${realm}`,
		expectedAudience: process.env.KEYCLOAK_AUDIENCE || "account",
	};
}

async function getJoseModule() {
	if (!joseModulePromise) {
		joseModulePromise = import("jose");
	}
	return joseModulePromise;
}

function extractBearerToken(authorizationHeader) {
	const headerValue = String(authorizationHeader || "").trim();
	if (!headerValue) {
		const err = new Error("Session Keycloak requise.");
		err.statusCode = 401;
		throw err;
	}

	const [scheme, token] = headerValue.split(/\s+/, 2);
	if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
		const err = new Error("Header Authorization invalide.");
		err.statusCode = 401;
		throw err;
	}

	return token;
}

function isMissingOpenIdScope(response, responseText) {
	if (!response || response.status !== 403) return false;
	const authenticateHeader = String(response.headers.get("www-authenticate") || "").toLowerCase();
	const body = String(responseText || "").toLowerCase();
	return authenticateHeader.includes("insufficient_scope") || body.includes("insufficient_scope") || body.includes("missing openid scope");
}

function isTokenExpiredResponse(response, responseText) {
	if (!response || response.status !== 401) return false;
	const authenticateHeader = String(response.headers.get("www-authenticate") || "").toLowerCase();
	const body = String(responseText || "").toLowerCase();
	return (
		authenticateHeader.includes("token is not active") ||
		authenticateHeader.includes("invalid_token") ||
		body.includes("token is not active") ||
		body.includes("token_not_active")
	);
}

async function validateAccessTokenWithJwks(token, config) {
	const { createRemoteJWKSet, jwtVerify } = await getJoseModule();
	const jwksUrl = new URL(`${config.baseUrl}/realms/${config.realm}/protocol/openid-connect/certs`);

	if (!jwks) {
		jwks = createRemoteJWKSet(jwksUrl);
	}

	const verifyOptions = { issuer: config.issuer };
	if (config.expectedAudience) {
		verifyOptions.audience = config.expectedAudience;
	}

	try {
		const { payload } = await jwtVerify(token, jwks, verifyOptions);
		const username = String(payload.preferred_username || "").trim();
		if (!username) {
			const err = new Error("Session Keycloak invalide ou expiree.");
			err.statusCode = 401;
			throw err;
		}
		return { sub: payload.sub, username, email: payload.email || null };
	} catch {
		const err = new Error("Session Keycloak invalide ou expiree.");
		err.statusCode = 401;
		throw err;
	}
}

export async function validateAccessTokenSession(authorizationHeader) {
	const token = extractBearerToken(authorizationHeader);
	const config = getKeycloakConfig();
	const url = `${config.baseUrl}/realms/${config.realm}/protocol/openid-connect/userinfo`;

	const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
	const text = await response.text();
	let payload = null;

	if (text) {
		try {
			payload = JSON.parse(text);
		} catch {
			payload = null;
		}
	}

	if (response.ok && payload?.preferred_username) {
		return {
			sub: payload.sub,
			username: payload.preferred_username,
			email: payload.email || null,
		};
	}

	if (isTokenExpiredResponse(response, text)) {
		const err = new Error("Token expire, reconnecte-toi.");
		err.statusCode = 401;
		throw err;
	}

	if (isMissingOpenIdScope(response, text)) {
		return await validateAccessTokenWithJwks(token, config);
	}

	const err = new Error("Session Keycloak invalide ou expiree.");
	err.statusCode = 401;
	throw err;
}