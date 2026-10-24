# bastion-host

An interactive, no-build learning project that explains **SSH key-based authentication between two AWS EC2 instances** using a story. Region: **us-east-1 (N. Virginia)**. #Buildwithvinit

## The story

| Real world | Concept |
|---|---|
| EC2 A | Bastion Host / Jump Server (public subnet, "reception") |
| EC2 B | Private target server (private subnet, "restricted server room") |
| SSH | Secure communication tunnel |
| Private key | Personal secret key (never leaves A) |
| Public key | Registered identity proof (safe to share) |
| `authorized_keys` | Approved visitor list on B |
| Security Group | Security guard |
| Port 22 | SSH entrance |

## The 9 learning steps

1. AWS VPC and two EC2 instances
2. Understanding SSH
3. Understanding SSH keys
4. Generate SSH keys
5. View SSH keys
6. Authorize the public key
7. Configure Security Groups
8. Connect EC2 A to EC2 B
9. Verify and troubleshoot

Features: auto-play (5 s), reset, dark/light mode, moving-object legend, command explanations, copy buttons, keyboard navigation (arrow keys, Home, End), reduced-motion support.

## SSH command reference (Amazon Linux 2023, user `ec2-user`)

```bash
ssh-keygen -t ed25519                      # on A: create a NEW key pair
pwd; ls -la; cd ~/.ssh; ls -la             # look around
cat ~/.ssh/id_ed25519.pub                  # print the PUBLIC key only
mkdir -p ~/.ssh && chmod 700 ~/.ssh        # on B
vim ~/.ssh/authorized_keys                 # on B: paste ONE public key line
chmod 600 ~/.ssh/authorized_keys           # on B
chown -R ec2-user:ec2-user ~/.ssh          # on B
ssh -i ~/.ssh/id_ed25519 ec2-user@<PRIVATE_IP_OF_INSTANCE_B>   # on A
whoami; hostname; hostname -I              # verify
```

A key you generate is separate from the EC2 **launch key pair**. AWS installs the launch key's public half in `authorized_keys` at boot; appending your new public key keeps it.

## Run locally

Open `index.html` in a browser, or run `python3 -m http.server` in this folder and visit http://localhost:8000. No build step, no JavaScript dependencies (only the Bricolage Grotesque font from Google Fonts, with system fallback).

## Security recommendations

- Never copy, print, commit, or publish a private key. Only the `.pub` file moves.
- Allow SSH to the private server only from the bastion's Security Group, never `0.0.0.0/0`.
- Restrict the bastion's own port 22 to known IP ranges, or use Session Manager.
- Use a passphrase, `chmod 600` on private keys, `700` on `~/.ssh`.
- Remove keys from `authorized_keys` when access should end.

## Deploy on GitHub Pages

1. Push this folder to a GitHub repository.
2. Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Open `https://<your-user>.github.io/<repo>/`.

MIT licensed. #Buildwithvinit
