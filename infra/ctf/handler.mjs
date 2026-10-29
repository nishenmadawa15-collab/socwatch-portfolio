/* SOCWatch mini-CTF backend (M4).
   Lambda Function URL handler: GET returns the leaderboard, POST submits a flag.
   Flags are validated here (server-side source of truth) so the browser never
   decides who scored. Zero dependencies — AWS SDK v3 ships with nodejs20.x.
   CORS is handled by the Function URL's own Cors config, not in this code. */
import { createHash } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;

/* SHA-256(flag) -> { id, points }. Plaintext flags never live in this code —
   only their digests — so reading the Lambda source doesn't hand out the flags.
   The flags themselves are findable on the site (source / terminal / feed). */
const FLAGS = {
  "ae266af07bf9b62007d093ab49b6929170238bbed2c315adf553c5aa59576cc3": { id: "recon",    points: 100 },
  "d32db1d4ad69dee7eaa908b6eaee0b444e79c76ce5bac6849f944fa4ae00371a": { id: "terminal", points: 150 },
  "bee52e0c0e3850df347543108a8821337d1be5631672225cbe765d04f66df8d3": { id: "feed",     points: 250 }
};
const digest = (s) => createHash("sha256").update(s).digest("hex");

const json = (status, body) => ({
  statusCode: status,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body)
});

const cleanHandle = (h) =>
  typeof h === "string" ? h.trim().slice(0, 24).replace(/[^\w .\-]/g, "") : "";

async function leaderboard() {
  const out = await ddb.send(new ScanCommand({ TableName: TABLE }));
  const rows = (out.Items || [])
    .map((i) => ({
      handle: i.handle,
      score: Number(i.score) || 0,
      solved: Array.isArray(i.solved) ? i.solved : [],
      updatedAt: i.updatedAt || null
    }))
    .sort((a, b) => b.score - a.score || (a.updatedAt < b.updatedAt ? -1 : 1));
  return rows;
}

function rankOf(rows, handle) {
  const i = rows.findIndex((r) => r.handle === handle);
  return i === -1 ? null : i + 1;
}

export const handler = async (event) => {
  const method =
    event?.requestContext?.http?.method ||
    (event?.body !== undefined ? "POST" : "GET");

  try {
    if (method === "GET") {
      const rows = await leaderboard();
      return json(200, { ok: true, total: rows.length, scoreboard: rows.slice(0, 20) });
    }

    if (method === "POST") {
      let payload = {};
      try { payload = JSON.parse(event.body || "{}"); }
      catch { return json(400, { ok: false, error: "invalid JSON body" }); }

      const handle = cleanHandle(payload.handle);
      const flag = typeof payload.flag === "string" ? payload.flag.trim() : "";
      if (!handle || handle.length < 2) {
        return json(400, { ok: false, error: "pick a handle (2-24 chars)" });
      }

      const match = flag ? FLAGS[digest(flag)] : null;
      if (!match) {
        return json(200, { ok: false, error: "flag not recognised — keep hunting" });
      }

      const existing = (await ddb.send(new GetCommand({ TableName: TABLE, Key: { handle } }))).Item;
      const solved = new Set(existing?.solved || []);
      const already = solved.has(match.id);
      if (!already) solved.add(match.id);

      let score = Number(existing?.score) || 0;
      if (!already) score += match.points;

      const item = {
        handle,
        score,
        solved: [...solved],
        updatedAt: new Date().toISOString()
      };
      await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));

      const rows = await leaderboard();
      return json(200, {
        ok: true,
        already,
        id: match.id,
        awarded: already ? 0 : match.points,
        score,
        solved: item.solved,
        rank: rankOf(rows, handle),
        total: rows.length,
        message: already
          ? `already captured [${match.id}] — no double points`
          : `+${match.points} for [${match.id}]`
      });
    }

    return json(405, { ok: false, error: "method not allowed" });
  } catch (err) {
    console.error("ctf error", err);
    return json(500, { ok: false, error: "internal error" });
  }
};
