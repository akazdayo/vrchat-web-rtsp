import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function readRepoFile(relativePath: string) {
	return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

describe("deployment contract", () => {
	it("opens WebRTC transport ports on the droplet firewall", () => {
		const terraform = readRepoFile("infra/digitalocean-min/main.tf");

		expect(terraform).toMatch(
			/protocol\s*=\s*"tcp"[\s\S]*allowed_ports\s*=\s*"8189"/,
		);
		expect(terraform).toMatch(
			/protocol\s*=\s*"udp"[\s\S]*allowed_ports\s*=\s*"8189"/,
		);
	});

	it("publishes a reachable WebRTC host and local transport listeners", () => {
		const mediamtx = readRepoFile("infra/digitalocean-min/nix/mediamtx.nix");
		const caddy = readRepoFile("infra/digitalocean-min/nix/caddy.nix");

		expect(mediamtx).toContain('webrtcAllowOrigin = "https://rtsp.odango.app"');
		expect(mediamtx).toContain('webrtcLocalUDPAddress = ":8189"');
		expect(mediamtx).toContain('webrtcLocalTCPAddress = ":8189"');
		expect(mediamtx).toContain(
			'webrtcAdditionalHosts = [ "webrtc.odango.app" ];',
		);
		expect(caddy).toContain('virtualHosts."webrtc.odango.app"');
	});
});
