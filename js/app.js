(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var reduce = function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; };

var ICON = {
  env: '<rect x="-12" y="-8" width="24" height="16" rx="2" fill="#fff" stroke="#3b82f6" stroke-width="1.5"/><path d="M-12,-8 L0,3 L12,-8" fill="none" stroke="#3b82f6" stroke-width="1.5"/>',
  key: '<circle cx="-8" r="5" fill="#f5b83d"/><rect x="-4" y="-1.5" width="16" height="3" fill="#f5b83d"/><rect x="8" y="1.5" width="2.5" height="5" fill="#f5b83d"/>',
  lock: '<rect x="-8" y="-3" width="16" height="12" rx="2" fill="#34d399"/><path d="M-5,-3 v-4 a5,5 0 0 1 10,0 v4" fill="none" stroke="#34d399" stroke-width="2.5"/>',
  shield: '<path d="M0,-12 L10,-8 V2 Q10,10 0,14 Q-10,10 -10,2 V-8 Z" fill="#2dd4bf" stroke="#fff" stroke-width="1.2"/>',
  check: '<circle r="10" fill="#22c55e"/><path d="M-5,0 L-1,4 L6,-4" fill="none" stroke="#fff" stroke-width="2.5"/>',
  cross: '<circle r="10" fill="#ef4444"/><path d="M-4,-4 L4,4 M4,-4 L-4,4" stroke="#fff" stroke-width="2.5"/>'
};
var LEGEND = [['key', 'Key: SSH authentication'], ['env', 'Envelope: connection request'], ['lock', 'Lock: encrypted SSH session'], ['shield', 'Shield: Security Group'], ['check', 'Checkmark: successful login'], ['cross', 'Red cross: rejected connection']];

var STEPS = [
 { t: 'AWS VPC and two EC2 instances', s: 'Meet the building',
   plain: 'Picture a company campus. Reception (public subnet) holds server A, the jump server visitors can reach. Behind it is a restricted server room (private subnet) holding server B.',
   tech: 'In us-east-1 you create a VPC (for example 10.0.0.0/16). The public subnet has a route to an Internet Gateway; the private subnet has none. Instance A (Bastion Host) lives in the public subnet, Instance B in the private one. Both run Amazon Linux 2023 with the default user ec2-user.',
   watch: 'Gold reception and purple server room appear inside the teal VPC, with A on the left and B on the right.',
   a: ['# Bastion Host (public)', '$ '], b: ['# Private target', '$ '], cmds: [] },
 { t: 'Understanding SSH', s: 'The secure tunnel',
   plain: 'SSH (Secure Shell) is a private, scrambled tunnel between two computers. Port 22 is the entrance door where SSH knocks.',
   tech: 'SSH runs over TCP port 22. The sshd service on the target listens there; the client encrypts everything it sends, so passwords and commands cannot be read on the network.',
   watch: 'An envelope (connection request) travels from A toward B along the green SSH path.',
   a: ['$ ssh ec2-user@10.0.2.25', '  connecting on TCP 22...'], b: ['sshd listening on :22'],
   cmds: [{ c: 'ssh -V', e: 'Prints the installed OpenSSH version on this instance.' }, { c: 'sudo ss -tlnp | grep :22', e: 'Run on B: confirms sshd is listening on TCP 22.' }] },
 { t: 'Understanding SSH keys', s: 'Lock and key',
   plain: 'You get two matching keys. The public key is a lock you hand out freely. The private key is the only key that opens it, so you never share it.',
   tech: 'A key pair is asymmetric. The public key goes into the target\'s authorized_keys. The client proves it owns the matching private key by signing a challenge, and the private key never travels over the network. Anyone with your private key can act as you.',
   watch: 'The SSH path shows how the private key (gold) stays on A while the public key (teal) is the shareable half.',
   a: ['# private key = stays on A', '# public key  = can be shared'], b: [], cmds: [] },
 { t: 'Generate SSH keys', s: 'Create a key pair on A',
   plain: 'On server A you make your own personal key and its matching lock. It is saved in a hidden folder called .ssh.',
   tech: 'This creates a NEW key pair on Instance A. It is separate from the EC2 launch key pair you picked when launching an instance, whose public half AWS already placed in ec2-user\'s authorized_keys. Files: ~/.ssh/id_ed25519 (private) and ~/.ssh/id_ed25519.pub (public). Setting a passphrase is recommended.',
   watch: 'The terminal on A runs ssh-keygen and the private and public key files appear.',
   a: ['$ ssh-keygen -t ed25519', 'Enter file: (press Enter)', 'Generating key pair...', '✓ ~/.ssh/id_ed25519', '✓ ~/.ssh/id_ed25519.pub'], b: [],
   cmds: [{ c: 'ssh-keygen -t ed25519', e: 'Creates an Ed25519 key pair in ~/.ssh. Accept the default file name and add a passphrase.' }] },
 { t: 'View SSH keys', s: 'Look around safely',
   plain: 'You walk through the hidden folder and read only the public key. The private key is never printed.',
   tech: 'Hidden folders start with a dot, so ls -la is needed to see .ssh. The .pub file is safe to display and copy. Never run cat on the private key file or paste it anywhere.',
   watch: 'The terminal on A types each command in order and prints the public key line.',
   a: ['$ pwd', '/home/ec2-user', '$ ls -la   (shows .ssh)', '$ cd ~/.ssh   $ ls -la', '$ cat ~/.ssh/id_ed25519.pub', 'ssh-ed25519 AAAA... ec2-user@A'], b: [],
   cmds: [{ c: 'pwd', e: 'Prints the present working directory, normally /home/ec2-user.' }, { c: 'ls -la', e: 'Lists all files including hidden ones such as .ssh, with permissions and owners.' }, { c: 'cd ~/.ssh', e: 'Moves into the .ssh directory.' }, { c: 'ls -la', e: 'Shows id_ed25519 (private) and id_ed25519.pub (public). Private key should be -rw-------.' }, { c: 'cat ~/.ssh/id_ed25519.pub', e: 'Prints the PUBLIC key only. Do not cat the private key.' }] },
 { t: 'Authorize the public key', s: 'Add A to the visitor list',
   plain: 'Server B keeps an approved visitor list. You add A\'s public key to that list. Only the lock goes to B, the key stays with A.',
   tech: 'Reach B through an already authorized admin path, such as EC2 Instance Connect, Session Manager, or the launch key pair. Append ONE line, A\'s public key, to B\'s ~/.ssh/authorized_keys. sshd rejects keys if permissions are loose: ~/.ssh must be 700, authorized_keys 600, both owned by ec2-user.',
   watch: 'A gold public key travels from A to B along the lower path. No private key moves.',
   a: ['$ cat ~/.ssh/id_ed25519.pub', 'ssh-ed25519 AAAA... (public only)'], b: ['$ mkdir -p ~/.ssh', '$ chmod 700 ~/.ssh', '$ vim ~/.ssh/authorized_keys', '  (paste the public key line)', '$ chmod 600 ~/.ssh/authorized_keys'],
   cmds: [{ t: 'On B', c: 'mkdir -p ~/.ssh && chmod 700 ~/.ssh', e: 'Creates the folder with owner-only access.' }, { c: 'vim ~/.ssh/authorized_keys', e: 'Press i, paste A\'s one-line public key on a new line, press Esc, then type :wq. Appending keeps existing keys, including the launch key.' }, { c: 'chmod 600 ~/.ssh/authorized_keys', e: 'Only the owner may read and write the visitor list.' }, { c: 'chown -R ec2-user:ec2-user ~/.ssh', e: 'Ensures ec2-user owns the folder and file.' }] },
 { t: 'Configure Security Groups', s: 'Post the guards',
   plain: 'Each server has a security guard. B\'s guard only lets in visitors who come from A\'s guard. Strangers on the internet are turned away.',
   tech: 'On B\'s Security Group add an inbound rule: TCP 22, source = A\'s Security Group ID (security group referencing works within a VPC). Do not use 0.0.0.0/0 for port 22 on the private server. A\'s outbound rules must permit TCP 22, and network ACLs must allow it too.',
   watch: 'Guards stand at both servers. A shield passes A to B, while a red cross from the Internet is blocked.',
   a: ['# outbound TCP 22 allowed'], b: ['# inbound TCP 22', '#   source: SG of A only'],
   cmds: [{ c: 'aws ec2 authorize-security-group-ingress --group-id <SG_ID_OF_B> --protocol tcp --port 22 --source-group <SG_ID_OF_A>', e: 'Adds the rule: B accepts SSH only from members of A\'s Security Group.' }] },
 { t: 'Connect EC2 A to EC2 B', s: 'Open the tunnel',
   plain: 'From A you knock on B\'s door with your private key. B checks its visitor list, finds your lock, and lets you in through an encrypted tunnel.',
   tech: 'Both instances need a working network path (same VPC or routed network, security groups, NACLs) and A needs permission to reach B. Use the private IP of B. The first connection asks you to trust B\'s host fingerprint. The private key stays on A.',
   watch: 'Envelope, key and lock travel along the green path, then a checkmark confirms the login.',
   a: ['$ ssh -i ~/.ssh/id_ed25519', '  ec2-user@<PRIVATE_IP_OF_INSTANCE_B>'], b: ['[ec2-user@ip-10-0-2-25 ~]$', '✓ Successfully connected to', '  EC2 Instance B'],
   cmds: [{ c: 'ssh -i ~/.ssh/id_ed25519 ec2-user@<PRIVATE_IP_OF_INSTANCE_B>', e: '-i selects the private key; ec2-user is the Amazon Linux 2023 user; replace the placeholder with B\'s private IP.' }] },
 { t: 'Verify and troubleshoot', s: 'Green means go, red means fix',
   plain: 'Ask the server who you are and where you are. If it fails, read the error: each message points to a different cause.',
   tech: 'Run the checks on B after connecting. For failures use ssh -v to see which keys are offered. Timed out usually means network or security group. Refused means sshd is not reachable on that port. Permission denied usually means user, key or authorized_keys.',
   watch: 'A green checkmark confirms the successful login, while the red cross is the blocked Internet attempt.',
   a: ['✓ Connected = green path', '✗ Blocked = red cross'], b: ['$ whoami', 'ec2-user', '$ hostname', 'ip-10-0-2-25.ec2.internal', '$ hostname -I', '10.0.2.25'],
   cmds: [{ c: 'whoami', e: 'Shows the logged-in user. Expect ec2-user.' }, { c: 'hostname', e: 'Shows B\'s hostname, proving you are on B.' }, { c: 'hostname -I', e: 'Shows B\'s private IP address.' },
     { t: 'Permission denied (publickey)', c: 'ssh -v -i ~/.ssh/id_ed25519 ec2-user@<PRIVATE_IP_OF_INSTANCE_B>', e: 'Wrong key, user or missing authorized_keys entry. Verbose mode shows which key is tried.' },
     { t: 'Connection timed out', c: null, e: 'Packets are dropped. Check B\'s Security Group inbound rule, NACLs, routes, and that you used the private IP.' },
     { t: 'Connection refused', c: 'sudo systemctl status sshd', e: 'Reached the host but nothing accepts port 22. Check sshd is running on B.' },
     { t: 'Incorrect username', c: null, e: 'Amazon Linux 2023 uses ec2-user. root, admin or ubuntu will be denied.' },
     { t: 'Incorrect private key permissions (UNPROTECTED PRIVATE KEY FILE)', c: 'chmod 600 ~/.ssh/id_ed25519', e: 'SSH ignores private keys readable by others.' },
     { t: 'Missing public key in authorized_keys', c: 'grep -c ssh-ed25519 ~/.ssh/authorized_keys', e: 'Run on B. A count of 0 means A\'s public key was never added (step 6).' }] }
];

var cur = 1, timer = null, typeT = [];

// build sidebar
var ol = $('#steps');
STEPS.forEach(function (s, i) {
  var li = document.createElement('li'), b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = '<span class="num">' + (i + 1) + '</span><span><strong></strong><small></small></span>';
  $('strong', b).textContent = s.t; $('small', b).textContent = s.s;
  b.addEventListener('click', function () { go(i + 1); });
  li.appendChild(b); ol.appendChild(li);
});
var lg = $('#legend');
LEGEND.forEach(function (l) {
  var li = document.createElement('li');
  li.innerHTML = '<svg viewBox="-14 -14 28 28" aria-hidden="true">' + ICON[l[0]] + '</svg><span>' + l[1] + '</span>';
  lg.appendChild(li);
});
$$('.mov').forEach(function (g) { g.insertAdjacentHTML('beforeend', ICON[g.dataset.icon]); });

function setTerm(id, lines) {
  var el = $(id), x = el.getAttribute('x');
  el.textContent = '';
  var i = 0;
  function add() {
    if (i >= lines.length) return;
    var ts = document.createElementNS('http://www.w3.org/2000/svg', 'tspan'), L = lines[i];
    ts.setAttribute('x', x); ts.setAttribute('dy', i ? '18' : '0');
    ts.setAttribute('class', L[0] === '$' ? 'cmd' : L[0] === '✓' ? 'ok' : L[0] === '✗' ? 'bad' : L[0] === '#' ? 'note' : '');
    ts.textContent = L; el.appendChild(ts); i++;
    if (!reduce()) typeT.push(setTimeout(add, 450)); else add();
  }
  add();
}

function copy(text, btn) {
  function done() { btn.textContent = 'Copied ✓'; setTimeout(function () { btn.textContent = 'Copy'; }, 1400); }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, fallback);
  } else fallback();
  function fallback() {
    var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(t);
  }
}

function go(n) {
  cur = Math.max(1, Math.min(STEPS.length, n));
  var s = STEPS[cur - 1];
  $$('#steps button').forEach(function (b, i) { if (i + 1 === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  $('#c-title').textContent = 'Step ' + cur + ': ' + s.t;
  $('#c-plain').textContent = s.plain; $('#c-tech').textContent = s.tech; $('#c-watch').textContent = s.watch;

  var box = $('#cmds'); box.textContent = '';
  if (!s.cmds.length) { var p = document.createElement('p'); p.textContent = 'No commands in this step. Watch the diagram.'; box.appendChild(p); }
  s.cmds.forEach(function (c) {
    var d = document.createElement('div'); d.className = 'cmd';
    if (c.t) { var h = document.createElement('h4'); h.textContent = c.t; d.appendChild(h); }
    if (c.c) {
      var row = document.createElement('div'); row.className = 'row';
      var code = document.createElement('code'); code.textContent = c.c;
      var btn = document.createElement('button'); btn.type = 'button'; btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Copy command: ' + c.c);
      btn.addEventListener('click', function () { copy(c.c, btn); });
      row.appendChild(code); row.appendChild(btn); d.appendChild(row);
    }
    var e = document.createElement('p'); e.textContent = c.e; d.appendChild(e); box.appendChild(d);
  });

  $$('#svg [data-s]').forEach(function (el) {
    var on = el.dataset.s.split(' ').indexOf(String(cur)) > -1;
    el.classList.toggle('on', on);
    if (el.classList.contains('mov')) {
      var am = $('animateMotion', el);
      if (!on) return;
      if (reduce()) {
        var path = $($('mpath', am).getAttribute('href')), pt = path.getPointAtLength(path.getTotalLength() * 0.5);
        el.setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ')');
      } else { try { am.beginElement(); } catch (e) {} }
    }
  });
  typeT.forEach(clearTimeout); typeT = [];
  setTerm('#termA', s.a); setTerm('#termB', s.b);
}

function stop() { clearInterval(timer); timer = null; var p = $('#play'); p.textContent = '▶ Auto-play'; p.setAttribute('aria-pressed', 'false'); }
function start() {
  var p = $('#play'); p.textContent = '❚❚ Pause'; p.setAttribute('aria-pressed', 'true');
  timer = setInterval(function () { if (cur >= STEPS.length) stop(); else go(cur + 1); }, 5000);
}
$('#play').addEventListener('click', function () { if (timer) stop(); else { if (cur >= STEPS.length) go(1); start(); } });
$('#reset').addEventListener('click', function () { stop(); go(1); });
$('#theme').addEventListener('click', function () {
  var r = document.documentElement, dark = r.dataset.theme === 'dark';
  r.dataset.theme = dark ? 'light' : 'dark'; this.textContent = dark ? '☾ Dark' : '☀ Light';
});
document.addEventListener('keydown', function (e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(cur + 1); }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(cur - 1); }
  else if (e.key === 'Home') go(1);
  else if (e.key === 'End') go(STEPS.length);
});
go(1);
}());
