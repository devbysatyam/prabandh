import { execSync } from 'node:child_process';

console.log('Running Prabandh verification suite...');

try {
  console.log('1. Typechecking...');
  execSync('npm run typecheck', { stdio: 'inherit' });

  console.log('2. Running unit & engine tests...');
  execSync('npm test', { stdio: 'inherit' });

  console.log('3. Building production assets...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ All verification gates passed successfully!');
} catch (err) {
  console.error('❌ Verification failed:', err.message);
  process.exit(1);
}
