import poolClient from "../config/dbClient.js";

function normalizeWebsiteUsername(username) {
	return String(username || "").trim();
}

function normalizeWalletAmount(value) {
	const amount = Number(value);
	return Number(amount.toFixed(2));
}

export async function getWalletForUser({ username }) {
	const normalizedUsername = normalizeWebsiteUsername(username);
	const [rows] = await poolClient.execute(
		`SELECT c.pk_client, c.pseudo, COALESCE(p.solde, 0.00) AS solde
		 FROM t_client c
		 LEFT JOIN t_portefeuille p ON p.fk_client = c.pk_client
		 WHERE c.pseudo = ?
		 LIMIT 1`,
		[normalizedUsername],
	);

	const wallet = rows[0];
	if (!wallet) {
		const err = new Error("Utilisateur introuvable.");
		err.statusCode = 404;
		throw err;
	}

	return {
		username: normalizedUsername,
		walletBalance: Number(wallet.solde),
	};
}

export async function adjustWalletForUser({ username, amount }) {
	const normalizedUsername = normalizeWebsiteUsername(username);
	const normalizedAmount = normalizeWalletAmount(amount);
	const conn = await poolClient.getConnection();

	try {
		await conn.beginTransaction();
		const [rows] = await conn.execute(
			`SELECT c.pk_client, c.pseudo, p.pk_portefeuille, COALESCE(p.solde, 0.00) AS solde
			 FROM t_client c
			 LEFT JOIN t_portefeuille p ON p.fk_client = c.pk_client
			 WHERE c.pseudo = ?
			 LIMIT 1
			 FOR UPDATE`,
			[normalizedUsername],
		);

		const wallet = rows[0];
		if (!wallet) {
			const err = new Error("Utilisateur introuvable.");
			err.statusCode = 404;
			throw err;
		}

		const currentBalance = Number(wallet.solde);
		const nextBalance = Number((currentBalance + normalizedAmount).toFixed(2));
		if (nextBalance < 0) {
			const err = new Error("Solde insuffisant.");
			err.statusCode = 400;
			throw err;
		}

		if (wallet.pk_portefeuille) {
			await conn.execute("UPDATE t_portefeuille SET solde = ? WHERE pk_portefeuille = ?", [nextBalance, wallet.pk_portefeuille]);
		} else {
			await conn.execute("INSERT INTO t_portefeuille (fk_client, solde) VALUES (?, ?)", [wallet.pk_client, nextBalance]);
		}

		await conn.commit();
		return { username: normalizedUsername, walletBalance: nextBalance };
	} catch (error) {
		await conn.rollback();
		throw error;
	} finally {
		conn.release();
	}
}