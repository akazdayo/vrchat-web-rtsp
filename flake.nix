{
  description = "VRChat WebRTC RTSP — dev shell + NixOS on DigitalOcean";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
    deploy-rs.url = "github:serokell/deploy-rs";
    deploy-rs.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs =
    { self, nixpkgs, utils, deploy-rs, ... }:
    # ── dev shell (all systems) ──────────────────────────────────
    utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
      in
      {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            nodejs_24
            mediamtx
            terraform
            cf-terraforming
          ];
        };
      }
    )
    # ── NixOS deployment (x86_64-linux) ──────────────────────────
    // {
      nixosConfigurations.do-1 = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./infra/digitalocean-min/nix/configuration.nix
        ];
      };

      deploy.nodes.do-1 = {
        hostname = "146.190.87.123";
        sshUser = "root";

        profiles.system = {
          user = "root";
          path = deploy-rs.lib.x86_64-linux.activate.nixos self.nixosConfigurations.do-1;
        };
      };

      checks = builtins.mapAttrs (_: lib: lib.deployChecks self.deploy) deploy-rs.lib;
    };
}
