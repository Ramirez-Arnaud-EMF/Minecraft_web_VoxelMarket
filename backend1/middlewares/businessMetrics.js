import promClient from "prom-client";

const accountRegistrationsTotal = new promClient.Counter({
    name: "backend1_account_registrations_total",
    help: "Total account registration attempts handled by backend1",
    labelNames: ["outcome"],
});

const accountLoginsTotal = new promClient.Counter({
    name: "backend1_account_logins_total",
    help: "Total account login attempts handled by backend1",
    labelNames: ["outcome"],
});

function normalizeOutcome(outcome) {
    const value = String(outcome || "unknown").trim().toLowerCase();

    if (value === "success") {
        return "success";
    }

    if (value === "conflict") {
        return "conflict";
    }

    if (value === "invalid_credentials") {
        return "invalid_credentials";
    }

    if (value === "client_error") {
        return "client_error";
    }

    if (value === "server_error") {
        return "server_error";
    }

    return "unknown";
}

function outcomeFromError(error) {
    const statusCode = Number(error?.statusCode || 0);

    if (statusCode === 401) {
        return "invalid_credentials";
    }

    if (statusCode === 409) {
        return "conflict";
    }

    if (statusCode >= 400 && statusCode < 500) {
        return "client_error";
    }

    if (statusCode >= 500) {
        return "server_error";
    }

    return "unknown";
}
//////////////////////////////////////////////////////////////////
export function recordAccountRegistrationSuccess() {
    accountRegistrationsTotal.inc({ outcome: "success" });
}

export function recordAccountRegistrationFailure(error) {
    accountRegistrationsTotal.inc({ outcome: normalizeOutcome(outcomeFromError(error)) });
}
//////////////////////////////////////////////////////////////////
export function recordAccountLoginSuccess() {
    accountLoginsTotal.inc({ outcome: "success" });
}

export function recordAccountLoginFailure(error) {
    accountLoginsTotal.inc({ outcome: normalizeOutcome(outcomeFromError(error)) });
}
