import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { getApiConfig } from "./config";

const app: Express = express();
const config = getApiConfig();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(
  cors({
    credentials: false,
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, "");
      const allowed =
        config.corsOrigins.includes(normalizedOrigin) ||
        (config.nodeEnv !== "production" &&
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin));
      callback(allowed ? null : new Error("Origin is not allowed"), allowed);
    },
  }),
);
app.use(express.json({ limit: config.bodyLimit, strict: true }));
app.use(express.urlencoded({ extended: false, limit: config.bodyLimit }));

app.use("/api", router);
app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});
app.use(
  (
    error: unknown,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    req.log.error({ err: error }, "Request failed");
    const forbiddenOrigin =
      error instanceof Error && error.message === "Origin is not allowed";
    res.status(forbiddenOrigin ? 403 : 500).json({
      error: forbiddenOrigin ? "origin_not_allowed" : "internal_server_error",
      requestId: req.id,
    });
  },
);

export default app;
