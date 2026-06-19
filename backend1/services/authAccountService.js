import poolClient from "../config/dbClient.js";

function getKeycloakConfig() {
	return {
		baseUrl: process.env.KEYCLOAK_BASE_URL || "http://my-keycloak:7080",
		realm: process.env.KEYCLOAK_REALM || "voxelmarket-realm",
		clientId: process.env.KEYCLOAK_CLIENT_ID || "voxelmarket-client",
		issuer: process.env.KEYCLOAK_ISSUER || "http://localhost:7080/realms/voxelmarket-realm",
		adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME || "admin",
		adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || "admin",
	};
}

async function getAdminAccessToken() {
	const { baseUrl, adminUsername, adminPassword } = getKeycloakConfig();
	const tokenUrl = `${baseUrl}/realms/master/protocol/openid-connect/token`;
	const body = new URLSearchParams({
		grant_type: "password",
		client_id: "admin-cli",
		username: adminUsername,
		password: adminPassword,
	});

	const response = await fetch(tokenUrl, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: body.toString(),
	});

	const payload = await response.json();
	if (!response.ok || !payload.access_token) {
		throw new Error(payload.error_description || "Impossible d'obtenir le token admin Keycloak.");
	}

	return payload.access_token;
}

async function fetchKeycloakJson(url, options = {}) {
	const response = await fetch(url, options);
	const text = await response.text();
	const payload = text ? JSON.parse(text) : null;
	return { response, payload };
}

async function getExistingUsers(accessToken, realm, baseUrl, username, email) {
	const headers = { Authorization: `Bearer ${accessToken}` };
	const [usernameLookup, emailLookup] = await Promise.all([
		fetchKeycloakJson(`${baseUrl}/admin/realms/${realm}/users?username=${encodeURIComponent(username)}&exact=true`, { headers }),
		fetchKeycloakJson(`${baseUrl}/admin/realms/${realm}/users?email=${encodeURIComponent(email)}&exact=true`, { headers }),
	]);

	return {
		usernameUsers: Array.isArray(usernameLookup.payload) ? usernameLookup.payload : [],
		emailUsers: Array.isArray(emailLookup.payload) ? emailLookup.payload : [],
	};
}

async function getRealmRole(accessToken, realm, baseUrl, roleName) {
	const { response, payload } = await fetchKeycloakJson(
		`${baseUrl}/admin/realms/${realm}/roles/${encodeURIComponent(roleName)}`,
		{ headers: { Authorization: `Bearer ${accessToken}` } },
	);

	if (!response.ok || !payload) {
		throw new Error(`Role Keycloak introuvable: ${roleName}`);
	}

	return payload;
}

async function assignRealmRoles(accessToken, realm, baseUrl, userId, roles) {
	const response = await fetch(`${baseUrl}/admin/realms/${realm}/users/${userId}/role-mappings/realm`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(roles),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(text || "Impossible d'attribuer les roles Keycloak.");
	}
}

export async function registerUser(username, email, password) {
	const normalizedUsername = username;
	const normalizedEmail = email;

	const config = getKeycloakConfig();
	const accessToken = await getAdminAccessToken();
	const { usernameUsers, emailUsers } = await getExistingUsers(
		accessToken,
		config.realm,
		config.baseUrl,
		normalizedUsername,
		normalizedEmail,
	);

	if (usernameUsers.length > 0) {
		const err = new Error("Ce pseudo existe deja.");
		err.statusCode = 409;
		throw err;
	}

	if (emailUsers.length > 0) {
		const err = new Error("Cet email existe deja.");
		err.statusCode = 409;
		throw err;
	}

	const createResponse = await fetch(`${config.baseUrl}/admin/realms/${config.realm}/users`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username: normalizedUsername,
			firstName: normalizedUsername,
			lastName: "VoxelMarket",
			email: normalizedEmail,
			emailVerified: true,
			enabled: true,
			requiredActions: [],
			credentials: [{ type: "password", value: password, temporary: false }],
		}),
	});

	if (!createResponse.ok) {
		const text = await createResponse.text();
		const err = new Error(text || "Creation du compte refusee par Keycloak.");
		err.statusCode = createResponse.status;
		throw err;
	}

	const createdUsers = await getExistingUsers(
		accessToken,
		config.realm,
		config.baseUrl,
		normalizedUsername,
		normalizedEmail,
	);
	const createdUser = createdUsers.usernameUsers[0];

	if (!createdUser?.id) {
		throw new Error("Utilisateur cree mais introuvable dans Keycloak.");
	}

	const userRole = await getRealmRole(accessToken, config.realm, config.baseUrl, "user");
	await assignRealmRoles(accessToken, config.realm, config.baseUrl, createdUser.id, [userRole]);

	const conn = await poolClient.getConnection();
	try {
		const [clientResult] = await conn.execute(
			"INSERT INTO t_client (keycloak_sub, pseudo, email, statut_compte) VALUES (?, ?, ?, ?)",
			[createdUser.id, normalizedUsername, normalizedEmail, "actif"],
		);
		await conn.execute("INSERT INTO t_portefeuille (fk_client, solde) VALUES (?, ?)", [clientResult.insertId, 0.0]);
	} finally {
		conn.release();
	}

	return {
		id: createdUser.id,
		username: normalizedUsername,
		email: normalizedEmail,
		roles: ["user"],
	};
}

export async function loginUser(username, password) {
	const { baseUrl, realm, clientId } = getKeycloakConfig();
	const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
	const body = new URLSearchParams({
		grant_type: "password",
		client_id: clientId,
		scope: "openid profile email",
		username,
		password,
	});

	const response = await fetch(tokenUrl, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: body.toString(),
	});

	const payload = await response.json();
	if (!response.ok) {
		const err = new Error(payload.error_description || "Authentification Keycloak refusee.");
		err.statusCode = response.status;
		err.details = payload;
		throw err;
	}

	return {
		access_token: payload.access_token,
		refresh_token: payload.refresh_token,
		expires_in: payload.expires_in,
		token_type: payload.token_type,
		scope: payload.scope,
	};
}

export function getPublicConfig() {
	const config = getKeycloakConfig();
	return {
		realm: config.realm,
		clientId: config.clientId,
		issuer: config.issuer,
	};
}