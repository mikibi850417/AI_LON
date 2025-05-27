// react-frontend/server.mjs
import https from "https";
import fs from "fs";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || (dev ? 3000 : 443);
const app = next({ dev });
const handle = app.getRequestHandler();

// ES 모듈 환경에서 경로 직접 지정
const httpsOptions = {
    key: fs.readFileSync(new URL("./ssl/private.key", import.meta.url)),
    cert: fs.readFileSync(new URL("./ssl/certificate.crt", import.meta.url)),
    ca: fs.readFileSync(new URL("./ssl/ca_bundle.crt", import.meta.url)),
};

app.prepare().then(() => {
    https
        .createServer(httpsOptions, (req, res) => {
            handle(req, res);
        })
        .listen(port, (err) => {
            if (err) throw err;
            console.log(`> HTTPS 서버 (${dev ? "dev" : "prod"}) 실행: https://0.0.0.0:${port}`);
        });
});