export function notFound(req, res, _next) {
    res.status(404).json({
        message: `Route introuvable: ${req.method} ${req.originalUrl}`,
    });
}

export function errorHandler(error, _req, res, _next) {
    console.error(error);

    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(statusCode).json({
        message: error.message || "Erreur interne du serveur.",
    });
}
