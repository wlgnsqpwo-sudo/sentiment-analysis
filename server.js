/**
 * server.js
 * 
 * [역할]
 * 로컬 개발 환경에서 정적 웹 페이지(HTML, CSS, JS)와 Vercel 서버리스 함수(/api/analyze)를
 * 동일한 도메인과 포트(3000)에서 실행하여 브라우저로 직접 테스트할 수 있도록 해주는 로컬 개발 서버입니다.
 * 
 * Vercel 정적 파일 서빙 규칙과 100% 호환되도록 /css, /js, /public 경로를 모두 완벽히 지원합니다.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import analyzeHandler from './api/analyze.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// 정적 파일 확장자별 MIME 타입 매핑
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // 1. API 요청 처리 (/api/analyze)
  if (pathname.startsWith('/api/analyze')) {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
    });

    req.on('end', async () => {
      const mockReq = {
        method: req.method,
        headers: req.headers,
        body: bodyData ? (tryParseJSON(bodyData) || bodyData) : {}
      };

      const mockRes = {
        statusCode: 200,
        headers: {},
        setHeader(name, value) {
          this.headers[name] = value;
          return this;
        },
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          res.writeHead(this.statusCode, {
            ...this.headers,
            'Content-Type': 'application/json; charset=utf-8'
          });
          res.end(JSON.stringify(data));
        }
      };

      try {
        await analyzeHandler(mockReq, mockRes);
      } catch (err) {
        console.error('[Local Server Error]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: '서버 내부 오류가 발생했습니다.' }
        }));
      }
    });
    return;
  }

  // 2. 정적 파일 경로 매핑 (Vercel 호환: /css, /js 요청 시 public 내부 탐색)
  let filePath;
  if (pathname === '/') {
    filePath = path.join(__dirname, 'index.html');
  } else if (pathname.startsWith('/css/') || pathname.startsWith('/js/')) {
    filePath = path.join(__dirname, 'public', pathname);
  } else {
    filePath = path.join(__dirname, pathname);
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found - 요청하신 파일을 찾을 수 없습니다.');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

function tryParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 감성 분석 로컬 개발 서버가 실행되었습니다!`);
  console.log(`👉 접속 주소: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
