const { spawn, execSync } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

console.log('\x1b[36m%s\x1b[0m', '================================================');
console.log('\x1b[36m%s\x1b[0m', '   STOKER - Sistema de Gerenciamento de Estoques');
console.log('\x1b[36m%s\x1b[0m', '================================================');
console.log('\x1b[32m%s\x1b[0m', '   Frontend: http://localhost:3000');
console.log('\x1b[34m%s\x1b[0m', '   Backend:  http://localhost:4000');
console.log('\x1b[33m%s\x1b[0m', '   Para parar tudo, feche esta janela ou aperte Ctrl + C');
console.log('\x1b[36m%s\x1b[0m', '================================================\n');

// Libera portas ocupadas anteriormente
function freePort(port) {
  try {
    const output = execSync(`netstat -ano | findstr ":${port}"`, { encoding: 'utf-8' });
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && pid !== String(process.pid)) {
          try {
            execSync(`taskkill /pid ${pid} /t /f`, { stdio: 'ignore' });
          } catch {}
        }
      }
    }
  } catch {}
}

freePort(3000);
freePort(4000);

function prefixStream(stream, prefix, color) {
  if (!stream) return;
  stream.on('data', (data) => {
    const lines = data.toString().split(/\r?\n/);
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${color}[${prefix}]\x1b[0m ${line}`);
      }
    }
  });
}

function killTree(pid) {
  if (!pid) return;
  try {
    execSync(`taskkill /pid ${pid} /t /f`, { stdio: 'ignore' });
  } catch {}
}

// Inicia o Backend
const backend = spawn('npm.cmd', ['run', 'dev'], {
  cwd: backendDir,
  shell: true,
  env: process.env,
});
prefixStream(backend.stdout, 'BACKEND', '\x1b[34m');
prefixStream(backend.stderr, 'BACKEND', '\x1b[31m');

// Inicia o Frontend
const frontend = spawn('npm.cmd', ['run', 'dev'], {
  cwd: frontendDir,
  shell: true,
  env: process.env,
});
prefixStream(frontend.stdout, 'FRONTEND', '\x1b[32m');
prefixStream(frontend.stderr, 'FRONTEND', '\x1b[33m');

let isExiting = false;
function shutdown() {
  if (isExiting) return;
  isExiting = true;
  console.log('\n\x1b[31mEncerrando o Stoker...\x1b[0m');
  killTree(backend.pid);
  killTree(frontend.pid);
  freePort(3000);
  freePort(4000);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);

backend.on('close', (code) => {
  if (!isExiting && code !== 0) {
    console.log(`\x1b[31m[BACKEND] Processo finalizado com codigo ${code}\x1b[0m`);
  }
});

frontend.on('close', (code) => {
  if (!isExiting && code !== 0) {
    console.log(`\x1b[31m[FRONTEND] Processo finalizado com codigo ${code}\x1b[0m`);
  }
});
